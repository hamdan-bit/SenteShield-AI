/** Parsing, masking and safety logic kept separate so they can be tested. */
export const MAX_LENGTH = 1600;

export function redactSensitiveText(input) {
  return input
    .replace(/\b(?:\+?256|0)(?:7\d{8}|20\d{7})\b/g, '[PHONE REDACTED]')
    .replace(/\b\d{4,6}\b(?=\s*(?:is|as)?\s*(?:your\s*)?(?:pin|otp|verification|security)\b)/gi, '[CODE REDACTED]')
    .replace(/\b(?:pin|otp|verification code|security code)\s*(?:is|:|=)\s*\d{4,8}\b/gi, '[SECRET REDACTED]')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[EMAIL REDACTED]');
}

export function riskSignals(message) {
  const checks = [
    {code: 'secret', re: /\b(pin|password|otp|verification code|secret code)\b/i, severity: 3, label: 'Request involving a private security code'},
    {code: 'urgency', re: /\b(urgent|immediately|within \d+|last chance|blocked|suspended|expire|act now)\b/i, severity: 1, label: 'Pressure or time-sensitive language'},
    {code: 'payment', re: /\b(send|pay|deposit|transfer|fee|charges?|ugx|shillings|cash[- ]?out)\b/i, severity: 1, label: 'Request involving money or a payment'},
    {code: 'reward', re: /\b(won|prize|winner|lottery|jackpot|free money|reward|giveaway)\b/i, severity: 2, label: 'Unexpected prize or reward claim'},
    {code: 'link', re: /(?:https?:\/\/|www\.|bit\.ly|tinyurl)/i, severity: 1, label: 'External link requires verification'},
    {code: 'pretend', re: /\b(mtn|airtel|bank|police|ura|support|agent|account|momo)\b/i, severity: 1, label: 'References a service or authority'}
  ];
  return checks.filter(c => c.re.test(message)).map(({code,severity,label}) => ({code,severity,label}));
}

export function deterministicAssessment(message, language = 'en') {
  const signals = riskSignals(message);
  const score = signals.reduce((sum,item) => sum + item.severity, 0);
  const risk = score >= 4 ? 'High' : score >= 2 ? 'Medium' : 'Low';
  const isLg = language === 'lg';
  return {
    risk,
    summary: isLg ? (risk === 'High' ? `Obubaka buno bulina obubonero obw'okwekengera obungi. Tosindika ssente nga tonnakakasa.` : risk === 'Medium' ? `Obubaka buno bulina obubonero obuyinza okuba obw'obukuusa. Kakasiza mu mukutu omutongole.` : `Obubonero obw'obukuusa si bungi, naye tetusobola kukakasa nti omusindisi mutuufu.`) : risk === 'High'
      ? 'This message contains several common scam warning signs. Treat it cautiously.'
      : risk === 'Medium'
        ? 'This message has some warning signs. Verify it independently.'
        : 'Few obvious warning signs appeared in the text, but authenticity cannot be confirmed.',
    redFlags: signals.map(s=>({phrase: s.label, reason: isLg ? `Kino kiyinza okuba akabonero k'obukuusa. Kakasa obubaka.` : 'This can be a warning sign, depending on the context.'})),
    actions: isLg ? [
      'Towaayo PIN yo, password oba OTP eri muntu yenna.',
      `Kakasa obubaka ng'oyita ku mukutu omutongole ogw'ekitongole ekikuwa empeereza.`,
      `Tosindika ssente oba okunyiga links z'otomanyi nga tonnakakasa.`
    ] : [
      'Do not share your mobile money PIN, password, or one-time code.',
      'Verify the request through your provider’s official app or a trusted contact channel.',
      'Do not send money or open unknown links until you have verified the request.'
    ],
    model: 'rules',
    disclaimer: isLg ? 'Okwekenneenya obubaka bwokka tekukakasa nti obubaka butuufu.' : 'Text-only assessment. No tool can confirm from a message alone that a request is genuine.'
  };
}

function stripFences(str) { return str.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim(); }
export function normalizeAssessment(raw) {
  const d = typeof raw === 'string' ? JSON.parse(stripFences(raw)) : raw;
  if (!d || typeof d !== 'object') throw new Error('Invalid AI output');
  const risk = ['Low','Medium','High'].find(x=>x.toLowerCase()===String(d.risk||'').toLowerCase());
  if (!risk || typeof d.summary !== 'string') throw new Error('Missing AI fields');
  const clean = (v, max=250) => String(v ?? '').slice(0,max).trim();
  return {
    risk,
    summary: clean(d.summary,450),
    redFlags: (Array.isArray(d.redFlags) ? d.redFlags : []).slice(0,5).map(f=>({phrase:clean(f.phrase,120),reason:clean(f.reason,280)})).filter(f=>f.phrase && f.reason),
    actions: (Array.isArray(d.actions) ? d.actions : []).slice(0,4).map(a=>clean(a,240)).filter(Boolean),
    model:'ai',
    disclaimer:'AI can miss scams or incorrectly flag real messages. Independently verify before taking action.'
  };
}
