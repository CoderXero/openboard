import { contextBridge, ipcRenderer } from 'electron';
import type { OpenBoardAPI } from '../shared/types';

const api: OpenBoardAPI = {
  documents: {
    open: (path) => ipcRenderer.invoke('documents:open', path),
    save: (path, project) => ipcRenderer.invoke('documents:save', path, project),
    saveAs: (project) => ipcRenderer.invoke('documents:saveAs', project),
    pickOpen: () => ipcRenderer.invoke('documents:pickOpen'),
    pickSave: (defaultName) => ipcRenderer.invoke('documents:pickSave', defaultName),
    onOpenRequest: (handler) => { const listener = (_event: Electron.IpcRendererEvent, filePath: unknown): void => { if (typeof filePath === 'string') handler(filePath); }; ipcRenderer.on('documents:open-request', listener); return () => ipcRenderer.removeListener('documents:open-request', listener); }
  },
  recovery: {
    save: (project) => ipcRenderer.invoke('recovery:save', project),
    list: () => ipcRenderer.invoke('recovery:list'),
    discard: (projectId) => ipcRenderer.invoke('recovery:discard', projectId)
  },
  exports: {
    png: (svg, defaultName) => ipcRenderer.invoke('exports:png', svg, defaultName),
    svg: (svg, defaultName) => ipcRenderer.invoke('exports:svg', svg, defaultName),
    pdf: (svg, defaultName) => ipcRenderer.invoke('exports:pdf', svg, defaultName)
  },
  system: {
    getVersion: () => ipcRenderer.invoke('system:version'),
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', url)
  }
};

contextBridge.exposeInMainWorld('openboard', api);

export type OpenBoardWindowAPI = typeof api;
