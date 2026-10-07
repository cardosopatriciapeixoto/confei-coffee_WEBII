const API = "/api";

function getToken() {
  return localStorage.getItem("confei_coffee_token");
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const resposta = await fetch(`${API}${url}`, { ...options, headers });
  const dados = await resposta.json().catch(() => ({}));

  if (resposta.status === 401 && url !== "/auth/login") {
    localStorage.removeItem("confei_coffee_token");
    localStorage.removeItem("confei_coffee_usuario");
    window.location.href = "/";
    throw new Error(dados.mensagem || "Sessão expirada.");
  }

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Erro na solicitação.");
  }

  return dados;
}
