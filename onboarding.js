(async function onboardingController() {
  await PeerConnectStorage.initializeDefaults();
  const els = {
    stepNumber: document.getElementById("stepNumber"),
    step1: document.getElementById("step1"),
    step2: document.getElementById("step2"),
    step3: document.getElementById("step3"),
    goalContext: document.getElementById("goalContext"),
    charCount: document.getElementById("charCount"),
    optInCheckbox: document.getElementById("optInCheckbox"),
    backBtn: document.getElementById("backBtn"),
    nextBtn: document.getElementById("nextBtn"),
    skipBtn: document.getElementById("skipBtn"),
    skipBtnTop: document.getElementById("skipBtnTop"),
    stepBar1: document.getElementById("stepBar1"),
    stepBar2: document.getElementById("stepBar2"),
    stepBar3: document.getElementById("stepBar3"),
    label1: document.getElementById("label1"),
    label2: document.getElementById("label2"),
    label3: document.getElementById("label3")
  };

  let step = 1;

  function render() {
    if (els.stepNumber) {
      els.stepNumber.textContent = String(step);
    }
    els.step1.classList.toggle("hidden", step !== 1);
    els.step2.classList.toggle("hidden", step !== 2);
    els.step3.classList.toggle("hidden", step !== 3);
    els.backBtn.classList.toggle("hidden", step === 1);
    els.nextBtn.textContent = step === 3 ? "Finish" : "Next";

    const bars = [els.stepBar1, els.stepBar2, els.stepBar3];
    const labels = [els.label1, els.label2, els.label3];
    bars.forEach((bar, index) => bar.classList.toggle("active", index < step));
    labels.forEach((label, index) => label.classList.toggle("active", index <= step - 1));
  }

  els.goalContext.addEventListener("input", () => {
    els.charCount.textContent = String(els.goalContext.value.length);
  });

  els.skipBtn.addEventListener("click", async () => {
    await PeerConnectStorage.set({
      onboardingCompleted: true,
      optedIn: false
    });
    window.close();
  });
  els.skipBtnTop.addEventListener("click", async () => {
    await PeerConnectStorage.set({
      onboardingCompleted: true,
      optedIn: false
    });
    window.close();
  });

  els.backBtn.addEventListener("click", () => {
    step = Math.max(1, step - 1);
    render();
  });

  els.nextBtn.addEventListener("click", async () => {
    if (step < 3) {
      step += 1;
      render();
      return;
    }

    const context = els.goalContext.value.trim().slice(0, 200);
    const encryptedGoalContext = await PeerConnectCrypto.encryptText(context);
    await PeerConnectStorage.set({
      encryptedGoalContext,
      optedIn: els.optInCheckbox.checked,
      onboardingCompleted: true
    });
    window.close();
  });

  render();
})();
