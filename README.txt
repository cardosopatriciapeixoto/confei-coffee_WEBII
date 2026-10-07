CONFEI & COFFEE - CAFETERIA E CONFEITARIA

1. Extraia o ZIP em uma pasta nova.
2. Ligue Apache e MySQL no XAMPP.
3. Escolha UMA importacao no phpMyAdmin:
   - Instalacao nova: database/confei_coffee.sql
4. Confira o .env. DB_NAME deve ser confei_coffee.
5. No CMD desta pasta: npm install
6. Pare o sistema antigo com Ctrl+C.
7. Execute: npm start
8. Acesse http://localhost:3000 (ou a porta definida no .env).

Login Administrador: admin@confeicoffee.com
Senha inicial: 123456. 

Login Atendente: atendimento@confeicoffee.com
Senha: 123456 

## Permissões

O Atendente pode consultar produtos e cadastrar, consultar e editar clientes e pedidos. Não pode cadastrar ou editar produtos/preços, acessar o cadastro de funcionários nem excluir registros. No formulário de pedido, pode selecionar o responsável por uma lista que contém apenas identificador e nome. O Administrador mantém acesso completo. As restrições são aplicadas na interface e no servidor.
