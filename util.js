async function getToken() {
  const auth = localStorage.getItem("auth");
  const data = JSON.parse(auth);

  if (isTokenExpired(data.expiresAt)) {
    console.log("ATENÇÃO - TOKEN EXPIRADO !!!!!");
  }

  //   const result = await window.api.login(data.email, data.password);

  //   console.log(result);

  //   const payload = result.token.split(".")[1];
  //   const decoded = JSON.parse(atob(payload));
  //   const dataToStore = {
  //     login: email.value,
  //     token: result.token,
  //     type: result.tipo,
  //     expiresAt: decoded.exp * 1000, // convert seconds → milliseconds
  //     createdAt: Date.now(),
  //   };
  //   localStorage.setItem("auth", JSON.stringify(dataToStore));
  //   console.log("SAVED:", dataToStore);

  return data.token;
}

function isTokenExpired(expiresAt) {
  // Verifica se há uma string no localStorage
  if (expiresAt) {
    // Obtém a data de expiração do objeto
    const expireAt = new Date(expiresAt);

    // Subtrai 2 horas da data de expiração
    const expirationThreshold = new Date();
    expirationThreshold.setHours(expirationThreshold.getHours() - 4);

    // Compara a data de expiração com a data atual
    return expireAt < expirationThreshold;
  }

  // Retorna true se não houver token ou se ocorrer algum erro na verificação
  return true;
}
