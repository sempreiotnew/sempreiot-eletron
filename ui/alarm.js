const dataParam = window.api.getParams();
let deviceStateLocal = JSON.parse(localStorage.getItem("deviceStates")) || {};
const silentAlarmDevice = deviceStateLocal[dataParam.chipId];
handleButton();

function silentAll() {
  window.api.sendSilentAll();
  console.log(`Todos Silenciado`);
}

function silentDevice() {
  window.api.sendSilentDevice(dataParam.chipId);
  console.log(`${dataParam.chipId} Silenciado`);
}

function handleButton() {
  const btnSilent = document.getElementById("btnSilent");
  const btnSilentAll = document.getElementById("btnSilentAll");
  const alarmStatus = document.getElementById("alarmStatus");
  const alarmActions = document.querySelector(".alarm-actions");
  const closeBtn = document.getElementById("closeAlarmBtn");

  closeBtn.addEventListener("click", () => {
    window.close();
  });

  btnSilent.addEventListener("click", () => {
    silentDevice();
    alarmActions.style.display = "none";
    alarmStatus.style.display = "block";
    alarmStatus.textContent = `Dispositivo ${data.descricao} desabilitado`;
  });

  btnSilentAll.addEventListener("click", () => {
    silentAll();
    alarmActions.style.display = "none";
    alarmStatus.style.display = "block";
    alarmStatus.textContent = "Todos os dispositivos desabilitados";
  });
}

if (silentAlarmDevice == false) {
  const audio = new Audio("newnotification.mp3");
  audio.play().catch(() => {});
}
