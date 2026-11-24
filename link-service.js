/** SenteShield link checks. URL structure is analyzed locally on the server.
 * The target URL is NEVER fetched, visited, followed, or rendered by this service.
 * Optional Google Cloud Web Risk lookup uses its fixed HTTPS API endpoint only.
 */
import {isIP} from 'node:net';

export const LINK_MAX_LENGTH = 2100;
export const CONTEXT_MAX_LENGTH = 1500;
const SHORTENERS = new Set(['bit.ly','tinyurl.com','t.co','is.gd','cutt.ly','rb.gy','shorturl.at','tiny.one','rebrand.ly','ow.ly','soo.gd','s.id','lnkd.in']);
const DANGEROUS_SCHEMES = /^(?:javascript|data|file|ftp|blob|chrome|about):/i;
const suspiciousTlds = new Set(['click','top','xyz','buzz','work','shop','gq','tk','ml','cf','ga']);

export function extractLink(input) {
  if (typeof input !== 'string' || !input.trim() || input.length > LINK_MAX_LENGTH) throw new Error('Paste a link or a short message containing one (up to 2,100 characters).');
  const text = input.trim();
  if (DANGEROUS_SCHEMES.test(text)) throw new Error('Only ordinary http:// or https:// website links can be checked.');
  // Copy-pasted WhatsApp invitations often contain text before their links.
  const match = text.match(/https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+/i);
  let candidate = match?.[0];
  if (!candidate && /^[^\s/]+\.[a-z]{2,}(?:[/?#:]\S*)?$/i.test(text)) candidate = text;
  if (!candidate) throw new Error('No website link found. Paste a complete URL starting with https://.');
  candidate = candidate.replace(/[.,;!?\])}]+$/g,'');
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) throw new Error('The link contains invalid characters.');
  let parsed;
  try {parsed = new URL(candidate);} catch {throw new Error('This URL is not valid. Please check and paste it again.');}
  if (!['http:','https:'].includes(parsed.protocol) || !parsed.hostname || !parsed.hostname.includes('.') && !isIP(parsed.hostname.replace(/[\[\]]/g,''))) {
    throw new Error('Only public website links starting with http:// or https:// are supported.');
  }
  if (parsed.href.length > LINK_MAX_LENGTH) throw new Error('The link is too long to check.');
  return {url:parsed,original: candidate, accompanyingText:text.replace(match?.[0]||text,'').trim()};
}

