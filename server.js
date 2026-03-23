import express from 'express';
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// ── Anthropic proxy endpoint ─────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// ── Serve frontend ────────────────────────────────────────────────────────────
if (isProd) {
  // In production: serve the built dist folder
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In dev: let Vite handle the frontend
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
