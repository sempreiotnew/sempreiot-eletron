process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mqtt = require("mqtt");
const fetch = require("node-fetch");

let client = null;
let mainWindow = null; // FIX: store reference

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 480,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.openDevTools();
  mainWindow.loadFile(path.join(__dirname, "ui/login.html"));
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

// MQTT CONNECT
ipcMain.handle("connect-mqtt", (_, { username, password }) => {
  return new Promise((resolve, reject) => {
    client = mqtt.connect("wss://sempreiot.ddns.net:9002/mqtt", {
      username,
      password,
      rejectUnauthorized: false,
      wsOptions: { rejectUnauthorized: false },
    });

    client.on("connect", () => {
      console.log("MQTT connected");
      resolve("CONNECTED");
    });

    client.on("error", (err) => {
      console.log("MQTT ERROR:", err);
      reject(err);
    });

    client.on("message", (topic, message, packet) => {
      console.log("RECEIVED:", topic, message.toString());

      // FIX: ensure window exists and is not destroyed
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
    else console.log("SUBSCRIBED:", granted);
  });

  return "OK";
});

function createAlarmWindow() {
  const alarmWin = new BrowserWindow({
    width: 300,
    height: 250,
    title: "Alarm",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  alarmWin.loadFile(path.join(__dirname, "ui/alarm.html"));
}

ipcMain.handle("open-alarm", () => {
  createAlarmWindow();
});
