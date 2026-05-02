const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

const githubRepoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.GITHUB_ACTIONS && githubRepoName ? `/${githubRepoName}/` : "/";

module.exports = defineConfig({
  root: __dirname,
  base,
  publicDir: path.resolve(__dirname, "../public"),
  plugins: [
    {
      name: "redirect-public-index",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/index.html" || req.url === "/auth.html") {
            res.statusCode = 302;
            res.setHeader("Location", req.url === "/auth.html" ? "/#/auth" : "/");
            res.end();
            return;
          }
          next();
        });
      },
    },
    react(),
  ],
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
