// src/vite-plugin-easyts.ts
import * as fs from "fs";
import * as path from "path";
function vitePluginEasyTs() {
  let projectRoot = "";
  return {
    name: "vite-plugin-easyts",
    configureServer(server) {
      projectRoot = server.config.root;
      console.log("Project root:", projectRoot);
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
                outputDir = "EasyTsApi"
              } = JSON.parse(body);
              const srcDir = path.join(projectRoot, "src");
              console.log("Src directory:", srcDir);
              if (!fs.existsSync(srcDir)) {
                throw new Error(`src directory not found in ${projectRoot}`);
              }
              const fullOutputDir = path.join(srcDir, outputDir);
              console.log("Output directory:", fullOutputDir);
              if (!fs.existsSync(fullOutputDir)) {
                fs.mkdirSync(fullOutputDir, { recursive: true });
              }
              const filePath = path.join(fullOutputDir, `${interfaceName}.ts`);
              fs.writeFileSync(filePath, content);
              console.log("Type definition file:", filePath);
              const indexPath = path.join(fullOutputDir, "index.ts");
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
              const relativePath = path.relative(srcDir, filePath);
              console.log(`\u2728 Generated type definition: src/${relativePath}`);
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  path: `src/${relativePath}`
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