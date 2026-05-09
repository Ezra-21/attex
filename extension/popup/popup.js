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