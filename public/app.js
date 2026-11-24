'use strict';

const $ = id => document.getElementById(id);
const examples = {
  account: 'URGENT: Your MTN MoMo account has been blocked. To unlock it immediately, send UGX 20,000 and share your secret PIN with the support agent.',
  prize: 'CONGRATULATIONS! You won UGX 5,000,000 in our promotion. Claim your cash prize today. Pay a processing fee of UGX 50,000 before 6 PM and click http://bit.ly/claim-reward-now',
  authority: 'FINAL NOTICE: This is URA enforcement. Pay your outstanding UGX 85,000 compliance fee immediately through this personal mobile money number or your account will be suspended.',
  normal: 'Hello Sarah, are we still meeting tomorrow at 2pm at the library to work on the assignment? Please let me know.'
};
const localChecks = [
  {re:/\b(pin|otp|password|verification code|secret code|security code)\b/i,label:'Security code mentioned'},
  {re:/\b(urgent|immediately|last chance|blocked|suspended|act now|within \d+|expire)\b/i,label:'Pressure or urgency'},
  {re:/\b(pay|send|deposit|transfer|processing fee|ugx|cash[- ]?out|shillings)\b/i,label:'Payment or transfer'},
  {re:/\b(won|prize|lottery|jackpot|reward|giveaway|winner)\b/i,label:'Unexpected reward'},
  {re:/(?:https?:\/\/|www\.|bit\.ly|tinyurl)/i,label:'Unverified link'},
  {re:/\b(ura|mtn|airtel|police|bank|official|support agent)\b/i,label:'Company or authority named'}
];
const viewTitles = {scan:'Message scanner',links:'Link scanner',activity:'Recent checks',safety:'Safety guide'};
const message = $('message');
const analyze = $('analyze');
const sessionChecks = [];
let latest = null;
let latestMode = 'demo';
let scanController = null;
let toastTimer = null;
let scanning = false;
let mobileMenuIsOpen = false;
const settingsKey = 'senteshield.preferences.v1';
let runtimeSettings = {theme:'dark',motion:'normal'};
const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function icon(name, className='') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  if (className) svg.setAttribute('class',className);
  svg.setAttribute('aria-hidden','true');
  const use = document.createElementNS('http://www.w3.org/2000/svg','use');
  use.setAttribute('href',`#i-${name}`);
  svg.append(use);
  return svg;
}
function node(tag, className='', text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}
function scrollToElement(element) {
  element?.scrollIntoView({behavior:mediaReduced.matches || document.documentElement.dataset.reduceMotion === 'true' ? 'instant' : 'smooth',block:'start'});
}
function notify(text) {
  window.clearTimeout(toastTimer);
  $('toastText').textContent = text;
  $('toast').hidden = false;
  toastTimer = window.setTimeout(() => {$('toast').hidden = true;},3200);
}
function showError(text) {$('error').textContent=text;$('error').hidden=false;}
function clearError() {$('error').hidden=true;$('error').textContent='';}

function openMenu() {
  mobileMenuIsOpen = true;
  $('sidebar').classList.add('open');
  $('sidebarScrim').hidden = false;
  $('menuBtn').setAttribute('aria-expanded','true');
  document.body.classList.add('nav-open');
}
function closeMenu() {
  mobileMenuIsOpen = false;
  $('sidebar').classList.remove('open');
  $('sidebarScrim').hidden = true;
  $('menuBtn').setAttribute('aria-expanded','false');
  document.body.classList.remove('nav-open');
}
$('menuBtn').addEventListener('click',()=>mobileMenuIsOpen?closeMenu():openMenu());
$('sidebarScrim').addEventListener('click',closeMenu);
window.addEventListener('resize',()=>{if(window.innerWidth>1030&&mobileMenuIsOpen)closeMenu();});
function changeView(view, updateHash=true) {
  if (!viewTitles[view]) return;
  for(const page of document.querySelectorAll('.view')) {
    const active=page.id===`view-${view}`;
    page.hidden=!active;
    page.classList.toggle('active',active);
  }
  for(const btn of document.querySelectorAll('.nav-link')) {
    const active=btn.dataset.view===view;
    btn.classList.toggle('active',active);
    if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  }
  $('breadcrumb').textContent=viewTitles[view];
  closeMenu();
  if(view==='activity') renderHistory();
  if(updateHash && window.location.hash!==`#${view}`) history.replaceState(null,'',`#${view}`);
  window.scrollTo({top:0,behavior:'instant'});
}
for(const element of document.querySelectorAll('[data-view]'))element.addEventListener('click',()=>changeView(element.dataset.view));
window.addEventListener('hashchange',()=>changeView(location.hash.replace('#',''),false));

