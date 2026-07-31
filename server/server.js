const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const keyVault = require('./src/key_vault');
const agentManager = require('./src/agent_manager');
const workspaceTools = require('./src/workspace_tools');
const memoryStore = require('./src/memory_store');
const gitService = require('./src/git_service');
const agentRouter = require('./src/agent_router');
const ctrlDaemonBridge = require('./src/ctrl_daemon_bridge');
const buildOutputServer = require('./src/build_output_server');

// Start dedicated build output preview server on http://localhost:3005
buildOutputServer.startPreviewServer();

// Connect to official @bulletproof-sh/ctrl-daemon at port 3001
ctrlDaemonBridge.daemonPort = 3001;
ctrlDaemonBridge.setAgentManager(agentManager);
ctrlDaemonBridge.connect();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// WebSockets Connection & Real-time Event Broadcaster
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WebSocket] Client connected. Active clients:', clients.size);

  // Send initial full state payload on connect
  ws.send(JSON.stringify({
    event: 'INIT_STATE',
    data: agentManager.getAllState()
  }));

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message);
      const { event, data } = parsed;

      if (event === 'START_BUILD') {
        const buildId = `build_${Date.now()}`;
        agentRouter.runBuildPipeline(buildId, data.prompt || 'New AI Application', {
          emit: (evt, payload) => agentManager.broadcast(evt, payload)
        });
      } else if (event === 'DISPATCH_TASK') {
        const { agentId, task } = data;
        agentManager.dispatchTask(agentId, task);
      } else if (event === 'DISPATCH_TEAM_WORKFLOW') {
        const { prompt } = data;
        agentManager.dispatchTeamWorkflow(prompt);
      } else if (event === 'MOVE_AGENT') {
        const { agentId, x, y } = data;
        agentManager.moveAgentTo(agentId, x, y);
      } else if (event === 'GET_LOGS') {
        const logs = agentManager.getAgentLogs(data.agentId);
        ws.send(JSON.stringify({
          event: 'AGENT_LOGS',
          data: { agentId: data.agentId, logs }
        }));
      }
    } catch (err) {
      console.error('[WebSocket] Message processing error:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected. Active clients:', clients.size);
  });
});

// Configure AgentManager broadcast hook
agentManager.setBroadcastCallback((payload) => {
  const message = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
});

// --- REST API ROUTES ---

// Git Integration Endpoints
app.get('/api/git/status', async (req, res) => {
  res.json(await gitService.getStatus());
});

// X402 Billing Protocol Endpoint
const x402Billing = require('./src/x402_billing');
app.get('/api/billing/invoice/:buildId', (req, res) => {
  const invoice = x402Billing.getInvoice(req.params.buildId);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.setHeader('X-402-Payment-Required', 'SETTLED');
  res.setHeader('X-402-Cost-USD', invoice.totalCostUSD.toFixed(6));
  res.setHeader('X-402-Token-Count', invoice.totalTokens.toString());
  res.json(invoice);
});

app.post('/api/git/branch', async (req, res) => {
  const { agentName, featureName } = req.body;
  if (!agentName || !featureName) {
    return res.status(400).json({ error: 'Missing agentName or featureName' });
  }
  res.json(await gitService.createAgentBranch(agentName, featureName));
});

app.post('/api/git/commit', async (req, res) => {
  const { agentName, message } = req.body;
  if (!agentName || !message) {
    return res.status(400).json({ error: 'Missing agentName or message' });
  }
  res.json(await gitService.commitAgentChanges(agentName, message));
});

// Inter-Agent Message Bus Endpoint
app.get('/api/bus/history', (req, res) => {
  const { topic } = req.query;
  res.json(agentRouter.getHistory(topic));
});

// Workspace Files Endpoints
app.get('/api/workspace/files', (req, res) => {
  const dirPath = req.query.path || '';
  res.json(workspaceTools.listWorkspaceFiles(dirPath));
});

app.get('/api/workspace/read', (req, res) => {
  const filePath = req.query.file || '';
  res.json(workspaceTools.readFileContent(filePath));
});

