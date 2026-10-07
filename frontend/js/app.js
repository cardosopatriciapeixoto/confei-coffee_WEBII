// Interface: altere o visual nos arquivos HTML e css/personalizar.css.
const $ = (s) => document.querySelector(s),
    esc = (v) =>
        String(v ?? "").replace(
            /[&<>"']/g,
            (c) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                })[c],
        );
const money = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const labels = {
    dashboard: "Visão geral",
    clientes: "Clientes",
    funcionarios: "Funcionários",
    produtos: "Produtos",
    pedidos: "Pedidos",
    agenda: "Agenda de retiradas",
};
const schemas = {
    clientes: [
        ["nome", "Nome", "text", 120, true],
        ["telefone", "Telefone", "text", 20, true],
        ["email", "E-mail", "email", 120],
        ["endereco", "Endereço", "text", 200],
        ["cidade", "Cidade", "text", 100],
    ],
    funcionarios: [
        ["nome", "Nome", "text", 120, true],
        ["cargo", "Cargo", "text", 80, true],
        ["telefone", "Telefone", "text", 20],
        ["email", "E-mail", "email", 120],
    ],
    produtos: [
        ["nome", "Nome", "text", 120, true],
        ["categoria", "Categoria", "text", 80, true],
        ["preco", "Preço (R$)", "number", null, true],
        ["descricao", "Descrição", "text", 500],
        ["ativo", "Disponível para novos pedidos", "select"],
    ],
};
let data = {},
    usuario,
    section = "dashboard",
    page = 1,
    editing = null,
    editingType = "",
    draft = [];
const states = ["Pendente", "Em preparo", "Pronto", "Entregue", "Cancelado"];
const localDate = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};
const dateText = (v) =>
    v
        ? new Date(String(v).replace(" ", "T")).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
          })
        : "";