function selectedExample(button) {
  document.querySelectorAll('[data-example]').forEach(btn =>btn.classList.toggle('selected',btn===button));
}
function renderSignals() {
  const text=message.value.trim();
  const matches=text?localChecks.filter(item=>item.re.test(text)):[];
  const count=matches.length;
  $('signalCount').textContent=String(count).padStart(2,'0');
  $('signalHeading').textContent=!text?'Ready when you are.':count?`${count} warning ${count===1?'pattern':'patterns'} found`:'No common pattern detected';
  $('signalSummary').textContent=!text?'Paste a message to check for familiar warning patterns.':count?'These are clues in the text. Run a full check for context.':'That does not confirm the sender or link is genuine.';
  const list=$('liveSignals');list.replaceChildren();
  if(!text){list.append(node('div','signal-placeholder','No message entered yet.'));return;}
  if(!count){const item=node('div','signal-item no-signals');item.append(node('i'),node('span','','No obvious pattern in this message.'));list.append(item);return;}
  for(const match of matches.slice(0,6)) {
    const item=node('div','signal-item');item.append(node('i'),node('span','',match.label));list.append(item);
  }
}
function updateInput() {
  $('count').textContent=`${message.value.length} / 1600`;
  $('count').classList.toggle('near-limit',message.value.length>1500);
  $('clearBtn').disabled=!message.value.length;
  if(!$('results').hidden){$('results').hidden=true;latest=null;}
  clearError();
  renderSignals();
}
message.addEventListener('input',()=>{selectedExample(null);updateInput();});
$('clearBtn').addEventListener('click',()=>{message.value='';selectedExample(null);updateInput();message.focus();});
$('language').addEventListener('change',()=>{if(!$('results').hidden){$('results').hidden=true;latest=null;notify('Language updated. Run another check for a fresh result.');}});
$('pasteBtn').addEventListener('click',async()=>{
  try{
    if(!navigator.clipboard?.readText)throw new Error('Clipboard unavailable');
    const value=await navigator.clipboard.readText();
    if(!value.trim())return notify('Your clipboard is empty.');
    message.value=value.slice(0,1600);selectedExample(null);updateInput();message.focus();notify('Pasted. Remove private details before scanning.');
  }catch{notify('Tap the message box and use your device’s Paste action.');message.focus();}
});
for(const btn of document.querySelectorAll('[data-example]'))btn.addEventListener('click',()=>{
  message.value=examples[btn.dataset.example];selectedExample(btn);updateInput();message.focus({preventScroll:true});
  if(window.innerWidth<760)scrollToElement($('scanner'));
});

