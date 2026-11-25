CREATE DATABASE IF NOT EXISTS petsos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE petsos;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('admin','veterinario') NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(25) NOT NULL,
  email VARCHAR(160),
  endereco VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  especie VARCHAR(50) NOT NULL,
  raca VARCHAR(80),
  sexo ENUM('M','F','Não informado') DEFAULT 'Não informado',
  data_nascimento DATE NULL,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_animais_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS veterinarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  crmv VARCHAR(40),
  especialidade VARCHAR(100),
  CONSTRAINT fk_vet_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  animal_id INT NOT NULL,
  veterinario_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  status ENUM('Agendada','Confirmada','Concluída','Cancelada') NOT NULL DEFAULT 'Agendada',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consulta_animal FOREIGN KEY (animal_id)
    REFERENCES animais(id) ON DELETE RESTRICT,
  CONSTRAINT fk_consulta_vet FOREIGN KEY (veterinario_id)
    REFERENCES veterinarios(id) ON DELETE RESTRICT,
  INDEX idx_consultas_data (data_hora),
  INDEX idx_consultas_vet (veterinario_id)
);

CREATE TABLE IF NOT EXISTS historico_atendimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consulta_id INT NOT NULL UNIQUE,
  diagnostico TEXT,
  tratamento TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historico_consulta FOREIGN KEY (consulta_id)
    REFERENCES consultas(id) ON DELETE CASCADE
);
