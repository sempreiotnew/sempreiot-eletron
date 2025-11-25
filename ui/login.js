const email = document.getElementById("email");
const password = document.getElementById("password");
const btn = document.getElementById("btnLogin");

function automaticLogin() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);

  if (data) {
    console.log("Auto LOGIN");
    signIn(data.login, data.password);
  }
}

automaticLogin();

async function signIn(login, password) {
  try {
    const result = await window.api.login(login, password);

    console.log(result);
    const expireAt = new Date();
    expireAt.getMinutes(expireAt.getMinutes() + 2).toLocaleString();
    const dataToStore = {
      login: login,
      password: password,
      token: result.token,
      type: result.tipo,
      expiresAt: expireAt,
      createdAt: Date.now(),
    };
    localStorage.setItem("auth", JSON.stringify(dataToStore));
    console.log("SAVED:", dataToStore);

    await window.api.connectMQTT(login, password);

    window.location.href = "home.html";
  } catch (err) {
    alert("Login failed");
  }
}

btn.addEventListener("click", async () => {
  signIn(email.value, password.value);
});
