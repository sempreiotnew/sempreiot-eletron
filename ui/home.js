const btnSair = document.getElementById("btnSair");
btnSair.addEventListener("click", async () => {
  localStorage.clear();
  window.location.href = "login.html";
});

async function getUserData() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);
  const token = await getToken();

  const documents = await window.api.getDocument(data.login, token);

  console.log(documents);
  documents.forEach((document) => {
    document.devices.forEach((device) => {
      window.api.subscribe(`${device.chipId}/#`);
    });
  });
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
    // const audio = new Audio("newnotification.mp3");
    // audio.play().catch(() => {});
    const token = await getToken();

    const chipId = msg.topic.substring(0, msg.topic.indexOf("/"));
    const res = await window.api.getDevice(chipId, token);

    window.api.openAlarm(res.descricao);
  }
});

window.api.onConnect(() => {
  console.log("- MQTT connected from renderer");
  getUserData();
});
