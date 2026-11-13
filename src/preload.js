// oxlint-disable eslint-plugin-unicorn/no-empty-file
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addAssignment: (data) => ipcRenderer.invoke('assignments:add', data),
  listAssignments: () => ipcRenderer.invoke('assignments:list'),
});