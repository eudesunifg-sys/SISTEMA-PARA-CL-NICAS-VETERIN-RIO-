require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

(async () => {
  const [nome, email, senha] = process.argv.slice(2);
  if (!nome || !email || !senha) {
    console.log('Uso: node src/create-admin.js "Nome" email senha');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.log('A senha precisa ter pelo menos 8 caracteres.');
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(senha, 12);
    await db.execute(
      "INSERT INTO usuarios (nome,email,senha_hash,perfil) VALUES (?,?,?,'admin')",
      [nome, email.toLowerCase(), hash]
    );
    console.log('Administrador criado com sucesso.');
  } catch (e) {
    console.error('Não foi possível criar o administrador:', e.code || e.message);
  } finally {
    await db.end();
  }
})();
