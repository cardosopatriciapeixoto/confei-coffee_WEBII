if (getToken()) window.location.href = "/dashboard.html";
const form = document.querySelector("#login-form"),
  mensagem = document.querySelector("#login-message"),
  senha = document.querySelector("#senha");
document.querySelector("#mostrar-senha").addEventListener("change", (e) => {
  senha.type = e.target.checked ? "text" : "password";
});
document.querySelector("#limpar-login").addEventListener("click", () => {
  form.reset();
  senha.type = "password";
  mensagem.textContent = "";
  form.email.focus();
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensagem.textContent = "";
  const button = form.querySelector("[type=submit]");
  button.disabled = true;
  try {
    const dados = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.email.value.trim(),
        senha: form.senha.value,
      }),
    });
    localStorage.setItem("confei_coffee_token", dados.token);
    localStorage.setItem(
      "confei_coffee_usuario",
      JSON.stringify(dados.usuario),
    );
    location.href = "/dashboard.html";
  } catch (error) {
    mensagem.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
