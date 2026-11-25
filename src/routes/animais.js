const express = require('express');
const db = require('../db');
const { autenticar, permitirPerfis } = require('../middleware/auth');
const router = express.Router();
router.use(autenticar);

router.get('/', async (req, res) => {
  const [rows] = await db.execute(
    `SELECT a.*, c.nome AS tutor_nome FROM animais a
     JOIN clientes c ON c.id=a.cliente_id ORDER BY a.nome`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { cliente_id, nome, especie, raca, sexo, data_nascimento, observacoes } = req.body;
  if (!cliente_id || !nome || !especie) return res.status(400).json({ erro: 'Tutor, nome e espécie são obrigatórios.' });
  try {
    const [r] = await db.execute(
      `INSERT INTO animais (cliente_id,nome,especie,raca,sexo,data_nascimento,observacoes)
       VALUES (?,?,?,?,?,?,?)`,
      [cliente_id, nome.trim(), especie, raca || null, sexo || 'Não informado', data_nascimento || null, observacoes || null]
    );
    res.status(201).json({ id: r.insertId, mensagem: 'Animal cadastrado.' });
  } catch {
    res.status(400).json({ erro: 'Não foi possível cadastrar. Confira o cliente selecionado.' });
  }
});

router.put('/:id', async (req, res) => {
  const { cliente_id, nome, especie, raca, sexo, data_nascimento, observacoes } = req.body;
  const [r] = await db.execute(
    `UPDATE animais SET cliente_id=?,nome=?,especie=?,raca=?,sexo=?,data_nascimento=?,observacoes=? WHERE id=?`,
    [cliente_id, nome, especie, raca || null, sexo || 'Não informado', data_nascimento || null, observacoes || null, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ erro: 'Animal não encontrado.' });
  res.json({ mensagem: 'Animal atualizado.' });
});

router.delete('/:id', permitirPerfis('admin'), async (req, res) => {
  try {
    const [r] = await db.execute('DELETE FROM animais WHERE id=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ erro: 'Animal não encontrado.' });
    res.json({ mensagem: 'Animal excluído.' });
  } catch {
    res.status(409).json({ erro: 'Não é possível excluir: há consultas vinculadas a este animal.' });
  }
});

module.exports = router;
