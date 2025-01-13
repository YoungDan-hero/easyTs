// src/vite-plugin-easyts.ts
import * as fs from "fs";
import * as path from "path";
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
              if (!createInCurrentDir) {
                const indexPath = path.join(targetDir, "index.ts");
                const exportStatement = `export * from './${interfaceName}';
`;
                if (!fs.existsSync(indexPath)) {
                  fs.writeFileSync(
                    indexPath,
                    "// Auto-generated type definitions\n"
                  );
                }
                const indexContent = fs.readFileSync(indexPath, "utf-8");
                if (!indexContent.includes(exportStatement)) {
                  fs.appendFileSync(indexPath, exportStatement);
                }
              }
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
export {
  vitePluginEasyTs
};
//# sourceMappingURL=vite-plugin-easyts.js.map