const path = require("path");
const express = require("express");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const BUILD_DIR = path.join(__dirname, "..", "frontend", "build");

app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api${path}`,
    onProxyReq: fixRequestBody,
  })
);

app.use(express.static(BUILD_DIR));

app.get("/*splat", (req, res) => {
  res.sendFile(path.join(BUILD_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Production server listening on port ${PORT}`);
});
