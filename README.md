# Sistema Planejamento 2026

Adiciones para usar MongoDB Atlas como backend (API REST):

## Backend (server)
- Local: execute em `/server`:
  - `cd server && npm install`
  - crie `.env` com `MONGO_URI` (veja `.env.example`)
  - `npm run dev` (requer nodemon) ou `npm start`
- Endpoints:
  - `GET /api/tasks?project=ID`  — retorna array de tarefas do projeto
  - `GET /api/tasks?uid=UID`      — retorna array de tarefas do usuário
  - `POST /api/tasks?project=ID` — body `{ tasks: [...] }`
  - `POST /api/tasks?uid=UID`     — body `{ tasks: [...] }` (aceita também header `x-user-id`)

## Front-end
- O front agora usa **apenas a API REST (Mongo)** quando `window.API_BASE` estiver definido (p.ex. usando `config.js`) ou se a URL contém `?backend=mongo`.
- Para configurar, copie `config.js.example` → `config.js` e defina `window.API_BASE = 'https://api.seudominio.com'` apontando para seu servidor.
- Para compartilhar dados entre dispositivos com o mesmo link, abra o app com `?project=MEUID` (ex: `/?project=escola123`).
- O cliente gera um `anon_uid` local (armazenado em `localStorage`) caso não autentique; use `?project=ID` para dados compartilhados.

## Migração
- O app tenta migrar dados globais `/tasks_premium_2026` para o path do usuário quando autenticação anônima estiver ativa ou quando o projeto for usado.

---
Se quiser, posso criar um branch e abrir um PR com essas mudanças, e adicionar testes básicos para o servidor."