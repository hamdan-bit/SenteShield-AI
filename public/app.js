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
const viewTitles = {scan:'Message scanner',activity:'Recent checks',safety:'Safety guide'};
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
    sessionChecks.unshift({time:Date.now(),risk,mode,data:JSON.parse(JSON.stringify(data))});
    if(sessionChecks.length>12)sessionChecks.pop();
    $('historyCount').textContent=String(sessionChecks.length);
  }
  window.requestAnimationFrame(()=>scrollToElement(box));
}
function setLoading(active){
  scanning=active;analyze.disabled=active;analyze.setAttribute('aria-busy',String(active));
  $('loadingOverlay').hidden=!active;
  $('analyzeText').textContent=active?'Checking…':'Check message';
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
    const label=node('span','history-text');label.append(node('strong','',`${entry.risk[0].toUpperCase()+entry.risk.slice(1)} risk · ${entry.mode==='ai'?'Detailed':'Quick'} check`),node('span','',entry.data.summary||'Message check'));
    const time=node('time','history-time',new Date(entry.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
    btn.append(emblem,label,time,icon('arrow','history-arrow'));
    btn.addEventListener('click',()=>{changeView('scan');renderResult(entry.data,entry.mode,false);});list.append(btn);
  });
}

const dialog=$('appDialog');
function closeDialog(){if(dialog.open)dialog.close();document.body.classList.remove('dialog-open');}
$('closeDialog').addEventListener('click',closeDialog);
dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
function dialogMarkup(title,body){const content=$('dialogContent');content.replaceChildren();content.append(node('h2','',title),...body);}
function paragraph(text){return node('p','',text);}
function bulletList(lines){const ul=node('ul','dialog-list');for(const line of lines)ul.append(node('li','',line));return ul;}
function dialogActions(buttons){const area=node('div','dialog-actions');for(const item of buttons){const button=node('button',item.className||'secondary-btn',item.text);button.type='button';button.addEventListener('click',item.click);area.append(button);}return area;}
function openDialog(type){
  closeMenu();
  if(type==='help')dialogMarkup('A safer way to check',[
    paragraph('When an unexpected message asks you for money, a code, or an urgent response:'),
    bulletList(['Pause. Do not click links or send money immediately.','Check the sender using an official app or a phone number you found yourself.','Never disclose a PIN, OTP or password, even to someone claiming to be support.','Use this scanner for clues, not as proof that a sender is genuine.']),
    node('div','dialog-note','If money has already been sent, contact your provider promptly through its official support channels.'),
    dialogActions([{text:'Got it',className:'primary-btn',click:closeDialog}])
  ]);
  else if(type==='privacy')dialogMarkup('Your privacy matters',[
    paragraph('SenteShield does not require sign-up and does not save your submitted message in a database.'),
    bulletList(['Instant pattern hints run in your browser.','When you select Check message, a masked version of the text is sent to the SenteShield server.','If detailed analysis is configured, the masked text is processed by the model provider.','Phone numbers, emails and some code patterns are masked, but automatic masking can miss details. Remove anything private yourself.','Recent checks contain result summaries only and stay in this tab’s memory. They are cleared when you reload.']),
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
