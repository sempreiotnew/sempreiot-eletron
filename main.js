process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mqtt = require("mqtt");
const fetch = require("node-fetch");

let client = null;
let mainWindow = null;

// ======================================
// SINGLE INSTANCE
// ======================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ======================================
// AUTO LAUNCH ON SYSTEM START
// ======================================
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
});

// ======================================
// PREVENT APP FROM QUITTING
// ======================================
app.on("window-all-closed", () => {
  // Intentionally empty -> keeps background process alive
});

app.on("activate", () => {
  if (mainWindow) mainWindow.show();
  else createWindow();
});

// ======================================
// WINDOW CREATION
// ======================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 480,
    icon: path.join(__dirname, "logo_no_shadow_512x512.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.openDevTools();
  mainWindow.loadFile(path.join(__dirname, "ui/login.html"));

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(createWindow);

// ======================================
// UTILITIES
// ======================================
function safeSend(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

async function apiRequest(url, method, headers = {}, body = null) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ======================================
// LOGIN
// ======================================
ipcMain.handle("login", async (_, { email, password }) => {
  return apiRequest(
    `https://sempreiot.ddns.net/auth/${btoa(email)}&${btoa(password)}`,
    "POST",
    { "Content-Type": "application/json" },
    { email, password }
  );
});

// ======================================
// GET DOCUMENT
// ======================================
ipcMain.handle("getDocument", async (_, { login, token }) => {
  return apiRequest(
    `https://sempreiot.ddns.net:444/documento/lista/contrato/${login}`,
    "GET",
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  );
});

// ======================================
// GET DEVICE
// ======================================
ipcMain.handle("getDevice", async (_, { chipId, token }) => {
  return apiRequest(
    `https://sempreiot.ddns.net:444/dispositivo/listar/${chipId}`,
    "GET",
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  );
});

// ======================================
// MQTT CONNECT
// ======================================
ipcMain.handle("connect-mqtt", () => {
  return new Promise((resolve, reject) => {
    client = mqtt.connect("wss://sempreiot.ddns.net:9002/mqtt", {
      rejectUnauthorized: false,
      wsOptions: { rejectUnauthorized: false },
    });

    let mqttConnected = false;

    client.on("connect", () => {
      mqttConnected = true;
      console.log("MQTT connected");
      safeSend("mqtt-connected");
      resolve("CONNECTED");
    });

    client.on("error", (err) => {
      console.log("MQTT ERROR:", err);
      reject(err);
    });

    client.on("disconnect", (err) => {
      console.log("MQTT DISCONNECTED:", err);
      reject(err);
    });

    client.on("message", (topic, message, packet) => {
      safeSend("mqtt-message", {
        topic,
        message: message.toString(),
        retained: packet.retain,
      });
    });
  });
});

// ======================================
// SUBSCRIBE
// ======================================
ipcMain.handle("subscribe", (_, topic) => {
  if (!client) return "NO_CLIENT";

  client.subscribe(topic, (err) => {
    if (err) console.log("SUBSCRIBE ERROR:", err);
  });

  return "OK";
});

// ======================================
// ALARM WINDOW
// ======================================
function createAlarmWindow(descricao) {
  const alarmWin = new BrowserWindow({
    width: 300,
    height: 250,
    alwaysOnTop: true,
    modal: true,
    title: "ATENÇÃO ALARME 🚨",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  alarmWin.loadFile(path.join(__dirname, "ui/alarm.html"), {
    query: { descricao },
  });

  alarmWin.on("close", () => {
    alarmWin.destroy();
  });
}

ipcMain.handle("open-alarm", (_, descricao) => {
  createAlarmWindow(descricao);
});
