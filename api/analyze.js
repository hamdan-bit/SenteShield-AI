/** Vercel serverless API route. Does not store messages or expose API keys. */
import {MAX_LENGTH,redactSensitiveText} from '../logic.js';
import {analyzeSafely} from '../analysis-service.js';

const attempts = new Map(); // Instance-local guard, not a distributed rate limiter.
function allowed(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now >= entry.expires) {attempts.set(ip,{n:1,expires:now+60_000});return true;}
  if (entry.n >= 8) return false;
  entry.n++;
  return true;
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!allowed(ip)) return res.status(429).json({error:'Too many checks. Please try again in one minute.'});
  if (!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return res.status(415).json({error:'Send a JSON message.'});
  if (Number(req.headers['content-length']||0) > 8192) return res.status(413).json({error:'Request too large.'});
  let body = req.body;
  if (typeof body === 'string') {try {body=JSON.parse(body);}catch{return res.status(400).json({error:'Invalid JSON.'});}}
  if (typeof body?.message !== 'string' || body.message.trim().length < 10 || body.message.length > MAX_LENGTH) {
    return res.status(400).json({error:`Enter a message between 10 and ${MAX_LENGTH} characters.`});
  }
  const text = redactSensitiveText(body.message.trim());
  const language = body.language === 'lg' ? 'lg' : 'en';
  const result = await analyzeSafely(text,language);
  return res.status(200).json(result);
}
