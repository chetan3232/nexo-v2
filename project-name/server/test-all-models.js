const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables if available
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log('Using API Keys:');
console.log(`- NVIDIA_API_KEY: ${NVIDIA_API_KEY ? 'Present' : 'Missing'}`);
console.log(`- GEMINI_API_KEY: ${GEMINI_API_KEY ? 'Present' : 'Missing'}`);
console.log(`- OPENROUTER_API_KEY: ${OPENROUTER_API_KEY ? 'Present' : 'Missing'}`);
console.log('--------------------------------------------------\n');

const nvidiaClient = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});
const openrouterClient = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    "HTTP-Referer": "https://nexo.ai",
    "X-Title": "Nexo AI Workspace Test",
  }
});

const geminiClient = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
});

const STUDIO_MODELS = [
  { id: "poolside/laguna-xs-2.1:free", name: "poolside", client: openrouterClient, apiModel: "poolside/laguna-xs-2.1:free" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "nemotron-3-ultra-550b", client: openrouterClient, apiModel: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", client: geminiClient, apiModel: "gemini-2.5-flash" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", client: geminiClient, apiModel: "gemini-3.5-flash" },
  { id: "z-ai/glm-5.2", name: "GLM 5.2", client: nvidiaClient, apiModel: "z-ai/glm-5.2" },
  { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", client: nvidiaClient, apiModel: "moonshotai/kimi-k2.6" },
  { id: "stepfun-ai/step-3.7-flash", name: "Step 3.7 Flash", client: nvidiaClient, apiModel: "stepfun-ai/step-3.7-flash" },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testModel(modelConfig) {
  console.log(`Testing model: ${modelConfig.name} (${modelConfig.id})...`);
  try {
    const completion = await modelConfig.client.chat.completions.create({
      model: modelConfig.apiModel,
      messages: [{ role: 'user', content: '' }],
      temperature: 0.7,
      max_tokens: 20,
    });
    const response = completion.choices[0]?.message?.content?.trim() || '';
    console.log(`[Success] ${modelConfig.name}`);
    console.log(`Response: "${response}"`);
    console.log('--------------------------------------------------');
    return { name: modelConfig.name, success: true };
  } catch (err) {
    console.error(`[Failed] ${modelConfig.name}`);
    console.error(`Error:`, err.message);
    if (err.response && err.response.data) {
      console.error(`Details:`, JSON.stringify(err.response.data));
    }
    console.log('--------------------------------------------------');
    return { name: modelConfig.name, success: false, error: err.message };
  }
}

async function runAll() {
  const results = [];
  for (let i = 0; i < STUDIO_MODELS.length; i++) {
    const model = STUDIO_MODELS[i];
    if (i > 0) {
      console.log(`Waiting 3 seconds to avoid rate limits...`);
      await sleep(3000);
    }
    const res = await testModel(model);
    results.push(res);
  }

  console.log('\n==================================================');
  console.log('FINAL MODELS STATUS SUMMARY:');
  console.log('==================================================');
  results.forEach(r => {
    console.log(`- ${r.name}: ${r.success ? '✅ WORKING' : '❌ FAILED (' + r.error + ')'}`);
  });
}

runAll();
