// Integração com Firebase modular (usando module script que popula `window.__firebase`)
const GitHubSync = {
  _dbRef: null,
  _onChange: null,

  // --- Helpers for Mongo REST backend ---
  _useMongo(){
    try{ const q = new URLSearchParams(location.search); const backend = q.get('backend'); return Boolean(window.API_BASE) || backend === 'mongo'; }catch(e){ return Boolean(window.API_BASE); }
  },

  _getApiBase(){ return window.API_BASE || ''; },

  _getAnonUid(){
    let id = localStorage.getItem('mongo_anon_uid');
    if(!id){ id = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2,10); localStorage.setItem('mongo_anon_uid', id); }
    return id;
  },

  async _apiLoad(){
    const base = this._getApiBase();
    const q = new URLSearchParams(location.search);
    const project = q.get('project');
    let url = base + '/api/tasks';
    if(project) url += `?project=${encodeURIComponent(project)}`;
    else url += `?uid=${encodeURIComponent(this._getAnonUid())}`;

    try{
      const res = await fetch(url, {headers:{'Accept':'application/json'}});
      if(res.ok) return await res.json();
    }catch(e){ console.warn('API load error', e); }
    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  },

  async _apiSave(tasks){
    const base = this._getApiBase();
    const q = new URLSearchParams(location.search);
    const project = q.get('project');
    let url = base + '/api/tasks';
    if(project) url += `?project=${encodeURIComponent(project)}`;
    else url += `?uid=${encodeURIComponent(this._getAnonUid())}`;

    try{
      const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json','x-user-id': this._getAnonUid() }, body: JSON.stringify({tasks}) });
      if(res.ok) return true;
    }catch(e){ console.warn('API save error', e); }
    return false;
  },

  async init() {
    // If configured to use the Mongo REST backend, we won't try to init Firebase
    if(this._useMongo()){
      const statusEl = document.getElementById('syncStatus');
      if(statusEl){
        const q = new URLSearchParams(location.search);
        const project = q.get('project');
        statusEl.innerText = project ? `🔗 Projeto: ${project}` : '🔌 Conectado (mongo REST)';
      }
      return;
    }

    // Se o helper modular foi inicializado pelo <script type="module">, use-o
    if(window.__firebase && !this._dbRef){
      try{
        // Suporta projeto compartilhado via URL (ex: ?project=escola123)
        let project = null;
        try{ project = new URLSearchParams(location.search).get('project'); }catch(e){ project = null; }

        if(project){
          this._dbRef = window.__firebase.ref(`/projects/${project}/tasks`);
          const el = document.getElementById('syncStatus'); if(el) el.innerText = `🔗 Projeto: ${project}`;
        } else if(window.__firebase.refForUser){
          this._dbRef = window.__firebase.refForUser('tasks');
          const el = document.getElementById('syncStatus'); if(el) el.innerText = '🔐 Conectado (anônimo)';
        } else {
          this._dbRef = window.__firebase.ref('/tasks_premium_2026');
        }

        window.__firebase.onValue(this._dbRef, snapshot => {
          const data = snapshot.val() || [];
          localStorage.setItem('tasks_premium_2026', JSON.stringify(data));
          document.getElementById('syncStatus').innerText = '🔄 Sincronizado';
          if(typeof this._onChange === 'function') this._onChange(data);
        }, err => {
          console.warn('Firebase read error', err);
          document.getElementById('syncStatus').innerText = '⚠️ Erro de sincronização';
        });
      }catch(e){
        console.warn('Firebase init error', e);
      }
    }
  },

  onChange(cb){ this._onChange = cb; },

  async save(tasks){
    // Salvar localmente sempre
    localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
    const statusEl = document.getElementById('syncStatus'); if(statusEl) statusEl.innerText = '⏳ Salvando...';

    // Se estiver usando Mongo REST
    if(this._useMongo()){
      const ok = await this._apiSave(tasks);
      if(ok){ if(statusEl) statusEl.innerText = '🟢 Dados salvos (mongo)'; return true; }
      if(statusEl) statusEl.innerText = '⚠️ Erro ao salvar (mongo)'; return false;
    }

    if(!this._dbRef){
      await this.init();
    }

    if(this._dbRef && window.__firebase && window.__firebase.set){
      try{
        await window.__firebase.set(this._dbRef, tasks);
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
    // Se estiver usando Mongo REST
    if(this._useMongo()){
      const data = await this._apiLoad();
      return Array.isArray(data) ? data : [];
    }

    // Tenta carregar do Firebase (once/get) se disponível
    if(!this._dbRef){
      await this.init();
    }

    if(this._dbRef && window.__firebase && window.__firebase.get){
      try{
        const snapshot = await window.__firebase.get(this._dbRef);
        const data = snapshot.val();
        if(data) return data;
      }catch(e){
        console.warn('Firebase load error', e);
      }
    }

    // Fallback para localStorage
    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  }
};

/* Observação: para produção, configure regras e autenticação no Realtime Database.
   O módulo aqui usa a inicialização via <script type="module"> e expõe helpers em
   `window.__firebase` (get, set, onValue, ref). */
