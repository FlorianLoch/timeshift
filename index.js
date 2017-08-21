(async function () {
  const program = require("commander");
  const glob = require("glob");
  // const fs = require('mz/fs');
  const fs = require("fs");
  const Utimes = require("@ronomon/utimes");
  const moment = require("moment");

  program
    .version(require("./package.json").version)
    .usage("[options] <glob>")
    .option("-h, --hours <n>", "Shift timestamp by n hours")
    .option("-f, --from_filename", "Get original timestamp from filename")
    .option("--dry", "Dry-run, just lists files that would be modified")
    .parse(process.argv);

  if (program.hours) {
    await shiftBy(program.hours * 3600);
  }
  else {
    console.log("Please state how much time shift you would like to apply!");
    console.log("Run 'timeshift --help' for help on the options.");
  }

  async function shiftBy(seconds) {
    if (!program.args || program.args.length !== 1) {
      console.log("You should exactly state one glob pattern declaring files for which you would like to shift its timestamp!");
      console.log("Please remember to encapsulate this pattern in doublesquotes, otherwise your shell might extend it!");
      console.log("Run 'timeshift --help' for help on the options.");
      return;
    }

    const globPattern = program.args[0];

    const files = glob.sync(globPattern);

    if (files.length == 0) {
      console.log("Your glob pattern did not match any file. Please check this!");
      return;
    }

    console.log(`Going to shift timestamp of ${files.length} files.`);

    if (program.dry) {
      console.log(" ---- DRY-MODE, NOTHING MODIFIED! ---- ");
    }

    for (let file of files) {
      let timestamps;

      if (program.from_filename) {
        timestamps = parseTimestampsFromFilename(file);
      }
      else {
        timestamps = readTimestampsFromFile(file)
      }

      const newTimestamps = adjustTimestamps(timestamps);

      if (program.dry) {
        console.log(file + ":\t\t" + new Date(timestamps.ctimeMs).toUTCString() + " --> " + new Date(newTimestamps.ctimeMs).toUTCString());
      }
      else {
        await shiftTimestampOfFile(file, newTimestamps);
      }
    }

    function readTimestampsFromFile(file) {
      return fs.statSync(file);
    }

    function parseTimestampsFromFilename(file) {
      // we expect the following format: JJJJMMDDTHHMMSS as specified by momentjs
      // we therefore search for this pattern in the filename
      const match = file.match(/[0-9]{8}T[0-9]{6}/);

      if (match && match.length == 1) {
        const ts = moment(match[0]);
        return {
          atimeMs: ts,
          mtimeMs: ts,
          ctimeMs: ts
        };
      }
      else {
        throw new Error("Could not extract timestamp from filename '" + file + "'");
      }
    }

    function adjustTimestamps(timestamps) {
      const newTimestamps = {};

      newTimestamps.atimeMs = timestamps.atimeMs + seconds * 1000;
      newTimestamps.mtimeMs = timestamps.mtimeMs + seconds * 1000;
      newTimestamps.ctimeMs = timestamps.ctimeMs + seconds * 1000;

      return newTimestamps;
    }

    async function shiftTimestampOfFile(file, timestamps) {
      try {
        await new Promise((resolve, reject) => {
          Utimes.utimes(file, timestamps.ctimeMs, timestamps.mtimeMs, timestamps.atimeMs, (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          });
        });
      } catch (err) {
        console.log(`Could not handle file ${file}: ${err}`);
      }
    }
  }
})();