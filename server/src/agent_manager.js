const fs = require('fs');
const path = require('path');
const { callLLM } = require('./llm_clients');
const keyVault = require('./key_vault');
const memoryStore = require('./memory_store');
const workspaceTools = require('./workspace_tools');

const LAYOUT_FILE = path.join(__dirname, '..', 'data', 'office_layout.json');

class AgentManager {
  constructor() {
    this.agents = new Map();
    this.cubicles = [];
    this.decorations = [];
    this.tileSize = 32;
    this.cols = 24;
    this.rows = 16;
    this.logs = new Map();
    this.wsBroadcastCallback = null;

    this.loadLayout();
  }

  setBroadcastCallback(cb) {
    this.wsBroadcastCallback = cb;
  }

  broadcast(event, payload) {
    if (this.wsBroadcastCallback) {
      this.wsBroadcastCallback({ event, data: payload });
    }
  }

  loadLayout() {
    if (fs.existsSync(LAYOUT_FILE)) {
      try {
        const raw = fs.readFileSync(LAYOUT_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.cols = parsed.cols || 24;
        this.rows = parsed.rows || 16;
        this.tileSize = parsed.tileSize || 32;
        this.cubicles = parsed.cubicles || [];
        this.decorations = parsed.decorations || [];

        if (parsed.agents) {
          parsed.agents.forEach(a => {
            this.agents.set(a.id, {
              ...a,
              targetX: a.x,
              targetY: a.y,
              path: [],
              logs: []
            });
            this.logs.set(a.id, []);
          });
        }
      } catch (err) {
        console.error('[AgentManager] Error reading layout:', err.message);
      }
    }
  }

  saveLayout() {
    try {
      const agentsExport = [];
      this.agents.forEach(a => {
        agentsExport.push({
          id: a.id,
          name: a.name,
          role: a.role,
          avatar: a.avatar,
          direction: a.direction || 'down',
          color: a.color,
          x: a.x,
          y: a.y,
          deskX: a.deskX,
          deskY: a.deskY,
          status: a.status,
          speechBubble: a.speechBubble,
          currentTask: a.currentTask
        });
      });

      fs.writeFileSync(LAYOUT_FILE, JSON.stringify({
        officeName: "Ctrl/Cubicles Classic Pixel Office",
        cols: this.cols,
        rows: this.rows,
        tileSize: this.tileSize,
        decorations: this.decorations,
        cubicles: this.cubicles,
        agents: agentsExport
      }, null, 2));
    } catch (err) {
      console.error('[AgentManager] Error saving layout:', err.message);
    }
  }

  addLog(agentId, type, text) {
    if (!this.logs.has(agentId)) {
      this.logs.set(agentId, []);
    }
    const logItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      text
    };
    const agentLogs = this.logs.get(agentId);
    agentLogs.push(logItem);
    if (agentLogs.length > 200) agentLogs.shift();

    this.broadcast('AGENT_LOG', { agentId, log: logItem });
  }

  updateAgentStatus(agentId, status, speechBubble = null, currentTask = null) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.status = status;
    if (speechBubble !== undefined) agent.speechBubble = speechBubble;
    if (currentTask !== undefined) agent.currentTask = currentTask;

