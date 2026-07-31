/**
 * Multi-API Key Vault Modal & Allocator Controller
 */
class KeyVaultUI {
  constructor() {
    this.modal = document.getElementById('key-vault-modal');
    this.keys = [];
    this.bindings = {};

    this.initListeners();
  }

  initListeners() {
    const openBtn = document.getElementById('open-vault-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    const closeBtn = document.getElementById('close-vault-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal();
      });
    });

    const addKeyForm = document.getElementById('key-form');
    if (addKeyForm) {
      addKeyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameEl = document.getElementById('key-name');
        const providerEl = document.getElementById('key-provider');
        const keySecretEl = document.getElementById('key-secret');

        const name = nameEl ? nameEl.value.trim() : '';
        const provider = providerEl ? providerEl.value : 'openrouter';
        const keySecret = keySecretEl ? keySecretEl.value.trim() : '';

        if (!name || !keySecret) return;

        try {
          const res = await fetch('/api/keys/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, provider, key: keySecret })
          });
          const data = await res.json();
          if (data.success) {
            if (nameEl) nameEl.value = '';
            if (keySecretEl) keySecretEl.value = '';
            this.fetchKeys();
          }
        } catch (err) {
          console.error('[KeyVaultUI] Error saving key:', err);
        }
      });
    }
  }

  openModal() {
    if (this.modal) this.modal.classList.add('active');
    this.fetchKeys();
  }

  closeModal() {
    if (this.modal) this.modal.classList.remove('active');
  }

  setKeysAndBindings(keys, bindings) {
    this.keys = keys || [];
    this.bindings = bindings || {};
    this.renderKeysTable();
  }

  async fetchKeys() {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      this.keys = data.keys || [];
      this.bindings = data.bindings || {};
      this.renderKeysTable();
    } catch (err) {
      console.error('[KeyVaultUI] Error fetching keys:', err);
    }
  }

  renderKeysTable() {
    const listBody = document.getElementById('vault-keys-list');
    if (!listBody) return;

    listBody.innerHTML = '';

    if (this.keys.length === 0) {
      listBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No API Keys configured. Add your first key on the left!</td></tr>`;
      return;
    }

    this.keys.forEach(k => {
      const tr = document.createElement('tr');
      const cost = (k.telemetry?.estimatedCostUsd || 0.00).toFixed(2);
      const masked = k.masked || '***';

      tr.innerHTML = `
        <td><strong>${k.name}</strong></td>
        <td><span class="provider-badge ${k.provider}">${k.provider}</span></td>
        <td><code>${masked}</code></td>
        <td>
          <select class="glass-input key-bind-select" data-key-id="${k.id}" style="padding: 2px 4px; font-size:10px;">
            <option value="">Unbound</option>
            <option value="agent_alex">Alex Vance (Architect)</option>
            <option value="agent_maya">Maya Lin (Frontend)</option>
            <option value="agent_devon">Devon Miller (Backend)</option>
            <option value="agent_sam">Sam Carter (QA Audit)</option>
            <option value="agent_riley">Riley Davis (DevOps)</option>
            <option value="agent_marcus">Marcus Vance (Data)</option>
            <option value="agent_elena">Elena Rostova (Security)</option>
            <option value="agent_viktor">Viktor Krum (ML)</option>
            <option value="agent_zara">Zara Chen (SRE)</option>
            <option value="agent_kai">Kai Tanaka (UX)</option>
          </select>
        </td>
        <td>~$${cost}</td>
        <td>
          <button class="btn btn-secondary btn-xs btn-delete-key" data-key-id="${k.id}">🗑 Delete</button>
        </td>
      `;

      listBody.appendChild(tr);
    });

    // Handle bindings select dropdowns
    listBody.querySelectorAll('.key-bind-select').forEach(sel => {
      const keyId = sel.getAttribute('data-key-id');
      const boundAgentId = Object.keys(this.bindings).find(aId => this.bindings[aId] === keyId);
      if (boundAgentId) sel.value = boundAgentId;

      sel.addEventListener('change', async (e) => {
        const agentId = e.target.value;
        if (!agentId) return;

        try {
          await fetch('/api/keys/bind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, keyId })
          });
        } catch (err) {
          console.error('[KeyVaultUI] Error binding key:', err);
        }
      });
    });

    // Handle delete buttons
    listBody.querySelectorAll('.btn-delete-key').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const keyId = btn.getAttribute('data-key-id');
        if (!confirm('Are you sure you want to delete this API Key?')) return;

        try {
          await fetch(`/api/keys/${keyId}`, { method: 'DELETE' });
          this.fetchKeys();
        } catch (err) {
          console.error('[KeyVaultUI] Error deleting key:', err);
        }
      });
    });
  }
}

window.keyVaultUI = new KeyVaultUI();
