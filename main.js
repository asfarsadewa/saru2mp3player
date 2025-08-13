const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 825,
    height: 546,
    minWidth: 550,
    minHeight: 196,
    frame: false,
    resizable: false,
    titleBarStyle: 'hidden',
    roundedCorners: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'src/renderer/assets/icons/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'public/index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-mp3-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'MP3 Files', extensions: ['mp3'] }
    ]
  });
  
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  const fs = require('fs');
  const nodeID3 = require('node-id3');
  
  try {
    const tags = nodeID3.read(filePath);
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      name: path.basename(filePath, '.mp3'),
      title: tags.title || path.basename(filePath, '.mp3'),
      artist: tags.artist || 'Unknown Artist',
      album: tags.album || 'Unknown Album',
      duration: tags.length || 0,
      size: stats.size
    };
  } catch (error) {
    return {
      path: filePath,
      name: path.basename(filePath, '.mp3'),
      title: path.basename(filePath, '.mp3'),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      size: 0
    };
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on('resize-window', (event, width, height) => {
  if (mainWindow) {
    console.log(`Resizing window to: ${width}x${height}`);
    mainWindow.setSize(width, height);
  }
});