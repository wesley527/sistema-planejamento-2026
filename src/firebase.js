// Módulo para inicializar Firebase usando o SDK npm (modular)
import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, onValue, set as dbSet, get as dbGet } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCZI4Rb35MkIPiVk-xWz03eZwEaKeaxFhE",
  authDomain: "sistema-de-planejamento.firebaseapp.com",
  projectId: "sistema-de-planejamento",
  storageBucket: "sistema-de-planejamento.firebasestorage.app",
  messagingSenderId: "151928826868",
  appId: "1:151928826868:web:2b3bc73114259530ab67a1",
  measurementId: "G-7L9KYGE46R"
};

let db = null;
let initialized = false;

export function initFirebase() {
  if(initialized) return {
    ref: (p) => dbRef(db, p),
    onValue,
    set: dbSet,
    get: dbGet
  };

  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  initialized = true;

  return {
    ref: (p) => dbRef(db, p),
    onValue,
    set: dbSet,
    get: dbGet
  };
}

// Expor função auxiliar para uso em runtime
export function getHelpers(){
  if(window.__firebase) return window.__firebase; // se o script CDN já expôs
  return initFirebase();
}