function privateAddress(host) {
  const value=host.replace(/^\[|\]$/g,'');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (isIP(value)===6) return true; // All IPv6 literals are blocked for the optional reputation path.
  if (!isIP(value)) return false;
  const [a,b]=value.split('.').map(Number);
  return a===10 || a===127 || a===0 || a===192 && b===168 || a===172 && b>=16 && b<=31 || a===169 && b===254 || a>=224 || a===100 && b>=64 && b<=127 || a===192 && b===0;
}
function uniqueSignals(list) {return list.slice(0,8);}
export function assessLink(input,context='') {
  const {url,accompanyingText}=extractLink(input);
  if(typeof context !== 'string'||context.length>CONTEXT_MAX_LENGTH)throw new Error('The offer description must be 1,500 characters or fewer.');
  const host=url.hostname.toLowerCase();
  const hostLabel=host.replace(/^www\./,'');
  const combined=`${accompanyingText} ${context} ${decodeURIComponentSafe(url.pathname)} ${decodeURIComponentSafe(url.search)}`;
  const signals=[];
  let score=0;
  const push=(severity,title,detail,points)=>{signals.push({severity,title,detail});score+=points;};

  if(privateAddress(hostLabel)) push('high','Non-public address','This address points to a local or private destination, not a normal public website.',65);
  if(url.username||url.password) push('high','Hidden sign-in in URL','Text before @ can make a link appear to belong to another site.',65);
  if(isIP(hostLabel)) push('high','Numeric website address','The link uses an IP address instead of a recognizable website name.',35);
  if(hostLabel.includes('xn--')) push('high','Lookalike character risk','The domain contains encoded international characters that can resemble familiar letters.',38);
  if(url.protocol!=='https:') push('medium','No HTTPS','The link does not use an encrypted HTTPS connection.',18);
  if(SHORTENERS.has(hostLabel)) push('medium','Destination concealed','This shortened link hides its final destination. Do not open it to find out.',26);
  if(hostLabel.split('.').length >= 5) push('medium','Unusually long subdomain','Extra domain levels can hide the real site owner.',18);
  if((hostLabel.match(/-/g)||[]).length >= 3) push('medium','Complex domain name','Many hyphens can be used in imitation or throwaway domains.',12);
  if(suspiciousTlds.has(hostLabel.split('.').at(-1))) push('medium','Extra verification advised','This domain ending sometimes appears in short-lived promotional links. The ending alone is not proof of fraud.',9);
  if(url.port && !['80','443'].includes(url.port)) push('medium','Unusual network port','The URL uses a nonstandard port, which merits checking.',14);
  if(url.href.includes('%40') || /(?:\/|\.)@/.test(url.href)) push('medium','Obscured address text','The link contains an @ character or encoding that deserves a closer look.',13);

  const investment=/(invest(?:ment)?|daily\s*(?:earning|return|profit|tasks?)|roi|trading|earn(?:ing)?(?:\s+(?:money|ugx|cash|from|with))?|vip\s*(?:package|plan)|recharge|crypto|passive\s*income|buy\s*(?:a|the)\s*package|task\s*commission)/i.test(combined);
  const guaranteed=/(guaranteed|risk[ -]?free|100%\s*(?:sure|profit)|double\s*(?:your|the)\s*money|(?:daily|weekly)\s*(?:profit|return|interest)|\d+%\s*(?:daily|per day)|instant\s*(?:returns|profits))/i.test(combined);
  const deposits=/(?:pay|deposit|top[ -]?up|send|recharge|transfer|activation\s*fee|withdrawal\s*fee|unlock\s*(?:your|the)\s*(?:cash|balance))\b.{0,50}(?:ugx|shs|money|cash|fee|\d{4,})|(?:ugx|shs)\s*[\d,]+/i.test(combined);
  const recruitment=/(?:refer|referral|invite\s*(?:friends|others|people)|recruit|downline|commission\s*per\s*person|team\s*bonus)/i.test(combined) || [...url.searchParams.keys()].some(key=>/^(ref|referrer|invite|referredby|sponsor|agentid)$/i.test(key));
  const urgency=/(?:expires?\s*(?:today|soon)|only\s*today|limited\s*(?:slots|time)|join\s*now|act\s*fast|deadline|withdraw\s*now)/i.test(combined);
  const verification=/(?:pin|otp|one[ -]?time\s*(?:code|password)|password|verify\s*(?:your|account)|kyc)/i.test(combined);
  const sensitiveParams=[...url.searchParams.keys()].some(key=>/^(?:password|pass|pin|otp|token|access_token|auth|apikey|api_key|session|sessionid)$/i.test(key));
  if(sensitiveParams)push('high','Private token in URL','The address contains a parameter normally used for a password, token or access code. Do not share it publicly.',30);
  const claimedHut8=/(?:hut[\s._-]*8|heart\s*aid)/i.test(`${hostLabel} ${combined}`);
  const officialHut8=hostLabel==='hut8.com'||hostLabel.endsWith('.hut8.com');
  if(/hut[._-]*8/i.test(hostLabel) && !officialHut8)push('medium','Possible Hut 8 name imitation','This website resembles the Hut 8 name but is not on the company’s published hut8.com domain. Verify through the company’s own site.',28);

  if(guaranteed) push('high','Guaranteed profits claimed','Promises of guaranteed or unusually fast returns are a serious investment warning sign.',39);
  if(investment && deposits) push('high','Investment linked to payments','The pitch combines investing or earning with a request to send or deposit money.',31);
  else if(deposits) push('medium','Money request','The offer asks for a payment or deposit. Check the organization and terms independently.',20);
  else if(investment) push('medium','Online earning pitch','Confirm that the company is registered and licensed before sending money.',15);
  if(recruitment && investment) push('high','Recruitment-linked earnings','Earnings tied to referrals can signal a pyramid-style operation. Verify the business model.',34);
  else if(recruitment) push('medium','Referral or invite link','The offer uses a referral code or recruits other users. That alone does not establish fraud.',12);
  if(verification) push('high','Sensitive account information','The offer mentions PINs, passwords or verification steps. Do not enter credentials until verified.',22);
  if(urgency) push('medium','Pressure to act quickly','Time pressure can make it harder to review an offer carefully.',12);
  if(claimedHut8 && investment && !officialHut8) push('high','Hut 8 impersonation warning','Uganda Police reported investment solicitations using the Hut 8 name. That does not implicate the legitimate company; confirm with its official channels.',40);

  const risk=score>=60?'high':score>=24?'medium':'low';
  const status = risk==='high' ? 'Strong warning signs' : risk==='medium' ? 'Needs closer review' : 'No strong signals found';
  const primary=risk==='high'?'Do not pay, register or enter a PIN through this link before independent verification.':risk==='medium'?'Pause and verify the organization, offer and exact website address independently.':'No major patterns were found in the URL and supplied description. This does not mean it is safe.';
  const actions=risk==='low'? [primary,'Visit the organization using its independently confirmed official address, not the supplied link.','For any money-related offer, confirm licensing with Uganda’s financial regulators.'] : [primary,'Check financial licensing or registration through Uganda’s official regulators, not through the link.', 'If you already sent money, contact your payment provider using its official support channel.'];
  return {
    risk,status,summary:primary,hostname:host,displayUrl:`${url.protocol}//${host}${url.port?`:${url.port}`:''}`,
    signals:uniqueSignals(signals),actions,checked:{structure:true,offer:Boolean(accompanyingText || context.trim()),reputation:'not-configured'},
    // Keep the URL only in a non-public internal property; route responses omit it.
    _url:url.href,_allowReputation:!privateAddress(host) && !url.username && !url.password && !sensitiveParams
  };
}
function decodeURIComponentSafe(text) {try{return decodeURIComponent(text)}catch{return text}}

