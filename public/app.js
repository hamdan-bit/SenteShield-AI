'use strict';

const $ = id => document.getElementById(id);
const examples = {
  account: 'URGENT: Your MTN MoMo account has been blocked. To unlock it immediately, send UGX 20,000 and share your secret PIN with the support agent.',
  prize: 'CONGRATULATIONS! You won UGX 5,000,000 in our promotion. Claim your cash prize today. Pay a processing fee of UGX 50,000 before 6 PM and click http://bit.ly/claim-reward-now',
  authority: 'FINAL NOTICE: This is URA enforcement. Pay your outstanding UGX 85,000 compliance fee immediately through this personal mobile money number or your account will be suspended.',
  normal: 'Hello Sarah, are we still meeting tomorrow at 2pm at the library to work on the assignment? Please let me know.'
};
const localChecks = [
  { re: /\b(pin|otp|password|verification code|secret code)\b/i, label: 'Security code mentioned' },
  { re: /\b(urgent|immediately|last chance|blocked|suspended|act now|within \d+)\b/i, label: 'Pressure or urgency' },
  { re: /\b(pay|send|deposit|transfer|processing fee|ugx|cash[- ]?out)\b/i, label: 'Money or payment request' },
  { re: /\b(won|prize|lottery|jackpot|reward|giveaway)\b/i, label: 'Unexpected reward claim' },
  { re: /(?:https?:\/\/|www\.|bit\.ly|tinyurl)/i, label: 'Link that needs checking' }
];
const message = $('message');
const analyze = $('analyze');
let latest = null;
let resultMode = 'demo';
let toastTimer;

