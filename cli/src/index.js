const CLICreator = require("@nabh/cli-creator");
var modules = require("../config/module_configs.json");
const BaboonFactory = require("./baboon_factory");
async function run() {
  var cli = await CLICreator.createMultiModuleCLI(modules, BaboonFactory, null, 
    [["-p, --provider <provider>", "Cloud provider ID"],
      ["-r, --region <region>", "Default region"]]);
  await cli.run();
}
run();
