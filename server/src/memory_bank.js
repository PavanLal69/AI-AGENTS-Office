const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '..', '..', 'memory_bank.json');

/**
 * Ruflo-Style AgentDB Persistent Memory Bank
 * Stores prompt memory, code components, consensus scores, and UI design tokens across sessions.
 */
class MemoryBank {
  constructor() {
    this.memory = {
      buildHistory: [],
      componentBank: {},
      consensusLogs: []
    };
    this.loadMemory();
  }

  loadMemory() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
        this.memory = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[MemoryBank] Could not load memory file, starting fresh:', e.message);
    }
  }

  saveMemory() {
    try {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memory, null, 2));
    } catch (e) {
      console.error('[MemoryBank] Failed to save memory file:', e.message);
    }
  }

  recordBuild(buildRecord) {
    this.memory.buildHistory.push({
      buildId: buildRecord.buildId,
      prompt: buildRecord.prompt,
      timestamp: Date.now(),
      durationMs: buildRecord.durationMs,
      scores: buildRecord.scores
    });
    this.saveMemory();
  }

  recordConsensus(buildId, consensusResult) {
    this.memory.consensusLogs.push({
      buildId,
      timestamp: Date.now(),
      approved: consensusResult.approved,
      score: consensusResult.score,
      votes: consensusResult.votes
    });
    this.saveMemory();
  }

  storeComponentToken(key, codeSnippet) {
    this.memory.componentBank[key] = codeSnippet;
    this.saveMemory();
  }

  getComponentToken(key) {
    return this.memory.componentBank[key] || null;
  }

  getRecentBuilds(limit = 5) {
    return this.memory.buildHistory.slice(-limit);
  }
}

module.exports = new MemoryBank();
