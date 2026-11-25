const $ = (id) => document.getElementById(id);
let currentUser = null;
let authMode = 'login';
let cache = { clientes: [], animais: [], veterinarios: [], consultas: [] };

async function api(url, options = {}) {
  const response = await fetch('/api' + url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.erro || 'Não foi possível concluir a operação.');
  return data;
}
function toast(message) {
  const el = $('toast'); el.textContent = message; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}
function syncHomeButtons() {
  const logged = Boolean(currentUser);
  $('backToPanelBtn').classList.toggle('hidden', !logged);
  $('openLoginBtn').textContent = logged ? 'Trocar conta' : 'Entrar';
}
function showHome() {
  syncHomeButtons();
  $('homeView').classList.remove('hidden');
  $('loginView').classList.add('hidden');
  $('appView').classList.add('hidden');
}
function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === 'register';
  $('tabLogin').classList.toggle('active', !isRegister);
  $('tabRegister').classList.toggle('active', isRegister);
  $('registerFields').classList.toggle('hidden', !isRegister);
  $('registerName').required = isRegister;
  $('loginPassword').autocomplete = isRegister ? 'new-password' : 'current-password';
  $('authTitle').textContent = isRegister ? 'Crie sua conta no PetSOS' : 'Bem-vindo ao PetSOS';
  $('authSubtitle').textContent = isRegister
    ? 'Preencha seus dados para cadastrar um novo usuário.'
    : 'Entre com sua conta para acessar o sistema.';
  $('authSubmitBtn').textContent = isRegister ? 'Cadastrar' : 'Entrar';
  $('loginError').textContent = '';
}
function showLogin(mode = 'login') {
  setAuthMode(mode);
  $('homeView').classList.add('hidden');
  $('loginView').classList.remove('hidden');
  $('appView').classList.add('hidden');
}
function showApp(user) {
  currentUser = user;
  syncHomeButtons();
  $('homeView').classList.add('hidden');
  $('loginView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  $('welcomeName').textContent = user.nome.split(' ')[0];
  $('userPill').textContent = user.nome + ' · ' + (user.perfil === 'admin' ? 'Administrador' : user.perfil === 'veterinario' ? 'Veterinário' : 'Usuário');
  $('userSummary').innerHTML = '';
  const name = document.createElement('div'); name.textContent = user.nome;
  const role = document.createElement('small'); role.textContent = user.perfil === 'admin' ? 'Administrador' : user.perfil === 'veterinario' ? 'Veterinário' : 'Usuário';
  $('userSummary').append(name, role);
  document.querySelectorAll('[data-page="clientes"],[data-page="animais"],[data-page="veterinarios"]').forEach(b => b.classList.toggle('hidden', false));
  loadDashboard();
}
function go(page) {
  $('homeView').classList.add('hidden');
  $('loginView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  $('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('pageTitle').textContent = ({
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    animais: 'Animais',
    consultas: 'Consultas',
    veterinarios: 'Veterinários'
  })[page];
  if (page === 'clientes') loadClients();
  if (page === 'animais') loadAnimals();
  if (page === 'consultas') loadAppointments();
  if (page === 'veterinarios') loadVets();
}

$('openLoginBtn').addEventListener('click', () => showLogin('login'));
$('openRegisterBtn').addEventListener('click', () => showLogin('register'));
$('backToPanelBtn').addEventListener('click', () => {
  if (currentUser) go('dashboard');
  else showLogin('login');
});
$('backToHomeBtn').addEventListener('click', showHome);
$('goHomeBtn').addEventListener('click', showHome);
document.querySelectorAll('[data-home]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    showHome();
  });
});

$('tabLogin').addEventListener('click', () => setAuthMode('login'));
$('tabRegister').addEventListener('click', () => setAuthMode('register'));

document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(b.dataset.close).close()));

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginError').textContent = '';
  const email = $('loginEmail').value.trim();
  const senha = $('loginPassword').value;

  try {
    if (authMode === 'register') {
      const nome = $('registerName').value.trim();
      const user = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha })
      });
      $('loginForm').reset();
      toast('Conta criada com sucesso!');
      if (user && user.id) {
        showApp(user);
        go('dashboard');
      } else {
        setAuthMode('login');
        $('loginEmail').value = email;
      }
      return;
    }

    const user = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    $('loginForm').reset();
    showApp(user);
    go('dashboard');
  } catch (err) {
    $('loginError').textContent = err.message;
  }
});

$('logoutBtn').addEventListener('click', async () => {
  try { await api('/auth/logout', { method:'POST' }); } finally { currentUser = null; showHome(); }
});

