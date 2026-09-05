const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const AUDIO = path.join(ROOT, 'uploads', 'audio');
const VIDEOS = path.join(ROOT, 'uploads', 'videos');
const COVERS = path.join(ROOT, 'uploads', 'covers');
for (const d of [AUDIO, VIDEOS, COVERS]) fs.mkdirSync(d, { recursive: true });

app.use(express.json({limit:'2mb'}));
app.use(express.urlencoded({extended:true,limit:'2mb'}));
app.use(express.static(PUBLIC));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }
});

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'nkosilati1';
const SESSION_SECRET = process.env.SESSION_SECRET || 'CHANGE_THIS_SESSION_SECRET';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}})
  : null;

function id(){return Date.now().toString(36)+crypto.randomBytes(5).toString('hex');}
function sign(value){return crypto.createHmac('sha256',SESSION_SECRET).update(value).digest('hex');}
function makeSession(user){const payload=Buffer.from(JSON.stringify({u:user,r:'admin',exp:Date.now()+1000*60*60*24*7})).toString('base64url');return payload+'.'+sign(payload);}
function session(req){
  const raw=(req.headers.cookie||'').match(/(?:^|; )sid=([^;]+)/)?.[1]; if(!raw)return null;
  const [p,s]=raw.split('.'); if(!p||!s||sign(p)!==s)return null;
  try{const x=JSON.parse(Buffer.from(p,'base64url').toString());return x.exp>Date.now()?x:null;}catch{return null;}
}
function requireAdmin(req,res,next){if(!session(req))return res.status(401).json({error:'Login required'});next();}
function safeName(name){return path.basename(name).replace(/[^A-Za-z0-9._-]/g,'_');}
function localUrl(type,name){return '/uploads/'+type+'/'+name;}
function storagePublic(bucket,file){return supabase.storage.from(bucket).getPublicUrl(file).data.publicUrl;}
async function logAction(user,action,type,name){if(!supabase)return;await supabase.from('audit_log').insert({username:user,action,item_type:type,item_name:name});}

async function getContent(){
  if(!supabase) return {albums:[],songs:[],videos:[],lyrics:[],settings:{artist:'Himwiita Nkosilati Music',album:'Tushoma Ndiwe',phone:'0978038489',manager:'Eunice Mwanga'}};
  const [a,s,v,l,set] = await Promise.all([
    supabase.from('albums').select('*').order('created_at',{ascending:true}),
    supabase.from('songs').select('*').order('track',{ascending:true}).order('created_at',{ascending:true}),
    supabase.from('videos').select('*').order('created_at',{ascending:false}),
    supabase.from('lyrics').select('*').order('created_at',{ascending:false}),
    supabase.from('site_settings').select('*')
  ]);
  for(const x of [a,s,v,l,set]) if(x.error) throw x.error;
  const settings={};set.data.forEach(x=>settings[x.key]=x.value);
  return {albums:a.data||[],songs:s.data||[],videos:v.data||[],lyrics:l.data||[],settings};
}

