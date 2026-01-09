let documents = [];
let sharedDevices = [];
let mqttInitialized = false;
const auth = JSON.parse(localStorage.getItem("auth")) || {};
document.getElementById("userName").textContent = auth.name || "";
document.title = "Sempre IoT - Alarmes";

/* ===================== */
/* USER-SCOPED STORAGE */
/* ===================== */
function getUserDeviceStatesKey() {
  const auth = JSON.parse(localStorage.getItem("auth"));
  if (!auth?.login) return "deviceStates_anonymous";
  return `deviceStates_${auth.login}`;
}

function getDeviceStates() {
  return JSON.parse(localStorage.getItem(getUserDeviceStatesKey())) || {};
}

function setDeviceStates(states) {
  localStorage.setItem(getUserDeviceStatesKey(), JSON.stringify(states));
}

/* keep constant name to NOT break structure */
const DEVICE_STATES = getUserDeviceStatesKey();
let deviceStates = getDeviceStates();

const btnReload = document.getElementById("btnReload");
const loading = document.getElementById("loading");

window.api.onSilentDevice((chipId) => {
  console.log(`Received silent device event for chipId: ${chipId}`);
  updateCheckBoxLocalStorage(chipId, true);
  window.location.reload();
});

window.api.onSilentAll(() => {
  console.log(`Received silent device event for ALL`);
  const checkAllCheckbox = document.getElementById("checkAll");
  if (checkAllCheckbox) {
    checkAllCheckbox.checked = true;
    checkAllCheckbox.dispatchEvent(new Event("change"));
  }
});

btnReload.addEventListener("click", async () => {
  await unsubscribeAllDevices();
  window.location.reload();
});

//Avatar

function setUserName(fullName, data) {
  const newAuth = { ...data, name: fullName };
  localStorage.setItem("auth", JSON.stringify(newAuth));
  document.getElementById("userName").textContent = fullName;

  // Optionally set a custom avatar
  const avatarImg = document.getElementById("avatarImg");
  if (document.avatarUrl) {
    avatarImg.src = document.avatarUrl;
  }
}

function showLoading() {
  loading.style.display = "block";
}

function hideLoading() {
  loading.style.display = "none";
}

const btnSair = document.getElementById("btnSair");
btnSair.addEventListener("click", async () => {
  /* ❌ DO NOT CLEAR EVERYTHING */
  localStorage.removeItem("auth");

  await unsubscribeAllDevices();
  window.location.href = "login.html";
});

