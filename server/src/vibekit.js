const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Official VibeKit Integration Engine
 * Connects the `vibekit` CLI package, Vibe Themes, Audio Synthesizers, and Vibe Inspector Widgets.
 */
class VibeKitEngine {
  constructor() {
    this.installed = this.checkVibeKitInstallation();
    this.themes = {
      CYBERPUNK: { name: 'Cyberpunk Neon ⚡', bg: '#0b0f19', primary: '#00f0ff', secondary: '#ec4899', accent: '#6366f1' },
      CATPPUCCIN: { name: 'Catppuccin Mocha ☕', bg: '#1e1e2e', primary: '#cdd6f4', secondary: '#cba6f7', accent: '#89b4fa' },
      SYNTHWAVE: { name: 'Retro Synthwave 🌇', bg: '#1a0b2e', primary: '#ff007f', secondary: '#7928ca', accent: '#00f0ff' },
      OBSIDIAN: { name: 'Glass Obsidian 💎', bg: '#090d16', primary: '#38bdf8', secondary: '#818cf8', accent: '#34d399' },
      MATRIX: { name: 'Emerald Matrix 🟢', bg: '#020d08', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
      VELVET: { name: 'Velvet Rose 🌹', bg: '#1a0910', primary: '#f43f5e', secondary: '#fb7185', accent: '#fbbf24' }
    };
  }

  checkVibeKitInstallation() {
    try {
      require.resolve('vibekit');
      console.log('[VibeKit] Official `vibekit` package detected and active!');
      return true;
    } catch (e) {
      console.warn('[VibeKit] `vibekit` package loading fallback active:', e.message);
      return false;
    }
  }

  executeVibeCommand(cmd) {
    try {
      console.log(`[VibeKit CLI] Executing: npx vibekit ${cmd}`);
      const output = execSync(`npx vibekit ${cmd}`, { cwd: path.join(__dirname, '..', '..') }).toString();
      return { success: true, output };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  getVibeInspectorScript() {
    return `
    <script>
      (function() {
        if (window.__VIBEKIT_INJECTED__) return;
        window.__VIBEKIT_INJECTED__ = true;

        const widget = document.createElement('div');
        widget.id = 'vibekit-inspector-root';
        widget.innerHTML = \`
          <style>
            #vibekit-inspector-root { position: fixed; bottom: 24px; right: 24px; z-index: 99999; font-family: system-ui, sans-serif; }
            .vibe-pill { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(0, 240, 255, 0.4); color: #00f0ff; padding: 10px 18px; border-radius: 30px; font-size: 13px; font-weight: 800; cursor: pointer; backdrop-filter: blur(16px); box-shadow: 0 10px 30px rgba(0,240,255,0.2); transition: all 0.25s; display: flex; align-items: center; gap: 8px; }
            .vibe-pill:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,240,255,0.4); }
            .vibe-panel { display: none; position: absolute; bottom: 54px; right: 0; width: 320px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; backdrop-filter: blur(20px); color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
            .vibe-panel.open { display: block; }
            .vibe-title { font-size: 16px; font-weight: 900; color: #00f0ff; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
            .vibe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
            .vibe-theme-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center; }
            .vibe-theme-btn:hover { border-color: #00f0ff; color: #00f0ff; }
          </style>
          <div class="vibe-panel" id="vibe-panel">
            <div class="vibe-title"><span>⚡ VibeKit Inspector</span><span style="cursor:pointer; color:#94a3b8;" onclick="toggleVibePanel()">✕</span></div>
            <p style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Instant Vibe Theme Switcher & Synthesizer FX</p>
            <div class="vibe-grid">
              <button class="vibe-theme-btn" onclick="applyVibe('cyberpunk')">⚡ Cyberpunk</button>
              <button class="vibe-theme-btn" onclick="applyVibe('catppuccin')">☕ Catppuccin</button>
              <button class="vibe-theme-btn" onclick="applyVibe('synthwave')"><ctrl42> Synthwave</button>
              <button class="vibe-theme-btn" onclick="applyVibe('matrix')">🟢 Matrix</button>
            </div>
            <div style="font-size:11px; color:#10b981; font-weight:700; text-align:center;">● VibeKit CLI Engine Active</div>
          </div>
          <div class="vibe-pill" onclick="toggleVibePanel()">✨ VibeKit</div>
        \`;
        document.body.appendChild(widget);

        window.toggleVibePanel = function() {
          const panel = document.getElementById('vibe-panel');
          panel.classList.toggle('open');
          playVibeChime();
        };

        window.applyVibe = function(theme) {
          playVibeChime();
          if (theme === 'cyberpunk') {
            document.documentElement.style.setProperty('--bg', '#0b0f19');
            document.documentElement.style.setProperty('--primary', '#6366f1');
          } else if (theme === 'catppuccin') {
            document.documentElement.style.setProperty('--bg', '#1e1e2e');
            document.documentElement.style.setProperty('--primary', '#cba6f7');
          } else if (theme === 'synthwave') {
            document.documentElement.style.setProperty('--bg', '#1a0b2e');
            document.documentElement.style.setProperty('--primary', '#ff007f');
          } else if (theme === 'matrix') {
            document.documentElement.style.setProperty('--bg', '#020d08');
            document.documentElement.style.setProperty('--primary', '#10b981');
          }
          alert('✨ VibeKit Theme Transformed to: ' + theme.toUpperCase());
        };

        function playVibeChime() {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch(e) {}
        }
      })();
    </script>
    `;
  }
}

module.exports = new VibeKitEngine();
