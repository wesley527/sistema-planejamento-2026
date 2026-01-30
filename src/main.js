import GitHubSync from './github-sync.js';

// Tornar compatível com o código atual que espera um objeto global
window.GitHubSync = GitHubSync;

// Inicializa a sincronização para que o listener já esteja ativo
GitHubSync.init().catch(e => console.warn('Erro inicializando GitHubSync', e));

console.log('Entrypoint (Vite) pronto — GitHubSync exposto em window.GitHubSync');
