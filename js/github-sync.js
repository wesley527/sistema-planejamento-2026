// GitHub API Configuration
const GITHUB_USER = 'wesley527';
const GITHUB_REPO = 'sistema-planejamento-2026';
const FILE_PATH = 'database/db.json';

const GitHubSync = {
  async save(tasks) {
    // Salvar localmente em localStorage
    localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
    document.getElementById('syncStatus').innerText = '🟢 Dados salvos';
    return true;
  },

  async load() {
    // Carregar do localStorage
    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  }
};
