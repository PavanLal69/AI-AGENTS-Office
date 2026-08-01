const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BUILD_OUTPUT_DIR = path.join(__dirname, '..', '..', 'build_output');
const PREVIEW_PORT = 3005;

let serverInstance = null;

function ensureBuildOutputDir() {
  if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
    fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true });
  }

  const indexPath = path.join(BUILD_OUTPUT_DIR, 'index.html');
  // If file doesn't exist, generate default application
  if (!fs.existsSync(indexPath)) {
    const webGenerator = require('./web_generator');
    webGenerator.generateFullWebApplication('build a tic tac toe game', BUILD_OUTPUT_DIR);
  }
}

function startPreviewServer() {
  ensureBuildOutputDir();

  if (serverInstance) return PREVIEW_PORT;

  const app = express();

  // Strict No-Cache Middleware to ensure the browser always gets the latest built HTML
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  app.use(express.static(BUILD_OUTPUT_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));

  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(BUILD_OUTPUT_DIR, 'index.html'));
  });

  serverInstance = http.createServer(app);
  serverInstance.listen(PREVIEW_PORT, '0.0.0.0', () => {
    console.log(`[PreviewServer] Live generated app serving on http://localhost:${PREVIEW_PORT} & http://192.168.1.4:${PREVIEW_PORT} (LAN Active, Cache Disabled)`);
  });

  return PREVIEW_PORT;
}

module.exports = {
  startPreviewServer,
  BUILD_OUTPUT_DIR,
  PREVIEW_PORT
};
