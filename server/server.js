const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API: Explore prompt intent
app.post('/api/ai/explore', (req, res) => {
  const { prompt } = req.body;
  res.json({
    status: 'success',
    appType: 'Dashboard Application',
    targetUsers: 'Analytics Teams',
    platform: 'Desktop / Responsive Web',
    features: ['Responsive layouts grid', 'Real-time metrics widgets', 'Interactive charts']
  });
});

// API: Create task checklists
app.post('/api/ai/blueprint', (req, res) => {
  res.json({
    status: 'success',
    checklist: [
      { id: '1', label: 'Setup project configs', agent: 'DevOps', status: 'pending' },
      { id: '2', label: 'Draft prd.md constraints', agent: 'PM', status: 'pending' },
      { id: '3', label: 'Define design system tokens', agent: 'Designer', status: 'pending' },
      { id: '4', label: 'Generate React views layout', agent: 'Frontend', status: 'pending' },
      { id: '5', label: 'Expose Express routers', agent: 'Backend', status: 'pending' },
    ]
  });
});

// API: Router chat completions with dynamic Provider Routing and failovers
app.post('/api/chat', async (req, res) => {
  const { messages, model, systemInstruction } = req.body;
  const prompt = messages && messages.length > 0 ? messages[messages.length - 1]?.content || "" : "";
  
  console.log(`[ExpressServer] Routing completions query for model: ${model}`);
  
  try {
    if (model && model.startsWith('gemini-')) {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        return res.json({
          status: 'success',
          text: "Mock Gemini Response: I have successfully compiled the project layout views and updated style components.",
        });
      }
      
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || msg.text || "" }]
      }));
      
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction }
      });
      
      res.json({
        status: 'success',
        text: response.text || "Successfully executed generation."
      });
    } else {
      const apiKey = process.env.OPENROUTER_API_KEY || '';
      if (!apiKey) {
        return res.json({
          status: 'success',
          text: "Mock OpenRouter Response: Applied visual style coordinates and synchronized workspace structures.",
        });
      }
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content || m.text })),
          temperature: 0.2
        })
      });
      
      const data = await response.json();
      res.json({
        status: 'success',
        text: data.choices[0].message.content || ""
      });
    }
  } catch (err) {
    console.error("Routing completions error:", err);
    res.json({
      status: 'error',
      text: `Completions routing error: ${err.message}`
    });
  }
});

// API: Deploy workspace builds
app.post('/api/deploy', (req, res) => {
  res.json({
    status: 'success',
    deployUrl: 'https://nexo-deployed-sandbox.app',
    logs: ['Starting compiler build', 'Resolving static paths', 'Push finished successfully']
  });
});

// API: Load brain files
app.get('/api/brain/load', (req, res) => {
  const brainDir = path.resolve(__dirname, '../project-brain');
  const files = {};
  if (fs.existsSync(brainDir)) {
    const fileNames = fs.readdirSync(brainDir);
    fileNames.forEach((name) => {
      const filePath = path.join(brainDir, name);
      if (fs.statSync(filePath).isFile()) {
        files[name] = fs.readFileSync(filePath, 'utf-8');
      }
    });
  }
  res.json({ status: 'success', files });
});

// API: Save brain files
app.post('/api/brain/save', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || content === undefined) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }
  const brainDir = path.resolve(__dirname, '../project-brain');
  if (!fs.existsSync(brainDir)) {
    fs.mkdirSync(brainDir, { recursive: true });
  }
  const safeName = path.basename(filename);
  const filePath = path.join(brainDir, safeName);
  fs.writeFileSync(filePath, content, 'utf-8');
  res.json({ status: 'success' });
});


// Serve frontend assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[ExpressServer] Running on port ${PORT}`);
});
