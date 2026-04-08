(function peerConnectContentScript() {
  const state = {
    pageType: "unsupported",
    formFieldCount: 0,
    aiMessageCount: 0,
    sessionDismissals: 0,
    sessionSuggestionsShown: 0,
    sessionSuppressed: false,
    lastSuggestionAt: 0,
    pageLoadAt: Date.now(),
    overlayVisible: false,
    searchQuery: ""
  };

  function countFormFields() {
    const fields = document.querySelectorAll("input, textarea, select");
    return Array.from(fields).filter((field) => {
      const type = (field.getAttribute("type") || "").toLowerCase();
      if (type === "password" || type === "hidden") {
        return false;
      }
      return true;
    }).length;
  }

  function getCooldownMs() {
    return 10 * 60 * 1000;
  }

  function getSessionSuggestionLimit(frequency) {
    return frequency === "reduced" ? 1 : 2;
  }

  function shouldSuppressForSession(frequency) {
    if (state.sessionSuppressed) {
      return true;
    }
    if (state.sessionDismissals >= 3) {
      state.sessionSuppressed = true;
      return true;
    }
    if (state.sessionSuggestionsShown >= getSessionSuggestionLimit(frequency)) {
      return true;
    }
    if (Date.now() - state.lastSuggestionAt < getCooldownMs()) {
      return true;
    }
    return false;
  }

  function isSupportedType(type) {
    return type === "search" || type === "ai_chat" || type === "form_heavy";
  }

  function createOverlay(peer, isAiChat) {
    const container = document.createElement("div");
    container.id = "peer-connect-root";
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-label", "Peer connection suggestion");
    container.tabIndex = -1;
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "2147483646";

    const shadow = container.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }
      .card {
        width: 360px;
        max-width: min(360px, calc(100vw - 24px));
        color: #151c2c;
        background: #fcfdff;
        border: 1px solid #e8eef9;
        border-radius: 18px;
        box-shadow: 0 10px 28px rgba(24, 37, 67, 0.16);
        font-family: Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        padding: 16px;
      }
      .brand {
        font-size: 14px;
        font-weight: 800;
        margin: 0 0 10px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .pause-link {
        background: transparent;
        border: 0;
        color: #202b43;
        padding: 0;
        font-size: 12px;
        font-weight: 600;
      }
      .close-btn {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        border-color: #b7bfce !important;
        color: #6b748a !important;
        font-weight: 700;
      }
      .title {
        font-size: 14px;
        line-height: 1.2;
        margin: 0;
        font-weight: 700;
      }
      .main-title {
        font-size: 16px;
        line-height: 1.35;
        margin: 0 0 8px;
        font-weight: 600;
      }
      .summary {
        font-size: 13px;
        line-height: 1.45;
        margin: 0 0 14px;
        color: #79829a;
      }
      .peer-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;
      }
      .peer-item {
        border-radius: 10px;
        background: #f6f8fc;
        border: 1px solid #eef2f8;
        padding: 10px;
      }
      .peer-item strong {
        display: block;
        font-size: 12px;
        margin-bottom: 2px;
      }
      .peer-item span {
        color: #7d879e;
        font-size: 11px;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      button {
        border-radius: 10px;
        border: 1px solid #d5deee;
        color: #1f2a44;
        background: #ffffff;
        padding: 8px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      button:focus-visible {
        outline: 2px solid #86b7ff;
        outline-offset: 2px;
      }
      .connect {
        border: 0 !important;
        background: linear-gradient(135deg, #6c8cff, #a26bff);
        color: #ffffff !important;
        font-weight: 600;
        flex: 1;
      }
      .not-now {
        flex: 1;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #65708a;
        font-size: 11px;
      }
      .bar {
        width: 100%;
        height: 5px;
        border-radius: 999px;
        background: #e9edf6;
        overflow: hidden;
        margin-top: 6px;
      }
      .bar > span {
        display: block;
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #ffbf59, #ffc45d);
      }
      @media (prefers-color-scheme: dark) {
        .card {
          background: linear-gradient(180deg, #171d25 0%, #11161f 100%);
          color: #f6f7fb;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .pause-link,
        .summary,
        .meta {
          color: #c2cae0;
        }
        button {
          color: #ecf0ff;
          border-color: rgba(255, 255, 255, 0.24);
          background: transparent;
        }
        .peer-item {
          background: rgba(255, 255, 255, 0.06);
          border-color: transparent;
        }
        .bar {
          background: rgba(255, 255, 255, 0.14);
        }
      }
      @media (max-width: 480px) {
        .peer-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    const card = document.createElement("section");
    card.className = "card";
    const brand = document.createElement("p");
    brand.className = "brand";
    brand.textContent = "Peer Connect";

    const header = document.createElement("div");
    header.className = "header";
    const pauseBtn = document.createElement("button");
    pauseBtn.className = "pause-link";
    pauseBtn.setAttribute("aria-label", "Pause suggestions for today");
    pauseBtn.textContent = "Pause for today";
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.setAttribute("aria-label", "Close suggestion");
    closeBtn.textContent = "X";
    header.appendChild(pauseBtn);
    header.appendChild(closeBtn);

    const title = document.createElement("p");
    title.className = "main-title";
    title.textContent = peer.title || "Solved a similar challenge";

    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = peer.supportingText || "A peer may help you unblock this quickly.";

    const peerGrid = document.createElement("div");
    peerGrid.className = "peer-grid";
    peerGrid.innerHTML = `
      <div class="peer-item"><strong>${peer.domain || "Product Design"}</strong><span>Domain</span></div>
      <div class="peer-item"><strong>${peer.experience || "6+ years"}</strong><span>Experience</span></div>
      <div class="peer-item"><strong>${peer.availability || "Today"}</strong><span>Availability</span></div>
    `;

    const actions = document.createElement("div");
    actions.className = "actions";

    const connectBtn = document.createElement("button");
    connectBtn.className = "connect";
    connectBtn.setAttribute("aria-label", "Connect with peer");
    connectBtn.textContent = "Connect";

    const notNowBtn = document.createElement("button");
    notNowBtn.setAttribute("aria-label", "Dismiss suggestion for now");
    notNowBtn.textContent = "Not now";

    const meta = document.createElement("div");
    meta.className = "meta";
    const timerText = document.createElement("span");
    timerText.textContent = isAiChat ? "Auto-dismiss in 30s" : "Suggestion ready";
    meta.appendChild(timerText);

    const bar = document.createElement("div");
    bar.className = "bar";
    const progress = document.createElement("span");
    bar.appendChild(progress);
    if (!isAiChat) {
      bar.style.display = "none";
    }

    notNowBtn.className = "not-now";

    actions.appendChild(connectBtn);
    actions.appendChild(notNowBtn);
    card.appendChild(brand);
    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(peerGrid);
    card.appendChild(actions);
    card.appendChild(meta);
    card.appendChild(bar);

    shadow.appendChild(style);
    shadow.appendChild(card);
    document.documentElement.appendChild(container);
    container.focus();

    let dismissTimer = null;
    let secondsLeft = 30;
    if (isAiChat) {
      dismissTimer = setInterval(() => {
        secondsLeft -= 1;
        timerText.textContent = `Auto-dismiss in ${secondsLeft}s`;
        const percent = Math.max((secondsLeft / 30) * 100, 0);
        progress.style.width = `${percent}%`;
        if (secondsLeft <= 0) {
          clearInterval(dismissTimer);
          closeOverlay("timeout");
        }
      }, 1000);
    }

    function closeOverlay(reason) {
      if (dismissTimer) {
        clearInterval(dismissTimer);
      }
      if (!state.overlayVisible) {
        return;
      }
      state.overlayVisible = false;
      container.remove();
      if (reason === "dismiss" || reason === "timeout") {
        state.sessionDismissals += 1;
      }
    }

    connectBtn.addEventListener("click", () => {
      const url = new URL("https://peer-connect.example/connect");
      url.searchParams.set("match_id", "abc123");
      url.searchParams.set("context_token", "xyz789");
      window.open(url.toString(), "_blank", "noopener");
      closeOverlay("connect");
    });

    notNowBtn.addEventListener("click", () => {
      closeOverlay("dismiss");
    });

    closeBtn.addEventListener("click", () => {
      closeOverlay("dismiss");
    });

    pauseBtn.addEventListener("click", async () => {
      await PeerConnectStorage.setPauseForToday();
      closeOverlay("pause");
    });

    container.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeOverlay("dismiss");
      }
    });
  }

  async function maybeSuggestPeer() {
    if (!isSupportedType(state.pageType) || state.overlayVisible) {
      return;
    }
    const paused = await PeerConnectStorage.isExtensionPaused();
    if (paused) {
      return;
    }

    const { encryptedGoalContext = "", frequency = "active", optedIn = false } =
      await PeerConnectStorage.get(["encryptedGoalContext", "frequency", "optedIn"]);
    if (shouldSuppressForSession(frequency)) {
      return;
    }
    if (!optedIn) {
      return;
    }

    const goalContext = await PeerConnectCrypto.decryptText(encryptedGoalContext);
    const suggestion = await PeerConnectMatcher.getPeerSuggestion({
      pageType: state.pageType,
      queryText: state.searchQuery,
      goalContextLength: goalContext.length,
      aiMessageCount: state.aiMessageCount,
      timeOnPageMs: Date.now() - state.pageLoadAt,
      formFieldCount: state.formFieldCount,
      frequency
    });

    if (!suggestion) {
      return;
    }

    state.overlayVisible = true;
    state.sessionSuggestionsShown += 1;
    state.lastSuggestionAt = Date.now();
    createOverlay(suggestion, state.pageType === "ai_chat");
  }

  function bindAiMessageTracking() {
    const handler = () => {
      // Count only user-send intents, not response chunks.
      state.aiMessageCount += 1;
      if (state.aiMessageCount >= 3) {
        maybeSuggestPeer();
      }
    };

    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        handler();
      }
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const label = (target.getAttribute("aria-label") || target.textContent || "").toLowerCase();
      if (label.includes("send")) {
        handler();
      }
    });
  }

  function initTriggers() {
    if (state.pageType === "ai_chat") {
      bindAiMessageTracking();
      return;
    }
    if (state.pageType === "form_heavy") {
      setTimeout(() => {
        maybeSuggestPeer();
      }, 60000);
      return;
    }
    if (state.pageType === "search") {
      setTimeout(() => {
        maybeSuggestPeer();
      }, 4000);
    }
  }

  function init() {
    state.formFieldCount = countFormFields();
    state.pageType = PeerConnectMatcher.detectPageType(new URL(window.location.href), state.formFieldCount);
    if (state.pageType === "search") {
      const params = new URLSearchParams(window.location.search);
      state.searchQuery = params.get("q") || "";
    }
    if (!isSupportedType(state.pageType)) {
      return;
    }
    initTriggers();
  }

  init();
})();
