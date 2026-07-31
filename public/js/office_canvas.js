/**
 * HTML5 2D Canvas Tilemap & Animated Office Renderer
 * Guaranteed fallback rendering so canvas is NEVER blank/black.
 */
class OfficeCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.cols = 24;
    this.rows = 16;
    this.tileSize = 32;
    this.scale = 1.35;

    this.cubicles = [];
    this.decorations = [];
    this.agents = new Map();
    this.selectedAgentId = 'agent_alex';

    this.animFrame = 0;
    this.particles = [];

    this.onSelectAgentCallback = null;

    this.initCanvasSize();
    this.setupListeners();
    window.addEventListener('resize', () => this.initCanvasSize());
    this.startLoop();
  }

  initCanvasSize() {
    const wrapper = this.canvas.parentElement;
    let availW = 800;
    let availH = 500;

    if (wrapper && wrapper.clientWidth > 0 && wrapper.clientHeight > 0) {
      availW = wrapper.clientWidth - 24;
      availH = wrapper.clientHeight - 24;
    }

    const scaleX = availW / (this.cols * this.tileSize);
    const scaleY = availH / (this.rows * this.tileSize);
    this.scale = Math.max(1.0, Math.min(scaleX, scaleY));

    this.canvas.width = Math.floor(this.cols * this.tileSize * this.scale);
    this.canvas.height = Math.floor(this.rows * this.tileSize * this.scale);
    this.ctx.imageSmoothingEnabled = false;
  }

  setSelectAgentCallback(cb) {
    this.onSelectAgentCallback = cb;
  }

  setState(state) {
    if (state.cols) this.cols = state.cols;
    if (state.rows) this.rows = state.rows;
    if (state.tileSize) this.tileSize = state.tileSize;
    if (state.cubicles) this.cubicles = state.cubicles;
    if (state.decorations) this.decorations = state.decorations;

    if (window.pathfinding) {
      window.pathfinding.cols = this.cols;
      window.pathfinding.rows = this.rows;
      this.cubicles.forEach(c => window.pathfinding.setObstacle(c.deskX, c.deskY, true));
      this.decorations.forEach(d => window.pathfinding.setObstacle(d.x, d.y, true));
    }

    if (state.agents && state.agents.length > 0) {
      state.agents.forEach(a => {
        const existing = this.agents.get(a.id);
        this.agents.set(a.id, {
          ...a,
          animFrame: existing ? existing.animFrame : 0,
          renderX: existing ? existing.renderX : a.x,
          renderY: existing ? existing.renderY : a.y
        });
      });
    }

    this.initCanvasSize();
  }

  updateAgent(agentData) {
    const agent = this.agents.get(agentData.id);
    if (agent) {
      Object.assign(agent, agentData);
      if (agentData.status === 'CODING' && window.audioEngine) window.audioEngine.playClick();
      else if (agentData.status === 'COMPLETED' && window.audioEngine) window.audioEngine.playChime();
    }
  }

  setupListeners() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const ts = this.tileSize * this.scale;
      const tileX = Math.floor(clickX / ts);
      const tileY = Math.floor(clickY / ts);

      let clickedAgentId = null;
      this.agents.forEach((agent) => {
        if (Math.round(agent.renderX) === tileX && Math.round(agent.renderY) === tileY) {
          clickedAgentId = agent.id;
        }
      });

      if (!clickedAgentId) {
        this.cubicles.forEach((c) => {
          if ((Math.abs(c.deskX - tileX) <= 1) && (Math.abs(c.deskY - tileY) <= 1)) {
            clickedAgentId = c.agentId;
          }
        });
      }

      if (clickedAgentId) {
        this.selectedAgentId = clickedAgentId;
        if (this.onSelectAgentCallback) {
          this.onSelectAgentCallback(clickedAgentId);
        }
      }
    });
  }

  startLoop() {
    const loop = () => {
      this.animFrame++;
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    this.agents.forEach(agent => {
      if (agent.renderX !== agent.x) {
        const dx = agent.x - agent.renderX;
        agent.renderX += dx * 0.2;
        if (Math.abs(dx) < 0.01) agent.renderX = agent.x;
        agent.direction = dx > 0 ? 'right' : 'left';
      }
      if (agent.renderY !== agent.y) {
        const dy = agent.y - agent.renderY;
        agent.renderY += dy * 0.2;
        if (Math.abs(dy) < 0.01) agent.renderY = agent.y;
        agent.direction = dy > 0 ? 'down' : 'up';
      }
    });
  }

  render() {
    const ctx = this.ctx;
    const ts = this.tileSize * this.scale;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Ensure fallback tiles if spriteGen is pending
    const woodFloor = window.spriteGen ? window.spriteGen.getWoodFloorTile() : null;
    const blueCarpet = window.spriteGen ? window.spriteGen.getBlueCarpetTile() : null;
    const checkeredFloor = window.spriteGen ? window.spriteGen.getCheckeredTile() : null;
    const wallTile = window.spriteGen ? window.spriteGen.getWallTile() : null;

    // 1. Draw Dual-Room Floor Tilemap
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c < 12) {
          if (woodFloor) ctx.drawImage(woodFloor, c * ts, r * ts, ts, ts);
          else { ctx.fillStyle = '#4a2e1b'; ctx.fillRect(c * ts, r * ts, ts, ts); }
        } else {
          if (r < 12) {
            if (blueCarpet) ctx.drawImage(blueCarpet, c * ts, r * ts, ts, ts);
            else { ctx.fillStyle = '#1e3a8a'; ctx.fillRect(c * ts, r * ts, ts, ts); }
          } else {
            if (checkeredFloor) ctx.drawImage(checkeredFloor, c * ts, r * ts, ts, ts);
            else { ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000'; ctx.fillRect(c * ts, r * ts, ts, ts); }
          }
        }

        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1 || (c === 11 && (r < 5 || r > 8))) {
          if (wallTile) ctx.drawImage(wallTile, c * ts, r * ts, ts, ts);
          else { ctx.fillStyle = '#1f2937'; ctx.fillRect(c * ts, r * ts, ts, ts); }
        }
      }
    }

    // 2. Quad Pod Desk
    if (window.spriteGen) {
      const quadDesk = window.spriteGen.getQuadPodDeskTile();
      ctx.drawImage(quadDesk, 4 * ts, 8 * ts, ts * 2, ts * 2);
    }

    // 3. CRT Desks
    this.cubicles.forEach(cubicle => {
      if (cubicle.deskX !== 4 && cubicle.deskX !== 6 && cubicle.deskX !== 5 && cubicle.deskX < 12) {
        if (window.spriteGen) {
          const retroDesk = window.spriteGen.getRetroDeskTile();
          ctx.drawImage(retroDesk, cubicle.deskX * ts, cubicle.deskY * ts, ts, ts);
        }
      }

      if (cubicle.agentId === this.selectedAgentId) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cubicle.deskX * ts - 2, cubicle.deskY * ts - 2, ts + 4, ts + 4);
      }
    });

    // 4. Decorations
    this.decorations.forEach(d => {
      if (window.spriteGen) {
        let tile;
        if (d.type.startsWith('sofa')) {
          const dir = d.type.includes('vertical') ? 'vertical' : 'down';
          tile = window.spriteGen.getRedSofaTile(dir);
        } else if (d.type === 'coffee_table') {
          tile = window.spriteGen.getCoffeeTableTile();
        } else {
          tile = window.spriteGen.getDecorationTile(d.type);
        }
        ctx.drawImage(tile, d.x * ts, d.y * ts, ts, ts);
      }
    });

    // 5. Draw Characters & Overhead Subtask Badges
    this.agents.forEach(agent => {
      const frameIndex = Math.floor(this.animFrame / 15);
      const drawX = agent.renderX * ts;
      const drawY = agent.renderY * ts;

      if (window.spriteGen) {
        const charSprite = window.spriteGen.getCharacterSprite(agent.avatar, agent.direction || 'down', frameIndex);
        ctx.drawImage(charSprite, drawX, drawY, ts, ts);
      } else {
        ctx.fillStyle = agent.color || '#5a8cff';
        ctx.fillRect(drawX + 4, drawY + 4, ts - 8, ts - 8);
      }

      // Selected Halo Ring
      if (agent.id === this.selectedAgentId) {
        ctx.strokeStyle = agent.color || '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX + ts / 2, drawY + ts / 2 + 4, ts / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Overhead Subtask Badge
      this.renderSubtaskOverheadBadge(agent, drawX, drawY, ts);

      // Numerical Agent ID Badge
      this.renderNumericalAgentIdBadge(agent, drawX, drawY, ts);
    });
  }

  renderSubtaskOverheadBadge(agent, drawX, drawY, ts) {
    if (agent.status === 'IDLE' && !agent.currentTask) return;

    const ctx = this.ctx;
    const subtaskText = `• [Subtask (${agent.name.toLowerCase().split(' ')[0]}-agent)]`;

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(subtaskText).width;
    const bw = textWidth + 14;
    const bh = 18;

    const bx = drawX + ts / 2 - bw / 2;
    const by = drawY - bh - 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subtaskText, drawX + ts / 2, by + bh / 2);
  }

  renderNumericalAgentIdBadge(agent, drawX, drawY, ts) {
    const ctx = this.ctx;
    const numId = agent.id.includes('alex') ? '4' : (agent.id.includes('maya') ? '2' : '1');

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(drawX + ts - 10, drawY + ts - 10, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numId, drawX + ts - 4, drawY + ts - 4);
  }
}
