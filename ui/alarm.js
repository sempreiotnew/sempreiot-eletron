const dataParam = window.api.getParams();
let deviceStateLocal = JSON.parse(localStorage.getItem("deviceStates")) || {};
const deviceAlarm = deviceStateLocal[dataParam.chipId];

if (deviceAlarm && deviceAlarm === true) {
  const audio = new Audio("newnotification.mp3");
  audio.play().catch(() => {});
}
