const email = document.getElementById("email");
const password = document.getElementById("password");
const btn = document.getElementById("btnLogin");

btn.addEventListener("click", async () => {
  try {
    const result = await window.api.login(email.value, password.value);

    console.log(result);

    const payload = result.token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const dataToStore = {
      token: result.token,
      type: result.tipo,
      expiresAt: decoded.exp * 1000, // convert seconds → milliseconds
      createdAt: Date.now(),
    };
    localStorage.setItem("auth", JSON.stringify(dataToStore));
    console.log("SAVED:", dataToStore);

    alert("Login OK!");

    await window.api.connectMQTT(email.value, password.value);

    window.api.subscribe("#");
    window.location.href = "home.html";
    // window.api.onMessage((msg) => {
    //   console.log("MQTT:", msg.topic, msg.message);

    //   if (msg.topic.includes("15032864")) {
    //     const audio = new Audio("newnotification.mp3");
    //     audio.play().catch(() => {});
    //   }
    // });
  } catch (err) {
    alert("Login failed");
  }
});
