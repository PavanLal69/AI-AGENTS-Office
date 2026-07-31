const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'data', 'agent_memory');

/**
 * Persistent Agent Memory & Transcript Store
 */
class MemoryStore {
  constructor() {
    this.ensureMemoryDir();
  }

  ensureMemoryDir() {
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }
  }

  getAgentMemoryPath(agentId) {
    return path.join(MEMORY_DIR, `${agentId}_memory.json`);
  }

  saveAgentMemory(agentId, memoryData) {
    try {
      const filePath = this.getAgentMemoryPath(agentId);
      fs.writeFileSync(filePath, JSON.stringify(memoryData, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error(`[MemoryStore] Failed saving memory for ${agentId}:`, err.message);
      return false;
    }
  }

  loadAgentMemory(agentId) {
    try {
      const filePath = this.getAgentMemoryPath(agentId);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`[MemoryStore] Failed loading memory for ${agentId}:`, err.message);
    }
    return {
      agentId,
      created: new Date().toISOString(),
      tasksCount: 0,
      history: []
    };
  }

  appendTaskHistory(agentId, taskRecord) {
    const memory = this.loadAgentMemory(agentId);
    memory.tasksCount = (memory.tasksCount || 0) + 1;
    memory.lastUpdated = new Date().toISOString();
    
    if (!memory.history) memory.history = [];
    memory.history.push({
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...taskRecord
    });

    if (memory.history.length > 50) memory.history.shift();

    this.saveAgentMemory(agentId, memory);
    return memory;
  }
}

module.exports = new MemoryStore();
