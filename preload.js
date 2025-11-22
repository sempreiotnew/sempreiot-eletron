const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (email, password) => ipcRenderer.invoke("login", { email, password }),
  getDocument: (login, token) =>
    ipcRenderer.invoke("getDocument", { login, token }),
  getDevice: (chipId, token) =>
    ipcRenderer.invoke("getDevice", { chipId, token }),

  connectMQTT: (username, password) =>
    ipcRenderer.invoke("connect-mqtt", { username, password }),

  subscribe: (topic) => ipcRenderer.invoke("subscribe", topic),

  onMessage: (callback) =>
    ipcRenderer.on("mqtt-message", (event, data) => callback(data)),

  openAlarm: (descricao) => ipcRenderer.invoke("open-alarm", descricao),

  getParams: () => {
    const urlParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlParams.entries());
  },
});