async function seedSongs(){
  if(!supabase)return;
  const {data:existing,error}=await supabase.from('songs').select('id').limit(1); if(error)throw error;
  if(existing?.length)return;
  const files=fs.readdirSync(AUDIO).filter(x=>x.toLowerCase().endsWith('.mp3')).sort();
  for(let i=0;i<files.length;i++){
    const filename=files[i], idv='album-'+(i+1), title=filename.replace(/_himwiita_nkhosilati.*$/i,'').replace(/^.*\//,'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase()).replace(/\s+/g,' ').trim();
    const storagePath='seed/'+filename;
    const exists=await supabase.storage.from('audio').list('seed',{search:filename,limit:1});
    if(!exists.error && exists.data?.some(x=>x.name===filename)){
      await supabase.from('songs').upsert({id:idv,title,artist:'Himwiita Nkosilati',album:'Tushoma Ndiwe',genre:'Gospel',file_url:storagePublic('audio',storagePath),track:i+1},{onConflict:'id'});continue;
    }
    const data=fs.readFileSync(path.join(AUDIO,filename));
    const up=await supabase.storage.from('audio').upload(storagePath,data,{contentType:'audio/mpeg',upsert:true});
    if(up.error)throw up.error;
    const row={id:idv,title,artist:'Himwiita Nkosilati',album:'Tushoma Ndiwe',genre:'Gospel',file_url:storagePublic('audio',storagePath),track:i+1};
    const ins=await supabase.from('songs').upsert(row,{onConflict:'id'});if(ins.error)throw ins.error;
  }
}

app.get('/api/content', async(req,res)=>{try{res.json(await getContent())}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/me',(req,res)=>res.json({loggedIn:!!session(req),user:session(req)?.u||null}));
app.post('/api/login',(req,res)=>{const {username,password}=req.body||{};if(username===ADMIN_USER&&password===ADMIN_PASS){res.setHeader('Set-Cookie',`sid=${makeSession(username)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);return res.json({ok:true})}res.status(401).json({error:'Incorrect username or password'})});
app.post('/api/logout',(req,res)=>{res.setHeader('Set-Cookie','sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');res.json({ok:true})});

app.post('/api/upload',requireAdmin,upload.single('file'),async(req,res)=>{
  try{
    if(!supabase)return res.status(503).json({error:'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'});
    const type=req.body.type,title=(req.body.title||'').trim(); if(!title)return res.status(400).json({error:'Title is required'});
    const bucket={song:'audio',video:'videos',cover:'covers'}[type];
    if(type==='lyrics'){
      const row={id:id(),song:title,text:req.body.text||''};const q=await supabase.from('lyrics').insert(row);if(q.error)throw q.error;await logAction(session(req).u,'Created','lyrics',title);return res.json({ok:true,data:await getContent()});
    }
    if(!bucket||!req.file)return res.status(400).json({error:'A file is required'});
    const ext=path.extname(safeName(req.file.originalname)).toLowerCase();
    const allowed={audio:['.mp3','.wav','.m4a','.flac','.aac'],videos:['.mp4','.webm','.mov'],covers:['.jpg','.jpeg','.png','.webp']}[bucket];
    if(!allowed.includes(ext))return res.status(400).json({error:'Unsupported file type'});
    const objectPath=`uploads/${Date.now()}_${crypto.randomBytes(5).toString('hex')}${ext}`;
    const up=await supabase.storage.from(bucket).upload(objectPath,req.file.buffer,{contentType:req.file.mimetype||'application/octet-stream',upsert:false});if(up.error)throw up.error;
    const publicUrl=storagePublic(bucket,objectPath);
    let row;
    if(type==='song')row={id:id(),title,artist:'Himwiita Nkosilati',album:req.body.album||'Tushoma Ndiwe',genre:req.body.genre||'Gospel',file_url:publicUrl,track:Number(req.body.track||0),plays:0};
    if(type==='video')row={id:id(),title,description:req.body.description||'',file_url:publicUrl};
    if(type==='cover')row={id:id(),title,description:req.body.description||'',cover_url:publicUrl};
    const table={song:'songs',video:'videos',cover:'albums'}[type];const q=await supabase.from(table).insert(row);if(q.error)throw q.error;
    await logAction(session(req).u,'Created',type,title);res.json({ok:true,data:await getContent()});
  }catch(e){console.error(e);res.status(500).json({error:e.message||'Upload failed'})}
});

app.post('/api/delete/:type/:id',requireAdmin,async(req,res)=>{
  try{if(!supabase)return res.status(503).json({error:'Supabase is not configured'});const map={song:'songs',video:'videos',album:'albums',lyric:'lyrics'},table=map[req.params.type];if(!table)return res.status(400).json({error:'Bad type'});
    const {data,error}=await supabase.from(table).select('*').eq('id',req.params.id).maybeSingle();if(error)throw error;if(!data)return res.status(404).json({error:'Item not found'});
    const q=await supabase.from(table).delete().eq('id',req.params.id);if(q.error)throw q.error;await logAction(session(req).u,'Deleted',req.params.type,data.title||data.song||'item');res.json({ok:true,data:await getContent()});
  }catch(e){res.status(500).json({error:e.message})}
});

app.post('/api/play/:id',async(req,res)=>{try{if(!supabase)return res.json({ok:true});await supabase.rpc('increment_song_play',{song_id:req.params.id}).catch(async()=>{const {data}=await supabase.from('songs').select('plays').eq('id',req.params.id).single();if(data)await supabase.from('songs').update({plays:(data.plays||0)+1}).eq('id',req.params.id)});res.json({ok:true})}catch(e){res.json({ok:false})}});

app.get('/uploads/:type/:name',(req,res)=>{const dirs={audio:AUDIO,videos:VIDEOS,covers:COVERS};const dir=dirs[req.params.type];if(!dir)return res.sendStatus(404);const fp=path.join(dir,safeName(req.params.name));if(!fs.existsSync(fp))return res.sendStatus(404);res.sendFile(fp)});

app.get('/admin.html',(req,res)=>res.sendFile(path.join(PUBLIC,'admin.html')));

app.listen(PORT,async()=>{console.log(`Himwiita Nkosilati Music V4 running on port ${PORT}`);if(supabase){try{await seedSongs();console.log('Supabase seed check complete.')}catch(e){console.error('Seed warning:',e.message)}}});
