const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectMp3Files: () => ipcRenderer.invoke('select-mp3-files'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height)
});