require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit: '1mb'}));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sistema-planejamento';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error', err);
});

const TaskSchema = new mongoose.Schema({
  project: { type: String, index: true, sparse: true },
  uid: { type: String, index: true, sparse: true },
  tasks: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});

TaskSchema.index({ project: 1 }, { sparse: true });
TaskSchema.index({ uid: 1 }, { sparse: true });

const TaskModel = mongoose.model('Task', TaskSchema);

app.get('/api/health', (req, res) => res.json({ok:true, time: new Date()}));

// GET /api/tasks?project=ID or ?uid=UID
app.get('/api/tasks', async (req, res) => {
  const { project, uid } = req.query;
  try{
    let doc = null;
    if(project){
      doc = await TaskModel.findOne({ project }).exec();
    } else if(uid){
      doc = await TaskModel.findOne({ uid }).exec();
    } else if(req.header('x-user-id')){
      doc = await TaskModel.findOne({ uid: req.header('x-user-id') }).exec();
    } else {
      return res.status(400).json({ error: 'missing project or uid' });
    }

    if(!doc) return res.json([]);
    return res.json(doc.tasks || []);
  }catch(e){
    console.error('GET /api/tasks error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

// POST /api/tasks?project=ID or ?uid=UID  body: { tasks: [...] }
app.post('/api/tasks', async (req, res) => {
  const { project, uid } = req.query;
  const headerUid = req.header('x-user-id');
  const targetUid = uid || headerUid || null;
  try{
    if(!project && !targetUid) return res.status(400).json({ error: 'missing project or uid' });

    const tasks = Array.isArray(req.body.tasks) ? req.body.tasks : (req.body.tasks || []);

    let doc = null;
    if(project){
      doc = await TaskModel.findOneAndUpdate({ project }, { tasks, updatedAt: new Date() }, { upsert: true, new: true }).exec();
    } else {
      doc = await TaskModel.findOneAndUpdate({ uid: targetUid }, { uid: targetUid, tasks, updatedAt: new Date() }, { upsert: true, new: true }).exec();
    }

    return res.json({ ok: true, tasks: doc.tasks });
  }catch(e){
    console.error('POST /api/tasks error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));