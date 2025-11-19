window.api.onMessage((msg) => {
  console.log("MQTT:", msg.topic, msg.message);

  if (msg.topic.includes("15032864")) {
    const audio = new Audio("newnotification.mp3");
    audio.play().catch(() => {});
  }
});
