// GitHub API Configuration
const GITHUB_USER = 'wesley527';
const GITHUB_REPO = 'sistema-planejamento-2026';
const FILE_PATH = 'database/db.json';

// Obter token do localStorage (já deve estar salvo)
function getGitHubToken() {
  return localStorage.getItem('github_token') || null;
}

const GitHubSync = {
  async save(tasks) {
    const GITHUB_TOKEN = getGitHubToken();
    
    if (!GITHUB_TOKEN) {
      console.warn('Token do GitHub não configurado. Salvando apenas localmente.');
      localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
      return false;
    }

    try {
      // Primeiro, obter o SHA do arquivo atual
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      let sha = null;
      if (getResponse.ok) {
        const data = await getResponse.json();
        sha = data.sha;
      }

      // Preparar os dados no formato esperado
      const content = {
        pedagogico: tasks.filter(t => t.type === 'ped'),
        comercial: tasks.filter(t => t.type === 'com')
      };

      const contentBase64 = btoa(JSON.stringify(content, null, 2));

      // Fazer commit dos dados
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `Atualização de tarefas - ${new Date().toLocaleString('pt-BR')}`,
            content: contentBase64,
            sha: sha
          })
        }
      );

      if (response.ok) {
        document.getElementById('syncStatus').innerText = '🟢 Sincronizado com GitHub';
        localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
        return true;
      } else {
        const error = await response.json();
        console.error('Erro ao salvar no GitHub:', error);
        document.getElementById('syncStatus').innerText = '🔴 Erro ao sincronizar';
        localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
        return false;
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      document.getElementById('syncStatus').innerText = '🟡 Offline - salvando localmente';
      localStorage.setItem('tasks_premium_2026', JSON.stringify(tasks));
      return false;
    }
  },

  async load() {
    const GITHUB_TOKEN = getGitHubToken();
    
    if (!GITHUB_TOKEN) {
      console.warn('Token do GitHub não configurado. Carregando do localStorage.');
      return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(atob(data.content));
        
        // Converter para formato de tarefas
        let tasks = [];
        
        if (content.pedagogico && Array.isArray(content.pedagogico)) {
          tasks = tasks.concat(content.pedagogico.map(t => ({...t, type: 'ped'})));
        }
        
        if (content.comercial && Array.isArray(content.comercial)) {
          tasks = tasks.concat(content.comercial.map(t => ({...t, type: 'com'})));
        }
        
        document.getElementById('syncStatus').innerText = '🟢 Carregado do GitHub';
        return tasks;
      }
    } catch (error) {
      console.error('Erro ao carregar do GitHub:', error);
      document.getElementById('syncStatus').innerText = '🟡 Usando dados locais';
    }

    return JSON.parse(localStorage.getItem('tasks_premium_2026')) || [];
  }
};
