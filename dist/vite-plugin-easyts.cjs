"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/vite-plugin-easyts.ts
var vite_plugin_easyts_exports = {};
__export(vite_plugin_easyts_exports, {
  vitePluginEasyTs: () => vitePluginEasyTs
});
module.exports = __toCommonJS(vite_plugin_easyts_exports);
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
function vitePluginEasyTs() {
  let projectRoot = "";
  return {
    name: "vite-plugin-easyts",
    configureServer(server) {
      projectRoot = server.config.root;
      server.middlewares.use("/__easyts_save", async (req, res) => {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const {
                interfaceName,
                content,
                outputDir = "EasyTsApi",
                createInCurrentDir = false,
                currentFilePath = ""
              } = JSON.parse(body);
              let targetDir;
              let filePath;
              if (createInCurrentDir && currentFilePath) {
                targetDir = path.dirname(
                  path.join(projectRoot, currentFilePath)
                );
                filePath = path.join(targetDir, `${interfaceName}.d.ts`);
              } else {
                const srcDir = path.join(projectRoot, "src");
                if (!fs.existsSync(srcDir)) {
                  throw new Error(`src directory not found in ${projectRoot}`);
                }
                targetDir = path.join(srcDir, outputDir);
                filePath = path.join(targetDir, `${interfaceName}.ts`);
              }
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              fs.writeFileSync(filePath, content);
              const relativePath = path.relative(projectRoot, filePath);
              console.log(`\u2728 Generated type definition: ${relativePath}`);
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  path: relativePath
                })
              );
            } catch (error) {
              console.error("Error saving type definition:", error);
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: String(error),
                  projectRoot,
                  currentDir: process.cwd()
                })
              );
            }
          });
        } else {
          res.statusCode = 405;
          res.end("Method not allowed");
        }
      });
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  vitePluginEasyTs
});
//# sourceMappingURL=vite-plugin-easyts.cjs.map