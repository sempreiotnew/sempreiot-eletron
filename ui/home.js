let documents = [];
let sharedDevices = [];
let mqttInitialized = false;
document.title = "Sempre IoT - Alarmes";
const DEVICE_STATES = "deviceStates";
let deviceStates = JSON.parse(localStorage.getItem(DEVICE_STATES)) || {};

localStorage.removeItem(DEVICE_STATES);
localStorage.setItem(DEVICE_STATES, JSON.stringify(deviceStates));

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
    // Force the checkbox to be checked (true)
    checkAllCheckbox.checked = true;

    // Manually dispatch the change event
    checkAllCheckbox.dispatchEvent(new Event("change"));
  }
  // window.location.reload();
});

btnReload.addEventListener("click", async () => {
  await unsubscribeAllDevices();
  window.location.reload();
});

function showLoading() {
  loading.style.display = "block";
}

function hideLoading() {
  loading.style.display = "none";
}

const btnSair = document.getElementById("btnSair");
btnSair.addEventListener("click", async () => {
  localStorage.clear();

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

  documents = await window.api.getDocument(data.login, token);
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
  // const container = document.getElementById("devicesList");
  // container.innerHTML = "";
  allDevices = []; // reset
  documents.forEach((doc) => {
    doc.devices.forEach((device) => {
      // renderHtmlDevices(device);
      allDevices.push(device);
    });
  });

  sharedDevices.forEach((shared) => {
    shared.forEach((device) => {
      // renderHtmlDevices(device);
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

  let deviceStored = JSON.parse(localStorage.getItem(DEVICE_STATES)) || {};
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

//Silent all
document.getElementById("checkAll").addEventListener("change", (e) => {
  const checked = e.target.checked;
  const deviceStates = JSON.parse(localStorage.getItem(DEVICE_STATES)) || {};

  document
    .querySelectorAll("#devicesList input[type='checkbox']")
    .forEach((cb) => {
      cb.checked = checked;
      deviceStates[cb.id] = checked;
    });

  localStorage.setItem(DEVICE_STATES, JSON.stringify(deviceStates));
});

function updateCheckBoxLocalStorage(chipId, checked) {
  let deviceStateLocal = JSON.parse(localStorage.getItem(DEVICE_STATES)) || {};
  deviceStateLocal[chipId] = checked;
  localStorage.setItem("deviceStates", JSON.stringify(deviceStateLocal));
}

async function getToken() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);

  if (isTokenExpired(data.expiresAt)) {
    console.log("TOKEN EXPIRADO !!!!!");
    const result = await window.api.login(data.login, data.password);

    const expireAt = new Date();
    expireAt.getMinutes(expireAt.getMinutes() + 2).toLocaleString();

    const dataToStore = {
      login: data.login,
      password: data.password,
      token: result.token,
      type: result.tipo,
      expiresAt: expireAt, // convert seconds → milliseconds
      createdAt: Date.now(),
    };
    localStorage.setItem("auth", JSON.stringify(dataToStore));

    return result.token;
  }

  return data.token;
}

function isTokenExpired(expiresAt) {
  // Verifica se há uma string no localStorage
  if (expiresAt) {
    // Obtém a data de expiração do objeto
    const expireAt = new Date(expiresAt);

    // Subtrai 2 horas da data de expiração
    const expirationThreshold = new Date();
    // expirationThreshold.setMinutes(expirationThreshold.getMinutes() - 2);

    // Compara a data de expiração com a data atual
    return expireAt < expirationThreshold;
  }

  // Retorna true se não houver token ou se ocorrer algum erro na verificação
  return true;
}

window.api.onMessage(async (msg) => {
  // console.log("MQTT:", msg.topic, msg.message);

  if (msg.topic.includes("/alarm") && msg.message === "1" && !msg.retained) {
    const token = await getToken();

    const chipId = msg.topic.substring(0, msg.topic.indexOf("/"));
    const res = await window.api.getDevice(chipId, token);

    let deviceSettings = JSON.parse(localStorage.getItem("deviceStates")) || {};
    const deviceLocal = deviceSettings[chipId];
    window.api.openAlarm(res.descricao, chipId, deviceLocal ?? false);
  }
});

window.api.onConnect(async () => {
  if (mqttInitialized) return; // ✅ prevents multiple executions
  mqttInitialized = true;
  console.log("- MQTT connected from renderer");
  try {
    showLoading();
    await getUserData();
  } catch (err) {
    console.err(err);
    console.log("something went wrong");
  } finally {
    hideLoading();
  }
});
