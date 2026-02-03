/**
 * Local server: serves built frontend (dist/) and runs API handlers.
 * Use with: npx tsx server/index.ts (after npm run build).
 * Loads env from .env via dotenv.
 */
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

type Handler = (req: express.Request, res: express.Response) => Promise<void>;

function wrap(h: Handler): express.RequestHandler {
  return (req, res, next) => {
    h(req, res).catch((err) => {
      console.error('[server]', err);
      if (!res.headersSent) res.status(500).json({ error: String(err?.message ?? err) });
    });
  };
}

async function loadHandlers() {
  const [
    dataMod,
    ordersMod,
    clobProxyMod,
    polymarketMod,
    polymarketSignMod,
    walletMod,
    walletBalanceMod,
    walletInitMod,
    walletPkMod,
  ] = await Promise.all([
    import('../api/data/index.ts'),
    import('../api/orders.ts'),
    import('../api/clob-proxy.ts'),
    import('../api/polymarket/index.ts'),
    import('../api/polymarket/sign.ts'),
    import('../api/wallet.ts'),
    import('../api/wallet/balance.ts'),
    import('../api/wallet/initialize.ts'),
    import('../api/wallet/private-key.ts'),
  ]);

  const dataHandler = dataMod.default as Handler;
  const setDataPath = (segment: string): express.RequestHandler => (req, _res, next) => {
    (req as express.Request & { query: Record<string, unknown> }).query.path = [segment];
    next();
  };

  // Rewrites: /api/event-state etc. -> data handler
  app.all('/api/event-state', setDataPath('event-state'), wrap(dataHandler));
  app.all('/api/event-state/*', setDataPath('event-state'), wrap(dataHandler));
  app.all('/api/strategy-config', setDataPath('strategy-config'), wrap(dataHandler));
  app.all('/api/strategy-config/*', setDataPath('strategy-config'), wrap(dataHandler));
  app.all('/api/trades', setDataPath('trades'), wrap(dataHandler));
  app.all('/api/trades/*', setDataPath('trades'), wrap(dataHandler));
  app.all('/api/positions', setDataPath('positions'), wrap(dataHandler));
  app.all('/api/positions/*', setDataPath('positions'), wrap(dataHandler));

  // /api/data/* — set path from URL
  app.use('/api/data', (req, _res, next) => {
    const rest = (req.path || '').replace(/^\//, '');
    (req as express.Request & { query: Record<string, unknown> }).query.path = rest ? rest.split('/').filter(Boolean) : [];
    next();
  });
  app.use('/api/data', wrap(dataHandler));

  app.all('/api/orders', wrap(ordersMod.default as Handler));
  app.all('/api/clob-proxy', wrap(clobProxyMod.default as Handler));

  // Polymarket: /api/polymarket/sign is exact; rest goes to catch-all
  app.all('/api/polymarket/sign', wrap(polymarketSignMod.default as Handler));
  app.use('/api/polymarket', (req, _res, next) => {
    const rest = (req.path || '').replace(/^\//, '');
    (req as express.Request & { query: Record<string, unknown> }).query.path = rest ? rest.split('/').filter(Boolean) : [];
    next();
  }, wrap(polymarketMod.default as Handler));

  app.all('/api/wallet/balance', wrap(walletBalanceMod.default as Handler));
  app.all('/api/wallet/initialize', wrap(walletInitMod.default as Handler));
  app.all('/api/wallet/private-key', wrap(walletPkMod.default as Handler));
  app.all('/api/wallet', wrap(walletMod.default as Handler));
}

async function start() {
  await loadHandlers();

  app.use(express.static(dist));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('API: /api/event-state, /api/strategy-config, /api/trades, /api/positions, /api/orders, /api/wallet, /api/polymarket, /api/clob-proxy');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
