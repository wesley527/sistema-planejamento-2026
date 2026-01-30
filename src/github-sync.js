// API-only sync helper (uses REST backend /api/tasks)

let _onChange = null;

function _useMongo(){
  try{ const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null; const backend = q && q.get('backend'); return Boolean(window.API_BASE) || backend === 'mongo'; }catch(e){ return Boolean(window.API_BASE); }
}

function _getApiBase(){ return window.API_BASE || ''; }

function _getAnonUid(){
  let id = typeof window !== 'undefined' ? localStorage.getItem('mongo_anon_uid') : null;
  if(!id && typeof window !== 'undefined'){ id = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2,10); localStorage.setItem('mongo_anon_uid', id); }
  return id;
}

async function _apiLoad(){
  const base = _getApiBase();
  let url = base + '/api/tasks';
  if(typeof window !== 'undefined'){
    const q = new URLSearchParams(window.location.search);
    const project = q.get('project');
    if(project) url += `?project=${encodeURIComponent(project)}`;
    else url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  } else {
    url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  }

  try{
    const res = await fetch(url, {headers:{'Accept':'application/json'}});
    if(res.ok) return await res.json();
  }catch(e){ console.warn('API load error', e); }
  return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
}

async function _apiSave(tasks){
  const base = _getApiBase();
  let url = base + '/api/tasks';
  if(typeof window !== 'undefined'){
    const q = new URLSearchParams(window.location.search);
    const project = q.get('project');
    if(project) url += `?project=${encodeURIComponent(project)}`;
    else url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  } else {
    url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  }

  try{
    const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json','x-user-id': _getAnonUid() }, body: JSON.stringify({tasks}) });
    if(res.ok) return true;
  }catch(e){ console.warn('API save error', e); }
  return false;
}

async function init(){
  // make sure status shows mongo when configured
  if(_useMongo()){
    const statusEl = (typeof document !== 'undefined') ? document.getElementById('syncStatus') : null;
    if(statusEl){ const q = new URLSearchParams(window.location.search); const project = q.get('project'); statusEl.innerText = project ? `🔗 Projeto: ${project}` : '🔌 Conectado (mongo REST)'; }
  }
}

let _onChange = null;
let _dbRef = null; // Firebase ref fallback
let helpers = null; // Firebase helpers (get/set/onValue) if present

function _useMongo(){
  try{ const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null; const backend = q && q.get('backend'); return Boolean(window.API_BASE) || backend === 'mongo'; }catch(e){ return Boolean(window.API_BASE); }
}

function _getApiBase(){ return window.API_BASE || ''; }

function _getAnonUid(){
  let id = typeof window !== 'undefined' ? localStorage.getItem('mongo_anon_uid') : null;
  if(!id && typeof window !== 'undefined'){ id = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2,10); localStorage.setItem('mongo_anon_uid', id); }
  return id;
}

async function _apiLoad(){
  const base = _getApiBase();
  let url = base + '/api/tasks';
  if(typeof window !== 'undefined'){
    const q = new URLSearchParams(window.location.search);
    const project = q.get('project');
    if(project) url += `?project=${encodeURIComponent(project)}`;
    else url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  } else {
    url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  }

  try{
    const res = await fetch(url, {headers:{'Accept':'application/json'}});
    if(res.ok) return await res.json();
  }catch(e){ console.warn('API load error', e); }
  return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
}

async function _apiSave(tasks){
  const base = _getApiBase();
  let url = base + '/api/tasks';
  if(typeof window !== 'undefined'){
    const q = new URLSearchParams(window.location.search);
    const project = q.get('project');
    if(project) url += `?project=${encodeURIComponent(project)}`;
    else url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  } else {
    url += `?uid=${encodeURIComponent(_getAnonUid())}`;
  }

  try{
    const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json','x-user-id': _getAnonUid() }, body: JSON.stringify({tasks}) });
    if(res.ok) return true;
  }catch(e){ console.warn('API save error', e); }
  return false;
}

async function init(){
  // show status when using mongo backend
  if(_useMongo()){
    const statusEl = (typeof document !== 'undefined') ? document.getElementById('syncStatus') : null;
    if(statusEl){ const q = new URLSearchParams(window.location.search); const project = q.get('project'); statusEl.innerText = project ? `🔗 Projeto: ${project}` : '🔌 Conectado (mongo REST)'; }
    return;
  }

  // try to initialize Firebase helpers if present (window.__firebase)
  if(typeof window !== 'undefined' && window.__firebase && !_dbRef){
    try{
      helpers = window.__firebase;

      // project-based ref: /projects/:id/tasks
      let project = null;
      try{ project = new URLSearchParams(window.location.search).get('project'); }catch(e){ project = null; }

      if(project){
        _dbRef = helpers.ref(`/projects/${project}/tasks`);
        const el = document.getElementById('syncStatus'); if(el) el.innerText = `🔗 Projeto: ${project}`;
      } else if(helpers.refForUser){
        _dbRef = helpers.refForUser('tasks');
        const el = document.getElementById('syncStatus'); if(el) el.innerText = '🔐 Conectado (anônimo)';
      } else {
        _dbRef = helpers.ref('/tasks_premium_2026');
      }

      // setup realtime listener
      if(helpers.onValue && _dbRef){
        helpers.onValue(_dbRef, snapshot => {
          const data = snapshot.val() || [];
          localStorage.setItem('tasks_premium_2026', JSON.stringify(data));
          const el = document.getElementById('syncStatus'); if(el) el.innerText = '🔄 Sincronizado';
          if(typeof _onChange === 'function') _onChange(data);
        }, err => {
          console.warn('Firebase read error', err);
          const el = document.getElementById('syncStatus'); if(el) el.innerText = '⚠️ Erro de sincronização';
        });
      }
    }catch(e){ console.warn('Firebase init error', e); }
  }
}

export default {
  async init(){ await init(); },
  onChange(cb){ _onChange = cb; },

  async save(tasks){
    // always persist locally
    if(typeof window !== 'undefined') localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
    const statusEl = (typeof document !== 'undefined') ? document.getElementById('syncStatus') : null; if(statusEl) statusEl.innerText = '⏳ Salvando...';

    // Mongo REST backend
    if(_useMongo()){
      const ok = await _apiSave(tasks);
      if(ok){ if(statusEl) statusEl.innerText = '🟢 Dados salvos (mongo)'; return true; }
      if(statusEl) statusEl.innerText = '⚠️ Erro ao salvar (mongo)'; return false;
    }

    // Firebase fallback
    if(!_dbRef) await init();
    if(_dbRef && helpers && helpers.set){
      try{
        await helpers.set(_dbRef, tasks);
        if(statusEl) statusEl.innerText = '🟢 Dados salvos';
        return true;
      }catch(e){
        console.warn('Firebase write error', e);
        if(statusEl) statusEl.innerText = '⚠️ Erro ao salvar (fallback local)';
        return false;
      }
    }

    if(statusEl) statusEl.innerText = '⚠️ Salvamento local (sem Firebase)';
    return true;
  },

  async load(){
    // Mongo REST backend
    if(_useMongo()){
      const data = await _apiLoad();
      return Array.isArray(data) ? data : [];
    }

    // Firebase fallback
    if(!_dbRef) await init();
    if(_dbRef && helpers && helpers.get){
      try{
        const snapshot = await helpers.get(_dbRef);
        const data = snapshot.val();
        if(data) return data;
      }catch(e){ console.warn('Firebase load error', e); }
    }

    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  }
};
