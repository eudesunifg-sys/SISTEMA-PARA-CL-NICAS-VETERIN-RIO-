const express = require('express');
const db = require('../db');
const { autenticar, permitirPerfis } = require('../middleware/auth');
const router = express.Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM clientes ORDER BY nome');
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { nome, cpf, telefone, email, endereco } = req.body;
    if (!nome || !telefone) return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
    const [r] = await db.execute(
      'INSERT INTO clientes (nome, cpf, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)',
      [nome.trim(), cpf || null, telefone.trim(), email || null, endereco || null]
    );
    res.status(201).json({ id: r.insertId, mensagem: 'Cliente cadastrado.' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Este CPF já está cadastrado.' });
    res.status(500).json({ erro: 'Não foi possível cadastrar o cliente.' });
  }
});

router.put('/:id', async (req, res) => {
  const { nome, cpf, telefone, email, endereco } = req.body;
  const [r] = await db.execute(
    'UPDATE clientes SET nome=?, cpf=?, telefone=?, email=?, endereco=? WHERE id=?',
    [nome, cpf || null, telefone, email || null, endereco || null, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json({ mensagem: 'Cliente atualizado.' });
});

router.delete('/:id', permitirPerfis('admin'), async (req, res) => {
  try {
    const [r] = await db.execute('DELETE FROM clientes WHERE id=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ erro: 'Cliente não encontrado.' });
    res.json({ mensagem: 'Cliente excluído.' });
  } catch {
    res.status(409).json({ erro: 'Não é possível excluir: há animais vinculados a este cliente.' });
  }
});

module.exports = router;