async function loadDashboard() {
  try {
    const d = await api('/dashboard');
    $('statConsultas').textContent = d.consultasHoje;
    $('statClientes').textContent = d.clientes;
    $('statAnimais').textContent = d.animais;
    $('statAguardando').textContent = d.aguardando;
    const rows = await api('/consultas');
    cache.consultas = rows;
    $('dashboardAppointments').innerHTML = makeAppointmentsTable(rows.slice(0,5));
  } catch (e) { toast(e.message); }
}
function makeTable(headers, rows) {
  if (!rows.length) return '<div class="empty">Nenhum registro cadastrado.</div>';
  return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function loadClients() {
  try {
    cache.clientes = await api('/clientes');
    $('clientsTable').innerHTML = makeTable(['Nome','CPF','Telefone','E-mail','Endereço'], cache.clientes.map(c =>
      `<tr><td>${esc(c.nome)}</td><td>${esc(c.cpf || '—')}</td><td>${esc(c.telefone)}</td><td>${esc(c.email || '—')}</td><td>${esc(c.endereco || '—')}</td></tr>`));
  } catch(e) { toast(e.message); }
}
async function loadAnimals() {
  try {
    cache.animais = await api('/animais');
    $('animalsTable').innerHTML = makeTable(['Animal','Espécie','Raça','Tutor'], cache.animais.map(a =>
      `<tr><td>${esc(a.nome)}</td><td>${esc(a.especie)}</td><td>${esc(a.raca || '—')}</td><td>${esc(a.tutor_nome)}</td></tr>`));
  } catch(e) { toast(e.message); }
}
async function loadVets() {
  try {
    cache.veterinarios = await api('/veterinarios');
    $('vetsTable').innerHTML = makeTable(['Nome','CRMV','Especialidade'], cache.veterinarios.map(v =>
      `<tr><td>${esc(v.nome)}</td><td>${esc(v.crmv || '—')}</td><td>${esc(v.especialidade || '—')}</td></tr>`));
  } catch(e) { toast(e.message); }
}
function makeAppointmentsTable(rows) {
  return makeTable(['Data','Animal','Tutor','Veterinário','Motivo','Status'], rows.map(c => {
    const date = new Date(String(c.data_hora).replace(' ', 'T'));
    const formatted = Number.isNaN(date.getTime()) ? esc(c.data_hora) : date.toLocaleString('pt-BR');
    const status = `<span class="status ${c.status}">${esc(c.status)}</span>`;
    const action = `<select class="small-btn" aria-label="Alterar status" data-status-id="${c.id}"><option value="">Status...</option>${['Agendada','Confirmada','Concluída','Cancelada'].map(s=>`<option>${s}</option>`).join('')}</select>`;
    return `<tr><td>${formatted}</td><td>${esc(c.animal)}</td><td>${esc(c.tutor)}</td><td>${esc(c.veterinario)}</td><td>${esc(c.motivo)}</td><td>${status} ${action}</td></tr>`;
  }));
}
async function loadAppointments() {
  try {
    cache.consultas = await api('/consultas');
    $('appointmentsTable').innerHTML = makeAppointmentsTable(cache.consultas);
  } catch(e) { toast(e.message); }
}
document.addEventListener('change', async e => {
  if (!e.target.matches('[data-status-id]') || !e.target.value) return;
  try {
    await api(`/consultas/${e.target.dataset.statusId}/status`, { method:'PATCH', body:JSON.stringify({status:e.target.value}) });
    toast('Status atualizado.'); loadAppointments();
  } catch(err) { toast(err.message); }
});

$('newClientBtn').addEventListener('click', () => $('clientDialog').showModal());
$('clientForm').addEventListener('submit', async e => {
  e.preventDefault(); const data = Object.fromEntries(new FormData(e.target).entries());
  try { await api('/clientes', {method:'POST', body:JSON.stringify(data)}); e.target.reset(); $('clientDialog').close(); toast('Cliente cadastrado.'); loadClients(); }
  catch(err) { toast(err.message); }
});
$('newAnimalBtn').addEventListener('click', async () => {
  try {
    cache.clientes = await api('/clientes');
    $('animalOwner').innerHTML = '<option value="">Selecione o tutor</option>' + cache.clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');
    $('animalDialog').showModal();
  } catch(e) { toast(e.message); }
});
$('animalForm').addEventListener('submit', async e => {
  e.preventDefault(); const data = Object.fromEntries(new FormData(e.target).entries());
  try { await api('/animais', {method:'POST', body:JSON.stringify(data)}); e.target.reset(); $('animalDialog').close(); toast('Animal cadastrado.'); loadAnimals(); }
  catch(err) { toast(err.message); }
});
$('newVetBtn').addEventListener('click', () => $('vetDialog').showModal());
$('vetForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    await api('/usuarios', {
      method: 'POST',
      body: JSON.stringify({ ...data, perfil: 'veterinario' })
    });
    e.target.reset();
    $('vetDialog').close();
    toast('Veterinário cadastrado.');
    loadVets();
  } catch (err) { toast(err.message); }
});
$('newAppointmentBtn').addEventListener('click', async () => {
  try {
    const [animals, vets] = await Promise.all([api('/animais'), api('/veterinarios')]);
    cache.animais = animals; cache.veterinarios = vets;
    $('appointmentAnimal').innerHTML = '<option value="">Selecione o animal</option>' + animals.map(a=>`<option value="${a.id}">${esc(a.nome)} — ${esc(a.tutor_nome)}</option>`).join('');
    $('appointmentVet').innerHTML = '<option value="">Selecione o veterinário</option>' + vets.map(v=>`<option value="${v.id}">${esc(v.nome)}</option>`).join('');
    if (!animals.length || !vets.length) return toast('Cadastre pelo menos um animal e um veterinário antes de agendar.');
    $('appointmentDialog').showModal();
  } catch(e) { toast(e.message); }
});
$('appointmentForm').addEventListener('submit', async e => {
  e.preventDefault(); const data = Object.fromEntries(new FormData(e.target).entries());
  try { await api('/consultas', {method:'POST', body:JSON.stringify(data)}); e.target.reset(); $('appointmentDialog').close(); toast('Consulta agendada.'); loadAppointments(); loadDashboard(); }
  catch(err) { toast(err.message); }
});

(async function init() {
  try { const user = await api('/auth/me'); showApp(user); }
  catch { showHome(); }
})();