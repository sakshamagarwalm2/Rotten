const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow;
let serverProcess;
let httpServer;
let serverLogs = [];

function showLoading(status) {
  const logs = serverLogs.slice(-8).map(l => escapeHtml(l)).join('<br>');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Rotten</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;padding:32px;text-align:center}
.logo{width:64px;height:64px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#111}
.spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
p{color:#aaa;font-size:14px;max-width:400px}
.log{color:#666;font-size:11px;font-family:monospace;max-width:500px;word-break:break-all;line-height:1.4}
.hint{color:#444;font-size:11px;margin-top:8px}
</style></head><body>
<div class="logo">R</div>
<div class="spinner"></div>
<p>${escapeHtml(status || 'Starting Rotten...')}</p>
<div class="log">${logs}</div>
<p class="hint">Press F12 to open DevTools</p>
</body></html>`;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function escapeHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getStandaloneDir() {
  if (isDev) {
    return path.join(__dirname, '..', '.next', 'standalone');
  }
  // Check real filesystem paths FIRST (app.asar.unpacked) before virtual asar paths
  const candidates = [
    path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone'),
    path.join(process.resourcesPath, 'app', '.next', 'standalone'),
    path.join(process.resourcesPath, '.next', 'standalone'),
    path.join(__dirname, '..', '.next', 'standalone'),
    path.join(__dirname, '..', '..', '.next', 'standalone'),
  ];
  for (const dir of candidates) {
    try {
      const serverPath = path.join(dir, 'server.js');
      // Check the real filesystem (bypass asar virtual filesystem)
      const realPath = fs.realpathSync(serverPath);
      if (fs.existsSync(realPath) && !realPath.includes('.asar')) {
        serverLogs.push('Found unpacked server at: ' + realPath);
        return path.dirname(realPath);
      }
    } catch (e) {
      // path doesn't exist on real filesystem
    }
    if (fs.existsSync(path.join(dir, 'server.js'))) {
      serverLogs.push('Found server at: ' + dir + ' (may be inside asar)');
      return dir;
    }
  }
  serverLogs.push('ERROR: server.js not found');
  return candidates[0];
}

function startServer() {
  return new Promise((resolve) => {
    const standaloneDir = getStandaloneDir();
    const serverScript = path.join(standaloneDir, 'server.js');

    serverLogs.push('Standalone dir exists: ' + fs.existsSync(standaloneDir));
    serverLogs.push('server.js exists: ' + fs.existsSync(serverScript));
    showLoading('Starting server...');

    if (!fs.existsSync(serverScript)) {
      serverLogs.push('ERROR: server.js not found at: ' + serverScript);
      resolve(false);
      return;
    }

    const userDataDir = app.getPath('userData');
    const uploadDir = path.join(userDataDir, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    serverLogs.push('Upload dir: ' + uploadDir);

    const nodeCandidates = [
      { exe: process.execPath, envAdd: { ELECTRON_RUN_AS_NODE: '1' } },
      { exe: path.join(process.resourcesPath, '..', 'node.exe'), envAdd: {} },
      { exe: 'node', envAdd: {} },
    ];

    let resolved = false;
    let nodeIndex = 0;

    function trySpawn() {
      if (nodeIndex >= nodeCandidates.length) {
        serverLogs.push('ERROR: no node executable found');
        showLoading('Failed: no node executable');
        if (!resolved) { resolved = true; resolve(false); }
        return;
      }

      const { exe, envAdd } = nodeCandidates[nodeIndex];
      serverLogs.push('Trying node: ' + exe);

      try {
        serverProcess = spawn(exe, [serverScript], {
          env: {
            ...process.env,
            ...envAdd,
            PORT: '3000',
            NODE_ENV: 'production',
            UPLOAD_DIR: uploadDir,
          },
          cwd: standaloneDir,
          stdio: 'pipe',
        });
      } catch (e) {
        serverLogs.push('spawn threw: ' + e.message);
        nodeIndex++;
        trySpawn();
        return;
      }

      serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        for (const line of text.split('\n').filter(Boolean)) {
          serverLogs.push(line);
        }
        showLoading('Server starting...');
        if (!resolved && (text.includes('Ready') || text.includes('localhost:3000'))) {
          resolved = true;
          resolve(true);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const text = data.toString();
        for (const line of text.split('\n').filter(Boolean)) {
          serverLogs.push('ERR: ' + line);
        }
        showLoading('Server error...');
      });

      serverProcess.on('error', (err) => {
        serverLogs.push('Process error (' + exe + '): ' + err.message);
        nodeIndex++;
        trySpawn();
      });

      serverProcess.on('exit', (code) => {
        if (!resolved) {
          serverLogs.push('Server exited with code: ' + code);
        }
      });
    }

    trySpawn();

    // Give up trying additional candidates after first exit; just report final status
    setTimeout(() => {
      if (!resolved) {
        serverLogs.push('Server start timed out after 15s');
        showLoading('Timed out - loading app...');
        resolved = true;
        resolve(true);
      }
    }, 15000);
  });
}

function loadApp() {
  mainWindow.loadURL('http://localhost:3000');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: 'Rotten - Doc to PPT Converter',
  });

  mainWindow.webContents.on('did-finish-load', () => {
    const url = mainWindow.webContents.getURL();
    if (url.startsWith('http://localhost:3000')) {
      serverLogs.push('App loaded successfully');
    }
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    if (code === -3) return; // ERR_ABORTED – navigation cancelled by another navigation, harmless
    serverLogs.push('Page load failed: ' + code + ' ' + desc + ' for ' + url);
    showLoading('Retrying... (' + desc + ')');
    setTimeout(loadApp, 3000);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  showLoading('Starting...');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createWindow();

  if (!isDev) {
    const started = await startServer();
    serverLogs.push('Server start result: ' + started);
    showLoading(started ? 'Loading app...' : 'Server failed - check F12 console');
  }

  loadApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
