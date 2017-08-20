(async function () {
  const program = require("commander");
  const glob = require("glob");
  // const fs = require('mz/fs');
  const fs = require("fs");
  const Utimes = require('@ronomon/utimes');

  program
    .version(require("./package.json").version)
    .usage("[options] <glob>")
    .option("-h, --hours <n>", "Shift timestamp by n hours")
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

    if (program.dry) {
      console.log("Would shift the timestamps of the following files by " + seconds + " seconds:");
      console.log(files.reduce((acc, file) => { return acc + file + "\n"; }, ""));
      return;
    }

    if (files.length == 0) {
      console.log("Your glob pattern did not match any file. Please check this!");
      return;
    }

    console.log(`Going to shift timestamp of ${files.length} files.`);

    for (let file of files) {
      await shiftTimestampOfFile(file);
    }

    async function shiftTimestampOfFile(file) {
      try {
        const stat = fs.statSync(file);

        console.log(stat.ctimeMs);

        const newAtime = stat.atimeMs + seconds * 1000;
        const newMtime = stat.mtimeMs + seconds * 1000;
        const newCtime = stat.ctimeMs + seconds * 1000;

        await new Promise((resolve, reject) => {
          Utimes.utimes(file, newCtime, newMtime, newAtime, (err) => {
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