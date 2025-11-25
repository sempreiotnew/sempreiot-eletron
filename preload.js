const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (email, password) => ipcRenderer.invoke("login", { email, password }),
  getDocument: (login, token) =>
    ipcRenderer.invoke("getDocument", { login, token }),
  getDevice: (chipId, token) =>
    ipcRenderer.invoke("getDevice", { chipId, token }),
  getDeviceShared: (contrato, login, token) =>
    ipcRenderer.invoke("getDeviceShared", { contrato, login, token }),

  connectMQTT: (username, password) =>
    ipcRenderer.invoke("connect-mqtt", { username, password }),

  onConnect: (callback) => ipcRenderer.on("mqtt-connected", () => callback()),

  subscribe: (topic) => ipcRenderer.invoke("subscribe", topic),
  unsubscribe: (topic) => ipcRenderer.invoke("unsubscribe", topic),

  onMessage: (callback) =>
    ipcRenderer.on("mqtt-message", (event, data) => callback(data)),

  openAlarm: (descricao, chipId, active) =>
    ipcRenderer.invoke("open-alarm", descricao, chipId, active),

  getParams: () => {
    const urlParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlParams.entries());
  },
});
