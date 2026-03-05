import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const PROJECT_ROOT = join(__dirname, '..');
const PRODUCTS_JSON = join(PROJECT_ROOT, 'lib', 'data', 'products.json');
const FALLBACK_JSON = join(__dirname, '..', 'lib', 'data', 'products.json');

function getProducts() {
  for (const p of [PRODUCTS_JSON, FALLBACK_JSON]) {
    try {
      const raw = readFileSync(p, 'utf8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      continue;
    }
  }
  return [];
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', (req, res) => {
  const products = getProducts();
  res.json(products);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
