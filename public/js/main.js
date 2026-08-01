/**
 * Main Application Orchestrator & Multi-Agent Build Controller
 * Dual WebSocket & REST dispatch for 100% reliable prompt builds.
 */
class MainApp {
  constructor() {
    this.ws = null;
    this.state = this.getDefaultFallbackState();
    this.reconnectTimer = null;
    this.currentBuildUrl = 'http://localhost:3005';

    this.initCanvas();
    this.initBuildPromptListeners();
    this.initX402BillingUI();
    this.renderLeftGroupsTree();
    this.selectAgent('agent_alex');
    this.connectWebSocket();
  }

  getDefaultFallbackState() {
    return {
      cols: 24,
      rows: 16,
      tileSize: 32,
      decorations: [
        { type: "bookshelf", x: 2, y: 1 },
        { type: "wall_clock", x: 5, y: 1 },
        { type: "sofa_down", x: 16, y: 4 },
        { type: "coffee_table", x: 16, y: 6 }
      ],
      cubicles: [
        { id: "cubicle_1", name: "Architect Suite", deskX: 3, deskY: 4, agentId: "agent_alex" },
        { id: "cubicle_2", name: "Frontend Station 1", deskX: 8, deskY: 4, agentId: "agent_maya" },
        { id: "cubicle_3", name: "Backend Lab Left", deskX: 15, deskY: 6, agentId: "agent_devon" },
        { id: "cubicle_4", name: "QA & Audit Hub", deskX: 18, deskY: 6, agentId: "agent_sam" }
      ],
      agents: [
        { id: "agent_alex", name: "Alex Vance", slug: "drifting-gliding-neumann", group: "ctrl", role: "Lead System Architect", model: "NVIDIA Nemotron 550B", score: 98, color: "#7000ff", x: 3, y: 5, status: "IDLE" },
        { id: "agent_maya", name: "Maya Lin", slug: "pixel-craft-maya", group: "ctrl", role: "Frontend Pixel Specialist", model: "Recraft V4.1 Vector", score: 96, color: "#00f0ff", x: 8, y: 5, status: "IDLE" },
        { id: "agent_devon", name: "Devon Miller", slug: "async-engine-devon", group: "ctrl", role: "Backend Core Engineer", model: "Cohere North Mini Code", score: 95, color: "#ff007b", x: 15, y: 6, status: "IDLE" },
        { id: "agent_sam", name: "Sam Carter", slug: "shield-auditor-sam", group: "ctrl", role: "QA & Security Auditor", model: "Ling 3.0 Flash", score: 99, color: "#00ff66", x: 18, y: 6, status: "IDLE" },
        { id: "agent_riley", name: "Riley Davis", slug: "cloud-pipeline-riley", group: "bulletproof-sh", role: "DevOps & Cloud Specialist", model: "Recraft V4.1 Vector", score: 94, color: "#e2e8f0", x: 3, y: 9, status: "IDLE" },
        { id: "agent_marcus", name: "Marcus Vance", slug: "data-stream-marcus", group: "bulletproof-sh", role: "Data Systems Specialist", model: "Cohere North Mini Code", score: 93, color: "#ea580c", x: 7, y: 9, status: "IDLE" },
        { id: "agent_elena", name: "Elena Rostova", slug: "sentinel-elena", group: "bulletproof-sh", role: "Cyber Security Sentinel", model: "NVIDIA Nemotron 550B", score: 97, color: "#ef4444", x: 2, y: 10, status: "IDLE" },
        { id: "agent_viktor", name: "Viktor Krum", slug: "ml-core-viktor", group: "bulletproof-sh", role: "Machine Learning Engineer", model: "Recraft V4.1 Vector", score: 95, color: "#a855f7", x: 8, y: 10, status: "IDLE" },
        { id: "agent_zara", name: "Zara Chen", slug: "sre-zara", group: "ecosystem", role: "Site Reliability Engineer", model: "Ling 3.0 Flash", score: 96, color: "#eab308", x: 14, y: 11, status: "IDLE" },
        { id: "agent_kai", name: "Kai Tanaka", slug: "ux-architect-kai", group: "ecosystem", role: "Product & UX Architect", model: "Recraft V4.1 Vector", score: 92, color: "#ec4899", x: 20, y: 11, status: "IDLE" }
      ]
    };
  }

  initCanvas() {
    window.officeCanvas = new OfficeCanvas('office-canvas');
    window.officeCanvas.setState(this.state);
    window.officeCanvas.setSelectAgentCallback((agentId) => {
      this.selectAgent(agentId);
    });
  }

