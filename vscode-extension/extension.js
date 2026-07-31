const vscode = require('vscode');

/**
 * Ctrl/Cubicles - Pixel Office VS Code Extension Entrypoint
 */
function activate(context) {
  console.log('[Ctrl/Cubicles] Pixel Office Extension activated.');

  // Command 1: Open Full Webview Panel
  let disposablePanel = vscode.commands.registerCommand('ctrlCubicles.openOffice', () => {
    const panel = vscode.window.createWebviewPanel(
      'ctrlCubiclesOffice',
      'Ctrl/Cubicles — Pixel Office HQ',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = getWebviewContent('http://localhost:3000');
  });

  // Sidebar Webview View Provider
  class OfficeViewProvider {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true
      };
      webviewView.webview.html = getWebviewContent('http://localhost:3000');
    }
  }

  context.subscriptions.push(
    disposablePanel,
    vscode.window.registerWebviewViewProvider('ctrlCubicles.officeView', new OfficeViewProvider())
  );
}

function getWebviewContent(serverUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #090a10; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="${serverUrl}"></iframe>
</body>
</html>`;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
