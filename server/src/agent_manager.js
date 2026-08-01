const fs = require('fs');
const path = require('path');
const { callLLM } = require('./llm_clients');
const keyVault = require('./key_vault');
const memoryStore = require('./memory_store');
const workspaceTools = require('./workspace_tools');

const LAYOUT_FILE = path.join(__dirname, '..', 'data', 'office_layout.json');

// ─── Autonomous Activity Task Pool ─────────────────────────────────────────
const AUTONOMOUS_TASKS = {
  agent_alex: [
    'Reviewing system architecture blueprints',
    'Designing microservices event bus topology',
    'Drafting API gateway load balancer specs',
    'Auditing WebSocket latency benchmarks',
    'Planning Kubernetes deployment strategy',
    'Refactoring DAG execution pipeline',
    'Writing technical architecture RFC'
  ],
  agent_maya: [
    'Crafting glassmorphic UI components',
    'Optimizing Canvas 60fps render loop',
    'Building responsive grid layout system',
    'Designing dark mode color palette',
    'Animating micro-interaction transitions',
    'Creating SVG icon sprite sheet',
    'Implementing CSS variable design tokens'
  ],
  agent_devon: [
    'Writing Express REST API endpoints',
    'Optimizing database query performance',
    'Building WebSocket event broadcaster',
    'Implementing JWT authentication flow',
    'Refactoring middleware error handlers',
    'Configuring CORS security policies',
    'Writing rate limiter middleware'
  ],
  agent_sam: [
    'Running static security analysis scan',
    'Auditing API key encryption protocols',
    'Verifying AES-256-GCM vault integrity',
    'Testing cross-site scripting defenses',
    'Reviewing dependency vulnerability report',
    'Validating input sanitization rules',
    'Running penetration test suite'
  ],
  agent_riley: [
    'Configuring Docker container pipeline',
    'Writing Kubernetes deployment manifests',
    'Setting up CI/CD GitHub Actions workflow',
    'Monitoring container health checks',
    'Optimizing Docker image layer caching',
    'Configuring Nginx reverse proxy',
    'Deploying staging environment'
  ],
  agent_marcus: [
    'Indexing telemetry data streams',
    'Designing time-series data schemas',
    'Building real-time analytics pipeline',
    'Optimizing memory store indexing',
    'Writing data aggregation queries',
    'Configuring event stream partitions',
    'Building dashboard metrics collector'
  ],
  agent_elena: [
    'Conducting penetration testing sweep',
    'Rotating cryptographic secret keys',
    'Auditing zero-trust access policies',
    'Reviewing firewall ingress rules',
    'Scanning for exposed credentials',
    'Validating TLS certificate chain',
    'Hardening container security baseline'
  ],
  agent_viktor: [
    'Training local embedding model weights',
    'Optimizing prompt context compression',
    'Tuning token latency benchmarks',
    'Building vector similarity index',
    'Evaluating model inference accuracy',
    'Compressing context window tokens',
    'Running A/B test on prompt strategies'
  ],
  agent_zara: [
    'Monitoring uptime SLA dashboard',
    'Debugging WebSocket heartbeat drops',
    'Configuring failover key balancing',
    'Analyzing server response time P99',
    'Setting up Grafana alert thresholds',
    'Testing auto-scaling trigger rules',
    'Investigating memory leak in workers'
  ],
  agent_kai: [
    'Designing developer workflow shortcuts',
    'Prototyping pixel office UI layout',
    'Writing product requirements document',
    'Conducting UX heuristic evaluation',
    'Creating user journey flow diagrams',
    'Designing onboarding tutorial steps',
    'Building interactive command palette'
  ]
};

const MEETING_TOPICS = [
  'Sprint planning standup',
  'Architecture review meeting',
  'Security audit debrief',
  'Code review session',
  'Performance optimization sync',
  'Deployment readiness check',
  'Cross-team integration meeting',
  'Incident post-mortem review',
  'Feature prioritization workshop',
  'Tech debt cleanup planning'
];

