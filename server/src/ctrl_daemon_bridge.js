const WebSocket = require('ws');

/**
 * CTRL-Daemon WebSocket Bridge
 * Connects to official @bulletproof-sh/ctrl-daemon service (port 19854) to ingest live Claude Code & CLI agent sessions.
 */
class CtrlDaemonBridge {
  constructor(daemonPort = 19854) {
    this.daemonPort = daemonPort;
    this.ws = null;
    this.connected = false;
    this.agentManagerRef = null;
    this.reconnectTimer = null;
  }

  setAgentManager(agentManager) {
    this.agentManagerRef = agentManager;
  }

  connect() {
    const url = `ws://127.0.0.1:${this.daemonPort}/ws`;
    console.log(`[CtrlDaemonBridge] Connecting to ctrl-daemon at ${url}...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.connected = true;
        console.log('[CtrlDaemonBridge] Successfully connected to official @bulletproof-sh/ctrl-daemon WebSocket!');
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleDaemonMessage(message);
        } catch (err) {
          console.error('[CtrlDaemonBridge] Error parsing daemon message:', err.message);
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.warn('[CtrlDaemonBridge] Disconnected from ctrl-daemon. Retrying in 5s...');
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      });

      this.ws.on('error', (err) => {
        this.connected = false;
        console.warn('[CtrlDaemonBridge] ctrl-daemon connection offline:', err.message);
      });
    } catch (e) {
      console.warn('[CtrlDaemonBridge] Exception initializing websocket:', e.message);
    }
  }

  handleDaemonMessage(msg) {
    // Standard ctrl-daemon broadcast payload
    const { type, payload } = msg;

    if (type === 'SESSION_UPDATE' && this.agentManagerRef) {
      const { sessionId, agentName, status, currentTask, tokensIn, tokensOut, cost, turn } = payload;
      
      const agentId = 'agent_alex'; // map to primary active agent
      this.agentManagerRef.updateAgentStatus(agentId, status || 'CODING', `[Subtask (${agentName})]`, currentTask);
      this.agentManagerRef.addLog(agentId, 'CODE', `[Turn ${turn || 1}] Tokens: ${tokensIn || 1} in / ${tokensOut || 2400} out. Cost: ~$${cost || 0.35}`);
    }
  }
}

module.exports = new CtrlDaemonBridge();
