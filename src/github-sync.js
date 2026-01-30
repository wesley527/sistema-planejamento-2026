import { getHelpers } from './firebase.js';

let _dbRef = null;
let _onChange = null;
let helpers = null;

async function init(){
  if(_dbRef) return;
  helpers = getHelpers();
  _dbRef = helpers.ref('/tasks_premium_2026');

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