const STATUS_BUBBLES = {
  CODING: ['⌨️ Coding...', '💻 Writing code', '🛠️ Building...', '📝 Implementing'],
  THINKING: ['💡 Thinking...', '🧠 Analyzing...', '🔍 Researching...', '📊 Planning...'],
  REVIEWING: ['👀 Reviewing...', '📋 Auditing...', '🔎 Inspecting...', '✅ Checking...'],
  MEETING: ['🤝 In meeting', '📢 Presenting', '💬 Discussing', '🎯 Aligning'],
  BREAK: ['☕ Coffee break', '🚶 Taking a walk', '🍕 Lunch break', '🎧 Quick rest'],
  EXECUTING: ['⚡ Executing...', '🚀 Deploying...', '🔄 Processing...', '⏳ Running...']
};

// ─── Hiring Candidate Pool ─────────────────────────────────────────────────
const CANDIDATE_POOL = [
  { name: 'Aria Patel', role: 'NLP Specialist', avatar: 'blonde_walker', color: '#06b6d4', model: 'NVIDIA Nemotron 550B', description: 'Expert in natural language processing, sentiment analysis, and transformer fine-tuning.' },
  { name: 'Liam Chen', role: 'Blockchain Developer', avatar: 'spiky_brown', color: '#8b5cf6', model: 'Cohere North Mini Code', description: 'Specializes in smart contract development, DeFi protocols, and Algorand integration.' },
  { name: 'Nora Kenji', role: 'Mobile Engineer', avatar: 'curly_blonde', color: '#f59e0b', model: 'Ling 3.0 Flash', description: 'React Native and Flutter expert for cross-platform mobile applications.' },
  { name: 'Omar Reyes', role: 'Performance Engineer', avatar: 'black_hair_red', color: '#10b981', model: 'Recraft V4.1 Vector', description: 'Low-latency systems, profiling, and runtime optimization specialist.' },
  { name: 'Freya Svensson', role: 'AI Ethics Officer', avatar: 'silver_hair', color: '#f43f5e', model: 'NVIDIA Nemotron 550B', description: 'AI safety auditor, bias detection, and responsible AI governance.' },
  { name: 'Jin Takahashi', role: 'Database Architect', avatar: 'afro_orange', color: '#3b82f6', model: 'Cohere North Mini Code', description: 'PostgreSQL, MongoDB, and distributed database sharding expert.' },
  { name: 'Zoe Martinez', role: 'API Gateway Engineer', avatar: 'blonde_walker', color: '#14b8a6', model: 'Ling 3.0 Flash', description: 'GraphQL, REST, and gRPC API design and gateway management.' },
  { name: 'Ravi Sharma', role: 'Cloud Infrastructure', avatar: 'spiky_brown', color: '#f97316', model: 'Recraft V4.1 Vector', description: 'AWS, GCP, and Azure cloud infrastructure automation.' }
];

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
    this.firedAgents = [];
    this.hireHistory = [];
    this.autonomousTimers = new Map();

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
          slug: a.slug,
          group: a.group,
          role: a.role,
          description: a.description,
          avatar: a.avatar,
          direction: a.direction || 'down',
          color: a.color,
          score: a.score,
          successRate: a.successRate,
          model: a.model,
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
        officeName: "Ctrl/Cubicles AI Agents Headquarters",
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

  // ─── 24/7 AUTONOMOUS AGENT ACTIVITY ENGINE ──────────────────────────────
  startAutonomousLifecycle() {
    console.log('[AutonomousEngine] 🤖 Starting 24/7 agent activity engine for ALL agents...');

    const agentIds = Array.from(this.agents.keys());
    console.log(`[AutonomousEngine] Activating ${agentIds.length} agents: ${agentIds.join(', ')}`);

    // Stagger agent starts so they don't all move at once
    agentIds.forEach((agentId, index) => {
      const initialDelay = (index * 2000) + Math.random() * 3000;
      setTimeout(() => {
        this._startAgentActivityLoop(agentId);
      }, initialDelay);
    });

    // Periodic office-wide events (meetings, standups)
    setInterval(() => {
      this._triggerOfficeMeeting();
    }, 120000); // Every 2 minutes, trigger a random meeting

    console.log('[AutonomousEngine] ✅ All agents activated! Office is alive 24/7.');
  }

  _startAgentActivityLoop(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const runCycle = () => {
      if (!this.agents.has(agentId)) return; // Agent was fired

      const activity = this._pickRandomActivity();
      this._executeAutonomousActivity(agentId, activity);

      // Schedule next activity cycle (8-25 seconds)
      const nextDelay = 8000 + Math.random() * 17000;
      const timer = setTimeout(runCycle, nextDelay);
      this.autonomousTimers.set(agentId, timer);
    };

    runCycle();
  }

  _pickRandomActivity() {
    const rand = Math.random();
    if (rand < 0.35) return 'WORK_AT_DESK';
    if (rand < 0.55) return 'ROAM_OFFICE';
    if (rand < 0.70) return 'VISIT_COLLEAGUE';
    if (rand < 0.82) return 'GO_TO_LOUNGE';
    if (rand < 0.90) return 'TAKE_BREAK';
    return 'WORK_AT_DESK';
  }

  _executeAutonomousActivity(agentId, activity) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const tasks = AUTONOMOUS_TASKS[agentId] || AUTONOMOUS_TASKS['agent_alex'];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

    switch (activity) {
      case 'WORK_AT_DESK': {
        // Move to desk, start coding/thinking
        const statusType = Math.random() > 0.5 ? 'CODING' : 'THINKING';
        const bubbles = STATUS_BUBBLES[statusType];
        const bubble = bubbles[Math.floor(Math.random() * bubbles.length)];
        
        this.moveAgentTo(agentId, agent.deskX, agent.deskY);
        this.updateAgentStatus(agentId, statusType, bubble, randomTask);
        this.addLog(agentId, 'INFO', `📋 ${randomTask}`);

        // After working, mark as reviewing or idle
        setTimeout(() => {
          if (this.agents.has(agentId)) {
            const nextStatus = Math.random() > 0.4 ? 'REVIEWING' : 'IDLE';
            const reviewBubbles = STATUS_BUBBLES[nextStatus] || STATUS_BUBBLES['REVIEWING'];
            const nextBubble = reviewBubbles ? reviewBubbles[Math.floor(Math.random() * reviewBubbles.length)] : null;
            this.updateAgentStatus(agentId, nextStatus, nextBubble, randomTask);
          }
        }, 4000 + Math.random() * 4000);
        break;
      }

      case 'ROAM_OFFICE': {
        // Walk to a random tile in the office
        const targetX = 2 + Math.floor(Math.random() * (this.cols - 4));
        const targetY = 2 + Math.floor(Math.random() * (this.rows - 4));
        
        this.updateAgentStatus(agentId, 'THINKING', '🚶 Walking...', randomTask);
        this.moveAgentTo(agentId, targetX, targetY);

        // After roaming, go back to work
        setTimeout(() => {
          if (this.agents.has(agentId)) {
            this.moveAgentTo(agentId, agent.deskX, agent.deskY);
            this.updateAgentStatus(agentId, 'CODING', '⌨️ Back to work', randomTask);
          }
        }, 5000 + Math.random() * 5000);
        break;
      }

      case 'VISIT_COLLEAGUE': {
        // Pick a random other agent and walk to their desk
        const allIds = Array.from(this.agents.keys()).filter(id => id !== agentId);
        if (allIds.length === 0) break;
        
        const targetAgentId = allIds[Math.floor(Math.random() * allIds.length)];
        const targetAgent = this.agents.get(targetAgentId);
        if (!targetAgent) break;

        this.updateAgentStatus(agentId, 'MEETING', `💬 Talking to ${targetAgent.name}`, `Sync with ${targetAgent.name}`);
        this.moveAgentTo(agentId, targetAgent.deskX + 1, targetAgent.deskY);
        this.addLog(agentId, 'INFO', `💬 Walked over to discuss with ${targetAgent.name}`);

        // After meeting, return to desk
        setTimeout(() => {
          if (this.agents.has(agentId)) {
            this.moveAgentTo(agentId, agent.deskX, agent.deskY);
            this.updateAgentStatus(agentId, 'CODING', '⌨️ Implementing feedback', randomTask);
            this.addLog(agentId, 'INFO', `✅ Finished sync with ${targetAgent.name}, back to coding`);
          }
        }, 6000 + Math.random() * 4000);
        break;
      }

      case 'GO_TO_LOUNGE': {
        // Walk to the lounge/sofa area (around x:16, y:6)
        const loungeX = 15 + Math.floor(Math.random() * 4);
        const loungeY = 4 + Math.floor(Math.random() * 5);

        this.updateAgentStatus(agentId, 'BREAK', '☕ At the lounge', 'Quick break');
        this.moveAgentTo(agentId, loungeX, loungeY);
        this.addLog(agentId, 'INFO', `☕ ${agent.name} headed to the lounge for a break`);

        setTimeout(() => {
          if (this.agents.has(agentId)) {
            this.moveAgentTo(agentId, agent.deskX, agent.deskY);
            this.updateAgentStatus(agentId, 'IDLE', '🔄 Refreshed', randomTask);
          }
        }, 7000 + Math.random() * 5000);
        break;
      }

      case 'TAKE_BREAK': {
        const breakBubbles = STATUS_BUBBLES['BREAK'];
        const bubble = breakBubbles[Math.floor(Math.random() * breakBubbles.length)];
        
        // Move to a random spot near the edges (break room area)
        const breakX = Math.random() > 0.5 ? (1 + Math.floor(Math.random() * 3)) : (20 + Math.floor(Math.random() * 3));
        const breakY = 12 + Math.floor(Math.random() * 3);

        this.updateAgentStatus(agentId, 'BREAK', bubble, 'On break');
        this.moveAgentTo(agentId, breakX, breakY);

        setTimeout(() => {
          if (this.agents.has(agentId)) {
            this.moveAgentTo(agentId, agent.deskX, agent.deskY);
            this.updateAgentStatus(agentId, 'THINKING', '🧠 Planning next task', randomTask);
          }
        }, 8000 + Math.random() * 6000);
        break;
      }
    }
  }

  _triggerOfficeMeeting() {
    const agentIds = Array.from(this.agents.keys());
    if (agentIds.length < 2) return;

    // Pick 2-4 agents for a meeting
    const meetingSize = 2 + Math.floor(Math.random() * 3);
    const shuffled = agentIds.sort(() => Math.random() - 0.5);
    const meetingAgents = shuffled.slice(0, Math.min(meetingSize, agentIds.length));

    const topic = MEETING_TOPICS[Math.floor(Math.random() * MEETING_TOPICS.length)];
    
    // Meeting location: lounge area
    const meetX = 16;
    const meetY = 6;

    console.log(`[AutonomousEngine] 📢 Office Meeting: "${topic}" with ${meetingAgents.length} agents`);

    meetingAgents.forEach((id, i) => {
      const agent = this.agents.get(id);
      if (!agent) return;

      this.updateAgentStatus(id, 'MEETING', '🤝 In meeting', topic);
      this.moveAgentTo(id, meetX + (i % 3) - 1, meetY + Math.floor(i / 3));
      this.addLog(id, 'INFO', `📢 Joined meeting: "${topic}"`);
    });

    // End meeting after 10-18 seconds
    setTimeout(() => {
      meetingAgents.forEach(id => {
        const agent = this.agents.get(id);
        if (!agent) return;

        this.moveAgentTo(id, agent.deskX, agent.deskY);
        this.updateAgentStatus(id, 'CODING', '⌨️ Post-meeting action items', topic);
        this.addLog(id, 'INFO', `✅ Meeting ended: "${topic}" — back to work`);
      });
    }, 10000 + Math.random() * 8000);
  }

  // ─── HIRING & FIRING SYSTEM ────────────────────────────────────────────
  hireAgent(candidateIndex) {
    if (candidateIndex < 0 || candidateIndex >= CANDIDATE_POOL.length) {
      return { success: false, error: 'Invalid candidate index' };
    }

    const candidate = CANDIDATE_POOL[candidateIndex];
    const newId = `agent_${candidate.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;
    const slug = candidate.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 4);

    // Find an empty desk spot
    const deskX = 2 + Math.floor(Math.random() * 18);
    const deskY = 3 + Math.floor(Math.random() * 10);

    const newAgent = {
      id: newId,
      name: candidate.name,
      slug,
      group: 'ecosystem',
      role: candidate.role,
      description: candidate.description,
      avatar: candidate.avatar,
      direction: 'down',
      score: 80 + Math.floor(Math.random() * 15),
      successRate: `${(92 + Math.random() * 7).toFixed(1)}%`,
      model: candidate.model,
      color: candidate.color,
      x: 12,  // Start at entrance
      y: 1,
      deskX,
      deskY,
      targetX: deskX,
      targetY: deskY,
      path: [],
      status: 'IDLE',
      speechBubble: '👋 Just hired!',
      currentTask: 'Onboarding & setup'
    };

    this.agents.set(newId, newAgent);
    this.logs.set(newId, []);

    // Add autonomous task pool for the new agent
    AUTONOMOUS_TASKS[newId] = [
      `Setting up ${candidate.role} workspace`,
      `Learning codebase architecture`,
      `Running initial security scan`,
      `Configuring development environment`,
      `Reading team documentation`,
      `Building first prototype`,
      `Testing integration points`
    ];

    // Move to desk
    this.moveAgentTo(newId, deskX, deskY);

    this.hireHistory.push({
      agentId: newId,
      name: candidate.name,
      role: candidate.role,
      hiredAt: new Date().toISOString()
    });

    this.addLog(newId, 'INFO', `🎉 ${candidate.name} has been HIRED as ${candidate.role}!`);

    // Start autonomous activity for the new agent
    setTimeout(() => {
      this._startAgentActivityLoop(newId);
    }, 3000);

    // Broadcast to all clients
    this.broadcast('AGENT_HIRED', {
      agent: newAgent,
      message: `🎉 ${candidate.name} joined the team as ${candidate.role}!`
    });

    this.saveLayout();

    console.log(`[HiringSystem] ✅ HIRED: ${candidate.name} (${candidate.role}) → ID: ${newId}`);
    return { success: true, agent: newAgent };
  }

  fireAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Don't allow firing the Queen (Alex Vance)
    if (agentId === 'agent_alex') {
      return { success: false, error: 'Cannot fire the Lead System Architect (Queen Router)' };
    }

    const agentName = agent.name;
    const agentRole = agent.role;

    // Stop autonomous activity
    const timer = this.autonomousTimers.get(agentId);
    if (timer) {
      clearTimeout(timer);
      this.autonomousTimers.delete(agentId);
    }

    // Move agent to exit and then remove
    this.updateAgentStatus(agentId, 'FIRED', '👋 Goodbye...', 'Leaving the office');
    this.moveAgentTo(agentId, 12, 0);
    this.addLog(agentId, 'INFO', `🔴 ${agentName} has been FIRED from the office`);

    // Record in fired history
    this.firedAgents.push({
      id: agentId,
      name: agentName,
      role: agentRole,
      firedAt: new Date().toISOString()
    });

    // Remove after exit animation
    setTimeout(() => {
      this.agents.delete(agentId);
      this.logs.delete(agentId);
      delete AUTONOMOUS_TASKS[agentId];

      this.broadcast('AGENT_FIRED', {
        agentId,
        name: agentName,
        role: agentRole,
        message: `🔴 ${agentName} (${agentRole}) has left the office`
      });

      this.saveLayout();
    }, 4000);

    console.log(`[FiringSystem] 🔴 FIRED: ${agentName} (${agentRole}) — ID: ${agentId}`);
    return { success: true, name: agentName, role: agentRole };
  }

  getCandidatePool() {
    return CANDIDATE_POOL.map((c, i) => ({ index: i, ...c }));
  }

  getHireFireHistory() {
    return {
      hired: this.hireHistory,
      fired: this.firedAgents
    };
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
