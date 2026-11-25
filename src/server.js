require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/animais', require('./routes/animais'));
app.use('/api/consultas', require('./routes/consultas'));
app.use('/api/perdidos', require('./routes/perdidos'));
app.use('/api', require('./routes/admin'));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`PetSOS disponível em http://localhost:${port}`));