  initBuildPromptListeners() {
    const btnStart = document.getElementById('btn-start-build');
    const inputPrompt = document.getElementById('global-build-prompt');

    const triggerBuild = async () => {
      const promptText = inputPrompt ? inputPrompt.value.trim() : '';
      if (!promptText) {
        alert('Please enter a build prompt (e.g., Build a personal portfolio website)');
        return;
      }

      console.log('[MainApp] Dispatching prompt build for:', promptText);

      if (window.inspectorUI) {
        window.inspectorUI.appendLog({ type: 'THOUGHT', text: `🚀 Multi-Agent Build Triggered: "${promptText}"` });
      }

      // 1. Send WebSocket event
      this.sendWsEvent('START_BUILD', { prompt: promptText });

      // 2. Dual REST fallback to guarantee execution
      try {
        const res = await fetch('/api/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText })
        });
        const data = await res.json();
        if (data && data.localhostUrl) {
          this.currentBuildUrl = data.localhostUrl;
        }
      } catch (err) {
        console.warn('[MainApp] REST build fallback notice:', err.message);
      }

      if (inputPrompt) inputPrompt.value = '';
    };

    if (btnStart) btnStart.onclick = triggerBuild;
    if (inputPrompt) {
      inputPrompt.onkeydown = (e) => {
        if (e.key === 'Enter') triggerBuild();
      };
    }