function createElement(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}
function scrollToEl(el) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
}
function toast(text) {
  window.clearTimeout(toastTimer);
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastTimer = window.setTimeout(() => { $('toast').hidden = true; }, 3200);
}
function showError(text) {
  $('error').textContent = text;
  $('error').hidden = false;
}
function renderSignals() {
  const text = message.value.trim();
  const holder = $('liveSignals');
  const summary = $('insightSummary');
  holder.replaceChildren();
  if (!text) {
    summary.textContent = 'Paste a message to see potential warning signs here.';
    const empty = createElement('div', 'signal-empty');
    const orbit = createElement('span', 'empty-orbit', '✳');
    orbit.setAttribute('aria-hidden','true');
    empty.append(orbit, createElement('span', '', 'Ready when you are'));
    holder.append(empty);
    return;
  }
  const matches = localChecks.filter(check => check.re.test(text));
  summary.textContent = matches.length ? `${matches.length} possible ${matches.length === 1 ? 'signal' : 'signals'} in this text. Run the full check for context.` : 'No common warning phrases spotted yet.';
  if (!matches.length) {
    holder.append(createElement('div', 'signal-item no-signals', 'No common warning phrases. This does not verify the sender.'));
  } else {
    for (const check of matches) {
      const item = createElement('div', 'signal-item');
      const icon = createElement('span','', '↗');
      icon.setAttribute('aria-hidden','true');
      item.append(icon, createElement('span', '', check.label));
      holder.append(item);
    }
  }
}
function updateInput() {
  $('count').textContent = `${message.value.length} / 1600`;
  $('count').classList.toggle('near-limit', message.value.length > 1500);
  $('clearBtn').disabled = !message.value.length;
  $('error').hidden = true;
  renderSignals();
}
message.addEventListener('input', () => {
  document.querySelectorAll('[data-example]').forEach(button => button.classList.remove('selected'));
  updateInput();
});
$('clearBtn').addEventListener('click', () => {
  message.value = '';
  $('results').hidden = true;
  document.querySelectorAll('[data-example]').forEach(button => button.classList.remove('selected'));
  updateInput(); message.focus();
});
$('pasteBtn').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.readText) throw new Error('Clipboard unavailable');
    const clipboard = await navigator.clipboard.readText();
    if (!clipboard.trim()) return toast('Clipboard is empty.');
    message.value = clipboard.slice(0, 1600);
    updateInput();
    message.focus();
    toast('Pasted. Remove private information before checking.');
  } catch {
    toast('Use your device’s Paste action inside the message box.');
    message.focus();
  }
});
for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-example]').forEach(b => b.classList.toggle('selected', b === button));
    message.value = examples[button.dataset.example];
    $('results').hidden = true;
    updateInput();
    message.focus({ preventScroll: true });
    if (window.innerWidth < 780) scrollToEl($('scanner'));
  });
}
function setBusy(working) {
  analyze.disabled = working;
  analyze.classList.toggle('loading', working);
  analyze.setAttribute('aria-busy', String(working));
  $('analyzeText').textContent = working ? 'Checking…' : 'Check message';
  $('scanArrow').textContent = working ? '···' : '↗';
}
function renderResult(data, mode) {
  latest = data;
  resultMode = mode;
  const risk = ['low', 'medium', 'high'].includes(String(data.risk || '').toLowerCase()) ? String(data.risk).toLowerCase() : 'medium';
  const box = $('results');
  box.classList.remove('risk-low','risk-medium','risk-high');
  box.classList.add('risk-' + risk);
  $('riskBadge').textContent = `${risk[0].toUpperCase() + risk.slice(1)} risk`;
  $('riskIcon').textContent = risk === 'low' ? '✓' : risk === 'medium' ? '!' : '⚠';
  $('summary').textContent = data.summary || 'A message may contain warning signs. Verify it independently.';
  $('resultMode').textContent = mode === 'ai' ? 'Detailed check' : 'Quick check · rule-based';
  $('disclaimer').textContent = mode === 'ai'
    ? 'Text-only assessment. A result cannot confirm a sender or payment request is genuine.'
    : 'Rule-based check only. Look for other warning signs and verify the sender independently.';
  const flags = $('flags');
  flags.replaceChildren();
  if (!Array.isArray(data.redFlags) || !data.redFlags.length) {
    flags.append(createElement('p', 'empty-flags', 'No specific warning signs identified. This does not prove the message is safe.'));
  } else {
    for (const flag of data.redFlags.slice(0, 5)) {
      const item = createElement('div','finding');
      item.append(createElement('strong', '', flag.phrase || 'Potential warning'), createElement('p', '', flag.reason || 'Verify this request with the sender.'));
      flags.append(item);
    }
  }
  const actions = $('actions');
  actions.replaceChildren();
  for (const action of (Array.isArray(data.actions) ? data.actions : []).slice(0, 4)) {
    actions.append(createElement('li','',String(action)));
  }
  box.hidden = false;
  window.requestAnimationFrame(() => scrollToEl(box));
}
async function performAnalysis() {
  const value = message.value.trim();
  if (value.length < 10) return showError('Please enter at least 10 characters.');
  if (value.length > 1600) return showError('Use 1,600 characters or fewer.');
  $('error').hidden = true;
  setBusy(true);
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 26000);
    let response;
    try {
      response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value, language: $('language').value }), signal: controller.signal
      });
    } finally { window.clearTimeout(timeout); }
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || 'Scanner unavailable. Please try again.');
    if (!payload?.result) throw new Error('Scanner returned an unexpected response.');
    renderResult(payload.result, payload.mode);
    if (payload.mode !== 'ai') toast('Showing a quick check. Detailed analysis is currently unavailable.');
  } catch (error) {
    showError(error.name === 'AbortError' ? 'The check took too long. Please try again.' : error.message || 'Scanner unavailable.');
  } finally { setBusy(false); }
}
analyze.addEventListener('click', performAnalysis);
message.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); performAnalysis(); }
});
$('resetBtn').addEventListener('click', () => {
  latest = null;
  $('results').hidden = true;
  message.value = '';
  document.querySelectorAll('[data-example]').forEach(button => button.classList.remove('selected'));
  updateInput(); message.focus({preventScroll: true}); scrollToEl($('scanner'));
});
function summaryText() {
  if (!latest) return '';
  const flags = (latest.redFlags || []).map(f => `• ${f.phrase}: ${f.reason}`).join('\n') || 'No specific warning signs found.';
  const steps = (latest.actions || []).map((s,i) => `${i+1}. ${s}`).join('\n');
  return `SenteShield — ${latest.risk} risk (${resultMode === 'ai' ? 'detailed' : 'quick'} check)\n\n${latest.summary}\n\nWarning signs:\n${flags}\n\nNext steps:\n${steps}\n\nThis check cannot verify the sender. Never share your PIN or OTP.`;
}
$('copyAdvice').addEventListener('click', async () => {
  if (!latest) return;
  try { await navigator.clipboard.writeText(summaryText()); toast('Result copied.'); }
  catch { toast('Copy is unavailable on this device.'); }
});
$('shareAdvice').addEventListener('click', async () => {
  if (!latest) return;
  if (navigator.share) {
    try { await navigator.share({ title: 'SenteShield message check', text: summaryText() }); }
    catch (error) { if (error.name !== 'AbortError') toast('Could not share this result.'); }
  } else {
    try { await navigator.clipboard.writeText(summaryText()); toast('Copied to share.'); }
    catch { toast('Sharing is not available.'); }
  }
});
async function checkConnection() {
  const state = $('modeStatus');
  try {
    const response = await fetch('/api/health', {cache:'no-store'});
    if (!response.ok) throw new Error('Not available');
    const data = await response.json();
    state.classList.remove('basic','offline');
    state.classList.toggle('basic', !data.aiConfigured);
    $('modeText').textContent = data.aiConfigured ? 'Detailed scan ready' : 'Quick check ready';
  } catch {
    state.classList.remove('basic');
    state.classList.add('offline');
    $('modeText').textContent = 'Scanner offline';
  }
}
$('footerYear').textContent = String(new Date().getFullYear());
updateInput();
checkConnection();
