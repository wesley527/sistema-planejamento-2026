(async ()=>{
  const base = process.env.API_BASE || 'http://localhost:4000';
  const uid = 'smoke_test_' + Date.now();
  console.log('Base:', base);

  // POST sample task
  const task = { date: new Date().toISOString().slice(0,10), action: 'smoke-test', done: false };
  try{
    const post = await fetch(`${base}/api/tasks?uid=${encodeURIComponent(uid)}`, { method: 'POST', headers: {'Content-Type':'application/json','x-user-id': uid}, body: JSON.stringify({tasks:[task]}) });
    const postJson = await post.json();
    console.log('POST result:', postJson);
  }catch(e){ console.error('POST error', e); process.exit(2); }

  // GET the tasks back
  try{
    const res = await fetch(`${base}/api/tasks?uid=${encodeURIComponent(uid)}`);
    const data = await res.json();
    console.log('GET result:', data);
    if(Array.isArray(data) && data.length>0){
      console.log('Smoke test OK');
      process.exit(0);
    }else{
      console.error('Smoke test failed: no data returned');
      process.exit(3);
    }
  }catch(e){ console.error('GET error', e); process.exit(2); }
})();