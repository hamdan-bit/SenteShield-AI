/** Vercel serverless link scanner. Never requests the submitted website. */
import {scanLink,LINK_MAX_LENGTH,CONTEXT_MAX_LENGTH} from '../link-service.js';

const attempts=new Map();
function allowed(ip){
 const now=Date.now();
 const entry=attempts.get(ip);
 if(!entry||now>=entry.expires){attempts.set(ip,{n:1,expires:now+60000});return true;}
 if(entry.n>=12)return false;
 entry.n++;return true;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return res.status(415).json({error:'Send JSON with a link.'});
 if(Number(req.headers['content-length']||0)>8192)return res.status(413).json({error:'Request too large.'});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(!allowed(ip))return res.status(429).json({error:'Too many checks. Try again in one minute.'});
 let body=req.body;
 if(typeof body==='string'){try{body=JSON.parse(body)}catch{return res.status(400).json({error:'Invalid JSON.'});}}
 if(typeof body?.link!=='string' || body.link.length>LINK_MAX_LENGTH || typeof(body.context??'')!=='string' || (body.context??'').length>CONTEXT_MAX_LENGTH)return res.status(400).json({error:'Enter a link and optional description within the limits.'});
 try{
  const result=await scanLink(body.link,body.context??'');
  return res.status(200).json({result});
 }catch(error){return res.status(400).json({error:error.message||'Invalid link.'});}
}
