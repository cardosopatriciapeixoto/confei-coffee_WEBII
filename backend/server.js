const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const prepararUsuarios = require("./utils/bootstrap");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", require("./routes/auth"));
for (const tabela of ["clientes", "funcionarios", "produtos"])
  app.use("/api/" + tabela, require("./routes/cadastros")(tabela));
app.use("/api/pedidos", require("./routes/pedidos"));
app.use("/api", (_req, res) =>
  res.status(404).json({ mensagem: "Rota não encontrada." }),
);
app.use((erro, req, res, next) => {
  console.error(erro.message);
  const vinculo = erro.code === "ER_ROW_IS_REFERENCED_2";
  const referencia = erro.code === "ER_NO_REFERENCED_ROW_2";
  res
    .status(vinculo ? 409 : referencia ? 400 : 500)
    .json({
      mensagem: vinculo
        ? "Este registro está vinculado a pedidos. Preserve o histórico; para produtos, marque como indisponível."
        : referencia
          ? "Cliente, funcionário ou produto não encontrado. Atualize a página."
          : "Não foi possível concluir. Confira os dados e a conexão com o banco.",
    });
});

const frontend = path.join(__dirname, "..", "frontend");
app.use(express.static(frontend));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontend, "index.html"));
});

const porta = Number(process.env.PORT || 3000);

async function iniciar() {
  try {
    await pool.query("SELECT 1");
    console.log("[OK] Banco de dados conectado.");
    await prepararUsuarios();

    const servidor = app.listen(porta, () => {
      console.log(`[OK] Confei & Coffee: http://localhost:${porta}`);
    });
    servidor.on("error", async (erro) => {
      if (erro.code === "EADDRINUSE") {
        console.error(
          `[ERRO] A porta ${porta} está em uso. Pare o servidor antigo com Ctrl+C ou altere PORT no .env e execute npm start novamente.`,
        );
      } else console.error("[ERRO]", erro.message);
      await pool.end();
      process.exitCode = 1;
    });
  } catch (erro) {
    console.error("[ERRO] Não foi possível iniciar o sistema:");
    console.error(erro.message);
    console.error("Confira o MySQL, o banco e o arquivo .env.");
  }
}

iniciar();