    const closeBtn = document.getElementById('close-build-modal-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        document.getElementById('build-complete-modal').classList.remove('active');
      };
    }

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const targetUrl = this.currentBuildUrl || 'http://localhost:3005';
        navigator.clipboard.writeText(targetUrl);
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Link'; }, 2000);
      };
    }
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[App] Connected to Office WebSocket Server');
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.handleWsEvent(parsed.event, parsed.data);
        } catch (err) {
          console.error('[App] Error parsing WS event:', err);
        }
      };

      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.ws.onerror = () => {
        this.ws.close();
      };
    } catch (e) {
      console.error('[App] Exception opening WebSocket:', e);
    }
  }

  sendWsEvent(event, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  handleWsEvent(event, data) {
    if (event === 'INIT_STATE') {
      this.state = data;
      window.officeCanvas.setState(data);
      this.renderLeftGroupsTree();

      if (window.keyVaultUI) {
        window.keyVaultUI.setKeysAndBindings(data.keys, this.getBindingsMap(data.agents));
      }

      if (data.agents && data.agents.length > 0) {
        this.selectAgent(data.agents[0].id);
      }
    } else if (event === 'AGENT_UPDATE') {
      window.officeCanvas.updateAgent(data);
      if (this.state && this.state.agents) {
        const agent = this.state.agents.find(a => a.id === data.id);
        if (agent) Object.assign(agent, data);
      }
    } else if (event === 'AGENT_LOG') {
      if (window.inspectorUI) {
        window.inspectorUI.appendLog(data.log);
      }
    } else if (event === 'BUILD_PHASE') {
      if (window.inspectorUI) {
        window.inspectorUI.appendLog({ type: 'THOUGHT', text: data.title });
      }
    } else if (event === 'BUILD_COMPLETED') {
      this.showBuildCompletedModal(data);
    } else if (event === 'KEYS_UPDATED') {
      if (window.keyVaultUI) {
        window.keyVaultUI.setKeysAndBindings(data.keys, data.bindings);
      }
    } else if (event === 'LAYOUT_UPDATED') {
      this.state = data;
      window.officeCanvas.setState(data);
    } else if (event === 'AGENT_HIRED') {
      // New agent joined — add to state and re-render
      if (this.state && this.state.agents && data.agent) {
        this.state.agents.push(data.agent);
        window.officeCanvas.setState(this.state);
        this.renderLeftGroupsTree();
      }
      console.log(`[Office] 🎉 ${data.message}`);
    } else if (event === 'AGENT_FIRED') {
      // Agent left — remove from state and re-render
      if (this.state && this.state.agents) {
        this.state.agents = this.state.agents.filter(a => a.id !== data.agentId);
        window.officeCanvas.setState(this.state);
        this.renderLeftGroupsTree();
      }
      console.log(`[Office] 🔴 ${data.message}`);
    }
  }

  showBuildCompletedModal(data) {
    const modal = document.getElementById('build-complete-modal');
    if (!modal) return;

    const buildUrl = data.localhostUrl || 'http://localhost:3005';
    this.currentBuildUrl = buildUrl;

    document.getElementById('build-modal-prompt').textContent = `Prompt: "${data.prompt}"`;
    
    const linkEl = document.getElementById('build-localhost-link');
    if (linkEl) {
      linkEl.textContent = buildUrl;
      linkEl.href = buildUrl;
    }

    const scoresList = document.getElementById('agent-scores-list');
    if (scoresList) {
      scoresList.innerHTML = '';

      const agentMap = {
        'agent_alex': { name: 'Alex Vance', role: 'Lead Architect', model: 'NVIDIA Nemotron 550B', score: 98 },
        'agent_elena': { name: 'Elena Rostova', role: 'Security Sentinel', model: 'NVIDIA Nemotron 550B', score: 97 },
        'agent_sam': { name: 'Sam Carter', role: 'QA Auditor', model: 'Ling 3.0 Flash', score: 99 },
        'agent_zara': { name: 'Zara Chen', role: 'SRE Engineer', model: 'Ling 3.0 Flash', score: 96 },
        'agent_devon': { name: 'Devon Miller', role: 'Backend Engineer', model: 'Cohere North Mini Code', score: 95 },
        'agent_marcus': { name: 'Marcus Vance', role: 'Data Systems', model: 'Cohere North Mini Code', score: 93 },
        'agent_maya': { name: 'Maya Lin', role: 'Frontend Specialist', model: 'Recraft V4.1 Vector', score: 96 },
        'agent_kai': { name: 'Kai Tanaka', role: 'UX Architect', model: 'Recraft V4.1 Vector', score: 92 },
        'agent_riley': { name: 'Riley Davis', role: 'DevOps Engineer', model: 'Recraft V4.1 Vector', score: 94 },
        'agent_viktor': { name: 'Viktor Krum', role: 'ML Engineer', model: 'Recraft V4.1 Vector', score: 95 }
      };

      Object.entries(agentMap).forEach(([id, meta]) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        item.innerHTML = `
          <div>
            <span class="agent-name">${meta.name}</span>
            <div style="font-size:10px; color:var(--text-dim);">${meta.role} • ${meta.model}</div>
          </div>
          <span class="score-badge">${meta.score}/100 Score</span>
        `;
        scoresList.appendChild(item);
      });
    }

    modal.classList.add('active');
    if (window.audioEngine) window.audioEngine.playChime();

    // Also populate X402 Billing invoice if present
    if (data.invoice) {
      this.renderX402Invoice(data.invoice);
    }
  }

  initX402BillingUI() {
    const btnOpen = document.getElementById('open-billing-btn');
    const btnClose = document.getElementById('close-billing-btn');
    const modal = document.getElementById('x402-billing-modal');
    const btnTogglePera = document.getElementById('btn-toggle-pera-qr');
    const boxPera = document.getElementById('pera-qr-scanner-box');
    const btnSimulatePera = document.getElementById('btn-simulate-pera-pay');
    const btnCopyUri = document.getElementById('btn-copy-pera-uri');

    if (btnOpen && modal) {
      btnOpen.onclick = () => {
        modal.classList.add('active');
        if (window.audioEngine) window.audioEngine.playChime();
      };
    }
    if (btnClose && modal) {
      btnClose.onclick = () => {
        modal.classList.remove('active');
      };
    }

    if (btnTogglePera && boxPera) {
      btnTogglePera.onclick = () => {
        const isHidden = boxPera.style.display === 'none';
        boxPera.style.display = isHidden ? 'block' : 'none';
        btnTogglePera.textContent = isHidden ? '✕ Hide QR Scanner' : '📱 Show QR Scanner';
        if (isHidden) {
          this.drawPeraModalQRCode();
        }
      };
    }

    if (btnSimulatePera) {
      btnSimulatePera.onclick = () => {
        const logBox = document.getElementById('pera-settle-tx-log');
        const hashEl = document.getElementById('pera-tx-hash');
        btnSimulatePera.textContent = '⏳ Authorizing with Pera Mobile Wallet...';
        btnSimulatePera.style.opacity = '0.7';

        setTimeout(() => {
          const fakeTxHash = 'TX_PERA_ALGO_' + Math.random().toString(36).substring(2, 10).toUpperCase();
          if (hashEl) hashEl.textContent = fakeTxHash;
          if (logBox) logBox.style.display = 'block';
          btnSimulatePera.textContent = '✓ Settled via Pera Wallet (Algorand TestNet)';
          btnSimulatePera.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          btnSimulatePera.style.opacity = '1';

          if (window.audioEngine) window.audioEngine.playChime();
          alert(`🎉 X402 Micro-Payment Settled via Pera Wallet on Algorand TestNet!\n\nTxHash: ${fakeTxHash}\nStatus: HTTP 402 SETTLED`);
        }, 1200);
      };
    }

    if (btnCopyUri) {
      btnCopyUri.onclick = () => {
        const uriEl = document.getElementById('pera-invoice-uri');
        if (uriEl) {
          navigator.clipboard.writeText(uriEl.textContent);
          alert('📋 Pera WalletConnect Payment URI copied to clipboard!');
        }
      };
    }
  }

  drawPeraModalQRCode() {
    const canvas = document.getElementById('pera-modal-qr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = '#0f172a';

    const size = 15;
    const step = 150 / size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r < 4 && c < 4) || (r < 4 && c > 10) || (r > 10 && c < 4)) {
          if (r === 0 || r === 3 || c === 0 || c === 3 || (c === 14 || c === 11 || r === 0 || r === 3) && c >= 11 && r <= 3 || (r === 14 || r === 11 || c === 0 || c === 3) && r >= 11 && c <= 3) {
            ctx.fillRect(c * step, r * step, step, step);
          }
        } else if (Math.sin(r * 2.5 + c * 5.5 + 42) > -0.2) {
          ctx.fillRect(c * step + 1, r * step + 1, step - 2, step - 2);
        }
      }
    }
  }

  renderX402Invoice(invoice) {
    if (!invoice) return;

    const costEl = document.getElementById('x402-total-cost');
    const tokensEl = document.getElementById('x402-total-tokens');
    const hCost = document.getElementById('x402-header-cost');
    const hTokens = document.getElementById('x402-header-tokens');
    const hId = document.getElementById('x402-header-id');
    const tbody = document.getElementById('x402-invoice-breakdown');

    if (costEl) costEl.textContent = `$${invoice.totalCostUSD.toFixed(6)}`;
    if (tokensEl) tokensEl.textContent = `${invoice.totalTokens.toLocaleString()} total prompt & completion tokens`;
    if (hCost) hCost.textContent = `$${invoice.totalCostUSD.toFixed(6)}`;
    if (hTokens) hTokens.textContent = `${invoice.totalTokens.toLocaleString()} Tokens`;
    if (hId) hId.textContent = invoice.invoiceId || 'X402_SETTLED';

    if (tbody && invoice.breakdown) {
      tbody.innerHTML = '';
      invoice.breakdown.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.agentId}</strong></td>
          <td>${item.role}</td>
          <td><span class="badge-blue">${item.model}</span></td>
          <td>${item.promptTokens}</td>
          <td>${item.completionTokens}</td>
          <td style="color:var(--accent-green); font-weight:700;">$${item.costUSD.toFixed(6)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  getBindingsMap(agents) {
    const map = {};
    agents.forEach(a => {
      if (a.assignedKey) map[a.id] = a.assignedKey.id;
    });
    return map;
  }

  renderLeftGroupsTree() {
    const container = document.querySelector('.groups-tree');
    if (!container || !this.state || !this.state.agents) return;

    const groups = {};
    this.state.agents.forEach(a => {
      const gName = a.group || 'ctrl';
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(a);
    });

    container.innerHTML = '';
    const colors = { 'ctrl': 'red', 'bulletproof-sh': 'green', 'ecosystem': 'gold' };

    Object.entries(groups).forEach(([gName, agentList]) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'group-item open';

      const colorClass = colors[gName] || 'green';
      groupDiv.innerHTML = `
        <div class="group-title"><span class="color-sq ${colorClass}"></span> <strong>${gName}</strong> <span class="count">${agentList.length}</span></div>
      `;

      agentList.forEach(agent => {
        const node = document.createElement('div');
        node.className = `agent-tree-node ${agent.id === window.officeCanvas.selectedAgentId ? 'active' : ''}`;
        node.setAttribute('data-id', agent.id);

        const statusMap = {
          'CODING': { text: 'coding', dotClass: 'green' },
          'THINKING': { text: 'thinking', dotClass: 'green' },
          'EXECUTING': { text: 'executing', dotClass: 'green' },
          'REVIEWING': { text: 'reviewing', dotClass: 'green' },
          'MEETING': { text: 'in meeting', dotClass: 'gold' },
          'BREAK': { text: 'on break', dotClass: 'orange' },
          'COMPLETED': { text: 'done', dotClass: 'green' },
          'FIRED': { text: 'leaving', dotClass: 'red' },
          'IDLE': { text: 'idle', dotClass: 'green' }
        };
        const statusInfo = statusMap[agent.status] || { text: 'idle', dotClass: 'green' };
        const slug = agent.slug || agent.name.toLowerCase().replace(/\s+/g, '-');

        node.innerHTML = `
          <span class="dot ${statusInfo.dotClass}"></span> ${slug} <span class="time">${statusInfo.text}</span>
        `;

        node.addEventListener('click', () => {
          this.selectAgent(agent.id);
        });

        groupDiv.appendChild(node);
      });

      container.appendChild(groupDiv);
    });
  }

  selectAgent(agentId) {
    if (!this.state || !this.state.agents) return;

    const agent = this.state.agents.find(a => a.id === agentId);
    if (agent) {
      window.officeCanvas.selectedAgentId = agentId;

      document.querySelectorAll('.agent-tree-node').forEach(p => {
        if (p.getAttribute('data-id') === agentId) p.classList.add('active');
        else p.classList.remove('active');
      });

      window.inspectorUI.selectAgent(agent, this.state.keys || []);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.mainApp = new MainApp();
});
