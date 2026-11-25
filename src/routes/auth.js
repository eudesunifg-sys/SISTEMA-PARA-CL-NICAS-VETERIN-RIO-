const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

    const [rows] = await db.execute(
      'SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = ? AND ativo = TRUE',
      [email.trim().toLowerCase()]
    );
    if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash))) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const usuario = rows[0];
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('petsos_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });
    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao realizar login.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('petsos_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ mensagem: 'Logout realizado.' });
});

router.get('/me', autenticar, (req, res) => res.json(req.usuario));

module.exports = router;
