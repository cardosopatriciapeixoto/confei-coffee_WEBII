const express = require("express");
const pool = require("../config/database");
const { autenticar, apenasAdmin } = require("../middlewares/auth");
const configs = {
    clientes: {
        fields: {
            nome: 120,
            telefone: 20,
            email: 120,
            endereco: 200,
            cidade: 100,
        },
        required: ["nome", "telefone"],
    },
    funcionarios: {
        fields: { nome: 120, cargo: 80, telefone: 20, email: 120 },
        required: ["nome", "cargo"],
    },
    produtos: {
        fields: { nome: 120, categoria: 80, descricao: 500 },
        required: ["nome", "categoria"],
    },
};
module.exports = function (tabela) {
    const router = express.Router(),
        conf = configs[tabela];
    router.use(autenticar);

    // O pedido precisa apenas dos nomes dos responsáveis, não de seus contatos.
    if (tabela === "funcionarios") {
        router.get("/opcoes", async (req, res, next) => {
            try {
                const [rows] = await pool.query(
                    "SELECT id, nome FROM funcionarios ORDER BY nome",
                );
                res.json(rows);
            } catch (e) {
                next(e);
            }
        });
        router.use(apenasAdmin);
    }

    // Produtos são consultáveis; somente o administrador pode modificá-los.
    if (tabela === "produtos") {
        router.use((req, res, next) => {
            if (req.method === "GET" || req.method === "HEAD") return next();
            return apenasAdmin(req, res, next);
        });
    }

    router.get("/", async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT * FROM ${tabela} ORDER BY nome`,
            );
            res.json(rows);
        } catch (e) {
            next(e);
        }
    });
    function validar(body) {
        const obj = {};
        for (const [k, max] of Object.entries(conf.fields)) {
            obj[k] = String(body[k] ?? "").trim();
            if (obj[k].length > max)
                throw Error(`Campo ${k}: limite de ${max} caracteres.`);
        }
        for (const k of conf.required)
            if (!obj[k]) throw Error(`Preencha ${k}.`);
        if (obj.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email))
            throw Error("E-mail inválido.");
        if (tabela === "produtos") {
            const v = Number(body.preco);
            if (
                body.preco === "" ||
                body.preco == null ||
                !Number.isFinite(v) ||
                v <= 0 ||
                v > 99999999.99
            )
                throw Error("Informe um preço positivo válido.");
            obj.preco = Math.round(v * 100) / 100;
            obj.ativo = body.ativo === false || body.ativo === 0 ? 0 : 1;
        }
        return obj;
    }
    for (const method of ["post", "put"])
        router[method](
            method === "post" ? "/" : "/:id",
            async (req, res, next) => {
                let obj;
                try {
                    obj = validar(req.body);
                } catch (e) {
                    return res.status(400).json({ mensagem: e.message });
                }
                try {
                    if (method === "post") {
                        const [r] = await pool.query(
                            `INSERT INTO ${tabela} SET ?`,
                            obj,
                        );
                        return res.status(201).json({ id: r.insertId });
                    }
                    const [r] = await pool.query(
                        `UPDATE ${tabela} SET ? WHERE id=?`,
                        [obj, req.params.id],
                    );
                    if (!r.affectedRows)
                        return res
                            .status(404)
                            .json({ mensagem: "Registro não encontrado." });
                    res.json({ mensagem: "Registro atualizado." });
                } catch (e) {
                    next(e);
                }
            },
        );
    router.delete("/:id", apenasAdmin, async (req, res, next) => {
        try {
            const [r] = await pool.query(`DELETE FROM ${tabela} WHERE id=?`, [
                req.params.id,
            ]);
            if (!r.affectedRows)
                return res
                    .status(404)
                    .json({ mensagem: "Registro não encontrado." });
            res.json({ mensagem: "Registro excluído." });
        } catch (e) {
            next(e);
        }
    });
    return router;
};
