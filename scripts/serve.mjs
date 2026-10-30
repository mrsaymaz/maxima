#!/usr/bin/env node
// Local web server for playing Maxima: `npm start`, then open the printed address.
// Browsers block the game's modules and asset loading when index.html is opened straight from disk (file://),
// so the game has to be served over http. No dependencies; serves dist/ only.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};

const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end('Bad request');return;}
 let file=path.join(ROOT,pathname);
 if(!file.startsWith(ROOT)){res.writeHead(403).end('Forbidden');return;}
 fs.stat(file,(err,stat)=>{
  if(!err&&stat.isDirectory()){file=path.join(file,'index.html');stat=fs.existsSync(file)?fs.statSync(file):null;}
  if(err&&!stat||!stat?.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');return;}
  res.writeHead(200,{'Content-Type':TYPES[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
  if(req.method==='HEAD'){res.end();return;}
  fs.createReadStream(file).pipe(res);
 });
});

const port=Number(process.env.PORT)||8080;
server.on('error',err=>{
 if(err.code==='EADDRINUSE')console.error(`Port ${port} is already in use. Try another one, for example:  PORT=8081 npm start`);
 else console.error(err.message);
 process.exit(1);
});
server.listen(port,'0.0.0.0',()=>{
 const lan=Object.values(os.networkInterfaces()).flat().filter(a=>a&&a.family==='IPv4'&&!a.internal).map(a=>a.address);
 console.log(`Maxima is running.\n\n  On this computer:   http://localhost:${port}/`);
 for(const ip of lan)console.log(`  On a phone (same Wi-Fi):   http://${ip}:${port}/`);
 console.log('\nPress Ctrl+C to stop.');
});
