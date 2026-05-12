'use strict';

const dot        = document.getElementById('dot');
const statusText = document.getElementById('status-text');
const portalInput = document.getElementById('portal-url');
const apiKeyInput = document.getElementById('api-key');
const btnSave    = document.getElementById('btn-save');
const btnTest    = document.getElementById('btn-test');
const queueLabel = document.getElementById('queue-label');
const btnFlush   = document.getElementById('btn-flush');
const settingsLink = document.getElementById('settings-link');

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const { apiKey = '', portalUrl = 'https://focus-astu-backend.purplebeach-cef0511d.southafricanorth.azurecontainerapps.io' } =
    await chrome.storage.sync.get(['apiKey', 'portalUrl']);

  portalInput.value = portalUrl;
  // Show a masked placeholder if key is saved, but don't fill the field
  // (so the user doesn't accidentally overwrite a saved key)
  if (apiKey) {
    apiKeyInput.placeholder = '••••••••••••  (saved)';
  }

  // Update settings link
  settingsLink.href = `${portalUrl}/settings/extension`;

  await refreshQueueCount();

  if (apiKey) {
    await checkConnection(portalUrl, apiKey, /* silent */ true);
  } else {
    setStatus('unconfigured', 'Enter your API key to get started');
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────

btnSave.addEventListener('click', async () => {
  const portalUrl = portalInput.value.trim().replace(/\/$/, '') || 'https://focus-astu-backend.purplebeach-cef0511d.southafricanorth.azurecontainerapps.io';
  const apiKey    = apiKeyInput.value.trim();

  if (!apiKey && !(await hasSavedKey())) {
    flash(apiKeyInput, 'red');
    return;
  }

  const saveData = { portalUrl };
  if (apiKey) saveData.apiKey = apiKey;

  await chrome.storage.sync.set(saveData);

  apiKeyInput.value = '';
  apiKeyInput.placeholder = '••••••••••••  (saved)';
  settingsLink.href = `${portalUrl}/settings/extension`;

  // Test the connection after save
  const { apiKey: savedKey } = await chrome.storage.sync.get('apiKey');
  if (savedKey) await checkConnection(portalUrl, savedKey, false);
  else setStatus('connected', 'Portal URL saved');
});

btnTest.addEventListener('click', async () => {
  const portalUrl = portalInput.value.trim().replace(/\/$/, '') || 'https://focus-astu-backend.purplebeach-cef0511d.southafricanorth.azurecontainerapps.io';
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  if (!apiKey) {
    setStatus('error', 'Save an API key first');
    return;
  }
  await checkConnection(portalUrl, apiKey, false);
});

btnFlush.addEventListener('click', async () => {
  btnFlush.disabled = true;
  await chrome.runtime.sendMessage({ type: 'FLUSH_RETRY' });
  await refreshQueueCount();
  btnFlush.disabled = false;
});

// ── Connection check ──────────────────────────────────────────────────────────

async function checkConnection(portalUrl, apiKey, silent) {
  if (!silent) setStatus('checking', 'Testing connection…');

  const result = await chrome.runtime.sendMessage({
    type: 'TEST_CONNECTION',
    portalUrl,
    apiKey,
  });

  if (result && result.ok) {
    setStatus('connected', 'Connected to portal');
  } else {
    const msg = (result && result.error) || `HTTP ${result && result.status}`;
    setStatus('error', `Not connected: ${msg}`);
  }
}

// ── Status display ────────────────────────────────────────────────────────────

function setStatus(state, text) {
  dot.className = 'dot';
  if (state === 'connected')   dot.classList.add('connected');
  if (state === 'error')       dot.classList.add('error');
  if (state === 'checking')    dot.classList.add('checking');
  statusText.textContent = text;
}

// ── Queue count ───────────────────────────────────────────────────────────────

async function refreshQueueCount() {
  const { retry_queue: q = [] } = await chrome.storage.local.get('retry_queue');
  queueLabel.textContent = `Queued: ${q.length} submission${q.length === 1 ? '' : 's'}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hasSavedKey() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  return !!apiKey;
}

function flash(el, color) {
  el.style.borderColor = color === 'red' ? '#fc8181' : '#48bb78';
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

// Kick off
init();
