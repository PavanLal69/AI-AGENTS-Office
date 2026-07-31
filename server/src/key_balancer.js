const keyVault = require('./key_vault');

/**
 * Key Balancer & Rate Limit Failover Manager
 */
class KeyBalancer {
  constructor() {
    this.rateLimitedKeys = new Map(); // keyId -> resetTime
  }

  markRateLimited(keyId, cooldownMs = 60000) {
    this.rateLimitedKeys.set(keyId, Date.now() + cooldownMs);
    console.warn(`[KeyBalancer] Key ${keyId} marked rate-limited for ${cooldownMs / 1000}s`);
  }

  isKeyAvailable(keyId) {
    if (!this.rateLimitedKeys.has(keyId)) return true;
    const resetTime = this.rateLimitedKeys.get(keyId);
    if (Date.now() >= resetTime) {
      this.rateLimitedKeys.delete(keyId);
      return true;
    }
    return false;
  }

  getOptimalKeyForAgent(agentId) {
    const primaryKey = keyVault.getAgentKey(agentId);
    
    if (primaryKey && this.isKeyAvailable(primaryKey.keyId)) {
      return primaryKey;
    }

    // Primary key rate limited -> find alternative key in vault
    const allKeys = keyVault.getAllKeys();
    const available = allKeys.find(k => this.isKeyAvailable(k.id));

    if (available) {
      console.log(`[KeyBalancer] Primary key for ${agentId} rate limited. Falling back to key: ${available.name}`);
      return {
        keyId: available.id,
        name: available.name,
        provider: available.provider,
        key: keyVault.keys.get(available.id)?.key,
        masked: available.masked
      };
    }

    // Return primary key as last resort
    return primaryKey;
  }
}

module.exports = new KeyBalancer();
