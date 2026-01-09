const dataParam = window.api.getParams();
const auth = JSON.parse(localStorage.getItem("auth"));
const btnSilent = document.getElementById("btnSilent");
const btnSilentAll = document.getElementById("btnSilentAll");

let deviceStateLocal = JSON.parse(
  localStorage.getItem(`deviceStates_${auth.login}`) || "{}"
);
const silentAlarmDevice = deviceStateLocal[dataParam.chipId];

let alarmAudio = null;
handleButton();

function silentAll() {
  window.api.sendSilentAll();
  console.log(`Todos Silenciado`);
}

function silentDevice() {
  window.api.sendSilentDevice(dataParam.chipId);
  console.log(`${dataParam.chipId} Silenciado`);
}

window.api.onStartCountClose((seconds) => {
  stopAlarmAudio();
  onCountClose(seconds);
  btnSilent.style.display = "none";
  btnSilentAll.style.display = "none";
});

function onCountClose(seconds) {
  return new Promise((resolve) => {
    const closeCounter = document.getElementById("close-counter");
    closeCounter.style.display = "block";
    let counter = seconds;

    closeCounter.textContent = `Fechando alarme em ${counter}s`;

    const interval = setInterval(() => {
      counter--;
      closeCounter.textContent = `Fechando alarme em ${counter}s`;

      if (counter <= 0) {
        clearInterval(interval);
        resolve(); // ✅ NOW await works
        window.close();
      }
    }, 1000);
  });
}

function handleButton() {
  const alarmStatus = document.getElementById("alarmStatus");
  const alarmActions = document.querySelector(".alarm-actions");
  const closeBtn = document.getElementById("closeAlarmBtn");

  closeBtn.addEventListener("click", () => {
    window.close();
  });

  btnSilent.addEventListener("click", async () => {
    await stopProcedures(false);
    alarmActions.style.display = "none";
    alarmStatus.style.display = "block";
    alarmStatus.textContent = `Dispositivo ${data.descricao} desabilitado`;
    closeBtn.style.display = "block";
  });

  btnSilentAll.addEventListener("click", async () => {
    await stopProcedures(true);
    alarmActions.style.display = "none";
    alarmStatus.style.display = "block";
    alarmStatus.textContent = "Todos os dispositivos foram desabilitados";
    closeBtn.style.display = "block";
  });
}

async function stopProcedures(isAll) {
  function stopAndCount(isAll) {
    if (isAll) {
      silentAll();
      window.api.startCountCloseAll(10);
    } else {
      silentDevice();
      window.api.startCountCloseAll(10, dataParam.chipId);
    }
  }

  return await Promise.all([stopAndCount(isAll), stopAlarmAudio()]);
}

function stopAlarmAudio() {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmAudio = null;
  }
}

if (silentAlarmDevice == false) {
  alarmAudio = new Audio("newnotification.mp3");
  alarmAudio.loop = true;
  alarmAudio.play().catch(() => {});
}
