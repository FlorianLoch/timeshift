const program = require("commander");

program
  .version(require("./package.json").version)
  .usage("[options] <file ...>")
  .option("-h, --hours <n>", "Shift timestamp by n hours")
  .parse(process.argv);


if (program.hours) {
  shiftBy(program.hours * 3600);
}
else {
  console.log("Please state how much time shift you would like to apply!");
  console.log("Run 'timeshift --help' for help on the options.");
}

function shiftBy(seconds) {
  if (!program.args) {
    console.log("You should state at least one file for which you would like to shift its timestamp!");
    console.log("Run 'timeshift --help' for help on the options.");
    return;
  }

  console.log(`Goin to shift timestamp of $fo`);
  // TODO
}