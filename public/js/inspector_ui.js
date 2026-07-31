/**
 * Ctrl/Cubicles Agent Inspector & Turn Execution Tree UI Controller
 * Renders clickable localhost links and scores directly inside Turn Execution Tree
 */
class InspectorUI {
  constructor() {
    this.currentAgent = null;
    this.allKeys = [];
    this.turnsCount = 0;

    this.initFormListeners();
  }

  initFormListeners() {
    document.querySelectorAll('.dock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.id === 'dock-fit' && window.officeCanvas) {
          window.officeCanvas.scale = 1.8;
          window.officeCanvas.initCanvasSize();
        }
      });
    });

    document.querySelectorAll('.agent-tree-node').forEach(node => {
      node.addEventListener('click', () => {
        document.querySelectorAll('.agent-tree-node').forEach(n => n.classList.remove('active'));
        node.classList.add('active');
        const agentId = node.getAttribute('data-id');
        if (window.mainApp) window.mainApp.selectAgent(agentId);
      });
    });
  }

  setKeys(keys) {
    this.allKeys = keys;
  }

  selectAgent(agent, keysList = []) {
    this.currentAgent = agent;
    if (keysList.length > 0) this.allKeys = keysList;

    // Agent Model Specialization Mapping
    const modelMap = {
      'agent_alex': { model: 'NVIDIA Nemotron 550B', badgeClass: 'openrouter', spec: 'Thinking & Planning' },
      'agent_elena': { model: 'NVIDIA Nemotron 550B', badgeClass: 'openrouter', spec: 'Thinking & Security' },
      'agent_devon': { model: 'Cohere North Mini Code', badgeClass: 'openai', spec: 'Coding & Backend' },
      'agent_marcus': { model: 'Cohere North Mini Code', badgeClass: 'openai', spec: 'Coding & Streams' },
      'agent_sam': { model: 'Ling 3.0 Flash', badgeClass: 'gemini', spec: 'Research & QA Audit' },
      'agent_zara': { model: 'Ling 3.0 Flash', badgeClass: 'gemini', spec: 'Research & SRE' },
      'agent_maya': { model: 'Recraft V4.1 Vector', badgeClass: 'anthropic', spec: 'UI & Pixel Assets' },
      'agent_kai': { model: 'Recraft V4.1 Vector', badgeClass: 'anthropic', spec: 'UX & Workflows' },
      'agent_riley': { model: 'Recraft V4.1 Vector', badgeClass: 'anthropic', spec: 'DevOps Containers' },
      'agent_viktor': { model: 'Recraft V4.1 Vector', badgeClass: 'anthropic', spec: 'ML Optimization' }
    };

    const specInfo = modelMap[agent.id] || { model: agent.model || 'OpenRouter Model', badgeClass: 'openrouter', spec: agent.role };

    // Card Header Info
    const agentSlug = agent.slug || agent.name.toLowerCase().replace(/\s+/g, '-');
    document.getElementById('card-agent-name').textContent = `${agent.name} (${agentSlug})`;
    document.getElementById('card-branch').textContent = 'develop';
    document.getElementById('card-model').textContent = specInfo.model;

    const avatarBox = document.getElementById('card-avatar');
    avatarBox.style.background = agent.color || 'var(--accent-purple)';

    // Metadata Grid
    const numId = agent.id.replace('agent_', '');
    document.getElementById('card-id').textContent = numId;
    document.getElementById('card-session').textContent = `ef989843-2a56-40a6-9ace-${agent.id.slice(-4)}`;
    document.getElementById('card-agent-slug').textContent = agentSlug;
    document.getElementById('card-dir').textContent = `github.com/${agent.group || 'ctrl'}-sh`;

    // Provider Badge
    const badgeEl = document.getElementById('card-provider-badge');
    badgeEl.textContent = specInfo.model;
    badgeEl.className = `val provider-badge ${specInfo.badgeClass}`;

    document.getElementById('card-team').textContent = `● ${agent.group || 'ctrl'} (${specInfo.spec})`;

    // Score & Success Rate
    const scoreVal = agent.score || 95;
    const successVal = agent.successRate || '99.4%';

    const boundKey = agent.assignedKey;
    let costVal = '$0.00 (Free OpenRouter)';
    let tokensVal = '1.2k in / 8.5k out';

    if (boundKey && boundKey.telemetry) {
      const tel = boundKey.telemetry;
      tokensVal = `${tel.promptTokens || 1200} in / ${((tel.completionTokens || 8500) / 1000).toFixed(1)}k out`;
    }

    document.getElementById('card-tokens').textContent = tokensVal;
    document.getElementById('card-cache').textContent = `Score: ${scoreVal}/100 (${successVal})`;
    document.getElementById('card-cost').textContent = costVal;
    document.getElementById('card-branch-val').textContent = 'develop';

    // Fetch existing logs
    if (window.mainApp && window.mainApp.sendWsEvent) {
      window.mainApp.sendWsEvent('GET_LOGS', { agentId: agent.id });
    }
  }

  appendLog(log) {
    const treeNodes = document.getElementById('tree-nodes');
    if (!treeNodes) return;

    if (log.type === 'THOUGHT') {
      const node = document.createElement('div');
      node.className = 'tree-node thought';
      node.innerHTML = `<span class="node-icon text-gold">●</span> <strong>Thinking</strong> <span class="time">+0s</span>`;
      treeNodes.appendChild(node);
    } else if (log.type === 'CODE') {
      this.turnsCount++;
      const turnsEl = document.getElementById('tree-turns');
      if (turnsEl) turnsEl.textContent = `${this.turnsCount} turns`;

      const divider = document.createElement('div');
      divider.className = 'tree-node turn-divider';
      divider.textContent = `TURN ${this.turnsCount} +0s`;
      treeNodes.appendChild(divider);

      const block = document.createElement('div');
      block.className = 'tree-node prompt-block';

      let textContent = log.text;
      if (textContent.includes('http://localhost:3005') || textContent.includes('http://localhost:3000')) {
        block.style.borderLeft = '3px solid var(--accent-green)';
        block.style.background = 'rgba(166, 227, 161, 0.12)';
        textContent = textContent.replace(/http:\/\/localhost:\d+/g, (url) => {
          return `<a href="${url}" target="_blank" style="color:var(--accent-green); font-weight:700; text-decoration:underline;">${url}</a>`;
        });
      }

      block.innerHTML = `
        <div class="node-title text-purple">● MODEL OUTPUT <span class="time">+0s</span></div>
        <div class="node-text">${textContent}</div>
      `;
      treeNodes.appendChild(block);
    } else if (log.type === 'EXEC') {
      const toolNode = document.createElement('div');
      toolNode.className = 'tree-node tool-exec';
      toolNode.innerHTML = `
        <span class="tool-badge grep">Grep</span> <code class="tool-query">${log.text}</code> <span class="tool-meta text-green">16 lines +0s</span>
      `;
      treeNodes.appendChild(toolNode);
    }

    treeNodes.scrollTop = treeNodes.scrollHeight;
  }
}

window.inspectorUI = new InspectorUI();
