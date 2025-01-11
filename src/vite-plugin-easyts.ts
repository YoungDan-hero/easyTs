import type { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";

interface TypeDefinition {
  interfaceName: string;
  content: string;
  outputDir?: string;
}

export function vitePluginEasyTs(): Plugin {
  let projectRoot = "";

  return {
    name: "vite-plugin-easyts",
    configureServer(server) {
      projectRoot = server.config.root;
      console.log("Project root:", projectRoot); // 调试日志

      // 注册自定义路由处理类型定义的保存
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
              }: TypeDefinition = JSON.parse(body);

              // 使用 Vite 的项目根目录
              const srcDir = path.join(projectRoot, "src");
              console.log("Src directory:", srcDir); // 调试日志

              if (!fs.existsSync(srcDir)) {
                throw new Error(`src directory not found in ${projectRoot}`);
              }

              // 在src目录下创建输出目录
              const fullOutputDir = path.join(srcDir, outputDir);
              console.log("Output directory:", fullOutputDir); // 调试日志

              // 确保输出目录存在
              if (!fs.existsSync(fullOutputDir)) {
                fs.mkdirSync(fullOutputDir, { recursive: true });
              }

              // 保存类型定义文件
              const filePath = path.join(fullOutputDir, `${interfaceName}.ts`);
              fs.writeFileSync(filePath, content);
              console.log("Type definition file:", filePath); // 调试日志

              // 更新 index.ts
              const indexPath = path.join(fullOutputDir, "index.ts");
              const exportStatement = `export * from './${interfaceName}';\n`;

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
              console.log(`✨ Generated type definition: src/${relativePath}`);

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  path: `src/${relativePath}`,
                })
              );
            } catch (error) {
              console.error("Error saving type definition:", error);
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: String(error),
                  projectRoot,
                  currentDir: process.cwd(),
                })
              );
            }
          });
        } else {
          res.statusCode = 405;
          res.end("Method not allowed");
        }
      });
    },
  };
}
