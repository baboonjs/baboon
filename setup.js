const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
// Install all dev dependencies
/* 
var devDeps = [ 
"@nabh/index-ts-creator",
"@typescript-eslint/eslint-plugin",
"@typescript-eslint/parser",
"eslint",
"jest",
"rimraf"
];
for (const pkg of devDeps)
  execSync("npm i " + pkg + " -w ** --save-dev");
*/

var workspaces = require("./package.json").workspaces;
for (const ws of workspaces) {
  let pkgjson = path.resolve(ws, "package.json");
  if (!fs.existsSync(pkgjson)) continue;
  let obj = JSON.parse(fs.readFileSync(pkgjson));
  obj.author = "Padmanabh Dabke";
  obj.license = "MIT";
  obj["main"] = "./dist/dist-cjs/index.js";
  obj["types"] = "./dist/dist-types/index.d.ts";
  obj["module"] = "./dist/dist-es/index.js";
  obj["repository"] = {
    "type": "git",
    "url": "git+https://github.com/baboonjs/baboon.git",
    "directory": ws
  };
  obj["bugs"] = {
    "url": "https://github.com/baboonjs/baboon/issues"
  };
  obj["homepage"] = "https://github.com/baboonjs/baboon#readme";

  obj["scripts"] =
  {
    "build": "npm run clean && index-ts-creator src && npm run build:cjs && npm run build:es && npm run build:types",
    "build:cjs": "tsc -p tsconfig.json",
    "build:es": "tsc -p tsconfig.es.json",
    "build:types": "tsc -p tsconfig.types.json",
    "build:dev": "npm run build:cjs && npm run build:types",
    "clean": "rimraf ./dist",
    "test": "jest",
    "lint": "npx eslint --fix src/**"
  };
  fs.writeFileSync(pkgjson, JSON.stringify(obj, null, 2));
}