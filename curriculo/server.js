require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Configs
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'supersecretkeychangedinproduction',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS in production (but this is for local dev)
}));

// Serve static files (Public)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/admin/login');
}

// Routes
app.get('/', (req, res) => {
    // Dynamic serving for Dev Mode to see SEO changes immediately
    try {
        let content = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
        const dataPath = path.join(__dirname, 'data.json');

        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            const seo = data.seo || {};

            // Helper to get localized or string content
            const getVal = (val, lang = 'br') => {
                if (!val) return '';
                if (typeof val === 'string') return val;
                return val[lang] || val['br'] || '';
            };

            const sTitle = getVal(seo.title);
            const sDesc = getVal(seo.description);
            const sKw = getVal(seo.keywords);

            // Simple Replacements (same logic as build-static.js)
            if (sTitle) {
                content = content.replace(/<title>[\s\S]*?<\/title>/, `<title>${sTitle}</title>`);
                content = content.replace(/<meta\s+name="title"[\s\S]*?>/, `<meta name="title" content="${sTitle}">`);
                content = content.replace(/<meta\s+property="og:title"[\s\S]*?>/, `<meta property="og:title" content="${sTitle}">`);
                content = content.replace(/<meta\s+property="twitter:title"[\s\S]*?>/, `<meta property="twitter:title" content="${sTitle}">`);
            }
            if (sDesc) {
                content = content.replace(/<meta\s+name="description"[\s\S]*?>/, `<meta name="description" content="${sDesc}">`);
                content = content.replace(/<meta\s+property="og:description"[\s\S]*?>/, `<meta property="og:description" content="${sDesc}">`);
                content = content.replace(/<meta\s+property="twitter:description"[\s\S]*?>/, `<meta property="twitter:description" content="${sDesc}">`);
            }
            if (sKw) content = content.replace(/<meta\s+name="keywords"[\s\S]*?>/, `<meta name="keywords" content="${sKw}">`);
            if (seo.author) content = content.replace(/<meta\s+name="author"[\s\S]*?>/, `<meta name="author" content="${seo.author}">`);
            if (seo.robots) content = content.replace(/<meta\s+name="robots"[\s\S]*?>/, `<meta name="robots" content="${seo.robots}">`);
            if (seo.ogImage) {
                content = content.replace(/<meta\s+property="og:image"[\s\S]*?>/, `<meta property="og:image" content="${seo.ogImage}">`);
                content = content.replace(/<meta\s+property="twitter:image"[\s\S]*?>/, `<meta property="twitter:image" content="${seo.ogImage}">`);
            }
            if (seo.canonicalUrl) content = content.replace(/<link\s+rel="canonical"[\s\S]*?>/, `<link rel="canonical" href="${seo.canonicalUrl}">`);

            // New Fields Injection (Append if not exists)
            if (seo.siteName) {
                if (content.includes('property="og:site_name"')) {
                    content = content.replace(/<meta\s+property="og:site_name"[\s\S]*?>/, `<meta property="og:site_name" content="${seo.siteName}">`);
                } else {
                    content = content.replace('</head>', `<meta property="og:site_name" content="${seo.siteName}">\n    </head>`);
                }
            }
            if (seo.locale) {
                if (content.includes('property="og:locale"')) {
                    content = content.replace(/<meta\s+property="og:locale"[\s\S]*?>/, `<meta property="og:locale" content="${seo.locale}">`);
                } else {
                    content = content.replace('</head>', `<meta property="og:locale" content="${seo.locale}">\n    </head>`);
                }
            }
            if (seo.themeColor) {
                if (content.includes('name="theme-color"')) {
                    content = content.replace(/<meta\s+name="theme-color"[\s\S]*?>/, `<meta name="theme-color" content="${seo.themeColor}">`);
                } else {
                    content = content.replace('</head>', `<meta name="theme-color" content="${seo.themeColor}">\n    </head>`);
                }
            }
            if (seo.googleVerification) {
                if (content.includes('name="google-site-verification"')) {
                    content = content.replace(/<meta\s+name="google-site-verification"[\s\S]*?>/, `<meta name="google-site-verification" content="${seo.googleVerification}">`);
                } else {
                    content = content.replace('</head>', `<meta name="google-site-verification" content="${seo.googleVerification}">\n    </head>`);
                }
            }

            // DYNAMIC JSON-LD GENERATION (Dev Mode)
            try {
                const personSchema = {
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Person",
                            "@id": `${seo.canonicalUrl || 'https://rmo.dev.br/'}#person`,
                            "name": data.profile?.name || "Ricardo Martins",
                            "jobTitle": ["Software Engineer", "Tech Lead", "Desenvolvedor Golang"],
                            "url": seo.canonicalUrl || "https://rmo.dev.br/",
                            "image": seo.ogImage || data.profile?.image,
                            "sameAs": (data.socialLinks || []).map(l => l.url),
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": "Guarapuava",
                                "addressRegion": "Paraná",
                                "addressCountry": "BR"
                            }
                        }
                    ]
                };

                // MERGE CUSTOM JSON-LD
                const sCustomJSONLD = getVal(seo.customJSONLD);
                if (sCustomJSONLD) {
                    try {
                        const customData = JSON.parse(sCustomJSONLD);
                        if (Array.isArray(customData)) {
                            personSchema["@graph"].push(...customData);
                        } else {
                            personSchema["@graph"].push(customData);
                        }
                    } catch (e) {
                        console.error('❌ Invalid Custom JSON-LD in Dev:', e);
                    }
                }

                const jsonLdString = JSON.stringify(personSchema, null, 2);
                content = content.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${jsonLdString}\n</script>`);
            } catch (jsonErr) {
                console.warn('JSON-LD dev generation failed:', jsonErr);
            }
        }
        res.send(content);
    } catch (e) {
        console.error('Error serving index:', e);
        res.sendFile(path.join(__dirname, 'public', 'index.html')); // Fallback
    }
});

// Admin Routes
app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'admin', 'index.html'));
});

app.get('/admin/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login', 'index.html'));
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin';

    if (username === adminUser && password === adminPass) {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.redirect('/admin/login?error=Invalid Credentials');
    }
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// API Routes for Admin
app.get('/api/data', isAuthenticated, (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data.json');
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: 'data.json not found' });
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { exec } = require('child_process');

app.post('/api/save', isAuthenticated, async (req, res) => {
    try {
        const newData = req.body;
        const dataPath = path.join(__dirname, 'data.json');
        const jsPath = path.join(__dirname, 'public', 'assets', 'js', 'data.js');

        // 1. Save data.json (Source of Truth)
        fs.writeFileSync(dataPath, JSON.stringify(newData, null, 4));

        // 2. Regenerate public/assets/js/data.js (For local dev)
        const jsContent = `const resumeData = ${JSON.stringify(newData, null, 4)};\n`;
        fs.writeFileSync(jsPath, jsContent);

        console.log('Saved JSON. Starting Build Process...');

        // 3. Trigger Build (Generates dist)
        exec('npm run build', (error, stdout, stderr) => {
            if (error) {
                console.error(`Build Error: ${error.message}`);
                return res.status(500).json({ error: 'Data saved, but Build failed: ' + error.message });
            }
            if (stderr) {
                console.warn(`Build Warning: ${stderr}`);
            }
            console.log(`Build Output: ${stdout}`);

            res.json({ success: true, message: 'Data saved and Site Rebuilt (dist updated)!' });
        });

    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// TTS Endpoint (Keeping it as requested, though redundant for static build)
app.post('/synthesize', async (req, res) => {
    try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const { text, lang } = req.body;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.VOICE_ID || "pNInz6obpgDQGcFmaJgB";

        if (!apiKey) {
            console.error("No API Key found");
            return res.status(500).json({ error: "API Key missing" });
        }

        const modelId = "eleven_multilingual_v2";

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

app.listen(PORT, () => console.log(`🚀 CMS Server running at http://localhost:${PORT}/admin`));
