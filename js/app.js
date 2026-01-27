const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
let activeTab = 'ped';

// Carregar dados do GitHub na inicialização
let tasks = [];

async function initApp() {
  tasks = await GitHubSync.load();
  
  const ped = [
   {d:"15/jan",a:"Palestra Janeiro Branco",m:"Janeiro"},
   {d:"17/jan",a:"Aferição de Pressão Arterial",m:"Janeiro"},
   {d:"19 á 24",a:"Campeonato de Digitação",m:"Janeiro"},
   {d:"26 á 31",a:"Olimpíada de Informática",m:"Janeiro"},
   {d:"07/fev",a:"Filme +1",m:"Fevereiro"},
   {d:"13/fev",a:"Bloquinho",m:"Fevereiro"},
   {d:"10/mar",a:"Palestra Inteligência Artificial",m:"Março"},
   {d:"16/mar",a:"Palestra Inteligência Emocional",m:"Março"},
   {d:"02/abr",a:"Conscientização do Autismo",m:"Abril"},
   {d:"10/abr",a:"Caça aos Ovos",m:"Abril"},
   {d:"31/mai",a:"Campeonato de Futebol",m:"Maio"},
   {d:"22/jun",a:"São João",m:"Junho"},
   {d:"13/out",a:"Dia das Crianças",m:"Outubro"},
   {d:"09 á 13",a:"Novembro Azul",m:"Novembro"},
   {d:"24/dez",a:"Especial de Natal",m:"Dezembro"}
  ];

  const com = [
   {d:"09/jan",a:"Colagem nos postes + urnas",m:"Janeiro"},
   {d:"17/jan",a:"Captação + Aferição PA",m:"Janeiro"},
   {d:"23/fev",a:"Início captação nas escolas",m:"Fevereiro"},
   {d:"MARÇO",a:"Captação mês completo",m:"Março"},
   {d:"01 á 10",a:"Entrega lista associação autismo",m:"Abril"},
   {d:"20/abr",a:"Café da manhã mães autistas",m:"Abril"},
   {d:"31/mai",a:"Torneio de futebol",m:"Maio"},
   {d:"22/jun",a:"Festa junina",m:"Junho"},
   {d:"13 á 15",a:"Colar QR Code nos postes",m:"Julho"},
   {d:"01 á 30",a:"Captação mês completo",m:"Setembro"},
   {d:"05 á 10",a:"Recebimento de brinquedos",m:"Outubro"},
   {d:"14/nov",a:"Ação Papai Noel",m:"Novembro"},
   {d:"24/dez",a:"Papai Noel + urnas",m:"Dezembro"}
  ];

  // Se não houver tarefas salvas, usar as padrões
  if(tasks.length === 0){
    ped.forEach(t => tasks.push({...t, done:false, type:'ped'}));
    com.forEach(t => tasks.push({...t, done:false, type:'com'}));
    await save();
  }
  
  renderApp();
}

const monthsDiv = document.getElementById('months');
const monthSel = document.getElementById('month');
const filterMonth = document.getElementById('filterMonth');

months.forEach(m => {
  monthSel.innerHTML += `<option>${m}</option>`;
  filterMonth.innerHTML += `<option>${m}</option>`;
});

async function save(){
  await GitHubSync.save(tasks);
}

function switchTab(tab){
  activeTab = tab;
  document.getElementById('tabPed').classList.toggle('active', tab === 'ped');
  document.getElementById('tabCom').classList.toggle('active', tab === 'com');
  renderApp();
}

function addTask(){
  const d = date.value.trim();
  const a = action.value.trim();
  const m = month.value;

  if(!d || !a) return alert('Preencha todos os campos');

  tasks.push({d,a,m,done:false,type:activeTab});
  save();
  renderApp();

  date.value='';
  action.value='';
}

function toggle(i){
  tasks[i].done = !tasks[i].done;
  save();
  renderApp();
}

function removeTask(i){
  if(confirm('Remover tarefa?')){
    tasks.splice(i,1);
    save();
    renderApp();
  }
}

function renderApp(){
  monthsDiv.innerHTML='';

  const fm = filterMonth.value;
  const fs = filterStatus.value;

  months.forEach(m => {
    const block = document.createElement('div');
    block.className='month';
    block.innerHTML=`<h2>${m}</h2>`;

    const list = document.createElement('div');

    tasks.forEach((t,i)=>{
      if(t.type !== activeTab || t.m !== m) return;
      if(fm !== 'all' && fm !== m) return;
      if(fs === 'done' && !t.done) return;
      if(fs === 'pending' && t.done) return;

      const div = document.createElement('div');
      div.className='task'+(t.done?' done':'');
      div.innerHTML=`
        <input type="checkbox" ${t.done?'checked':''} onchange="toggle(${i})">
        <span><b>${t.d}</b> - ${t.a}</span>
        <button onclick="removeTask(${i})">X</button>
      `;
      list.appendChild(div);
    });

    if(list.children.length>0){
      block.appendChild(list);
      monthsDiv.appendChild(block);
    }
  });
}

// Inicializar app quando documento carregar
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
