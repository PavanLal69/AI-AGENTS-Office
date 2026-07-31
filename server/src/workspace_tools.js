const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const WORKSPACE_ROOT = process.cwd();

/**
 * Real Workspace Tool Execution Handler for AI Agents
 */
class WorkspaceTools {
  constructor() {
    this.workspaceRoot = WORKSPACE_ROOT;
  }

  // List files in workspace
  listWorkspaceFiles(dirPath = '') {
    const targetPath = path.join(this.workspaceRoot, dirPath);
    try {
      if (!fs.existsSync(targetPath)) return { error: `Path does not exist: ${dirPath}` };
      const items = fs.readdirSync(targetPath, { withFileTypes: true });
      return {
        path: dirPath || '/',
        items: items.map(item => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          size: item.isFile() ? fs.statSync(path.join(targetPath, item.name)).size : null
        }))
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  // Read file content
  readFileContent(filePath) {
    const targetPath = path.join(this.workspaceRoot, filePath);
    try {
      if (!fs.existsSync(targetPath)) return { error: `File not found: ${filePath}` };
      const content = fs.readFileSync(targetPath, 'utf8');
      return { filePath, content: content.slice(0, 10000) }; // cap at 10k chars
    } catch (err) {
      return { error: err.message };
    }
  }

  // Write content to file
  writeFileContent(filePath, content) {
    const targetPath = path.join(this.workspaceRoot, filePath);
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, content, 'utf8');
      return { success: true, filePath, bytesWritten: Buffer.byteLength(content) };
    } catch (err) {
      return { error: err.message };
    }
  }

  // Execute terminal command safely inside workspace
  executeCommand(command) {
    return new Promise((resolve) => {
      // Basic sanity check to prevent dangerous system commands
      if (command.includes('rm -rf /') || command.includes('format c:')) {
        return resolve({ error: 'Command blocked by security policy' });
      }

      exec(command, { cwd: this.workspaceRoot, timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          return resolve({
            success: false,
            error: error.message,
            stderr: stderr.slice(0, 2000),
            stdout: stdout.slice(0, 2000)
          });
        }
        resolve({
          success: true,
          stdout: stdout.slice(0, 4000),
          stderr: stderr.slice(0, 1000)
        });
      });
    });
  }
}

module.exports = new WorkspaceTools();
