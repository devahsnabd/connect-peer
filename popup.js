(async function popupController() {
  await PeerConnectStorage.initializeDefaults();
  const els = {
    step1: document.getElementById("screen-step1"),
    step2: document.getElementById("screen-step2"),
    step3: document.getElementById("screen-step3"),
    connect: document.getElementById("screen-connect"),
    timer: document.getElementById("screen-timer"),
    settings: document.getElementById("screen-settings"),
    openSettingsBtn: document.getElementById("openSettingsBtn"),
    pickItems: Array.from(document.querySelectorAll(".pick-item")),
    step1NextBtn: document.getElementById("step1NextBtn"),
    step2BackBtn: document.getElementById("step2BackBtn"),
    step2NextBtn: document.getElementById("step2NextBtn"),
    finishBtn: document.getElementById("finishBtn"),
    goalContext: document.getElementById("popupGoalContext"),
    settingsGoalContext: document.getElementById("settingsGoalContext"),
    pauseToggle: document.getElementById("pauseToggle"),
    saveBtn: document.getElementById("saveBtn"),
    charCount: document.getElementById("charCount"),
    settingsCharCount: document.getElementById("settingsCharCount"),
    frequencyButtons: Array.from(document.querySelectorAll(".freq-btn")),
    timerSeconds: document.getElementById("timerSeconds"),
    timerProgress: document.getElementById("timerProgress")
  };

  let selectedFrequency = "active";
  let activeScreen = "step1";
  let timerId = null;

  function on(el, eventName, handler) {
    if (el) {
      el.addEventListener(eventName, handler);
    }
  }

  function show(screenName) {
    activeScreen = screenName;
    const map = {
      step1: els.step1,
      step2: els.step2,
      step3: els.step3,
      connect: els.connect,
      timer: els.timer,
      settings: els.settings
    };
    Object.values(map).forEach((el) => {
      if (el) {
        el.classList.add("hidden");
      }
    });
    if (map[screenName]) {
      map[screenName].classList.remove("hidden");
    }
  }

  function setFrequencyUI(value) {
    selectedFrequency = value;
    els.frequencyButtons.forEach((button) => {
      const active = button.dataset.value === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", active ? "true" : "false");
      button.setAttribute("role", "radio");
    });
  }

  async function persistSettings() {
    if (!els.settingsGoalContext || !els.pauseToggle) {
      return;
    }
    const text = els.settingsGoalContext.value.trim().slice(0, 200);
    const encryptedGoalContext = await PeerConnectCrypto.encryptText(text);
    await PeerConnectStorage.set({
      encryptedGoalContext,
      frequency: selectedFrequency,
      isPaused: els.pauseToggle.checked
    });
    if (selectedFrequency !== "paused" && !els.pauseToggle.checked) {
      await PeerConnectStorage.clearTemporaryPause();
    }
  }

  function startTimerScreen() {
    show("timer");
    let seconds = 30;
    if (els.timerSeconds) {
      els.timerSeconds.textContent = String(seconds);
    }
    if (els.timerProgress) {
      els.timerProgress.style.width = "100%";
    }
    if (timerId) {
      clearInterval(timerId);
    }
    timerId = setInterval(() => {
      seconds -= 1;
      if (els.timerSeconds) {
        els.timerSeconds.textContent = String(Math.max(seconds, 0));
      }
      if (els.timerProgress) {
        els.timerProgress.style.width = `${Math.max((seconds / 30) * 100, 0)}%`;
      }
      if (seconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        show("connect");
      }
    }, 1000);
  }

  async function load() {
    const settings = await PeerConnectStorage.getAllSettings();
    const goalContext = await PeerConnectCrypto.decryptText(settings.encryptedGoalContext);
    if (els.goalContext) {
      els.goalContext.value = goalContext;
    }
    if (els.settingsGoalContext) {
      els.settingsGoalContext.value = goalContext;
    }
    if (els.charCount) {
      els.charCount.textContent = String(goalContext.length);
    }
    if (els.settingsCharCount) {
      els.settingsCharCount.textContent = String(goalContext.length);
    }
    if (els.pauseToggle) {
      els.pauseToggle.checked = settings.isPaused;
    }
    setFrequencyUI(settings.frequency);
    show(settings.onboardingCompleted ? "connect" : "step1");
  }

  els.pickItems.forEach((item) => {
    item.addEventListener("click", () => {
      els.pickItems.forEach((other) => other.classList.remove("selected"));
      item.classList.add("selected");
    });
  });

  on(els.step1NextBtn, "click", () => show("step2"));
  on(els.step2BackBtn, "click", () => show("step1"));
  on(els.step2NextBtn, "click", () => show("step3"));
  on(els.finishBtn, "click", async () => {
    if (!els.goalContext) {
      return;
    }
    const text = els.goalContext.value.trim().slice(0, 200);
    const encryptedGoalContext = await PeerConnectCrypto.encryptText(text);
    await PeerConnectStorage.set({
      encryptedGoalContext,
      onboardingCompleted: true,
      optedIn: true
    });
    if (els.settingsGoalContext) {
      els.settingsGoalContext.value = text;
    }
    if (els.settingsCharCount) {
      els.settingsCharCount.textContent = String(text.length);
    }
    show("connect");
  });

  on(els.goalContext, "input", () => {
    if (els.charCount && els.goalContext) {
      els.charCount.textContent = String(els.goalContext.value.length);
    }
  });
  on(els.settingsGoalContext, "input", () => {
    if (els.settingsCharCount && els.settingsGoalContext) {
      els.settingsCharCount.textContent = String(els.settingsGoalContext.value.length);
    }
  });
  els.frequencyButtons.forEach((button) => {
    button.addEventListener("click", () => setFrequencyUI(button.dataset.value || "active"));
  });

  on(document.getElementById("connectBtn"), "click", startTimerScreen);
  on(document.getElementById("timerConnectBtn"), "click", startTimerScreen);
  on(document.getElementById("closeConnectBtn"), "click", () => show("step1"));
  on(document.getElementById("closeTimerBtn"), "click", () => show("connect"));
  on(document.getElementById("pauseTodayBtn"), "click", async () => {
    await PeerConnectStorage.setPauseForToday();
    show("connect");
  });
  on(document.getElementById("pauseTodayBtnTimer"), "click", async () => {
    await PeerConnectStorage.setPauseForToday();
    show("connect");
  });

  on(els.saveBtn, "click", async () => {
    await persistSettings();
    show("connect");
  });

  on(els.openSettingsBtn, "click", () => {
    if (activeScreen === "settings") {
      show("connect");
    } else {
      show("settings");
    }
  });

  load();
})();