/** Optional Web Risk verification: a *fixed* Google endpoint, never the submitted URL. */
export async function lookupWebRisk(url,key,{fetchImpl=fetch,timeoutMs=4500}={}) {
  if(!key) return {status:'not-configured'};
  const query=new URL('https://webrisk.googleapis.com/v1/uris:search');
  query.searchParams.append('threatTypes','MALWARE');
  query.searchParams.append('threatTypes','SOCIAL_ENGINEERING');
  query.searchParams.append('threatTypes','UNWANTED_SOFTWARE');
  query.searchParams.set('uri',url);
  query.searchParams.set('key',key);
  try {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const res=await fetchImpl(query.toString(),{signal:controller.signal,headers:{Accept:'application/json'},redirect:'error'});
      if(!res.ok){
        // Log only a status code and allowlisted provider category.
        // Never log the submitted URL, API key or raw Google response.
        let providerStatus = 'UNKNOWN';
        try {
          const body = await res.json();
          const safeStatuses = new Set(['INVALID_ARGUMENT','PERMISSION_DENIED','UNAUTHENTICATED','RESOURCE_EXHAUSTED','FAILED_PRECONDITION','UNAVAILABLE']);
          if(safeStatuses.has(body?.error?.status))providerStatus=body.error.status;
        } catch { /* Some responses are not JSON. */ }
        console.warn(`[SenteShield Web Risk] lookup error HTTP ${Number(res.status)||0}, category ${providerStatus}`);
        return {status:'unavailable'};
      }
      const data=await res.json();
      return data?.threat?.threatTypes?.length?{status:'matched',types:data.threat.threatTypes.filter(x=>typeof x==='string').slice(0,3)}:{status:'no-match'};
    }finally{clearTimeout(timer)}
  }catch(error){
    const category=error?.name==='AbortError'?'TIMEOUT':'NETWORK_OR_RESPONSE_ERROR';
    console.warn(`[SenteShield Web Risk] lookup error ${category}`);
    return {status:'unavailable'};
  }
}
export async function scanLink(input,context='',{webRiskKey=process.env.WEB_RISK_API_KEY||'',fetchImpl=fetch}={}) {
  const assessment=assessLink(input,context);
  let reputation={status:'not-configured'};
  if(webRiskKey && assessment._allowReputation) reputation=await lookupWebRisk(assessment._url,webRiskKey,{fetchImpl});
  else if(webRiskKey) reputation={status:'not-checked'};
  assessment.checked.reputation=reputation.status;
  if(reputation.status==='matched'){
    assessment.risk='high'; assessment.status='Known threat warning';
    assessment.summary='This link matches a Google Web Risk threat list. Do not open it or share information there.';
    assessment.signals.unshift({severity:'high',title:'Listed by Web Risk',detail:`A security threat list flagged this URL (${(reputation.types||[]).join(', ')}).`});
    assessment.actions[0]='Do not visit this page, pay, download files, or enter credentials.';
  }
  if(reputation.status==='no-match')assessment.checked.reputation='no-match';
  if(reputation.status==='unavailable')assessment.checked.reputation='unavailable';
  const {_url,_allowReputation,...publicResult}=assessment;
  return publicResult;
}
