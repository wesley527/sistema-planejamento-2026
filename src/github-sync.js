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

export default {
  async init(){ await init(); },
  onChange(cb){ _onChange = cb; },

  async save(tasks){
    localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
    const statusEl = document.getElementById('syncStatus'); if(statusEl) statusEl.innerText = '⏳ Salvando...';

    if(_useMongo()){
      const ok = await _apiSave(tasks);
      if(ok){ if(statusEl) statusEl.innerText = '🟢 Dados salvos (mongo)'; return true; }
      if(statusEl) statusEl.innerText = '⚠️ Erro ao salvar (mongo)'; return false;
    }

    // fallback: local save only
    if(statusEl) statusEl.innerText = '⚠️ Salvamento local (sem backend)';
    return true;
  },

  async load(){
    if(_useMongo()){
      const data = await _apiLoad();
      return Array.isArray(data) ? data : [];
    }

    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  }
};

export default {
  async init(){
    await init();
  },

  onChange(cb){ _onChange = cb; },

  async save(tasks){
    localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
    const statusEl = document.getElementById('syncStatus');
    if(statusEl) statusEl.innerText = '⏳ Salvando...';

    if(_useMongo()){
      const ok = await _apiSave(tasks);
      if(ok){ if(statusEl) statusEl.innerText = '🟢 Dados salvos (mongo)'; return true; }
      if(statusEl) statusEl.innerText = '⚠️ Erro ao salvar (mongo)'; return false;
    }

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
    if(_useMongo()){
      const data = await _apiLoad();
      return Array.isArray(data) ? data : [];
    }

    if(!_dbRef) await init();
    if(_dbRef && helpers && helpers.get){
      try{
        const snapshot = await helpers.get(_dbRef);
        const data = snapshot.val();
        if(data) return data;
      }catch(e){
        console.warn('Firebase load error', e);
      }
    }
    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  }
};
