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
