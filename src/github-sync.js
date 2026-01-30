import { getHelpers } from './firebase.js';

let _dbRef = null;
let _onChange = null;
let helpers = null;

async function init(){
  if(_dbRef) return;
  helpers = getHelpers();

  try{
    // Tentar obter uid via window (script CDN) ou via helper modular
    let uid = (typeof window !== 'undefined' && window.__firebase && window.__firebase.uid) || null;
    if(!uid && helpers.signInAnonymously){
      const user = await helpers.signInAnonymously();
      uid = user && user.uid;
    }

    // Suporta projeto compartilhado via URL (ex: ?project=escola123)
    let project = null;
    if(typeof window !== 'undefined'){
      try{ project = new URLSearchParams(window.location.search).get('project'); }catch(e){ project = null; }
    }

    if(project && helpers.ref){
      _dbRef = helpers.ref(`/projects/${project}/tasks`);
      const statusEl = document.getElementById('syncStatus'); if(statusEl) statusEl.innerText = `🔗 Projeto: ${project}`;
    } else if(uid && helpers.refForUser){
      _dbRef = helpers.refForUser(uid, 'tasks');
      const statusEl = document.getElementById('syncStatus'); if(statusEl) statusEl.innerText = '🔐 Conectado (anônimo)';

      // Migração modular: copiar dados globais se usuário ainda não tiver tarefas
      try{
        const perSnap = await helpers.get(_dbRef);
        const globalRef = helpers.ref('/tasks_premium_2026');
        const globalSnap = await helpers.get(globalRef);
        const perData = perSnap && perSnap.val();
        const globalData = globalSnap && globalSnap.val();
        if((perData == null || (Array.isArray(perData) && perData.length === 0)) && globalData){
          await helpers.set(_dbRef, globalData);
          console.info('Migrated global tasks to per-user tasks (modular)');
        }
      }catch(e){
        console.warn('Migration (modular) error', e);
      }

    } else {
      _dbRef = helpers.ref('/tasks_premium_2026');
    }

    helpers.onValue(_dbRef, (snapshot) => {
      const data = snapshot.val() || [];
      localStorage.setItem('tasks_premium_2026', JSON.stringify(data));
      const statusEl = document.getElementById('syncStatus');
      if(statusEl) statusEl.innerText = '🔄 Sincronizado';
      if(typeof _onChange === 'function') _onChange(data);
    }, (err) => {
      console.warn('Firebase read error', err);
      const statusEl = document.getElementById('syncStatus');
      if(statusEl) statusEl.innerText = '⚠️ Erro de sincronização';
    });
  }catch(e){
    console.warn('Firebase init error', e);
  }
}

export default {
  async init(){
    await init();
  },

  onChange(cb){ _onChange = cb; },

  async save(tasks){
    localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
    const statusEl = document.getElementById('syncStatus');
    if(statusEl) statusEl.innerText = '⏳ Salvando...';

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
