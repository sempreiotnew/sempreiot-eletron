const email = document.getElementById("email");
const password = document.getElementById("password");
const btn = document.getElementById("btnLogin");
const loading = document.getElementById("loading");

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btn.click();
  }
});

function showLoading() {
  loading.style.display = "block";
  btn.style.display = "none";
}

function hideLoading() {
  loading.style.display = "none";
  btn.disabled = false;
}

function automaticLogin() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);

  if (data) {
    console.log("Auto LOGIN");
    email.value = data.login;
    password.value = data.password;
    signIn(data.login, data.password);
  }
}

automaticLogin();

async function signIn(login, password) {
  showLoading();
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
    alert("Usuário ou senha incorretos");
    btn.style.display = "block";
  } finally {
    hideLoading();
  }
}

btn.addEventListener("click", async () => {
  signIn(email.value, password.value);
});