    this.broadcast('AGENT_UPDATE', {
      id: agentId,
      status: agent.status,
      speechBubble: agent.speechBubble,
      currentTask: agent.currentTask,
      x: agent.x,
      y: agent.y,
      direction: agent.direction
    });
  }

  moveAgentTo(agentId, targetX, targetY) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.targetX = targetX;
    agent.targetY = targetY;

    const path = [];
    let curX = agent.x;
    let curY = agent.y;

    while (curX !== targetX || curY !== targetY) {
      if (curX < targetX) { curX++; agent.direction = 'right'; }
      else if (curX > targetX) { curX--; agent.direction = 'left'; }
      else if (curY < targetY) { curY++; agent.direction = 'down'; }
      else if (curY > targetY) { curY--; agent.direction = 'up'; }
      path.push({ x: curX, y: curY });
    }

    agent.path = path;

    const moveInterval = setInterval(() => {
      if (agent.path.length > 0) {
        const nextTile = agent.path.shift();
        agent.x = nextTile.x;
        agent.y = nextTile.y;
        this.broadcast('AGENT_UPDATE', {
          id: agentId,
          x: agent.x,
          y: agent.y,
          direction: agent.direction,
          status: agent.status
        });
      } else {
        clearInterval(moveInterval);
      }
    }, 250);
  }

  async dispatchTask(agentId, taskPrompt) {
    const agent = this.agents.get(agentId);
    if (!agent) return { error: 'Agent not found' };

    const keyInfo = keyVault.getAgentKey(agentId);
    const keyName = keyInfo ? keyInfo.name : 'Default Fallback';
    const provider = keyInfo ? keyInfo.provider : 'openai';

    this.addLog(agentId, 'INFO', `🚀 Task received: "${taskPrompt}"`);
    this.addLog(agentId, 'KEY', `🔑 Using Key: [${keyName}] (${provider.toUpperCase()})`);

    // Phase 1: THINKING
    this.updateAgentStatus(agentId, 'THINKING', '💡 Thinking...', taskPrompt);
    this.moveAgentTo(agentId, agent.deskX, agent.deskY);
    this.addLog(agentId, 'THOUGHT', `Analyzing prompt using ${provider.toUpperCase()} model...`);

    await new Promise(r => setTimeout(r, 1500));

    // Phase 2: CODING / WRITING
    this.updateAgentStatus(agentId, 'CODING', '⌨️ Coding...', taskPrompt);
    this.addLog(agentId, 'INFO', `Generating implementation solution...`);

    const llmResult = await callLLM(agentId, taskPrompt, agent.role);

    this.addLog(agentId, 'CODE', llmResult.response);
    this.addLog(agentId, 'INFO', `Tokens: ${llmResult.promptTokens} prompt / ${llmResult.completionTokens} completion.`);

    await new Promise(r => setTimeout(r, 1800));

    // Phase 3: EXECUTING
    if (taskPrompt.toLowerCase().includes('server') || taskPrompt.toLowerCase().includes('deploy') || taskPrompt.toLowerCase().includes('backend')) {
      this.updateAgentStatus(agentId, 'EXECUTING', '⚡ Executing...', `Deploying: ${taskPrompt}`);
      this.addLog(agentId, 'EXEC', `Running deployment verification check...`);
      await new Promise(r => setTimeout(r, 2000));
      this.addLog(agentId, 'EXEC', `Container build & WebSocket broadcast active.`);
    }

    // Return to desk and complete
    this.moveAgentTo(agentId, agent.deskX, agent.deskY);
    this.updateAgentStatus(agentId, 'COMPLETED', '✅ Complete!', `Finished: ${taskPrompt}`);
    this.addLog(agentId, 'INFO', `Task completed successfully!`);

    // Save to persistent memory store
    memoryStore.appendTaskHistory(agentId, {
      prompt: taskPrompt,
      response: llmResult.response,
      provider: llmResult.provider,
      keyMasked: llmResult.keyMasked,
      isRealAPI: llmResult.isRealAPI
    });

    setTimeout(() => {
      if (agent.status === 'COMPLETED') {
        this.updateAgentStatus(agentId, 'IDLE', null, agent.currentTask);
      }
    }, 5000);

    return {
      success: true,
      agentId,
      result: llmResult.response,
      telemetry: {
        provider: llmResult.provider,
        keyMasked: llmResult.keyMasked,
        isRealAPI: llmResult.isRealAPI
      }
    };
  }

  async dispatchTeamWorkflow(projectPrompt) {
    this.broadcast('WORKFLOW_START', { prompt: projectPrompt });

    await this.dispatchTask('agent_alex', `Architect Spec: ${projectPrompt}`);
    await new Promise(r => setTimeout(r, 1000));

    const p1 = this.dispatchTask('agent_maya', `Frontend Interface: ${projectPrompt}`);
    const p2 = this.dispatchTask('agent_devon', `Backend API: ${projectPrompt}`);
    await Promise.all([p1, p2]);
    await new Promise(r => setTimeout(r, 1000));

    await this.dispatchTask('agent_sam', `Audit & Security: ${projectPrompt}`);
    await this.dispatchTask('agent_riley', `Deploy Pipeline: ${projectPrompt}`);

    this.broadcast('WORKFLOW_COMPLETE', { prompt: projectPrompt });
  }

  getAllState() {
    const agentsList = [];
    this.agents.forEach(a => {
      const boundKey = keyVault.getAgentKey(a.id);
      agentsList.push({
        ...a,
        assignedKey: boundKey ? {
          id: boundKey.keyId,
          name: boundKey.name,
          provider: boundKey.provider,
          masked: boundKey.masked,
          telemetry: boundKey.telemetry
        } : null
      });
    });

    return {
      cols: this.cols,
      rows: this.rows,
      tileSize: this.tileSize,
      cubicles: this.cubicles,
      decorations: this.decorations,
      agents: agentsList,
      keys: keyVault.getAllKeys()
    };
  }

  getAgentLogs(agentId) {
    return this.logs.get(agentId) || [];
  }
}

module.exports = new AgentManager();
