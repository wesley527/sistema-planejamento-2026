# Server for Sistema Planejamento

Simple Node + Express server that stores tasks in MongoDB (Atlas).

Endpoints:
- GET /api/tasks?project=ID  -> returns tasks array for project
- GET /api/tasks?uid=UID     -> returns tasks array for user
- POST /api/tasks?project=ID -> upsert tasks for project (body: { tasks: [...] })
- POST /api/tasks?uid=UID     -> upsert tasks for user (also accepts header x-user-id)

Env:
- MONGO_URI - MongoDB connection string
- PORT - port to listen

Run:
- npm install
- copy .env.example to .env and set MONGO_URI
- npm run dev (requires nodemon) or npm start
