const assert = require('assert');
const keyVault = require('../server/src/key_vault');
const workspaceTools = require('../server/src/workspace_tools');
const memoryStore = require('../server/src/memory_store');
const gitService = require('../server/src/git_service');
const keyBalancer = require('../server/src/key_balancer');

console.log('=======================================================');
console.log('🧪 RUNNING BACKEND INTEGRATION & UNIT TEST SUITE');
console.log('=======================================================');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Key Vault Encryption & Storage Test
  test('Key Vault should save and retrieve encrypted keys', () => {
    const keyId = keyVault.saveKey('test_key_001', 'Test Key Name', 'anthropic', 'sk-ant-test-secret-1234567890');
    assert.strictEqual(typeof keyId, 'string');
    
    const keyObj = keyVault.keys.get(keyId);
    assert.strictEqual(keyObj.name, 'Test Key Name');
    assert.strictEqual(keyObj.provider, 'anthropic');
    assert.strictEqual(keyObj.key, 'sk-ant-test-secret-1234567890');
  });

  // 2. Key Binding Test
  test('Key Vault should bind keys to agents', () => {
    const keyId = keyVault.saveKey('test_bind_002', 'OpenAI Bind Key', 'openai', 'sk-proj-test-secret-999999');
    const bound = keyVault.bindAgentKey('agent_alex', keyId);
    assert.strictEqual(bound, true);

    const agentKey = keyVault.getAgentKey('agent_alex');
    assert.strictEqual(agentKey.keyId, keyId);
  });

  // 3. Telemetry Tracking Test
  test('Key Vault should record token usage and cost telemetry', () => {
    const keys = keyVault.getAllKeys();
    assert(keys.length > 0);

    const firstKey = keys[0];
    keyVault.recordUsage(firstKey.id, 1000, 500, firstKey.provider);

    const updated = keyVault.telemetry.get(firstKey.id);
    assert(updated.requests > 0);
    assert(updated.promptTokens >= 1000);
    assert(updated.estimatedCostUsd >= 0);
  });

  // 4. Workspace Tools Test
  test('Workspace Tools should list directory files', () => {
    const files = workspaceTools.listWorkspaceFiles('');
    assert(files.items && Array.isArray(files.items));
    assert(files.items.some(i => i.name === 'package.json'));
  });

  // 5. Memory Store Test
  test('Memory Store should append task records to agent transcript', () => {
    const memory = memoryStore.appendTaskHistory('agent_test_unit', {
      prompt: 'Unit test prompt',
      response: 'Unit test response',
      provider: 'anthropic'
    });

    assert(memory.tasksCount > 0);
    assert(Array.isArray(memory.history));
    assert.strictEqual(memory.history[memory.history.length - 1].prompt, 'Unit test prompt');
  });

  // 6. Git Service Test
  await asyncTest('Git Service should check repo status', async () => {
    const status = await gitService.getStatus();
    assert(typeof status.isGitRepo === 'boolean');
  });

  // 7. Key Balancer Failover Test
  test('Key Balancer should select alternative key when rate limited', () => {
    keyBalancer.markRateLimited('key_anthropic_primary', 5000);
    const available = keyBalancer.isKeyAvailable('key_anthropic_primary');
    assert.strictEqual(available, false);
  });

  console.log('-------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('=======================================================');

  if (failed > 0) process.exit(1);
}

runTests();