app.post('/api/workspace/write', (req, res) => {
  const { filePath, content } = req.body;
  if (!filePath || content === undefined) {
    return res.status(400).json({ error: 'Missing filePath or content' });
  }
  res.json(workspaceTools.writeFileContent(filePath, content));
});

// Agent Memory Endpoint
app.get('/api/agents/:id/memory', (req, res) => {
  const { id } = req.params;
  res.json(memoryStore.loadAgentMemory(id));
});

// Get full system state
app.get('/api/state', (req, res) => {
  res.json(agentManager.getAllState());
});

// Key Vault Management Endpoints
app.get('/api/keys', (req, res) => {
  res.json({
    keys: keyVault.getAllKeys(),
    bindings: keyVault.getBindings()
  });
});

app.post('/api/keys/save', (req, res) => {
  const { id, name, provider, key } = req.body;
  if (!name || !provider || !key) {
    return res.status(400).json({ error: 'Missing required fields: name, provider, key' });
  }

  const keyId = keyVault.saveKey(id, name, provider, key);
  
  // Broadcast updated keys state to all UI clients
  agentManager.broadcast('KEYS_UPDATED', {
    keys: keyVault.getAllKeys(),
    bindings: keyVault.getBindings()
  });

  res.json({ success: true, keyId });
});

app.delete('/api/keys/:id', (req, res) => {
  const { id } = req.params;
  keyVault.deleteKey(id);

  agentManager.broadcast('KEYS_UPDATED', {
    keys: keyVault.getAllKeys(),
    bindings: keyVault.getBindings()
  });

  res.json({ success: true });
});

// REST Endpoint: Trigger Multi-Agent Build Pipeline
app.post('/api/build', (req, res) => {
  const { prompt } = req.body;
  const buildId = `build_${Date.now()}`;
  console.log(`[HTTP REST] Triggering Build #${buildId} for prompt: "${prompt}"`);

  agentRouter.runBuildPipeline(buildId, prompt || 'Personal Portfolio Website', {
    emit: (evt, payload) => agentManager.broadcast(evt, payload)
  });

  res.json({
    success: true,
    buildId,
    prompt: prompt || 'Personal Portfolio Website',
    message: 'Multi-agent pipeline started!',
    localhostUrl: 'http://localhost:3005'
  });
});

app.post('/api/keys/bind', (req, res) => {
  const { agentId, keyId } = req.body;
  if (!agentId || !keyId) {
    return res.status(400).json({ error: 'Missing agentId or keyId' });
  }

  const success = keyVault.bindAgentKey(agentId, keyId);
  if (success) {
    agentManager.broadcast('KEYS_UPDATED', {
      keys: keyVault.getAllKeys(),
      bindings: keyVault.getBindings()
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Key not found in vault' });
  }
});

// Dispatch Task to single agent
app.post('/api/tasks/dispatch', async (req, res) => {
  const { agentId, task } = req.body;
  if (!agentId || !task) {
    return res.status(400).json({ error: 'Missing agentId or task' });
  }

  // Trigger non-blocking task workflow
  agentManager.dispatchTask(agentId, task);
  res.json({ success: true, message: `Task dispatched to agent ${agentId}` });
});

// Dispatch Team Workflow
app.post('/api/tasks/team', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing team project prompt' });
  }

  agentManager.dispatchTeamWorkflow(prompt);
  res.json({ success: true, message: `Team workflow initiated for: ${prompt}` });
});

// Save modified office layout
app.post('/api/layout/save', (req, res) => {
  const { cubicles, decorations } = req.body;
  if (cubicles) agentManager.cubicles = cubicles;
  if (decorations) agentManager.decorations = decorations;
  
  agentManager.saveLayout();
  agentManager.broadcast('LAYOUT_UPDATED', agentManager.getAllState());
  res.json({ success: true });
});

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` 🏢 PIXEL AGENTS OFFICE SYSTEM IS RUNNING ON PORT ${PORT}`);
  console.log(` 🌐 Local Access: http://localhost:${PORT}`);
  console.log(` 🌐 Local Network (LAN): http://192.168.1.4:${PORT}`);
  console.log(` 🔑 Key Vault & Real-Time WebSockets Active`);
  console.log(`=======================================================`);
});
