/** Vercel serverless health check. */
export default function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  return res.status(200).json({ok:true,service:'SenteShield',aiConfigured:Boolean((process.env.GEMINI_API_KEY||'').trim()),reputationConfigured:Boolean((process.env.WEB_RISK_API_KEY||'').trim())});
}
