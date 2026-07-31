const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const KEYS_FILE = path.join(DATA_DIR, 'keys_store.json');
const ENCRYPTION_SECRET = process.env.KEY_SECRET || 'pixel-office-secret-key-32bytes!';

class KeyVault {
  constructor() {
    this.keys = new Map();
    this.agentBindings = new Map();
    this.telemetry = new Map();
    this.ensureDataDir();
    this.loadStore();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_SECRET.padEnd(32).slice(0, 32)), iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
      return Buffer.from(text).toString('base64');
    }
  }

  decrypt(text) {
    try {
      if (!text.includes(':')) {
        return Buffer.from(text, 'base64').toString('utf8');
      }
      const parts = text.split(':');
      const iv = Buffer.from(parts.shift(), 'hex');
      const encryptedText = Buffer.from(parts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_SECRET.padEnd(32).slice(0, 32)), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (e) {
      return text;
    }
  }

  maskKey(keyStr) {
    if (!keyStr) return 'N/A';
    if (keyStr.startsWith('http')) return keyStr;
    if (keyStr.length <= 10) return '***';
    return keyStr.slice(0, 10) + '...' + keyStr.slice(-6);
  }

  loadStore() {
    if (fs.existsSync(KEYS_FILE)) {
      try {
        const raw = fs.readFileSync(KEYS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.keys) {
          parsed.keys.forEach(k => {
            const rawKey = this.decrypt(k.encryptedKey);
            this.keys.set(k.id, {
              ...k,
              key: rawKey,
              masked: this.maskKey(rawKey)
            });
            this.telemetry.set(k.id, k.telemetry || {
              requests: 0,
              promptTokens: 0,
              completionTokens: 0,
              estimatedCostUsd: 0,
              lastUsed: null,
              status: 'ACTIVE'
            });
          });
        }
        if (parsed.bindings) {
          Object.entries(parsed.bindings).forEach(([agentId, keyId]) => {
            this.agentBindings.set(agentId, keyId);
          });
        }
      } catch (err) {
        console.error('[KeyVault] Error loading store:', err.message);
      }
    }

    if (this.keys.size === 0) {
      this.addDefaultKeys();
    }

    // Key 1: NVIDIA Nemotron 550B -> Thinking, Planning & Design
    this.saveKey(
      'key_openrouter_nvidia',
      'NVIDIA Nemotron 3 Ultra (Thinking, Planning & Design)',
      'openrouter',
      process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_NVIDIA'
    );

    // Key 2: Cohere North Mini Code -> Coding & Implementation
    this.saveKey(
      'key_openrouter_cohere',
      'Cohere North Mini Code (Coding & Implementation)',
      'openrouter',
      process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_COHERE'
    );

    // Key 3: Ling 3.0 Flash -> Researching & Analysis
    this.saveKey(
      'key_openrouter_ling',
      'Ling 3.0 Flash (Researching & Analysis)',
      'openrouter',
      process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_LING'
    );

    // Key 4: Recraft V4.1 Vector -> Image Generation & Graphics
    this.saveKey(
      'key_openrouter_recraft',
      'Recraft V4.1 Vector (Image Generation & Graphics)',
      'openrouter',
      process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_RECRAFT'
    );

    // Exact User Pipeline Bindings
    // 1. Thinking & Planning -> NVIDIA Nemotron
    this.bindAgentKey('agent_alex', 'key_openrouter_nvidia');
    this.bindAgentKey('agent_elena', 'key_openrouter_nvidia');

    // 2. Coding & Implementation -> Cohere North Mini
    this.bindAgentKey('agent_devon', 'key_openrouter_cohere');
    this.bindAgentKey('agent_marcus', 'key_openrouter_cohere');

    // 3. Researching & QA Audit -> Ling 3.0 Flash
    this.bindAgentKey('agent_sam', 'key_openrouter_ling');
    this.bindAgentKey('agent_zara', 'key_openrouter_ling');

    // 4. Image Generation & Pixel Graphics -> Recraft V4.1 Vector
    this.bindAgentKey('agent_maya', 'key_openrouter_recraft');
    this.bindAgentKey('agent_kai', 'key_openrouter_recraft');
    this.bindAgentKey('agent_riley', 'key_openrouter_recraft');
    this.bindAgentKey('agent_viktor', 'key_openrouter_recraft');
  }

  addDefaultKeys() {
    const demoKeys = [
      {
        id: 'key_openrouter_nvidia',
        name: 'NVIDIA Nemotron 3 Ultra (Thinking, Planning & Design)',
        provider: 'openrouter',
        key: process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_NVIDIA'
      },
      {
        id: 'key_openrouter_cohere',
        name: 'Cohere North Mini Code (Coding & Implementation)',
        provider: 'openrouter',
        key: process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_COHERE'
      },
      {
        id: 'key_openrouter_ling',
        name: 'Ling 3.0 Flash (Researching & Analysis)',
        provider: 'openrouter',
        key: process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_LING'
      },
      {
        id: 'key_openrouter_recraft',
        name: 'Recraft V4.1 Vector (Image Generation & Graphics)',
        provider: 'openrouter',
        key: process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_OPENROUTER_API_KEY_RECRAFT'
      }
    ];

    demoKeys.forEach(k => {
      this.saveKey(k.id, k.name, k.provider, k.key);
    });
  }

  saveStore() {
    try {
      const keysExport = [];
      this.keys.forEach((v, id) => {
        keysExport.push({
          id,
          name: v.name,
          provider: v.provider,
          encryptedKey: this.encrypt(v.key),
          masked: this.maskKey(v.key),
          telemetry: this.telemetry.get(id)
        });
      });

      const bindingsExport = {};
      this.agentBindings.forEach((keyId, agentId) => {
        bindingsExport[agentId] = keyId;
      });

      fs.writeFileSync(KEYS_FILE, JSON.stringify({
        keys: keysExport,
        bindings: bindingsExport,
        updatedAt: new Date().toISOString()
      }, null, 2));
    } catch (err) {
      console.error('[KeyVault] Error saving keys store:', err.message);
    }
  }

  saveKey(id, name, provider, rawKey) {
    const keyId = id || `key_${provider}_${Date.now()}`;
    const masked = this.maskKey(rawKey);

    this.keys.set(keyId, {
      id: keyId,
      name,
      provider,
      key: rawKey,
      masked
    });

    if (!this.telemetry.has(keyId)) {
      this.telemetry.set(keyId, {
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        lastUsed: null,
        status: 'ACTIVE'
      });
    }

    this.saveStore();
    return keyId;
  }

  deleteKey(id) {
    this.keys.delete(id);
    this.telemetry.delete(id);
    this.agentBindings.forEach((keyId, agentId) => {
      if (keyId === id) {
        this.agentBindings.delete(agentId);
      }
    });
    this.saveStore();
  }

  bindAgentKey(agentId, keyId) {
    if (keyId && this.keys.has(keyId)) {
      this.agentBindings.set(agentId, keyId);
      this.saveStore();
      return true;
    }
    return false;
  }

  getAgentKey(agentId) {
    const keyId = this.agentBindings.get(agentId);
    if (keyId && this.keys.has(keyId)) {
      return {
        keyId,
        ...this.keys.get(keyId)
      };
    }
    const firstKey = Array.from(this.keys.values())[0];
    return firstKey ? { keyId: firstKey.id, ...firstKey } : null;
  }

  recordUsage(keyId, promptTokens = 0, completionTokens = 0, provider = 'openai') {
    if (!keyId || !this.telemetry.has(keyId)) return;

    const stats = this.telemetry.get(keyId);
    stats.requests += 1;
    stats.promptTokens += promptTokens;
    stats.completionTokens += completionTokens;
    stats.lastUsed = new Date().toISOString();

    let promptRate = 0.003;
    let compRate = 0.015;
    if (provider === 'anthropic') { promptRate = 0.003; compRate = 0.015; }
    else if (provider === 'gemini') { promptRate = 0.000125; compRate = 0.0005; }
    else if (provider === 'openai') { promptRate = 0.0025; compRate = 0.01; }
    else if (provider === 'openrouter') { promptRate = 0.0; compRate = 0.0; } // Free model rate

    const cost = ((promptTokens / 1000) * promptRate) + ((completionTokens / 1000) * compRate);
    stats.estimatedCostUsd += cost;

    this.saveStore();
  }

  getAllKeys() {
    const result = [];
    this.keys.forEach((v, id) => {
      result.push({
        id,
        name: v.name,
        provider: v.provider,
        masked: v.masked,
        telemetry: this.telemetry.get(id) || {}
      });
    });
    return result;
  }

  getBindings() {
    const obj = {};
    this.agentBindings.forEach((keyId, agentId) => {
      obj[agentId] = keyId;
    });
    return obj;
  }
}

module.exports = new KeyVault();