function notify(s) {
    $("#notice").textContent = s;
}
function isAdmin() {
    return usuario?.perfil === "Administrador";
}
function podeEditar(tipo) {
    return isAdmin() || ["clientes", "pedidos"].includes(tipo);
}
function renderMenu() {
    $("#navigation").innerHTML = Object.entries(labels)
        .filter(([key]) => isAdmin() || key !== "funcionarios")
        .map(
            ([key, label]) => `<button data-section="${key}">${label}</button>`,
        )
        .join("");
}
async function reload() {
    const values = await Promise.all(
        ["clientes", "funcionarios", "produtos", "pedidos"].map((t) =>
            request(
                t === "funcionarios" && !isAdmin()
                    ? "/funcionarios/opcoes"
                    : "/" + t,
            ),
        ),
    );
    ["clientes", "funcionarios", "produtos", "pedidos"].forEach(
        (t, i) => (data[t] = values[i]),
    );
    render();
}
function selectOptions(rows, value) {
    return (
        '<option value="">Selecione</option>' +
        rows
            .map(
                (r) =>
                    `<option value="${r.id}" ${Number(value) === r.id ? "selected" : ""}>${esc(r.nome)}</option>`,
            )
            .join("")
    );
}
function render() {
    if (section === "funcionarios" && !isAdmin()) section = "dashboard";
    $("#new").hidden = !podeEditar(
        ["dashboard", "agenda"].includes(section) ? "pedidos" : section,
    );
    $("#title").textContent = labels[section];
    $("#new").textContent =
        section === "dashboard" || section === "pedidos" || section === "agenda"
            ? "+ Novo pedido"
            : "+ Novo cadastro";
    document
        .querySelectorAll("[data-section]")
        .forEach((b) =>
            b.classList.toggle("active", b.dataset.section === section),
        );
    $("#overview").hidden = section !== "dashboard";
    $("#listing").hidden = section === "dashboard";
    const order = ["pedidos", "agenda"].includes(section);
    $("#status-filter").hidden = !order;
    $("#date-label").hidden = !order;
    if (section === "dashboard") {
        const today = localDate().slice(0, 10),
            pending = data.pedidos.filter(
                (p) => !["Entregue", "Cancelado"].includes(p.status),
            );
        $("#overview").innerHTML =
            `<div class="welcome-banner"><div><span class="eyebrow">SABOR QUE ACOLHE, EXPERIÊNCIA QUE FICA!</span><h2>Um dia mais doce começa aqui.</h2><p>Seus clientes, cafés e encomendas, com todo o cuidado.</p></div><img src="assets/marca.svg" alt="" class="welcome-art"></div><div class="cafe-cards">${[
                ["Clientes", data.clientes.length],
                [
                    "Produtos disponíveis",
                    data.produtos.filter((p) => p.ativo).length,
                ],
                ["Pedidos em andamento", pending.length],
                [
                    "Valor dos pedidos entregues",
                    money(
                        data.pedidos
                            .filter((p) => p.status === "Entregue")
                            .reduce((s, p) => s + Number(p.total), 0),
                    ),
                ],
            ]
                .map(
                    ([l, v]) =>
                        `<div class="cafe-card">${l}<strong>${v}</strong></div>`,
                )
                .join(
                    "",
                )}</div><h2>Retiradas de hoje</h2><div class="cafe-table">${orderTable(data.pedidos.filter((p) => p.retirada.slice(0, 10) === today && p.status !== "Cancelado"))}</div>`;
        return;
    }
    let rows = [...(order ? data.pedidos : data[section])];
    const term = $("#search").value.toLocaleLowerCase();
    rows = rows.filter((r) =>
        Object.entries(r)
            .filter(([k]) => k !== "itens")
            .some(([, v]) =>
                String(v ?? "")
                    .toLocaleLowerCase()
                    .includes(term),
            ),
    );
    if (order) {
        if ($("#status-filter").value)
            rows = rows.filter((r) => r.status === $("#status-filter").value);
        if ($("#date-filter").value)
            rows = rows.filter(
                (r) => r.retirada.slice(0, 10) === $("#date-filter").value,
            );
        if (section === "agenda")
            rows.sort((a, b) => a.retirada.localeCompare(b.retirada));
    }
    const pages = Math.max(1, Math.ceil(rows.length / 8));
    page = Math.min(page, pages);
    const shown = rows.slice((page - 1) * 8, page * 8);
    if (order) $("#table").innerHTML = orderTable(shown);
    else {
        const cols = {
            clientes: ["nome", "telefone", "email", "cidade"],
            funcionarios: ["nome", "cargo", "telefone", "email"],
            produtos: ["nome", "categoria", "preco", "ativo"],
        }[section];
        $("#table").innerHTML =
            `<table><thead><tr>${cols.map((c) => `<th>${esc(schemas[section].find((f) => f[0] === c)[1])}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${shown.map((r) => `<tr>${cols.map((c) => `<td>${c === "preco" ? money(r[c]) : c === "ativo" ? (r[c] ? "Sim" : "Não") : esc(r[c])}</td>`).join("")}<td>${actions(r.id, section)}</td></tr>`).join("") || '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>'}</tbody></table>`;
    }
    $("#page-info").textContent =
        `Página ${page} de ${pages} • ${rows.length} registros`;
    $("#prev").disabled = page <= 1;
    $("#next").disabled = page >= pages;
}
function actions(id, type) {
    if (!podeEditar(type)) return "<span>Somente consulta</span>";
    return `<button class="btn" data-edit="${id}" data-type="${type}">Editar</button>${usuario.perfil === "Administrador" ? `<button class="btn" data-delete="${id}" data-type="${type}">Excluir</button>` : ""}`;
}
function orderTable(rows) {
    return `<table><thead><tr><th>Pedido / cliente</th><th>Retirada</th><th>Tipo / situação</th><th>Produtos</th><th>Total</th><th>Ações</th></tr></thead><tbody>${rows.map((r) => `<tr><td><strong>#${r.id} · ${esc(r.cliente_nome)}</strong><br><small>Atendimento: ${esc(r.funcionario_nome)}</small>${r.observacoes ? `<br><small>${esc(r.observacoes)}</small>` : ""}</td><td>${dateText(r.retirada)}</td><td>${esc(r.tipo)}<br><span class="badge">${esc(r.status)}</span></td><td>${r.itens.map((i) => `${i.quantidade} × ${esc(i.produto_nome)} (${money(i.preco_unitario)})`).join("<br>")}</td><td>${money(r.total)}</td><td>${actions(r.id, "pedidos")}</td></tr>`).join("") || '<tr><td colspan="6">Nenhum pedido encontrado.</td></tr>'}</tbody></table>`;
}
function openEditor(type, id) {
    if (!podeEditar(type)) {
        notify("Somente o administrador pode alterar este cadastro.");
        return;
    }
    editingType = type;
    editing = id ? data[type].find((r) => r.id === Number(id)) : null;
    $("#form-error").textContent = "";
    $("#editor-title").textContent =
        (editing ? "Editar" : "Novo registro") + " • " + labels[type];
    $("#order-items").hidden = type !== "pedidos";
    if (type === "pedidos") {
        if (
            !data.clientes.length ||
            !data.funcionarios.length ||
            !data.produtos.length
        ) {
            notify(
                "Cadastre pelo menos um cliente, funcionário e produto antes de criar pedidos.",
            );
            return;
        }
        const r = editing || {};
        $("#fields").innerHTML =
            `<label>Cliente<select name="cliente_id" required>${selectOptions(data.clientes, r.cliente_id)}</select></label><label>Funcionário<select name="funcionario_id" required>${selectOptions(data.funcionarios, r.funcionario_id)}</select></label><label>Tipo<select name="tipo">${["Balcão", "Encomenda"].map((v) => `<option ${r.tipo === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Situação<select name="status">${states.map((v) => `<option ${r.status === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Data e hora de retirada<input type="datetime-local" name="retirada" value="${esc(r.retirada ? r.retirada.replace(" ", "T").slice(0, 16) : localDate())}" required></label><label>Observações<textarea name="observacoes" maxlength="1000">${esc(r.observacoes)}</textarea></label>`;
        draft = r.itens
            ? r.itens.map((i) => ({
                  produto_id: i.produto_id,
                  quantidade: i.quantidade,
                  preco_unitario: Number(i.preco_unitario),
              }))
            : [{ produto_id: "", quantidade: 1 }];
        renderItems();
    } else {
        $("#fields").innerHTML = schemas[type]
            .map(
                ([k, l, t, max, req]) =>
                    `<label>${l}${t === "select" ? `<select name="${k}"><option value="1" ${editing?.ativo !== 0 ? "selected" : ""}>Sim</option><option value="0" ${editing?.ativo === 0 ? "selected" : ""}>Não</option></select>` : `<input name="${k}" type="${t}" value="${esc(editing?.[k] ?? "")}" ${max ? `maxlength="${max}"` : ""} ${req ? "required" : ""} ${t === "number" ? 'step="0.01" min="0.01" max="99999999.99"' : ""}>`}</label>`,
            )
            .join("");
    }
    $("#editor").showModal();
}
function itemPrice(i) {
    return (
        i.preco_unitario ??
        Number(
            data.produtos.find((p) => p.id === Number(i.produto_id))?.preco ||
                0,
        )
    );
}
function totals() {
    draft.forEach((i, index) => {
        const span = document.querySelector(`[data-subtotal="${index}"]`);
        if (span)
            span.textContent = money(
                (Math.round(itemPrice(i) * 100) * Number(i.quantidade)) / 100,
            );
    });
    $("#order-total").textContent =
        "Total: " +
        money(
            draft.reduce(
                (s, i) =>
                    s +
                    Math.round(itemPrice(i) * 100) * Number(i.quantidade || 0),
                0,
            ) / 100,
        );
}
function renderItems() {
    $("#items").innerHTML = draft
        .map(
            (i, index) =>
                `<div class="item-row"><label>Produto<select data-product="${index}" required>${selectOptions(
                    data.produtos.filter(
                        (p) => p.ativo || p.id === Number(i.produto_id),
                    ),
                    i.produto_id,
                )}</select></label><label>Quantidade<input data-qty="${index}" type="number" min="1" max="9999" step="1" value="${i.quantidade}" required></label><span data-subtotal="${index}"></span><button type="button" class="btn" data-remove="${index}">Remover</button></div>`,
        )
        .join("");
    totals();
}
$("#edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const b = Object.fromEntries(new FormData(e.target));
    if (editingType === "produtos") b.ativo = b.ativo === "1";
    if (editingType === "pedidos")
        b.itens = draft.map((i) => ({
            produto_id: Number(i.produto_id),
            quantidade: Number(i.quantidade),
        }));
    $("#save").disabled = true;
    $("#form-error").textContent = "";
    try {
        await request("/" + editingType + (editing ? "/" + editing.id : ""), {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(b),
        });
        $("#editor").close();
        notify("Registro salvo com sucesso.");
        await reload();
    } catch (e) {
        if ($("#editor").open) $("#form-error").textContent = e.message;
        else
            notify(
                "Salvo, mas não foi possível atualizar a lista: " + e.message,
            );
    } finally {
        $("#save").disabled = false;
    }
});
$("#items").addEventListener("change", (e) => {
    if (e.target.dataset.product !== undefined) {
        const i = draft[Number(e.target.dataset.product)];
        i.produto_id = Number(e.target.value);
        const old = editing?.itens.find((x) => x.produto_id === i.produto_id);
        i.preco_unitario = old ? Number(old.preco_unitario) : undefined;
        totals();
    }
});
$("#items").addEventListener("input", (e) => {
    if (e.target.dataset.qty !== undefined) {
        draft[Number(e.target.dataset.qty)].quantidade = Number(e.target.value);
        totals();
    }
});
$("#items").addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (b) {
        draft.splice(Number(b.dataset.remove), 1);
        renderItems();
    }
});
$("#add-item").onclick = () => {
    draft.push({ produto_id: "", quantidade: 1 });
    renderItems();
};
$("#close").onclick = () => $("#editor").close();
$("#new").onclick = () =>
    openEditor(["dashboard", "agenda"].includes(section) ? "pedidos" : section);
$("#navigation").onclick = (e) => {
    const b = e.target.closest("[data-section]");
    if (!b || (b.dataset.section === "funcionarios" && !isAdmin())) return;
    section = b.dataset.section;
    page = 1;
    $("#search").value = "";
    $("#date-filter").value = "";
    $("#status-filter").value = "";
    notify("");
    render();
};
for (const id of ["search", "status-filter", "date-filter"])
    $("#" + id).addEventListener("input", () => {
        page = 1;
        render();
    });
$("#prev").onclick = () => {
    page--;
    render();
};
$("#next").onclick = () => {
    page++;
    render();
};
document.addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit]"),
        del = e.target.closest("[data-delete]");
    if (edit) openEditor(edit.dataset.type, edit.dataset.edit);
    if (
        del &&
        confirm(
            "Excluir este registro? A exclusão de um pedido também remove seus itens.",
        )
    ) {
        del.disabled = true;
        try {
            await request("/" + del.dataset.type + "/" + del.dataset.delete, {
                method: "DELETE",
            });
            await reload();
            notify("Registro excluído.");
        } catch (e) {
            notify(e.message);
            del.disabled = false;
        }
    }
});
$("#logout").onclick = () => {
    localStorage.removeItem("confei_coffee_token");
    localStorage.removeItem("confei_coffee_usuario");
    location.href = "/";
};
document.documentElement.dataset.theme =
    localStorage.getItem("confei_coffee_theme") || "light";
$("#theme").onclick = () => {
    const theme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("confei_coffee_theme", theme);
};
(async () => {
    if (!getToken()) {
        location.href = "/";
        return;
    }
    try {
        usuario = await request("/auth/me");
        renderMenu();
        $("#user").textContent = usuario.nome + " • " + usuario.perfil;
        await reload();
    } catch (e) {
        notify(e.message);
    }
})();
