'use strict';

const RETRY_QUEUE_KEY = 'retry_queue';
const MAX_RETRIES = 3;

// ── Alarm: retry queued submissions on a schedule ─────────────────────────────

chrome.alarms.create('retry_queue', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'retry_queue') {
    flushRetryQueue();
  }
});

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SUBMISSION') {
    handleSubmission(message.payload).then(sendResponse);
    return true; // keep channel open for async response
  }
  if (message.type === 'TEST_CONNECTION') {
    testConnection(message.portalUrl, message.apiKey).then(sendResponse);
    return true;
  }
});

// ── Core submission flow ──────────────────────────────────────────────────────

async function handleSubmission(payload) {
  const { apiKey, portalUrl } = await getSettings();
  if (!apiKey || !portalUrl) {
    return { ok: false, error: 'Extension not configured. Open the popup and enter your API key.' };
  }

  const result = await postSubmission(portalUrl, apiKey, payload);
  if (result.ok) {
    showNotification(
      'Submission saved!',
      `${payload.problem_name} (${payload.platform.toLowerCase()}) was recorded on the portal.`
    );
    return { ok: true };
  }

  // Queue for retry
  await enqueue(payload);
  return { ok: false, error: result.error };
}

async function postSubmission(portalUrl, apiKey, payload) {
  try {
    const resp = await fetch(`${portalUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (resp.ok) return { ok: true };

    const body = await resp.text();
    return { ok: false, error: `${resp.status}: ${body}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Retry queue ───────────────────────────────────────────────────────────────

async function enqueue(payload) {
  const { retry_queue: queue = [] } = await chrome.storage.local.get(RETRY_QUEUE_KEY);
  queue.push({ payload, retries: 0, queuedAt: Date.now() });
  await chrome.storage.local.set({ [RETRY_QUEUE_KEY]: queue });
}

async function flushRetryQueue() {
  const { retry_queue: queue = [] } = await chrome.storage.local.get(RETRY_QUEUE_KEY);
  if (queue.length === 0) return;

  const { apiKey, portalUrl } = await getSettings();
  if (!apiKey || !portalUrl) return;

  const remaining = [];
  for (const item of queue) {
    const result = await postSubmission(portalUrl, apiKey, item.payload);
    if (result.ok) {
      showNotification(
        'Queued submission saved!',
        `${item.payload.problem_name} was synced after retry.`
      );
    } else {
      item.retries++;
      if (item.retries < MAX_RETRIES) {
        remaining.push(item);
      }
      // Drop after MAX_RETRIES to avoid stale queue growth
    }
  }

  await chrome.storage.local.set({ [RETRY_QUEUE_KEY]: remaining });
}

// ── Connectivity test (called from popup) ─────────────────────────────────────

async function testConnection(portalUrl, apiKey) {
  try {
    const resp = await fetch(`${portalUrl}/api/healthz`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return { ok: resp.ok, status: resp.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSettings() {
  const data = await chrome.storage.sync.get(['apiKey', 'portalUrl']);
  return {
    apiKey: data.apiKey || '',
    portalUrl: (data.portalUrl || 'https://focus-astu-backend.purplebeach-cef0511d.southafricanorth.azurecontainerapps.io').replace(/\/$/, ''),
  };
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title,
    message,
  });
}
