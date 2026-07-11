import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
};

function getProxyTarget() {
  const raw = process.env.API_PROXY_TARGET || process.env.VITE_API_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.pathname === '/api' || url.pathname === '/api/') {
      url.pathname = '/';
    }
    return url;
  } catch {
    return null;
  }
}

const proxyTarget = getProxyTarget();

function safeResolveWithin(baseDir, requestPath) {
  const normalized = path.posix.normalize(requestPath);
  const withoutLeading = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  const resolved = path.resolve(baseDir, withoutLeading);
  const baseResolved = path.resolve(baseDir);
  if (!resolved.startsWith(baseResolved + path.sep) && resolved !== baseResolved) {
    return null;
  }
  return resolved;
}

function setContentType(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext];
  if (type) res.setHeader('content-type', type);
}

function setCacheHeaders(res, requestPath) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  const isHtmlEntry = normalizedPath === '/index.html';
  const isHashedAsset = normalizedPath.startsWith('/assets/');
  const isPwaShellFile =
    normalizedPath === '/manifest.json' ||
    normalizedPath === '/sw.js' ||
    normalizedPath === '/registerSW.js' ||
    normalizedPath.startsWith('/workbox-');

  if (isHtmlEntry) {
    // Prevent stale HTML from pointing at a newer or already-pruned hashed asset bundle.
    res.setHeader('cache-control', 'no-cache, no-store, must-revalidate');
    return;
  }

  if (isPwaShellFile) {
    res.setHeader('cache-control', 'no-cache, no-store, must-revalidate');
    return;
  }

  if (isHashedAsset) {
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    return;
  }

  res.setHeader('cache-control', 'public, max-age=3600');
}

function sendText(res, statusCode, text) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end(text);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function setProxyResponseHeaders(res, upstreamHeaders) {
  const setCookie = typeof upstreamHeaders.getSetCookie === 'function' ? upstreamHeaders.getSetCookie() : null;
  if (setCookie && setCookie.length > 0) {
    res.setHeader('set-cookie', setCookie);
  }

  for (const [key, value] of upstreamHeaders.entries()) {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie') continue;
    if (lower === 'transfer-encoding') continue;
    res.setHeader(key, value);
  }
}

async function proxyRequest(req, res, url) {
  if (!proxyTarget) {
    sendText(res, 502, 'API proxy is not configured.');
    return;
  }

  const targetUrl = new URL(url.pathname + url.search, proxyTarget);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await readRequestBody(req) : undefined;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.length > 0 ? body : undefined,
      redirect: 'manual'
    });

    res.statusCode = upstreamRes.status;
    setProxyResponseHeaders(res, upstreamRes.headers);

    if (!upstreamRes.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstreamRes.body).pipe(res);
  } catch (error) {
    const message = error instanceof Error ? `Bad gateway: ${error.message}` : 'Bad gateway';
    sendText(res, 502, message);
  }
}

function serveStatic(req, res, pathname) {
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = safeResolveWithin(distDir, requestPath);
  if (!filePath) {
    sendText(res, 400, 'Bad request');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      res.statusCode = 200;
      setContentType(res, filePath);
      setCacheHeaders(res, requestPath);
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const looksLikeFile = path.posix.basename(requestPath).includes('.');
    if (looksLikeFile) {
      sendText(res, 404, 'Not found');
      return;
    }

    const indexPath = path.join(distDir, 'index.html');
    fs.stat(indexPath, (indexErr, indexStat) => {
      if (indexErr || !indexStat.isFile()) {
        sendText(res, 500, 'index.html not found');
        return;
      }
      res.statusCode = 200;
      res.setHeader('content-type', mimeTypes['.html']);
      setCacheHeaders(res, '/index.html');
      fs.createReadStream(indexPath).pipe(res);
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      sendText(res, 400, 'Bad request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/health') {
      sendText(res, 200, 'ok');
      return;
    }

    if (pathname.startsWith('/api/')) {
      await proxyRequest(req, res, url);
      return;
    }

    serveStatic(req, res, pathname);
  } catch {
    sendText(res, 500, 'Internal server error');
  }
});

server.listen(port, host, () => {
  const proxyInfo = proxyTarget ? proxyTarget.toString() : 'disabled';
  console.log(`[web]: listening on http://${host}:${port} (api proxy: ${proxyInfo})`);
});
