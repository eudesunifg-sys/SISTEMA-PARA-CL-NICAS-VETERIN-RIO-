const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar anúncios (com filtros opcionais)
router.get('/', async (req, res) => {
  try {
    const { busca, especie, situacao } = req.query;
    let sql = 'SELECT * FROM animais_perdidos WHERE resolvido = FALSE';
    const params = [];

    if (especie) {
      sql += ' AND especie = ?';
      params.push(especie);
    }

    if (situacao) {
      sql += ' AND situacao = ?';
      params.push(situacao);
    }

    if (busca) {
      sql += ' AND (nome LIKE ? OR cor_caracteristicas LIKE ? OR localizacao LIKE ?)';
      const termo = `%${busca}%`;
      params.push(termo, termo, termo);
    }

    sql += ' ORDER BY criado_em DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar animais perdidos' });
  }
});

// Cadastrar novo animal perdido ou encontrado
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      especie,
      cor_caracteristicas,
      situacao,
      localizacao,
      descricao,
      contato
    } = req.body;

    if (!nome || !especie || !cor_caracteristicas || !localizacao || !contato) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO animais_perdidos
        (nome, especie, cor_caracteristicas, situacao, localizacao, descricao, contato)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        especie.trim(),
        cor_caracteristicas.trim(),
        situacao === 'Encontrado' ? 'Encontrado' : 'Perdido',
        localizacao.trim(),
        descricao ? descricao.trim() : null,
        contato.trim()
      ]
    );

    res.status(201).json({
      id: result.insertId,
      mensagem: 'Anúncio publicado com sucesso!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao publicar anúncio' });
  }
});

module.exports = router;