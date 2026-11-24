'use strict';
const $ = id => document.getElementById(id);
const examples = {
  account: 'URGENT: Your MTN MoMo account has been blocked. To unlock it immediately, send UGX 20,000 and share your secret PIN with the support agent.',
  prize: 'CONGRATULATIONS! You won UGX 5,000,000 in our promotion. Claim your cash prize today. Pay a processing fee of UGX 50,000 before 6 PM and click http://bit.ly/claim-reward-now',
  authority: 'FINAL NOTICE: This is URA enforcement. Pay your outstanding UGX 85,000 compliance fee immediately through this personal mobile money number or your account will be suspended.',
  normal: 'Hello Sarah, are we still meeting tomorrow at 2pm at the library to work on the assignment? Please let me know.'
};
const message = $('message');
const analyze = $('analyze');
let lastAssessment = null;
let lastMode = null;
let toastTimer;

function safeScroll(element) {
  element?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
}
function updateCount(){
  $('count').textContent = `${message.value.length} / 1600`;
  $('count').classList.toggle('near-limit', message.value.length > 1500);
  $('clearBtn').disabled = !message.value.length;
  $('error').hidden = true;
}
function showToast(text) {
  clearTimeout(toastTimer);
  const toast = $('toast');
  toast.textContent = text; toast.hidden = false;
  toastTimer = setTimeout(() => {toast.hidden = true}, 3400);
}
function showError(text){ $('error').textContent=text; $('error').hidden=false; $('error').scrollIntoView({block:'nearest'}); }
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
message.addEventListener('input', updateCount);
$('clearBtn').addEventListener('click', () => {message.value='';updateCount();message.focus()});
$('pasteBtn').addEventListener('click', async () => {
  try { if (!navigator.clipboard?.readText) throw new Error('Clipboard not available');
    const pasted=await navigator.clipboard.readText();
    if(!pasted.trim())return showToast('Your clipboard is empty.');
    message.value=pasted.slice(0,1600);updateCount();message.focus();showToast('Text pasted. Remove any private details before scanning.');
  } catch {showToast('Paste is unavailable here. Press and hold in the box, then choose Paste.');}
});
for(const btn of document.querySelectorAll('[data-example]')) {
 btn.addEventListener('click',()=>{
   document.querySelectorAll('[data-example]').forEach(x=>x.classList.remove('selected'));
   btn.classList.add('selected');
   message.value=examples[btn.dataset.example];updateCount();
   $('results').hidden=true;
   message.focus({preventScroll:true});safeScroll($('scanner'));
   showToast('Example loaded. Select Scan my message to analyze it.');
 });
}
const navToggle=$('menuToggle');
navToggle.addEventListener('click',()=>{const open=navToggle.getAttribute('aria-expanded')==='true';navToggle.setAttribute('aria-expanded',String(!open));$('primaryNav').classList.toggle('open',!open)});
document.querySelectorAll('#primaryNav a').forEach(a=>a.addEventListener('click',()=>{navToggle.setAttribute('aria-expanded','false');$('primaryNav').classList.remove('open')}));

function setBusy(busy){
 analyze.disabled=busy;
 analyze.classList.toggle('loading',busy);
 $('analyzeText').textContent=busy?'Reading the signals…':'Scan my message';
 $('scanArrow').textContent=busy?'···':'↗';
 analyze.setAttribute('aria-busy',String(busy));
}
function renderAssessment(data,mode) {
 lastAssessment=data;lastMode=mode;
 const risk = String(data.risk || 'Medium').toLowerCase();
 const verdict=$('riskOrb').closest('.verdict-panel');
 verdict.classList.remove('risk-high','risk-medium','risk-low');
 verdict.classList.add(`risk-${risk}`);
 $('riskBadge').textContent=`${data.risk} risk`;
 $('riskIcon').textContent=risk==='low'?'✓':risk==='medium'?'!':'⚠';
 $('summary').textContent=data.summary;
 $('disclaimer').textContent=data.disclaimer || 'A text-based warning, not proof of fraud or safety.';
 $('resultMode').textContent=mode==='ai'?'GEMINI AI ASSESSMENT':'RULE-BASED PREVIEW';
 const flags=$('flags'); flags.replaceChildren();
 if(!data.redFlags?.length) flags.append(element('p','empty-flags','No specific red flags were identified. This does not confirm the sender is genuine.'));
 for(const [i,flag] of (data.redFlags||[]).entries()){
  const item=element('article','finding');
  const num=element('span','finding-num',String(i+1).padStart(2,'0'));
  const info=element('div','finding-copy');
  info.append(element('strong','',flag.phrase));info.append(element('p','',flag.reason));
  item.append(num,info);flags.append(item);
 }
 const actions=$('actions');actions.replaceChildren();
 for(const a of data.actions||[]) actions.append(element('li','',a));
 $('results').hidden=false;
 window.requestAnimationFrame(()=>safeScroll($('results')));
}
async function performAnalysis(){
 const value=message.value.trim();
 if(value.length<10){showError('Paste at least 10 characters so we have something to check.');message.focus();return;}
 if(value.length>1600){showError('Your message is too long. Keep it under 1,600 characters.');return;}
 $('error').hidden=true;setBusy(true);
 try {
  const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,language:$('language').value})});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||'Could not analyze this message. Try again.');
  renderAssessment(payload.result,payload.mode);
  if(payload.mode==='demo') showToast(payload.notice || 'This is a rule-based preview. Connect Gemini for live AI analysis.');
 }catch(err){showError(err.message||'Something went wrong. Try again.');}
 finally{setBusy(false);}
}
analyze.addEventListener('click',performAnalysis);
$('resetBtn').addEventListener('click',()=>{$('results').hidden=true;message.value='';updateCount();document.querySelectorAll('[data-example]').forEach(x=>x.classList.remove('selected'));message.focus({preventScroll:true});safeScroll($('scanner'));});
function adviceText(){
 return `SenteShield AI — ${lastAssessment.risk} risk (${lastMode==='ai'?'Gemini AI':'rule-based preview'})\n\n${lastAssessment.summary}\n\nPossible warning signs:\n${(lastAssessment.redFlags||[]).map(x=>`• ${x.phrase}: ${x.reason}`).join('\n')||'None specifically identified'}\n\nSafer actions:\n${(lastAssessment.actions||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nThis does not verify a sender or guarantee safety. Never share your PIN or OTP.`;
}
async function copyGuidance(){if(!lastAssessment)return;
 try{await navigator.clipboard.writeText(adviceText());showToast('Safety guidance copied.');}
 catch{showToast('Copy unavailable. Select the advice text and copy manually.');}
}
$('copyAdvice').addEventListener('click',copyGuidance);
$('shareAdvice').addEventListener('click',async()=>{
 if(!lastAssessment)return;
 if(navigator.share){try{await navigator.share({title:'SenteShield AI — message safety',text:adviceText()});}catch(e){if(e.name!=='AbortError')showToast('Sharing is unavailable on this device.');}}
 else await copyGuidance();
});
$('footerYear').textContent=String(new Date().getFullYear());
fetch('/api/health').then(r=>r.json()).then(data=>{
 const status=$('modeStatus');status.replaceChildren();
 status.append(element('span','status-dot'));
 status.append(document.createTextNode(data.aiConfigured?' AI configured':' Rules-only preview'));
 status.classList.toggle('demo',!data.aiConfigured);
}).catch(()=>{$('modeStatus').textContent=' Connection unavailable';$('modeStatus').classList.add('demo');});
updateCount();
