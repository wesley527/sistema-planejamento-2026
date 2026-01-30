// Integração com Firebase modular (usando module script que popula `window.__firebase`)
const GitHubSync = {
  _dbRef: null,
  _onChange: null,

  async init() {
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
    document.getElementById('syncStatus').innerText = '⏳ Salvando...';

    if(!this._dbRef){
      await this.init();
    }

    if(this._dbRef && window.__firebase && window.__firebase.set){
      try{
        await window.__firebase.set(this._dbRef, tasks);
        document.getElementById('syncStatus').innerText = '🟢 Dados salvos';
        return true;
      }catch(e){
        console.warn('Firebase write error', e);
        document.getElementById('syncStatus').innerText = '⚠️ Erro ao salvar (fallback local)';
        return false;
      }
    }

    document.getElementById('syncStatus').innerText = '⚠️ Salvamento local (sem Firebase)';
    return true;
  },

  async load(){
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