function renderResult(data, mode='demo', record=true) {
  const risk=['low','medium','high'].includes(String(data.risk||'').toLowerCase())?String(data.risk).toLowerCase():'medium';
  const box=$('results');
  box.classList.remove('risk-low','risk-medium','risk-high');box.classList.add(`risk-${risk}`);
  latest=data;latestMode=mode;
  $('riskBadge').textContent=`${risk[0].toUpperCase()+risk.slice(1)} risk`;
  $('riskLevel').textContent=risk==='high'?'CAUTION':risk==='medium'?'REVIEW':'LOWER RISK';
  $('resultMode').textContent=mode==='ai'?'Detailed message check':'Quick check · pattern-based';
  $('summary').textContent=data.summary||'Please verify the request independently.';
  $('disclaimer').textContent=mode==='ai'?
    'This text check cannot verify who sent the message. It can miss scams or flag legitimate messages.':
    'This is a pattern-based check, not a sender verification. It may miss important risks.';
  const flags=$('flags');flags.replaceChildren();
  if(!Array.isArray(data.redFlags)||!data.redFlags.length)flags.append(node('p','flag-empty','No specific warning signs in this check. This does not prove the request is safe.'));
  else for(const flag of data.redFlags.slice(0,5)){
    const item=node('div','finding');item.append(node('strong','',flag.phrase||'Potential warning'),node('p','',flag.reason||'Verify independently.'));flags.append(item);
  }
  const actions=$('actions');actions.replaceChildren();
  for(const action of(Array.isArray(data.actions)?data.actions:[]).slice(0,4))actions.append(node('li','',action));
  box.hidden=false;
  if(record){
    // The session timeline never stores the user's original message.
    sessionChecks.unshift({time:Date.now(),risk,mode,kind:'message',data:JSON.parse(JSON.stringify(data))});
    if(sessionChecks.length>12)sessionChecks.pop();
    $('historyCount').textContent=String(sessionChecks.length);
  }
  window.requestAnimationFrame(()=>scrollToElement(box));
}
function setLoading(active){
  scanning=active;analyze.disabled=active;analyze.setAttribute('aria-busy',String(active));
  $('loadingOverlay').hidden=!active;
  $('analyzeText').textContent=active?'Checking…':'Check message';
  if(active){$('loadingTitle').textContent='Checking your message';$('loadingSubtitle').textContent='Looking for warning signs and safer next steps.';}
}
async function runScan(){
  if(scanning)return;
  const text=message.value.trim();
  if(text.length<10)return showError('Please enter at least 10 characters.');
  if(text.length>1600)return showError('Messages must be 1,600 characters or fewer.');
  clearError();setLoading(true);
  const controller=new AbortController();scanController=controller;
  const timer=window.setTimeout(()=>controller.abort('timeout'),29000);
  try{
    const response=await fetch('/api/analyze',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,language:$('language').value}),signal:controller.signal,cache:'no-store'
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(payload?.error||'Scanner unavailable. Please try again.');
    if(!payload?.result)throw new Error('The scanner returned an unexpected response.');
    renderResult(payload.result,payload.mode,true);
    if(payload.mode!=='ai')notify('Quick pattern check completed. Detailed analysis is unavailable.');
  }catch(error){
    if(controller.signal.aborted){
      if(controller.signal.reason==='user')notify('Check cancelled.');
      else showError('This check timed out. Please try again.');
    }else showError(error?.message||'Unable to analyze this message.');
  }finally{
    window.clearTimeout(timer);if(scanController===controller)scanController=null;setLoading(false);
  }
}
analyze.addEventListener('click',runScan);
$('cancelScan').addEventListener('click',()=>scanController?.abort('user'));
message.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();runScan();}});
$('resetBtn').addEventListener('click',()=>{
  latest=null;$('results').hidden=true;message.value='';selectedExample(null);updateInput();message.focus({preventScroll:true});scrollToElement($('scanner'));
});
function summaryText(){
  if(!latest)return'';
  const flags=(latest.redFlags||[]).map(f=>`• ${f.phrase}: ${f.reason}`).join('\n')||'None identified';
  const actions=(latest.actions||[]).map((x,i)=>`${i+1}. ${x}`).join('\n');
  return `SenteShield — ${latest.risk} risk (${latestMode==='ai'?'detailed':'quick'} check)\n\n${latest.summary}\n\nWarning signs:\n${flags}\n\nNext steps:\n${actions}\n\nText checks cannot authenticate senders. Never share your PIN or OTP.`;
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);notify('Copied to clipboard.');}
  catch{notify('Copy is unavailable. Please use your device’s copy option.');}
}
$('copyAdvice').addEventListener('click',()=>{if(latest)copyText(summaryText());});
$('shareAdvice').addEventListener('click',async()=>{
  if(!latest)return;
  if(navigator.share){try{await navigator.share({title:'SenteShield assessment',text:summaryText()});}
    catch(e){if(e.name!=='AbortError')notify('Sharing is unavailable.');}}
  else await copyText(summaryText());
});
function renderHistory(){
  const list=$('historyList');list.replaceChildren();
  $('activityTotal').textContent=String(sessionChecks.length);
  $('clearHistory').disabled=!sessionChecks.length;
  if(!sessionChecks.length){
    const empty=node('div','empty-history');const img=node('span','empty-history-icon');img.append(icon('clock'));
    const primary=node('button','primary-btn small-primary','Start a check');primary.type='button';primary.append(icon('arrow'));primary.addEventListener('click',()=>changeView('scan'));
    empty.append(img,node('h3','','No checks yet'),node('p','','Scan a message to see its assessment here during this tab session.'),primary);list.append(empty);return;
  }
  sessionChecks.forEach((entry)=>{
    const btn=node('button','history-item');btn.type='button';
    const emblem=node('span',`history-icon ${entry.risk}`);emblem.append(icon('shield'));
    const label=node('span','history-text');label.append(node('strong','',`${entry.risk[0].toUpperCase()+entry.risk.slice(1)} risk · ${entry.kind==='link'?'Link':entry.mode==='ai'?'Detailed':'Quick'} check`),node('span','',entry.data.summary||'Message check'));
    const time=node('time','history-time',new Date(entry.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
    btn.append(emblem,label,time,icon('arrow','history-arrow'));
    btn.addEventListener('click',()=>{if(entry.kind==='link'){changeView('links');renderLinkResult(entry.data,false);}else{changeView('scan');renderResult(entry.data,entry.mode,false);}});list.append(btn);
  });
}

const dialog=$('appDialog');
function closeDialog(){if(dialog.open)dialog.close();document.body.classList.remove('dialog-open');}
$('closeDialog').addEventListener('click',closeDialog);
dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
function dialogMarkup(title,body){const content=$('dialogContent');content.replaceChildren();const heading=node('h2','',title);heading.id='dialogTitle';content.append(heading,...body);}
function paragraph(text){return node('p','',text);}
function bulletList(lines){const ul=node('ul','dialog-list');for(const line of lines)ul.append(node('li','',line));return ul;}
function dialogActions(buttons){const area=node('div','dialog-actions');for(const item of buttons){const button=node('button',item.className||'secondary-btn',item.text);button.type='button';button.addEventListener('click',item.click);area.append(button);}return area;}
function openDialog(type){
  closeMenu();
  if(type==='help')dialogMarkup('A safer way to check',[
    paragraph('When an unexpected message asks you for money, a code, or an urgent response:'),
    bulletList(['Use the Link scanner for unfamiliar URLs. It does not open the page or confirm a business license.','Pause. Do not click links or send money immediately.','Check the sender using an official app or a phone number you found yourself.','Never disclose a PIN, OTP or password, even to someone claiming to be support.','Use this scanner for clues, not as proof that a sender is genuine.']),
    node('div','dialog-note','If money has already been sent, contact your provider promptly through its official support channels.'),
    dialogActions([{text:'Got it',className:'primary-btn',click:closeDialog}])
  ]);
  else if(type==='privacy')dialogMarkup('Your privacy matters',[
    paragraph('SenteShield does not require sign-up and does not save your submitted message in a database.'),
    bulletList(['Instant pattern hints run in your browser.','When you select Check message, a masked version of the text is sent to the SenteShield server.','If detailed analysis is configured, the masked text is processed by the model provider.','Phone numbers, emails and some code patterns are masked, but automatic masking can miss details. Remove anything private yourself.','Link scans inspect URL structure and offer claims without opening the submitted page.','If Google Web Risk is enabled by the site owner, the submitted URL is shared with Google for a threat-list lookup. This may include its query parameters: remove sensitive tokens first.','A missing threat-list match is not certification that a site is safe.','Recent checks contain result summaries and hostnames only, and are cleared when you reload.']),
    node('div','dialog-note','A risk label is a cautionary assessment, not proof of an authentic or fraudulent sender.'),
    dialogActions([{text:'Understood',className:'primary-btn',click:closeDialog}])
  ]);
  else if(type==='settings'){
    const current=readSettings();
    const themeRow=node('div','preference-row');const themeCopy=node('div');themeCopy.append(node('strong','','Appearance'),node('span','','Choose a comfortable interface.'));
    const themeSelect=node('select');themeSelect.setAttribute('aria-label','Appearance');for(const [value,label] of [['dark','Midnight'],['light','Daylight']]){const opt=node('option','',label);opt.value=value;themeSelect.append(opt);}themeSelect.value=current.theme;themeSelect.addEventListener('change',()=>saveSettings({...readSettings(),theme:themeSelect.value}));themeRow.append(themeCopy,themeSelect);
    const motionRow=node('div','preference-row');const motionCopy=node('div');motionCopy.append(node('strong','','Motion'),node('span','','Reduce interface animations.'));
    const motionSelect=node('select');motionSelect.setAttribute('aria-label','Motion');for(const [value,label] of [['normal','Standard'],['reduced','Reduced']]){const opt=node('option','',label);opt.value=value;motionSelect.append(opt);}motionSelect.value=current.motion;motionSelect.addEventListener('change',()=>saveSettings({...readSettings(),motion:motionSelect.value}));motionRow.append(motionCopy,motionSelect);
    dialogMarkup('Your preferences',[paragraph('Adjust how SenteShield looks and feels on this device.'),themeRow,motionRow,node('div','dialog-note','Preferences are saved on this device. Messages and scan history are not.'),dialogActions([{text:'Done',className:'primary-btn',click:closeDialog}])]);
  }else if(type==='clear-history')dialogMarkup('Clear recent checks?',[
    paragraph('This removes the assessment summaries from the current tab. This cannot be undone.'),
    dialogActions([{text:'Keep checks',click:closeDialog},{text:'Clear session',className:'primary-btn',click:()=>{sessionChecks.length=0;$('historyCount').textContent='0';renderHistory();closeDialog();notify('Session cleared.');}}])
  ]);
  else return;
  if(!dialog.open)dialog.showModal();document.body.classList.add('dialog-open');
}
for(const button of document.querySelectorAll('[data-open]'))button.addEventListener('click',()=>openDialog(button.dataset.open));
$('clearHistory').addEventListener('click',()=>{if(sessionChecks.length)openDialog('clear-history');});

function readSettings(){
  try{
    const raw=localStorage.getItem(settingsKey);
    if(!raw)return {...runtimeSettings};
    const value=JSON.parse(raw);
    return {theme:value.theme==='light'?'light':'dark',motion:value.motion==='reduced'?'reduced':'normal'};
  }catch{return {...runtimeSettings};}
}
function saveSettings(settings){
  const chosen={theme:settings.theme==='light'?'light':'dark',motion:settings.motion==='reduced'?'reduced':'normal'};
  runtimeSettings=chosen;
  try{localStorage.setItem(settingsKey,JSON.stringify(chosen));}catch{}
  applySettings(chosen);
}
function applySettings(settings){
  document.documentElement.dataset.theme=settings.theme;
  document.documentElement.dataset.reduceMotion=String(settings.motion==='reduced');
  const themeColor=document.querySelector('meta[name="theme-color"]');if(themeColor)themeColor.content=settings.theme==='light'?'#edf1f4':'#0a0e17';
  const favicon=document.querySelector('link[rel="icon"]');if(favicon)favicon.href=settings.theme==='light'?'./favicon-light.svg':'./favicon-dark.svg';
}
async function checkConnection(){
  const status=$('connection');status.classList.remove('basic','offline');
  try{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);
    let response;try{response=await fetch('/api/health',{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
    if(!response.ok)throw new Error('unavailable');
    const data=await response.json();
    status.classList.toggle('basic',!data.aiConfigured);
    $('connectionText').textContent=data.aiConfigured?'Full check ready':'Quick check ready';
  }catch{status.classList.add('offline');$('connectionText').textContent='Service unavailable';}
}


// Link Intelligence: no submitted URL is opened, embedded, or requested by the browser.
const linkInput=$('linkInput');
const linkContext=$('linkContext');
const linkSamples={
  investment:{link:'https://hut8-offer.example/register?ref=UG124',context:'Join Hut 8 investment Uganda, deposit UGX 100,000 and earn guaranteed 20% daily returns.'},
  referral:{link:'https://myd-cash.example/signup?ref=INVITE123',context:'Join our earning app, deposit UGX 50,000, recruit 3 friends and earn daily task commission.'},
  short:{link:'https://bit.ly/reward-claim-demo',context:'Click to claim a prize. Pay the activation fee today to unlock your cash.'},
  ordinary:{link:'https://www.wikipedia.org/wiki/Uganda',context:''}
};
let linkBusy=false;
let latestLink=null;
function pickLinkExample(active){
  for(const btn of document.querySelectorAll('[data-link-example]'))btn.classList.toggle('selected',btn===active);
}
function extractPreview(text){
  const found=text.match(/https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+/i);
  const candidate=(found?.[0]||text.trim()).replace(/[.,;!?\])}]+$/g,'');
  if(!candidate)return null;
  try{
    const url=new URL(/^https?:\/\//i.test(candidate)?candidate:`https://${candidate}`);
    if(!['http:','https:'].includes(url.protocol)||!url.hostname.includes('.'))return null;
    return url.hostname;
  }catch{return null;}
}
function updateLinkPreview(){
  $('linkChars').textContent=`${linkInput.value.length} / 2100`;
  const hostname=extractPreview(linkInput.value);
  $('linkHost').textContent=hostname||'Paste a link to see the domain';
  $('linkDestination').classList.toggle('has-link',Boolean(hostname));
  $('linkError').hidden=true;
  if(!$('linkResults').hidden){$('linkResults').hidden=true;latestLink=null;}
}
linkInput.addEventListener('input',()=>{pickLinkExample(null);updateLinkPreview();});
linkContext.addEventListener('input',()=>{if(!$('linkResults').hidden){$('linkResults').hidden=true;latestLink=null;}});
$('linkClear').addEventListener('click',()=>{linkInput.value='';linkContext.value='';pickLinkExample(null);updateLinkPreview();linkInput.focus();});
$('linkPaste').addEventListener('click',async()=>{
  try{const pasted=await navigator.clipboard.readText();if(!pasted)throw new Error('Empty clipboard');linkInput.value=pasted.slice(0,2100);pickLinkExample(null);updateLinkPreview();linkInput.focus();notify('Pasted. Remove any private codes before scanning.');}
  catch{notify('Tap the link field and use Paste on your device.');linkInput.focus();}
});
$('contextToggle').addEventListener('click',()=>{
  const expanded=$('contextToggle').getAttribute('aria-expanded')!=='true';
  $('contextToggle').setAttribute('aria-expanded',String(expanded));
  $('contextContainer').hidden=!expanded;
  if(expanded)linkContext.focus();
});
for(const btn of document.querySelectorAll('[data-link-example]'))btn.addEventListener('click',()=>{
  const example=linkSamples[btn.dataset.linkExample];
  linkInput.value=example.link;linkContext.value=example.context;
  $('contextContainer').hidden=!example.context;
  $('contextToggle').setAttribute('aria-expanded',String(Boolean(example.context)));
  pickLinkExample(btn);updateLinkPreview();
  if(window.innerWidth<760)scrollToElement($('linkInput'));
});
function renderLinkResult(data,record=true){
  const risk=['low','medium','high'].includes(data.risk)?data.risk:'medium';
  latestLink=data;
  const results=$('linkResults');results.hidden=false;
  const verdict=$('linkVerdict');verdict.classList.remove('risk-low','risk-medium','risk-high');verdict.classList.add(`risk-${risk}`);
  $('linkVerdictMode').textContent=data.checked?.reputation==='matched'?'THREAT LIST MATCH':'URL & OFFER SCREENING';
  $('linkVerdictTitle').textContent=data.status||'Review advised';
  $('linkSummary').textContent=data.summary||'Verify this link independently.';
  $('linkRiskPill').textContent=risk==='high'?'HIGH CAUTION':risk==='medium'?'REVIEW':'LOWER SIGNALS';
  $('resultHostname').textContent=data.hostname||'Unknown destination';
  $('linkOfferStatus').textContent=data.checked?.offer?'Checked':'Not supplied';
  const reputation=data.checked?.reputation||'not-configured';
  $('linkReputation').textContent=({matched:'Threat found','no-match':'No listed match','not-configured':'Not enabled','not-checked':'Skipped','unavailable':'Unavailable'})[reputation]||'Not checked';
  $('repDot').className='method-dot'+(reputation==='matched'?' warn':reputation==='no-match'?' checked':'');
  const findings=$('linkFindings');findings.replaceChildren();
  const entries=Array.isArray(data.signals)?data.signals:[];
  if(!entries.length)findings.append(node('p','flag-empty','No common warning patterns detected. This does not verify the website or the person behind it.'));
  else for(const entry of entries.slice(0,8)){
    const item=node('div','finding');item.append(node('strong','',entry.title||'Warning sign'),node('p','',entry.detail||'Review the site independently.'));findings.append(item);
  }
  const steps=$('linkActions');steps.replaceChildren();
  for(const item of(Array.isArray(data.actions)?data.actions:[]).slice(0,4))steps.append(node('li','',item));
  if(record){
    sessionChecks.unshift({time:Date.now(),risk,kind:'link',mode:'link',data:JSON.parse(JSON.stringify(data))});
    if(sessionChecks.length>12)sessionChecks.pop();
    $('historyCount').textContent=String(sessionChecks.length);
  }
  window.requestAnimationFrame(()=>scrollToElement(results));
}
function setLinkBusy(value){
  linkBusy=value;$('checkLink').disabled=value;$('checkLink').setAttribute('aria-busy',String(value));
  $('checkLinkText').textContent=value?'Inspecting…':'Inspect link';
  $('loadingOverlay').hidden=!value;
  if(value){$('loadingTitle').textContent='Inspecting the link';$('loadingSubtitle').textContent='Checking its address and the claims made about it. The destination stays unopened.';}
}
async function runLinkScan(){
  if(linkBusy||scanning)return;
  const link=linkInput.value.trim();
  const context=linkContext.value.trim();
  if(!link){$('linkError').textContent='Paste a website link first.';$('linkError').hidden=false;linkInput.focus();return;}
  if(link.length>2100||context.length>1500){$('linkError').textContent='Your input is too long.';$('linkError').hidden=false;return;}
  $('linkError').hidden=true;setLinkBusy(true);
  const controller=new AbortController();scanController=controller;
  const timer=setTimeout(()=>controller.abort('timeout'),15000);
  try{
    const response=await fetch('/api/check-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({link,context}),signal:controller.signal,cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(data?.error||'Link check unavailable.');
    if(!data?.result)throw new Error('Unexpected link check response.');
    renderLinkResult(data.result);
    if(data.result.checked?.reputation==='not-configured')notify('URL checked. External threat-list checking is not enabled.');
  }catch(error){
    if(controller.signal.aborted){if(controller.signal.reason!=='user'){$('linkError').textContent='Link check timed out. Try again.';$('linkError').hidden=false;}else notify('Link check cancelled.');}
    else{$('linkError').textContent=error?.message||'Unable to inspect link.';$('linkError').hidden=false;}
  }finally{clearTimeout(timer);if(scanController===controller)scanController=null;setLinkBusy(false);}
}
$('checkLink').addEventListener('click',runLinkScan);
linkInput.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();runLinkScan();}});
$('newLinkCheck').addEventListener('click',()=>{latestLink=null;$('linkResults').hidden=true;linkInput.value='';linkContext.value='';pickLinkExample(null);updateLinkPreview();linkInput.focus({preventScroll:true});scrollToElement($('linkInput'));});
function linkResultText(){
  if(!latestLink)return'';
  return `SenteShield link review: ${latestLink.status}\nDomain: ${latestLink.hostname}\n\n${latestLink.summary}\n\nWarning signs:\n${(latestLink.signals||[]).map(x=>'- '+x.title+': '+x.detail).join('\n')||'No obvious patterns detected'}\n\nNext steps:\n${(latestLink.actions||[]).join('\n')}\n\nA link check cannot guarantee safety. Reputation: ${latestLink.checked?.reputation||'not checked'}.`;
}
$('copyLinkResult').addEventListener('click',()=>{if(latestLink)copyText(linkResultText());});
$('shareLinkResult').addEventListener('click',async()=>{
  if(!latestLink)return;
  if(navigator.share){try{await navigator.share({title:'SenteShield link review',text:linkResultText()});}catch(e){if(e.name!=='AbortError')notify('Sharing is unavailable.');}}
  else await copyText(linkResultText());
});
updateLinkPreview();

// Dialog, focus, and keyboard interactions have no external dependencies.
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&mobileMenuIsOpen)closeMenu();
  if((event.ctrlKey||event.metaKey)&&event.key==='k'){
    if(!dialog.open){event.preventDefault();changeView('scan');message.focus();}
  }
});
$('footerYear').textContent=String(new Date().getFullYear());
applySettings(readSettings());
changeView(viewTitles[location.hash.slice(1)]?location.hash.slice(1):'scan',false);
updateInput();renderHistory();checkConnection();
