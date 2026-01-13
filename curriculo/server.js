require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Remove node-fetch import for Node 18+ (it has native fetch) or use it if older. 
// Assuming user might be on modern node, but the guide used it. 
// We will use dynamic import or require depending on version, but standard `require('node-fetch')` works for v2.
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
// IMPORTANT: In production, move these to a 'public' folder to avoid exposing server.js/.env
app.use(express.static('public'));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.post('/synthesize', async (req, res) => {
    try {
        const { text, lang } = req.body; // Receive lang to select voice/model
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // Default voice (Adam)

        if (!apiKey) {
            return res.status(500).json({ error: "API Key missing on server" });
        }

        const modelId = "eleven_multilingual_v2"; // Best for PT-BR/EN mix

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                model_id: modelId,
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("ElevenLabs Error:", err);
            return res.status(response.status).json(err);
        }

        const audioBuffer = await response.arrayBuffer();
        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}/`));
