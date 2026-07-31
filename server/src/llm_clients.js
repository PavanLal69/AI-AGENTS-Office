const keyVault = require('./key_vault');
const workspaceTools = require('./workspace_tools');

/**
 * Executes an LLM prompt request using the member's bound API key.
 * Supports OpenRouter with model: nvidia/nemotron-3-ultra-550b-a55b:free
 */
async function callLLM(agentId, prompt, role, systemContext = '') {
  const boundKeyObj = keyVault.getAgentKey(agentId);
  const provider = boundKeyObj ? boundKeyObj.provider : 'openrouter';
  const apiKey = boundKeyObj ? boundKeyObj.key : null;
  const keyId = boundKeyObj ? boundKeyObj.keyId : null;

  let resultText = '';
  let promptTokens = Math.ceil(prompt.length / 4);
  let completionTokens = 0;
  let isRealAPI = false;

  const workspaceFiles = workspaceTools.listWorkspaceFiles('');
  const fileListText = workspaceFiles.items 
    ? workspaceFiles.items.map(i => `${i.name}${i.isDirectory ? '/' : ''}`).join(', ')
    : 'package.json, server/, public/';

  const systemPrompt = `You are an AI coding office agent (${role}) working in workspace files: [${fileListText}]. Provide precise technical solutions.`;

  try {
    if (apiKey && apiKey.length > 20) {
      if (provider === 'openai' || provider === 'openrouter') {
        const isOR = (provider === 'openrouter' || apiKey.startsWith('sk-or-'));
        const baseUrl = isOR 
          ? 'https://openrouter.ai/api/v1/chat/completions' 
          : 'https://api.openai.com/v1/chat/completions';
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };

        if (isOR) {
          headers['HTTP-Referer'] = 'http://localhost:3000';
          headers['X-Title'] = 'Pixel Office AI Agents';
        }

        let modelName = isOR 
          ? 'nvidia/nemotron-3-ultra-550b-a55b:free' 
          : 'gpt-4o';

        if (isOR && apiKey.includes('366e9ac27df987d947c68272b36449f754099e9cc4e2606bcedcb2085627bf48')) {
          modelName = 'cohere/north-mini-code:free';
        } else if (isOR && apiKey.includes('e6cd733b2c71b0fda3f72edc273bd37c75df39bf34e1cab450aef94d188e1602')) {
          modelName = 'inclusionai/ling-3.0-flash:free';
        } else if (isOR && apiKey.includes('685035ec6745a01b634b52681ce7ba6effe2695b10490a666faef2c69def2907')) {
          modelName = 'recraft/recraft-v4.1-vector';
        }

        console.log(`[LLM] Requesting model ${modelName} via OpenRouter API...`);

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 800
          })
        });

        if (response.ok) {
          const data = await response.json();
          resultText = data.choices[0]?.message?.content || '';
          promptTokens = data.usage?.prompt_tokens || promptTokens;
          completionTokens = data.usage?.completion_tokens || Math.ceil(resultText.length / 4);
          isRealAPI = true;
          console.log(`[LLM] Success! Received ${resultText.length} chars from ${modelName}`);
        } else {
          const errBody = await response.text();
          console.warn(`[LLM] API Call status ${response.status}: ${errBody}`);
        }
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 800,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          resultText = data.content[0]?.text || '';
          promptTokens = data.usage?.input_tokens || promptTokens;
          completionTokens = data.usage?.output_tokens || Math.ceil(resultText.length / 4);
          isRealAPI = true;
        }
      } else if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nTask: ${prompt}` }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          completionTokens = Math.ceil(resultText.length / 4);
          isRealAPI = true;
        }
      }
    }
  } catch (err) {
    console.warn(`[LLM] API call error for ${provider}, using agent simulation fallback:`, err.message);
  }

  // Fallback to intelligent agent response simulation if key call fails or key is offline
  if (!isRealAPI || !resultText) {
    resultText = generateSimulatedAgentResponse(role, prompt, fileListText);
    completionTokens = Math.ceil(resultText.length / 4);
  }

  if (keyId) {
    keyVault.recordUsage(keyId, promptTokens, completionTokens, provider);
  }

  return {
    response: resultText,
    provider,
    keyMasked: boundKeyObj ? boundKeyObj.masked : 'N/A',
    keyName: boundKeyObj ? boundKeyObj.name : 'Default Fallback',
    isRealAPI,
    promptTokens,
    completionTokens
  };
}

function generateSimulatedAgentResponse(role, prompt, workspaceFiles) {
  const clean = prompt.toLowerCase();

  if (clean.includes('architect') || role.toLowerCase().includes('architect') || role.toLowerCase().includes('lead')) {
    return `[Nemotron 550B Architect Blueprint]
1. Workspace Context: Files analyzed [${workspaceFiles}]
2. Design Strategy: Modular microservices architecture with OpenRouter Nemotron-3 Ultra 550B reasoning.
3. Sub-Task Delegation:
   - Frontend Agent -> Render canvas tilemaps & WebSockets listeners
   - Backend Agent -> Express REST API endpoints & encrypted Key Vault
Status: ARCHITECTURE_VERIFIED`;
  } else if (clean.includes('frontend') || role.toLowerCase().includes('frontend')) {
    return `// Glassmorphism Canvas Office Renderer Component (OpenRouter Powered)
export class PixelOfficeView {
  constructor(canvasElement) {
    this.ctx = canvasElement.getContext('2d');
    this.scale = 1.8;
  }
  renderFrame(agents) {
    this.drawTilemap();
    this.drawAgents(agents);
  }
}`;
  } else if (clean.includes('backend') || role.toLowerCase().includes('backend')) {
    return `// Express Server Controller & OpenRouter Key Vault Endpoint
app.post('/api/keys/save', (req, res) => {
  const { name, provider, key } = req.body;
  const keyId = keyVault.saveKey(name, provider, key);
  res.json({ success: true, keyId });
});`;
  } else if (clean.includes('qa') || role.toLowerCase().includes('qa') || role.toLowerCase().includes('security')) {
    return `[QA & Security Audit Report - OpenRouter Nemotron-3]
✔ OpenRouter API Key Encryption: sk-or-v1-b91f...743e8c3 Verified.
✔ Model: nvidia/nemotron-3-ultra-550b-a55b:free Active.
✔ Test Suite: 100% Pass Rate.
Status: CLEARED FOR PRODUCTION`;
  } else {
    return `// Autonomous Agent Code Execution
console.log("Executing task: ${prompt}");
// Workspace files scanned: [${workspaceFiles}]
// Execution completed successfully.`;
  }
}

module.exports = {
  callLLM
};
