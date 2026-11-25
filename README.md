# PetSOS — sistema acadêmico de clínica veterinária

Projeto inicial com HTML, CSS, JavaScript, Node.js, Express e MySQL.

## Requisitos
- Node.js 18 ou superior
- MySQL 8 ou compatível
- VS Code (opcional)

## 1. Criar o banco
1. Abra o MySQL Workbench.
2. Abra e execute `sql/schema.sql`.
3. Isso cria o banco `petsos` e as tabelas.

## 2. Configurar o servidor
No terminal, dentro da pasta do projeto:

```bash
npm install
```

Copie `.env.example` para `.env` e preencha usuário e senha do seu MySQL. Troque também `JWT_SECRET` por uma chave longa e aleatória.

## 3. Criar o primeiro administrador
Com o MySQL ligado e o `.env` configurado:

```bash
node src/create-admin.js "Administrador PetSOS" admin@petsos.com "SenhaForte123"
```

Guarde a senha localmente. Não use credenciais reais de outras contas.

## 4. Iniciar
```bash
npm run dev
```

Acesse: http://localhost:3000

Entre com o e-mail e a senha usados no passo anterior.

## Perfis
- `admin`: pode cadastrar usuários, criar veterinários e excluir clientes/animais.
- `veterinario`: pode consultar dados, cadastrar/editar clientes e animais, agendar consultas e atualizar status.

## Criar um usuário veterinário
Depois de entrar como administrador, use um cliente REST (por exemplo, Thunder Client no VS Code) para enviar:

`POST http://localhost:3000/api/usuarios`

Header: `Content-Type: application/json`

Body:
```json
{
  "nome": "Dra. Ana Silva",
  "email": "ana@petsos.com",
  "senha": "SenhaForte123",
  "perfil": "veterinario",
  "crmv": "CRMV-PE 0000",
  "especialidade": "Clínica geral"
}
```

O navegador precisa ter a sessão de administrador ativa. Se usar outro cliente REST, configure o envio e armazenamento de cookies.

## Endpoints principais
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET, POST /api/clientes`
- `PUT, DELETE /api/clientes/:id`
- `GET, POST /api/animais`
- `PUT, DELETE /api/animais/:id`
- `GET, POST /api/consultas`
- `PATCH /api/consultas/:id/status`
- `POST /api/usuarios` (somente administrador)
- `GET /api/veterinarios`
- `GET /api/dashboard`

## Observações
Este é um ponto de partida acadêmico, não um sistema pronto para uso com dados reais de pacientes. Antes de uso em produção, é necessário revisar segurança, autorização por registro, auditoria, backups, validação dos dados, proteção contra CSRF e requisitos da LGPD. O módulo de animais perdidos do HTML original deve ser integrado em uma etapa posterior.
