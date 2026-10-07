const express = require("express"),
  pool = require("../config/database");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const r = express.Router();
r.use(autenticar);
const estados = ["Pendente", "Em preparo", "Pronto", "Entregue", "Cancelado"];
r.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,c.nome cliente_nome,f.nome funcionario_nome FROM pedidos p JOIN clientes c ON c.id=p.cliente_id JOIN funcionarios f ON f.id=p.funcionario_id ORDER BY p.retirada DESC,p.id DESC`,
    );
    const [itens] = await pool.query(
      `SELECT i.*,pr.nome produto_nome FROM itens_pedido i JOIN produtos pr ON pr.id=i.produto_id`,
    );
    res.json(
      rows.map((p) => ({
        ...p,
        itens: itens.filter((i) => i.pedido_id === p.id),
      })),
    );
  } catch (e) {
    next(e);
  }
});
function validar(b) {
  if (
    !Number.isInteger(Number(b.cliente_id)) ||
    Number(b.cliente_id) <= 0 ||
    !Number.isInteger(Number(b.funcionario_id)) ||
    Number(b.funcionario_id) <= 0
  )
    throw Error("Selecione cliente e funcionário.");
  if (!["Balcão", "Encomenda"].includes(b.tipo) || !estados.includes(b.status))
    throw Error("Tipo ou situação inválida.");
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(b.retirada) ||
    Number.isNaN(Date.parse(b.retirada))
  )
    throw Error("Informe data e hora válidas.");
  if (!Array.isArray(b.itens) || !b.itens.length || b.itens.length > 100)
    throw Error("Inclua de 1 a 100 produtos.");
  const ids = new Set();
  for (const i of b.itens) {
    i.produto_id = Number(i.produto_id);
    i.quantidade = Number(i.quantidade);
    if (
      !Number.isInteger(i.produto_id) ||
      i.produto_id <= 0 ||
      !Number.isInteger(i.quantidade) ||
      i.quantidade < 1 ||
      i.quantidade > 9999 ||
      ids.has(i.produto_id)
    )
      throw Error(
        "Produtos não podem se repetir e a quantidade deve ser inteira entre 1 e 9999.",
      );
    ids.add(i.produto_id);
  }
  if (String(b.observacoes || "").length > 1000)
    throw Error("Observações: máximo de 1000 caracteres.");
}
for (const method of ["post", "put"])
  r[method](method === "post" ? "/" : "/:id", async (req, res, next) => {
    const b = req.body;
    try {
      validar(b);
    } catch (e) {
      return res.status(400).json({ mensagem: e.message });
    }
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      let antigos = [];
      if (method === "put") {
        const [ex] = await conn.query(
          "SELECT id FROM pedidos WHERE id=? FOR UPDATE",
          [req.params.id],
        );
        if (!ex.length) {
          await conn.rollback();
          return res.status(404).json({ mensagem: "Pedido não encontrado." });
        }
        [antigos] = await conn.query(
          "SELECT * FROM itens_pedido WHERE pedido_id=?",
          [req.params.id],
        );
      }
      const itens = [];
      let centavos = 0;
      for (const i of b.itens) {
        const [rows] = await conn.query(
          "SELECT preco,ativo FROM produtos WHERE id=? FOR UPDATE",
          [i.produto_id],
        );
        const antigo = antigos.find((a) => a.produto_id === i.produto_id);
        if (!rows.length || (!rows[0].ativo && !antigo)) {
          await conn.rollback();
          return res
            .status(400)
            .json({ mensagem: "Produto inexistente ou indisponível." });
        }
        const preco = Math.round(
          Number(antigo ? antigo.preco_unitario : rows[0].preco) * 100,
        );
        centavos += preco * i.quantidade;
        itens.push({ ...i, preco_unitario: preco / 100 });
      }
      if (centavos > 999999999999) {
        await conn.rollback();
        return res
          .status(400)
          .json({ mensagem: "Total acima do limite permitido." });
      }
      const obj = {
        cliente_id: b.cliente_id,
        funcionario_id: b.funcionario_id,
        tipo: b.tipo,
        status: b.status,
        retirada: b.retirada.replace("T", " ") + ":00",
        observacoes: b.observacoes || "",
        total: centavos / 100,
      };
      let id = req.params.id;
      if (method === "post") {
        const [result] = await conn.query("INSERT INTO pedidos SET ?", obj);
        id = result.insertId;
      } else {
        await conn.query("UPDATE pedidos SET ? WHERE id=?", [obj, id]);
        await conn.query("DELETE FROM itens_pedido WHERE pedido_id=?", [id]);
      }
      for (const i of itens)
        await conn.query(
          "INSERT INTO itens_pedido (pedido_id,produto_id,quantidade,preco_unitario) VALUES (?,?,?,?)",
          [id, i.produto_id, i.quantidade, i.preco_unitario],
        );
      await conn.commit();
      res
        .status(method === "post" ? 201 : 200)
        .json({ id, total: centavos / 100, mensagem: "Pedido salvo." });
    } catch (e) {
      if (conn) await conn.rollback();
      next(e);
    } finally {
      if (conn) conn.release();
    }
  });
r.delete("/:id", apenasAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM pedidos WHERE id=?", [
      req.params.id,
    ]);
    if (!result.affectedRows)
      return res.status(404).json({ mensagem: "Pedido não encontrado." });
    res.json({ mensagem: "Pedido e seus itens excluídos." });
  } catch (e) {
    next(e);
  }
});
module.exports = r;
