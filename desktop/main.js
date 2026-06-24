// Francais 3D — Electron obal (samostatná desktopová aplikace)
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function htmlPath() {
  // při vývoji (npm start) je hra o adresář výš; v zabaleném buildu v resources/
  const dev = path.join(__dirname, '..', 'francouzstina.html');
  if (fs.existsSync(dev)) return dev;
  return path.join(process.resourcesPath || __dirname, 'francouzstina.html');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0e1726',
    title: 'Français 3D',
    webPreferences: { webgl: true, backgroundThrottling: false }
  });
  win.removeMenu();
  win.loadFile(htmlPath());
  // externí odkazy otevři v prohlížeči, ne v appce
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
