# Confei & Coffee

Sistema web de gestão para uma cafeteria e confeitaria, adaptado como trabalho acadêmico a partir do projeto PetCare Modern.

## Recursos incluídos

- Interface responsiva com painel de resumo.
- Identidade visual em tons suaves de rosa.
- Modo claro e escuro.
- CRUD de clientes, funcionários, produtos e pedidos.
- Produtos com categoria, preço e disponibilidade.
- Pedidos de balcão e encomendas com vários produtos.
- Cálculo automático de subtotais e total do pedido.
- Agenda de retiradas com filtros de data e situação.
- Pesquisa, filtros e paginação.
- Login com JWT e senhas protegidas com hash bcrypt.
- Perfis Administrador e Atendente.
- Exclusão restrita ao Administrador.
- Bloqueio da exclusão de cadastros vinculados a pedidos.

## Tecnologias

HTML, CSS, JavaScript, Node.js, Express, MySQL, JWT e bcryptjs.

## Instalação com XAMPP

### 1. Ligue os serviços

Com Node.js e XAMPP instalados, inicie **Apache** e **MySQL** no XAMPP.

O Apache permite acessar o phpMyAdmin. O sistema é servido pelo Node.js.

### 2. Importe o banco

Acesse http://localhost/phpmyadmin, clique em **Importar** e selecione:

```text
database/confei_coffee.sql
```

O script cria o banco `confei_coffee` e inclui dados de demonstração. Importe uma única vez em uma instalação nova; se o banco já está funcionando, não importe novamente.

### 3. Configure o .env

Na mesma pasta do `package.json`, crie o arquivo `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=confei_coffee
JWT_SECRET=substitua_por_uma_chave_secreta_propria
```

Ajuste os dados conforme seu MySQL. Se o `.env` já estiver configurado e funcionando, mantenha-o. Não publique esse arquivo no GitHub.

### 4. Instale e execute

No terminal, na pasta que contém `package.json`, execute:

```bash
npm install
npm start
```

Acesse http://localhost:3000.

Mantenha o MySQL ligado e o terminal aberto. Nas próximas utilizações, basta executar `npm start`. Se a porta 3000 estiver ocupada, pare o servidor anterior com `Ctrl + C` ou altere `PORT` no `.env` e acesse a nova porta.

## Acessos de demonstração

Os usuários são criados automaticamente na inicialização quando a tabela `usuarios` está vazia.

| Perfil | E-mail | Senha inicial |
| --- | --- | --- |
| Administrador | admin@confeicoffee.com | 123456 |
| Atendente | atendimento@confeicoffee.com | 123456 |

O Atendente pode cadastrar, consultar e editar, mas não pode excluir registros.

## Observações

- O sistema controla cadastros, pedidos e encomendas; não inclui estoque de ingredientes, pagamentos ou emissão fiscal.
- O preço registrado nos itens de pedidos anteriores é preservado quando o preço do produto muda.
- A situação do pedido é alterada manualmente.
- Não envie `.env` nem `node_modules` ao GitHub. Mantenha `package.json` e `package-lock.json`.

## Teste de responsividade

No Chrome, pressione `F12`, ative o ícone de celular/tablet e confira as telas em diferentes tamanhos.
