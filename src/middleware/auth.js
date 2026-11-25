const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const token = req.cookies.petsos_token;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie('petsos_token');
    return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
  }
}

function permitirPerfis(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { autenticar, permitirPerfis };
