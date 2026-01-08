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

function getCpfCnpjFormmated(cpfCnpj) {
  const cleanedValue = cpfCnpj.replace(/\D/g, "");

  const isCpf = cleanedValue.length === 11;

  if (isCpf) {
    return cleanedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else {
    return cleanedValue.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
}

email.addEventListener("input", () => {
  const cursorPosition = email.selectionStart; // Track the current cursor position

  // Get the raw input (cleaned from non-numeric characters)
  const raw = email.value.replace(/\D/g, "");

  rawValueCpfCnpj = raw;
  // Format the cleaned value to CPF or CNPJ format
  const formatted = getCpfCnpjFormmated(raw);

  // Set the value back to the formatted input
  email.value = formatted;

  // Adjust the cursor position after the formatting
  let newCursorPosition = cursorPosition;

  // If the cursor is within the CPF or CNPJ mask, adjust the cursor position accordingly
  if (raw.length < cleanedValue.length) {
    // When the user is typing and the value length is increasing, we need to move the cursor
    newCursorPosition += 1;
  } else if (raw.length > cleanedValue.length) {
    // When the user is deleting, we need to move the cursor back
    newCursorPosition -= 1;
  }

  email.setSelectionRange(newCursorPosition, newCursorPosition); // Restore the cursor position
});

function getCpfCnpjFormmated(cpfCnpj) {
  // Remove all non-numeric characters (clean up)
  const cleanedValue = cpfCnpj.replace(/\D/g, "");

  // Determine if it's a CPF (11 digits) or CNPJ (14 digits)
  const isCpf = cleanedValue.length === 11;

  // Format the CPF or CNPJ
  if (isCpf) {
    return cleanedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (cleanedValue.length === 14) {
    return cleanedValue.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  // Return the original cleaned value if it's not a valid CPF or CNPJ
  return cleanedValue;
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
