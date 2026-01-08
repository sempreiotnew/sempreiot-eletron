process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mqtt = require("mqtt");
const fetch = require("node-fetch");
const alarmWindows = [];
let client = null;
let mainWindow = null; // FIX: store reference

if (process.platform === "win32") {
  app.setAppUserModelId("com.sempreiot.app");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to open the app again, just show existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

//ABOUT

app.whenReady().then(() => {
  app.setAboutPanelOptions({
    applicationName: "Sempre IoT - Alarmes",
    applicationVersion: "1.0.0",
    copyright: "© 2025 Sempre IoT",
    authors: ["Talles Augusto"],
    website: "https://www.sempreiot.com.br",
    iconPath: path.join(__dirname, "logo_no_shadow_512x512.png"),
  });
});

//Name
app.setName("Sempre IoT - Alarmes");

// ================================
// ✅ AUTO LAUNCH ON SYSTEM START
// ================================
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
});

// ======================================
// ✅ PREVENT APP FROM EVER QUITTING
// ======================================
app.on("window-all-closed", (e) => {
  // Do nothing -> keeps app running safely
});

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
  } else {
    createWindow();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "logo_no_shadow_512x512.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.maximize();

  //   mainWindow.webContents.openDevTools();
  mainWindow.loadFile(path.join(__dirname, "ui/login.html"));

  // ✅ Close button now only HIDES the app
  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(createWindow);

// LOGIN
ipcMain.handle("login", async (_, { email, password }) => {
  const res = await fetch(
    `https://sempreiot.ddns.net/auth/${btoa(email)}&${btoa(password)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) throw new Error("Invalid credentials");

  return res.json();
});

//GET DOCUMENT
ipcMain.handle("getDocument", async (_, { login, token }) => {
  const res = await fetch(
    `https://sempreiot.ddns.net:444/documento/lista/contrato/${login}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    console.log(res);
    throw new Error("Error getting documents");
  }

  return res.json();
});

//GET DEVICE
ipcMain.handle("getDevice", async (_, { chipId, token }) => {
  const res = await fetch(
    `https://sempreiot.ddns.net:444/dispositivo/listar/${chipId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    console.log(res);
    throw new Error("Error getting devices");
  }

  return res.json();
});

//GET DEVICE SHARED
ipcMain.handle("getDeviceShared", async (_, { contrato, login, token }) => {
  const res = await fetch(
    `https://sempreiot.ddns.net:444/documento/lista/chave/contrato/${contrato}&${login}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    console.log(res);
    throw new Error("Error getting devices shared");
  }

  return res.json();
});

// MQTT CONNECT
ipcMain.handle("connect-mqtt", (_, { username, password }) => {
  return new Promise((resolve, reject) => {
    client = mqtt.connect("wss://sempreiot.ddns.net:9002/mqtt", {
      username,
      password,
      rejectUnauthorized: false,
      wsOptions: { rejectUnauthorized: false },
    });

    let mqttConnected = false;

    client.on("connect", () => {
      mqttConnected = true;
      console.log("MQTT connected");

      sendMQTTStatus();
      resolve("CONNECTED");
    });

    function sendMQTTStatus() {
      if (mqttConnected && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("mqtt-connected");
      }
    }

    mainWindow.webContents.on("did-finish-load", () => {
      sendMQTTStatus();
    });

    client.on("error", (err) => {
      console.log("MQTT ERROR:", err);
      reject(err);
    });

    client.on("disconnect", (err) => {
      console.log("MQTT DISCONNECTED! ", err);
      reject(err);
    });

    client.on("message", (topic, message, packet) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("mqtt-message", {
          topic,
          message: message.toString(),
          retained: packet.retain,
        });
      } else {
        console.log("NO WINDOW AVAILABLE TO SEND MQTT MESSAGE");
      }
    });
  });
});

// SUBSCRIBE
ipcMain.handle("subscribe", (_, topic) => {
  if (!client) return "NO_CLIENT";

  client.subscribe(topic, (err, granted) => {
    if (err) console.log("SUBSCRIBE ERROR:", err);
  });

  return "OK";
});

ipcMain.handle("unsubscribe", (_, topic) => {
  if (!client) return "NO_CLIENT";

  client.unsubscribe(topic, (err, granted) => {
    if (err) console.log("UNSUBSCRIBE ERROR:", err);
  });

  return "OK";
});

ipcMain.handle("open-alarm", (_, descricao, chipId, silent) => {
  silent ? null : createAlarmWindow(descricao, chipId);
});

// ipcMain.handle("start-count-close-all", (_, seconds) => {
//   alarmWindows.forEach((win) => {
//     win.webContents.send("start-count-close", seconds); // envia evento para cada janela
//   });
// });

ipcMain.handle("start-count-close-all", (_, seconds, chipId) => {
  // Remove destroyed windows from the array
  for (let i = alarmWindows.length - 1; i >= 0; i--) {
    if (alarmWindows[i].isDestroyed()) {
      alarmWindows.splice(i, 1);
    }
  }

  // Send event only to alive windows
  alarmWindows.forEach((win) => {
    if (!win.isDestroyed()) {
      //if chipId was sent, then check the id of each screen
      if (chipId) {
        if (chipId === win.chipId) {
          win.webContents.send("start-count-close", seconds);
        }
      } else {
        win.webContents.send("start-count-close", seconds);
      }
    }
  });
});

ipcMain.on("silent-device", (event, chipId) => {
  console.log(`Silent chipId: ${chipId}`);

  // Forward the chipId to all renderer processes
  mainWindow.webContents.send("silent-device", chipId);
});

ipcMain.on("silent-all", (event) => {
  console.log(`Silent all devices`);

  // Forward the chipId to all renderer processes
  mainWindow.webContents.send("silent-all");
});
function createAlarmWindow(descricao, chipId) {
  const alarmWin = new BrowserWindow({
    width: 500,
    height: 450,
    alwaysOnTop: true,
    modal: true,
    title: "ATENÇÃO ALARME 🚨",
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  alarmWin.chipId = chipId;
  alarmWin.loadFile(path.join(__dirname, "ui/alarm.html"), {
    query: { descricao, chipId },
  });

  alarmWin.on("close", () => {
    const index = alarmWindows.indexOf(alarmWin);
    if (index > -1) alarmWindows.splice(index, 1);
    alarmWin.destroy();
  });

  alarmWindows.push(alarmWin);
}