function unsubscribeAllDevices() {
  return new Promise((resolve, reject) => {
    try {
      documents.forEach((document) => {
        document.devices.forEach((device) => {
          console.log(`documents unsubscribing ${device.chipId}`);
          window.api.unsubscribe(`${device.chipId}/#`);
        });
      });

      sharedDevices.forEach((shared) => {
        shared.forEach((device) => {
          console.log(`shared unsubscribing ${device.chipId}`);
          window.api.unsubscribe(`${device.chipId}/#`);
        });
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function getUserData() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);
  const token = await getToken();

  documents = await window.api.getDocument(atob(data.login), token);
  setUserName(`${documents[0].nome} ${documents[0].sobrenome}`, data);

  const shared = documents[0].contratosCompartilhado;

  documents.forEach((document) => {
    document.devices.forEach((device) => {
      window.api.subscribe(`${device.chipId}/#`);
    });
  });

  await Promise.all(
    shared.map(async (s) => {
      const res = await window.api.getDeviceShared(
        s.contratoShared,
        data.login,
        token
      );

      const filteredDevices = res[0].devices
        .map((device) => ({
          ...device,
          grupo: device.grupo.filter((g) => g.loginCelular === data.login),
        }))
        .filter((device) => device.grupo.length > 0);

      sharedDevices.push(filteredDevices);

      filteredDevices.forEach((device) => {
        window.api.subscribe(`${device.chipId}/#`);
      });
    })
  );

  renderDevices(documents);
}

function renderDevices(documents) {
  allDevices = [];
  documents.forEach((doc) => {
    doc.devices.forEach((device) => {
      allDevices.push(device);
    });
  });

  sharedDevices.forEach((shared) => {
    shared.forEach((device) => {
      allDevices.push(device);
    });
  });

  renderFilteredDevices(allDevices);
}

function renderFilteredDevices(devices) {
  const container = document.getElementById("devicesList");
  container.innerHTML = "";

  devices.forEach((device) => {
    renderHtmlDevices(device);
  });
}

const searchInput = document.getElementById("deviceSearch");

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase().trim();

  const filtered = allDevices.filter((device) => {
    const name = (device.descricao || "").toLowerCase();
    const chip = (device.chipId || "").toLowerCase();

    return name.includes(term) || chip.includes(term);
  });

  renderFilteredDevices(filtered);
});

function renderHtmlDevices(device) {
  const container = document.getElementById("devicesList");

  const row = document.createElement("div");
  row.className = "device-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = device.chipId;
  checkbox.value = device.chipId;
  checkbox.style.cursor = "pointer";

  /* ✅ USER-SCOPED LOAD */
  const deviceStored = getDeviceStates();
  checkbox.checked = deviceStored[device.chipId] ?? false;

  const label = document.createElement("label");
  label.htmlFor = device.chipId;
  label.textContent = device.descricao || device.chipId;

  row.appendChild(checkbox);
  row.appendChild(label);

  container.appendChild(row);

  checkbox.addEventListener("change", () => {
    updateCheckBoxLocalStorage(device.chipId, checkbox.checked);

    const all = document.querySelectorAll(
      "#devicesList input[type='checkbox']"
    );
    const checked = document.querySelectorAll(
      "#devicesList input[type='checkbox']:checked"
    );

    document.getElementById("checkAll").checked = all.length === checked.length;
  });
}

/* Silent all */
document.getElementById("checkAll").addEventListener("change", (e) => {
  const checked = e.target.checked;
  const deviceStates = getDeviceStates();

  document
    .querySelectorAll("#devicesList input[type='checkbox']")
    .forEach((cb) => {
      cb.checked = checked;
      deviceStates[cb.id] = checked;
    });

  setDeviceStates(deviceStates);
});

function updateCheckBoxLocalStorage(chipId, checked) {
  const deviceStateLocal = getDeviceStates();
  deviceStateLocal[chipId] = checked;
  setDeviceStates(deviceStateLocal);
}

async function getToken() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);

  if (isTokenExpired(data.expiresAt)) {
    console.log("TOKEN EXPIRADO !!!!!");
    const result = await window.api.login(
      atob(data.login),
      atob(data.password)
    );

    const expireAt = new Date();
    expireAt.getMinutes(expireAt.getMinutes() + 2).toLocaleString();

    const dataToStore = {
      login: btoa(data.login),
      password: btoa(data.password),
      token: result.token,
      type: result.tipo,
      expiresAt: expireAt,
      createdAt: Date.now(),
    };
    localStorage.setItem("auth", JSON.stringify(dataToStore));

    return result.token;
  }

  return data.token;
}

function isTokenExpired(expiresAt) {
  if (expiresAt) {
    const expireAt = new Date(expiresAt);
    const expirationThreshold = new Date();
    return expireAt < expirationThreshold;
  }
  return true;
}

window.api.onMessage(async (msg) => {
  if (msg.topic.includes("/alarm") && msg.message === "1" && !msg.retained) {
    const token = await getToken();
    const chipId = msg.topic.substring(0, msg.topic.indexOf("/"));
    const res = await window.api.getDevice(chipId, token);

    /* ✅ USER-SCOPED READ */
    const deviceSettings = getDeviceStates();
    const deviceLocal = deviceSettings[chipId];

    window.api.openAlarm(res.descricao, chipId, deviceLocal ?? false);
  }
});

window.api.onConnect(async () => {
  if (mqttInitialized) return;
  mqttInitialized = true;
  console.log("- MQTT connected from renderer");
  try {
    showLoading();
    await getUserData();
  } catch (err) {
    console.log(err);
    console.log("something went wrong");
  } finally {
    hideLoading();
  }
});
