import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export async function openTestBrowser() {
  const port = 21000 + process.pid % 5000, debug = port + 1;
  const origin = `http://127.0.0.1:${port}`;
  const chrome = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
  if (!chrome) throw new Error('Chrome required');
  const profile = mkdtempSync(join(tmpdir(), 'physioflow-offline-'));
  const children = [];
  const waitUrl = async url => { for (let i = 0; i < 150; i++) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise(r => setTimeout(r, 100)); } throw new Error(`No server: ${url}`); };
  let socket;
  const close = async () => {
    socket?.close();
    for (const child of children) child.kill('SIGKILL');
    await Promise.all(children.map(child => child.exitCode !== null ? null : new Promise(resolve => child.once('exit', resolve))));
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  };
  try {
    children.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' }));
    await waitUrl(origin);
    children.push(spawn(chrome, ['--headless=new', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${debug}`, `--user-data-dir=${profile}`, origin], { stdio: 'ignore' }));
    await waitUrl(`http://127.0.0.1:${debug}/json/list`);
    const tabs = await fetch(`http://127.0.0.1:${debug}/json/list`).then(r => r.json());
    socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let id = 0; const pending = new Map();
    socket.addEventListener('message', e => { const msg = JSON.parse(e.data), p = pending.get(msg.id); if (p) { pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); } });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    const waitFor = async (expression, label, timeout = 10000) => {
      const start = Date.now(); while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 80)); }
      throw new Error(`${label}: ${await evaluate('document.body.innerText')}`);
    };
    await waitFor('!!document.querySelector("main")', 'App ready');
    await evaluate(`localStorage.setItem('physioflow.ui-language','en')`);
    return { origin, send, evaluate, waitFor, close };
  } catch (error) { await close(); throw error; }
}
