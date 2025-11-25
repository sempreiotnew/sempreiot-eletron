let documents = [];
let sharedDevices = [];

const btnReload = document.getElementById("btnReload");
const loading = document.getElementById("loading");

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

  console.log(documents);

  documents.forEach((document) => {
    document.devices.forEach((device) => {
      window.api.subscribe(`${device.chipId}/#`);
    });
  });

  shared.forEach(async (s) => {
    const res = await window.api.getDeviceShared(
      s.contratoShared,
      data.login,
      token
    );

    sharedDevices.push(res[0].devices);

    res[0].devices.forEach((device) => {
      window.api.subscribe(`${device.chipId}/#`);
      console.log("subscribe");
      console.log(device.chipId);
    });
  });

  renderDevices(documents);
}

function renderDevices(documents) {
  const container = document.getElementById("devicesList");
  container.innerHTML = "";
  documents.forEach((doc) => {
    doc.devices.forEach((device) => {
      renderHtmlDevices(device);
    });
  });

  sharedDevices.forEach((shared) => {
    shared.forEach((device) => {
      renderHtmlDevices(device);
    });
  });
}

function renderHtmlDevices(device) {
  const container = document.getElementById("devicesList");
  const wrapper = document.createElement("div");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = device.chipId;
  checkbox.value = device.chipId;

  const label = document.createElement("label");
  label.htmlFor = device.chipId;
  label.textContent = device.descricao || device.chipId;

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);

  container.appendChild(wrapper);
}

async function getToken() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);
  console.log(data);

  if (isTokenExpired(data.expiresAt)) {
    console.log("TOKEN EXPIRADO !!!!!");
    const result = await window.api.login(data.login, data.password);

    console.log(result);

    const payload = result.token.split(".")[1];
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
    console.log("SAVED:", dataToStore);

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

// getUserData();

window.api.onMessage(async (msg) => {
  console.log("MQTT:", msg.topic, msg.message);

  if (msg.topic.includes("/alarm") && msg.message === "1" && !msg.retained) {
    const token = await getToken();

    const chipId = msg.topic.substring(0, msg.topic.indexOf("/"));
    const res = await window.api.getDevice(chipId, token);

    window.api.openAlarm(res.descricao);
  }
});

window.api.onConnect(async () => {
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
