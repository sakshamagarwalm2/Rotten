const { contextBridge, ipcRenderer } = require('electron');

function sendDiagnostics(type, detail) {
  const payload = {
    type,
    detail,
    href: window.location.href,
    readyState: document.readyState,
  };
  console.log('[diagnostics]', type, detail || '');
  try {
    ipcRenderer.send('diagnostics:renderer-log', payload);
  } catch (e) {
    console.error('[diagnostics] failed to send renderer log', e);
  }
}

sendDiagnostics('preload loaded', {
  platform: process.platform,
  electron: process.versions.electron,
});

window.addEventListener('error', (event) => {
  const target = event.target;
  if (target && target !== window) {
    sendDiagnostics('resource load failed', {
      tagName: target.tagName,
      url: target.src || target.href || target.currentSrc,
    });
    return;
  }

  sendDiagnostics('renderer error', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error && event.error.stack,
  });
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  sendDiagnostics('renderer unhandledrejection', {
    message: reason && reason.message ? reason.message : String(reason),
    stack: reason && reason.stack ? reason.stack : undefined,
  });
});

window.addEventListener('load', () => {
  const detail = { href: window.location.href, readyState: document.readyState };
  sendDiagnostics('renderer fully loaded', detail);
  sendDiagnostics('IPC sending diagnostics:ping', detail);
  ipcRenderer.invoke('diagnostics:ping', { from: 'preload', ...detail })
    .then((reply) => sendDiagnostics('IPC received diagnostics:ping reply', reply))
    .catch((error) => sendDiagnostics('IPC diagnostics:ping failed', {
      message: error.message,
      stack: error.stack,
    }));
}, { once: true });

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  diagnostics: {
    ping: (payload) => {
      sendDiagnostics('IPC sending diagnostics:ping', payload);
      return ipcRenderer.invoke('diagnostics:ping', payload);
    },
    log: (payload) => sendDiagnostics('renderer log', payload)
  }
});
