(async function optionsController() {
  await PeerConnectStorage.initializeDefaults();
  const els = {
    goalContext: document.getElementById("goalContext"),
    frequency: document.getElementById("frequency"),
    isPaused: document.getElementById("isPaused"),
    saveBtn: document.getElementById("saveBtn"),
    pauseTodayBtn: document.getElementById("pauseTodayBtn"),
    feedback: document.getElementById("feedback")
  };

  async function load() {
    const settings = await PeerConnectStorage.getAllSettings();
    const goalContext = await PeerConnectCrypto.decryptText(settings.encryptedGoalContext);
    els.goalContext.value = goalContext;
    els.frequency.value = settings.frequency;
    els.isPaused.checked = settings.isPaused;
  }

  async function save() {
    const encryptedGoalContext = await PeerConnectCrypto.encryptText(els.goalContext.value.trim().slice(0, 200));
    await PeerConnectStorage.set({
      encryptedGoalContext,
      frequency: els.frequency.value,
      isPaused: els.isPaused.checked
    });
    if (els.frequency.value !== "paused" && !els.isPaused.checked) {
      await PeerConnectStorage.clearTemporaryPause();
    }
    els.feedback.textContent = "Settings saved.";
  }

  els.saveBtn.addEventListener("click", save);
  els.pauseTodayBtn.addEventListener("click", async () => {
    await PeerConnectStorage.setPauseForToday();
    els.feedback.textContent = "Paused for today.";
  });

  load();
})();
