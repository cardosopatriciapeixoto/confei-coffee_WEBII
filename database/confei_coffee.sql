CREATE DATABASE IF NOT EXISTS confei_coffee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE confei_coffee;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  perfil ENUM('Administrador', 'Atendente') NOT NULL DEFAULT 'Atendente',
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  endereco VARCHAR(200),
  cidade VARCHAR(100)
);

CREATE TABLE funcionarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cargo VARCHAR(80) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(120)
);

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  descricao VARCHAR(500),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  funcionario_id INT NOT NULL,
  tipo ENUM('Balcão', 'Encomenda') NOT NULL,
  status ENUM(
    'Pendente',
    'Em preparo',
    'Pronto',
    'Entregue',
    'Cancelado'
  ) NOT NULL DEFAULT 'Pendente',
  retirada DATETIME NOT NULL,
  observacoes VARCHAR(1000),
  total DECIMAL(12, 2) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios (id)
);

CREATE TABLE itens_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos (id),
  UNIQUE (pedido_id, produto_id)
);

INSERT INTO
  clientes (nome, telefone, email, cidade)
VALUES
  (
    'Cliente balcão',
    'Não informado',
    NULL,
    'Montes Claros'
  ),
  (
    'Mariana Souza',
    '(38) 99999-1111',
    'mariana@example.com',
    'Montes Claros'
  );

INSERT INTO
  funcionarios (nome, cargo, telefone)
VALUES
  ('Ana Silva', 'Atendente', '(38) 98888-1111'),
  ('Carlos Souza', 'Confeiteiro', '(38) 98888-2222');

INSERT INTO
  produtos (nome, categoria, preco, descricao)
VALUES
  (
    'Café expresso',
    'Cafés',
    6.00,
    'Xícara individual'
  ),
  ('Cappuccino', 'Cafés', 12.00, 'Xícara de 200 ml'),
  (
    'Bolo de chocolate',
    'Bolos',
    65.00,
    'Bolo inteiro de 1 kg'
  ),
  ('Brigadeiro', 'Doces', 3.50, 'Unidade'),
  ('Pão de queijo', 'Salgados', 5.00, 'Unidade');

INSERT INTO
  pedidos (
    cliente_id,
    funcionario_id,
    tipo,
    status,
    retirada,
    total,
    observacoes
  )
VALUES
  (
    2,
    1,
    'Encomenda',
    'Pendente',
    TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00'),
    72.00,
    'Pedido de demonstração'
  );

INSERT INTO
  itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
VALUES
  (1, 3, 1, 65.00),
  (1, 4, 2, 3.50);
