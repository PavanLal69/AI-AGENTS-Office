const { exec } = require('child_process');
const path = require('path');

const WORKSPACE_ROOT = process.cwd();

/**
 * Git Operations Service for Autonomous AI Coding Agents
 */
class GitService {
  constructor() {
    this.cwd = WORKSPACE_ROOT;
  }

  execGit(args) {
    return new Promise((resolve) => {
      exec(`git ${args}`, { cwd: this.cwd, timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ success: false, error: error.message, stderr: stderr.trim() });
        }
        resolve({ success: true, stdout: stdout.trim() });
      });
    });
  }

  async getStatus() {
    const res = await this.execGit('status --porcelain');
    if (!res.success) return { isGitRepo: false, status: [] };

    const lines = res.stdout ? res.stdout.split('\n') : [];
    const files = lines.map(line => ({
      state: line.slice(0, 2).trim(),
      file: line.slice(3).trim()
    }));

    return { isGitRepo: true, files };
  }

  async getCurrentBranch() {
    const res = await this.execGit('rev-parse --abbrev-ref HEAD');
    return res.success ? res.stdout : 'main';
  }

  async createAgentBranch(agentName, featureName) {
    const branchName = `agent/${agentName.toLowerCase().replace(/\s+/g, '-')}-${featureName.toLowerCase().replace(/\s+/g, '-')}`;
    const res = await this.execGit(`checkout -b ${branchName}`);
    return { success: res.success, branch: branchName, message: res.stdout || res.error };
  }

  async commitAgentChanges(agentName, message) {
    await this.execGit('add .');
    const commitMsg = `[Agent: ${agentName}] ${message}`;
    const res = await this.execGit(`commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    return { success: res.success, message: res.stdout || res.error };
  }

  async getDiff() {
    const res = await this.execGit('diff');
    return res.success ? res.stdout : '';
  }
}

module.exports = new GitService();
