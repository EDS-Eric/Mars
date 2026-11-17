'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mars', {
  ignoreMouse: (ignore) => ipcRenderer.send('ignore-mouse', ignore),
  getStore: () => ipcRenderer.invoke('store:get'),
  setStore: (patch) => ipcRenderer.invoke('store:set', patch),
  memorySummary: () => ipcRenderer.invoke('memory:summary'),
  aiStatus: () => ipcRenderer.invoke('ai:status'),
  idleSeconds: () => ipcRenderer.invoke('sys:idle'),
  chat: (text, ctx) => ipcRenderer.invoke('ai:chat', text, ctx),
  hide: () => ipcRenderer.send('hide'),
  focus: () => ipcRenderer.send('focus'),
  contextMenu: () => ipcRenderer.send('context-menu'),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, id) => cb(id)),
  onHidden: (cb) => ipcRenderer.on('hidden', () => cb()),
  onActivity: (cb) => ipcRenderer.on('activity', (_e, s) => cb(s)),
  onShown: (cb) => ipcRenderer.on('shown', () => cb()),
  onGoHome: (cb) => ipcRenderer.on('go-home', () => cb()),
  homeDone: () => ipcRenderer.send('home-done'),
});
