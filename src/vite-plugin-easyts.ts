import type { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";

interface TypeDefinition {
  interfaceName: string;
  content: string;
  outputDir?: string;
  createInCurrentDir?: boolean;
  currentFilePath?: string;
}

export function vitePluginEasyTs(): Plugin {
  let projectRoot = "";

  return {
    name: "vite-plugin-easyts",
    configureServer(server) {
      projectRoot = server.config.root;

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
                createInCurrentDir = false,
                currentFilePath = "",
              }: TypeDefinition = JSON.parse(body);

              let targetDir: string;
              let filePath: string;

              if (createInCurrentDir && currentFilePath) {
                // 如果指定了在当前目录创建，使用当前文件的目录
                targetDir = path.dirname(
                  path.join(projectRoot, currentFilePath)
                );
                filePath = path.join(targetDir, `${interfaceName}.d.ts`);
              } else {
                // 否则使用默认的 src/outputDir 目录
                const srcDir = path.join(projectRoot, "src");
                if (!fs.existsSync(srcDir)) {
                  throw new Error(`src directory not found in ${projectRoot}`);
                }
                targetDir = path.join(srcDir, outputDir);
                filePath = path.join(targetDir, `${interfaceName}.ts`);
              }

              // 确保目标目录存在
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }

              // 保存类型定义文件
              fs.writeFileSync(filePath, content);

              const relativePath = path.relative(projectRoot, filePath);
              console.log(`✨ Generated type definition: ${relativePath}`);

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  path: relativePath,
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
