import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {MAX_LENGTH, redactSensitiveText} from './logic.js';
import {analyzeSafely} from './analysis-service.js';
import {scanLink, LINK_MAX_LENGTH, CONTEXT_MAX_LENGTH} from './link-service.js';

// Zero-dependency Node.js server. Compatible with Node 20+ / Render free tier.
const root = path.dirname(fileURLToPath(import.meta.url));
// Load .env in local development without introducing a dependency. Render uses native env vars.
try {
  const localEnv = readFileSync(path.join(root, '.env'), 'utf8');
  for (const line of localEnv.split(/\r?\n/)) {
    const parsed = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (!parsed) continue;
    const value = parsed[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!(parsed[1] in process.env)) process.env[parsed[1]] = value;
  }
} catch { /* .env is optional. Never log keys or its contents. */ }
const PORT = Number(process.env.PORT) || 3000;
const apiKey = (process.env.GEMINI_API_KEY || '').trim();
const model = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();
const rateCounters = new Map();
const files = new Map([
  ['/',{file:'index.html',contentType:'text/html; charset=utf-8'}],
  ['/index.html',{file:'index.html',contentType:'text/html; charset=utf-8'}],
  ['/styles.css',{file:'styles.css',contentType:'text/css; charset=utf-8'}],
  ['/app.js',{file:'app.js',contentType:'text/javascript; charset=utf-8'}],
  ['/favicon.svg',{file:'favicon.svg',contentType:'image/svg+xml'}]
]);

function send(res,status,body,contentType='application/json; charset=utf-8'){
  res.writeHead(status,{'Content-Type':contentType,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(typeof body==='string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function rateAllowed(ip){
  const now=Date.now(); const entry=rateCounters.get(ip);
  if(!entry || entry.until<now) {rateCounters.set(ip,{count:1,until:now+60_000});return true;}
  if(entry.count>=8) return false;
  entry.count++;return true;
}
function getBody(req){return new Promise((resolve,reject)=>{
  let total=0; const chunks=[];
  req.on('data',c=>{total+=c.length;if(total>8192){reject(new Error('Payload too large'));req.destroy();return;}chunks.push(c)});
  req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('Invalid JSON'))}});
  req.on('error',reject);
 });}
async function handle(req,res){
  const pathname=new URL(req.url||'/', 'http://localhost').pathname;
  if(pathname==='/api/health' && req.method==='GET')return send(res,200,{ok:true,service:'SenteShield AI',aiConfigured:Boolean(apiKey),reputationConfigured:Boolean((process.env.WEB_RISK_API_KEY||'').trim())});
  if(pathname==='/api/analyze'){
    if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
    if(!rateAllowed(req.socket.remoteAddress||'unknown'))return send(res,429,{error:'Too many checks. Please wait one minute.'});
    if(!(req.headers['content-type']||'').startsWith('application/json'))return send(res,415,{error:'Send JSON with a message field.'});
    let data;try{data=await getBody(req)}catch{return send(res,400,{error:'Invalid or oversized JSON request.'});}
    if(typeof data?.message!=='string'||data.message.trim().length<10||data.message.length>MAX_LENGTH)return send(res,400,{error:`Enter a message between 10 and ${MAX_LENGTH} characters.`});
    const safeMessage=redactSensitiveText(data.message.trim());
    const language=data.language==='lg'?'lg':'en';
    // Do not log or persist message bodies. Users should still remove sensitive data before submission.
    return send(res,200,await analyzeSafely(safeMessage,language,{apiKey,model}));
  }
  if(pathname==='/api/check-link'){
    if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
    if(!rateAllowed(req.socket.remoteAddress||'unknown'))return send(res,429,{error:'Too many checks. Please try again in one minute.'});
    if(!(req.headers['content-type']||'').startsWith('application/json'))return send(res,415,{error:'Send JSON with a link.'});
    let data;try{data=await getBody(req)}catch{return send(res,400,{error:'Invalid or oversized JSON request.'});}
    if(typeof data?.link!=='string'||data.link.length>LINK_MAX_LENGTH||typeof(data.context??'')!=='string'||(data.context??'').length>CONTEXT_MAX_LENGTH)return send(res,400,{error:'Enter a link and optional description within the limits.'});
    try{return send(res,200,{result:await scanLink(data.link,data.context??'')});}
    catch(e){return send(res,400,{error:e.message||'Invalid link.'});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed'});
  const asset=files.get(pathname);
  if(!asset)return send(res,404,{error:'Not found'});
  try{
    const content=await readFile(path.join(root,'public',asset.file));
    if(req.method==='HEAD')return send(res,200,'',asset.contentType);
    return send(res,200,content,asset.contentType);
  }catch{return send(res,500,{error:'Unable to serve app'});}
}
const server=createServer((req,res)=>{handle(req,res).catch(e=>{console.error('Unhandled request:',e.name);if(!res.headersSent)send(res,500,{error:'Unexpected server error'})})});
server.listen(PORT,'0.0.0.0',()=>console.log(`SenteShield AI ready at http://localhost:${PORT} (${apiKey?'live AI':'demo'} mode)`));
