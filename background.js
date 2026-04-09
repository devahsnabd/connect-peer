const DEFAULTS = {
  onboardingCompleted: false,
  optedIn: false,
  isPaused: false,
  frequency: "active",
  pauseUntil: 0,
  encryptedGoalContext: ""
};

async function ensureDefaults() {
  const current = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const updates = {};
  let dirty = false;
  Object.entries(DEFAULTS).forEach(([key, value]) => {
    if (typeof current[key] === "undefined") {
      updates[key] = value;
      dirty = true;
    }
  });
  if (dirty) {
    await chrome.storage.local.set(updates);
  }
}

async function updateBadgeState() {
  const { isPaused = false, frequency = "active", pauseUntil = 0 } = await chrome.storage.local.get([
    "isPaused",
    "frequency",
    "pauseUntil"
  ]);
  const paused = isPaused || frequency === "paused" || pauseUntil > Date.now();
  if (paused) {
    await chrome.action.setBadgeBackgroundColor({ color: "#9140ff" });
    await chrome.action.setBadgeText({ text: "II" });
    await chrome.action.setTitle({ title: "Peer Connect (Paused)" });
  } else {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: "Peer Connect" });
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await ensureDefaults();
  await updateBadgeState();
  // On first install, onboarding now starts inside popup flow.
  if (details.reason === "install") {
    await chrome.storage.local.set({ onboardingCompleted: false });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await updateBadgeState();
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  if (changes.isPaused || changes.frequency || changes.pauseUntil) {
    await updateBadgeState();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "PEER_CONNECT_OPEN_POPUP") {
    (async () => {
      try {
        if (chrome.action && typeof chrome.action.openPopup === "function") {
          await chrome.action.openPopup();
        } else {
          const popupUrl = chrome.runtime.getURL("popup.html");
          await chrome.tabs.create({ url: popupUrl });
        }
        sendResponse({ ok: true });
      } catch (_error) {
        try {
          const popupUrl = chrome.runtime.getURL("popup.html");
          await chrome.tabs.create({ url: popupUrl });
          sendResponse({ ok: true, fallback: true });
        } catch (fallbackError) {
          sendResponse({
            ok: false,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
        }
      }
    })();

    return true;
  }

  if (message.type === "PEER_CONNECT_OPEN_SESSION" && message.url) {
    (async () => {
      try {
        await chrome.tabs.create({ url: message.url });
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    })();

    return true;
  }

  return false;
});
