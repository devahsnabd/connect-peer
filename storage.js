(function initStorage(global) {
  const DEFAULTS = {
    onboardingCompleted: false,
    optedIn: false,
    isPaused: false,
    frequency: "active",
    pauseUntil: 0,
    encryptedGoalContext: "",
    installAt: 0
  };

  const STORAGE_AREA = chrome.storage.local;

  function now() {
    return Date.now();
  }

  async function get(keys) {
    return STORAGE_AREA.get(keys);
  }

  async function set(values) {
    return STORAGE_AREA.set(values);
  }

  async function getAllSettings() {
    const settings = await get(Object.keys(DEFAULTS));
    return { ...DEFAULTS, ...settings };
  }

  async function initializeDefaults() {
    const current = await getAllSettings();
    const updates = {};
    let dirty = false;

    Object.entries(DEFAULTS).forEach(([key, value]) => {
      if (typeof current[key] === "undefined") {
        updates[key] = value;
        dirty = true;
      }
    });

    if (!current.installAt) {
      updates.installAt = now();
      dirty = true;
    }

    if (dirty) {
      await set(updates);
    }
  }

  async function isTemporarilyPaused() {
    const { pauseUntil = 0 } = await get(["pauseUntil"]);
    return pauseUntil > now();
  }

  async function isExtensionPaused() {
    const { isPaused = false, frequency = "active" } = await get(["isPaused", "frequency"]);
    const tempPaused = await isTemporarilyPaused();
    return isPaused || tempPaused || frequency === "paused";
  }

  async function setPauseForToday() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    await set({
      pauseUntil: end.getTime(),
      isPaused: false
    });
  }

  async function clearTemporaryPause() {
    await set({ pauseUntil: 0 });
  }

  function mapFrequencyToMultiplier(frequency) {
    if (frequency === "reduced") {
      return 1.2;
    }
    if (frequency === "paused") {
      return 10;
    }
    return 1;
  }

  global.PeerConnectStorage = {
    DEFAULTS,
    get,
    set,
    getAllSettings,
    initializeDefaults,
    isExtensionPaused,
    isTemporarilyPaused,
    setPauseForToday,
    clearTemporaryPause,
    mapFrequencyToMultiplier
  };
})(typeof window !== "undefined" ? window : self);
