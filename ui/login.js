const email = document.getElementById("email");
const password = document.getElementById("password");
const btn = document.getElementById("btnLogin");
const loading = document.getElementById("loading");
let rawValueCpfCnpj;

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btn.click();
  }
});

email.addEventListener("input", () => {
  const cursorPosition = email.selectionStart;

  rawValueCpfCnpj = email.value.replace(/\D/g, "");
  const formatted = getCpfCnpjFormmated(rawValueCpfCnpj);

  email.value = formatted;

  email.setSelectionRange(cursorPosition, cursorPosition);
});

function getCpfCnpjFormmated(cpfCnpj) {
  const cleanedValue = cpfCnpj.replace(/\D/g, "");

  const isCpf = cleanedValue.length <= 11;

  if (isCpf) {
    return cleanedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else {
    return cleanedValue.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
}

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
    email.value = getCpfCnpjFormmated(data.login);
    password.value = data.password;
    signIn(data.login, data.password);
  }
}

automaticLogin();

async function signIn(login, password) {
  showLoading();
  try {
    const result = await window.api.login(login, password);

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
  console.log(rawValueCpfCnpj);
  signIn(rawValueCpfCnpj, password.value);
});
