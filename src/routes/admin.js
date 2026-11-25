const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { autenticar, permitirPerfis } = require('../middleware/auth');
const router = express.Router();

router.post('/usuarios', autenticar, permitirPerfis('admin'), async (req, res) => {
  const { nome, email, senha, perfil, crmv, especialidade } = req.body;
  if (!nome || !email || !senha || !['admin', 'veterinario'].includes(perfil)) {
    return res.status(400).json({ erro: 'Informe nome, e-mail, senha e perfil válido.' });
  }
  if (senha.length < 8) return res.status(400).json({ erro: 'A senha deve ter pelo menos 8 caracteres.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(senha, 12);
    const [r] = await conn.execute(
      'INSERT INTO usuarios (nome,email,senha_hash,perfil) VALUES (?,?,?,?)',
      [nome.trim(), email.trim().toLowerCase(), hash, perfil]
    );
    if (perfil === 'veterinario') {
      await conn.execute(
        'INSERT INTO veterinarios (usuario_id,crmv,especialidade) VALUES (?,?,?)',
        [r.insertId, crmv || null, especialidade || null]
      );
    }
    await conn.commit();
    res.status(201).json({ id: r.insertId, mensagem: 'Usuário criado.' });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    res.status(500).json({ erro: 'Não foi possível criar o usuário.' });
  } finally {
    conn.release();
  }
});

router.get('/veterinarios', autenticar, async (req, res) => {
  const [rows] = await db.execute(
    `SELECT v.id, u.nome, v.crmv, v.especialidade
     FROM veterinarios v JOIN usuarios u ON u.id=v.usuario_id
     WHERE u.ativo=TRUE ORDER BY u.nome`
  );
  res.json(rows);
});

router.get('/dashboard', autenticar, async (req, res) => {
  const [[clientes]] = await db.execute('SELECT COUNT(*) AS total FROM clientes');
  const [[animais]] = await db.execute('SELECT COUNT(*) AS total FROM animais');
  const [[hoje]] = await db.execute(
    "SELECT COUNT(*) AS total FROM consultas WHERE DATE(data_hora)=CURDATE() AND status <> 'Cancelada'"
  );
  const [[aguardando]] = await db.execute(
    "SELECT COUNT(*) AS total FROM consultas WHERE DATE(data_hora)=CURDATE() AND status IN ('Agendada','Confirmada')"
  );
  res.json({ clientes: clientes.total, animais: animais.total, consultasHoje: hoje.total, aguardando: aguardando.total });
});

module.exports = router;
