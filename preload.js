const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (email, password) => ipcRenderer.invoke("login", { email, password }),
  getDocument: (login, token) =>
    ipcRenderer.invoke("getDocument", { login, token }),

  connectMQTT: (username, password) =>
    ipcRenderer.invoke("connect-mqtt", { username, password }),

  subscribe: (topic) => ipcRenderer.invoke("subscribe", topic),

  onMessage: (callback) =>
    ipcRenderer.on("mqtt-message", (event, data) => callback(data)),

  openAlarm: () => ipcRenderer.invoke("open-alarm"),
});
