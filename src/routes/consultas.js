const express = require('express');
const db = require('../db');
const { autenticar } = require('../middleware/auth');
const router = express.Router();
router.use(autenticar);

router.get('/', async (req, res) => {
  const [rows] = await db.execute(
    `SELECT co.id, co.data_hora, co.motivo, co.status, a.nome AS animal,
            c.nome AS tutor, u.nome AS veterinario
     FROM consultas co
     JOIN animais a ON a.id=co.animal_id
     JOIN clientes c ON c.id=a.cliente_id
     JOIN veterinarios v ON v.id=co.veterinario_id
     JOIN usuarios u ON u.id=v.usuario_id
     ORDER BY co.data_hora DESC`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { animal_id, veterinario_id, data_hora, motivo } = req.body;
  if (!animal_id || !veterinario_id || !data_hora || !motivo) {
    return res.status(400).json({ erro: 'Preencha animal, veterinário, data, horário e motivo.' });
  }
  try {
    const [conflict] = await db.execute(
      `SELECT id FROM consultas WHERE veterinario_id=? AND data_hora=?
       AND status <> 'Cancelada'`,
      [veterinario_id, data_hora.replace('T', ' ')]
    );
    if (conflict.length) return res.status(409).json({ erro: 'Este veterinário já possui consulta nesse horário.' });

    const [r] = await db.execute(
      'INSERT INTO consultas (animal_id,veterinario_id,data_hora,motivo) VALUES (?,?,?,?)',
      [animal_id, veterinario_id, data_hora.replace('T', ' '), motivo.trim()]
    );
    res.status(201).json({ id: r.insertId, mensagem: 'Consulta agendada.' });
  } catch {
    res.status(400).json({ erro: 'Não foi possível agendar. Confira os dados.' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const permitidos = ['Agendada', 'Confirmada', 'Concluída', 'Cancelada'];
  if (!permitidos.includes(req.body.status)) return res.status(400).json({ erro: 'Status inválido.' });
  const [r] = await db.execute('UPDATE consultas SET status=? WHERE id=?', [req.body.status, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'Consulta não encontrada.' });
  res.json({ mensagem: 'Status atualizado.' });
});

module.exports = router;
