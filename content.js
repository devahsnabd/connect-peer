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
    searchQuery: "",
    shortcutAnchor: null,
    shortcutButton: null,
    shortcutObserver: null
  };

  function isShortcutEligibleHost() {
    const host = window.location.hostname;
    return host === "chatgpt.com" || host === "chat.openai.com" || host === "claude.ai";
  }

  function findShortcutAnchor() {
    const selectors = [
      "#prompt-textarea",
      "form textarea",
      "textarea[placeholder*='message' i]",
      "div.ProseMirror[contenteditable='true']",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node instanceof HTMLElement && node.offsetParent !== null) {
        return node;
      }
    }
    return null;
  }

  function ensureShortcutButton() {
    if (state.shortcutButton) {
      return state.shortcutButton;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "peer-connect-shortcut";
    button.setAttribute("aria-label", "Open Peer Connect");
    button.style.position = "fixed";
    button.style.zIndex = "2147483646";
    button.style.width = "48px";
    button.style.height = "48px";
    button.style.borderRadius = "999px";
    button.style.border = "3px solid #5560e7";
    button.style.background = "#ffffff";
    button.style.padding = "0";
    button.style.cursor = "pointer";
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.boxShadow = "0 6px 14px rgba(36, 52, 89, 0.18)";

    const logoWrapper = document.createElement("span");
    logoWrapper.setAttribute("aria-hidden", "true");
    logoWrapper.style.width = "24px";
    logoWrapper.style.height = "24px";
    logoWrapper.style.display = "inline-flex";
    logoWrapper.style.alignItems = "center";
    logoWrapper.style.justifyContent = "center";
    logoWrapper.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#pc-shortcut-clip)">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M31.8808 18.4286C32.205 19.6466 31.8571 20.9464 30.9658 21.8378L21.8369 30.9667C20.9455 31.8577 19.6455 32.2054 18.4277 31.8788L9.77045 29.5594C10.3655 28.7848 10.7111 27.8787 10.8115 26.9501L17.9687 28.869C18.9555 29.1348 20.0081 28.8519 20.7314 28.1288L28.1288 20.7313C28.8497 20.0079 29.1317 18.9556 28.8681 17.9686L26.8867 10.5712C27.8129 10.4428 28.7116 10.069 29.4746 9.44615L31.8808 18.4286ZM2.64838 23.4247C4.28419 21.7912 6.94458 21.7889 8.57807 23.4247C10.2115 25.0605 10.2115 27.7209 8.57807 29.3544C6.94221 30.9873 4.28169 30.99 2.64838 29.3544C1.01509 27.7187 1.01544 25.0582 2.64838 23.4247ZM10.163 1.03405C11.0544 0.142629 12.3551 -0.204761 13.5732 0.121936L21.9081 2.35729C21.3434 3.14603 21.0264 4.06135 20.954 4.9901L14.0322 3.13463C13.0453 2.86877 11.9928 3.15071 11.2695 3.87389L3.87201 11.2713C3.15095 11.9948 2.86906 13.0479 3.13276 14.035V14.0321L5.05072 21.1893C4.1243 21.2897 3.21842 21.6376 2.44135 22.2303L0.122013 13.5721C-0.204452 12.3542 0.142875 11.0542 1.03412 10.163L10.163 1.03405ZM23.207 2.43151C24.8428 0.798139 27.5032 0.79818 29.1367 2.43151C30.7701 4.0673 30.7701 6.7277 29.1367 8.36119C27.5008 9.99446 24.8404 9.99461 23.207 8.36119C21.5737 6.72544 21.5738 4.06497 23.207 2.43151Z"
            fill="url(#pc-shortcut-gradient)"
          />
          <path
            d="M22.4722 9.09619C21.6368 8.26078 21.1445 7.21068 20.9928 6.12091L14.2115 4.30307C13.3154 4.06272 12.3563 4.31941 11.7006 4.97513L4.97527 11.7004C4.31954 12.3562 4.06285 13.3152 4.30321 14.2113L6.17238 21.1887C7.32049 21.3123 8.4336 21.8094 9.31101 22.6868C10.1884 23.5642 10.6878 24.6773 10.8092 25.8254L17.7865 27.6946C18.6826 27.935 19.6416 27.6783 20.2974 27.0225L27.0227 20.2972C27.6784 19.6415 27.9351 18.6824 27.6947 17.7863L25.7719 10.606C24.5678 10.515 23.3893 10.0109 22.4699 9.09152L22.4722 9.09619Z"
            fill="#37FFEE"
          />
        </g>
        <defs>
          <linearGradient
            id="pc-shortcut-gradient"
            x1="6.40028"
            y1="7.4667"
            x2="25.6007"
            y2="26.667"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#4755E2" />
            <stop offset="1" stop-color="#6643E3" />
          </linearGradient>
          <clipPath id="pc-shortcut-clip">
            <rect width="32" height="32" fill="white" />
          </clipPath>
        </defs>
      </svg>
    `;
    button.appendChild(logoWrapper);

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        await chrome.runtime.sendMessage({ type: "PEER_CONNECT_OPEN_POPUP" });
      } catch (error) {
        console.warn("Peer Connect: unable to open popup from shortcut", error);
      }
    });

    document.documentElement.appendChild(button);
    state.shortcutButton = button;
    return button;
  }

  function positionShortcutButton() {
    if (!isShortcutEligibleHost()) {
      return;
    }
    const anchor = findShortcutAnchor();
    const button = ensureShortcutButton();
    if (!anchor) {
      button.style.display = "none";
      state.shortcutAnchor = null;
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const size = 48;
    const margin = 8;
    const left = Math.min(Math.max(rect.right - size - margin, margin), viewportWidth - size - margin);
    const top = Math.min(
      Math.max(rect.top + (rect.height - size) / 2, margin),
      viewportHeight - size - margin
    );

    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
    state.shortcutAnchor = anchor;
  }

  function initInputShortcut() {
    if (!isShortcutEligibleHost()) {
      return;
    }
    positionShortcutButton();
    window.addEventListener("resize", positionShortcutButton);
    window.addEventListener("scroll", positionShortcutButton, true);

    const observer = new MutationObserver(() => {
      positionShortcutButton();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true
    });
    state.shortcutObserver = observer;
  }

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

  function createOverlay(peer) {
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
        color: #4b5567;
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
        color: #475569;
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
        background: #f3f6fb;
        color: #1f2a44;
        border: 1px solid #c5d0e4;
        font-weight: 600;
      }
      .not-now:hover {
        background: #e9eef8;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #475569;
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
          color: #d5def3;
        }
        button {
          color: #ecf0ff;
          border-color: rgba(255, 255, 255, 0.24);
          background: transparent;
        }
        .not-now {
          background: rgba(255, 255, 255, 0.1);
          color: #f2f5ff;
          border-color: rgba(255, 255, 255, 0.3);
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
    timerText.textContent = "Auto-dismiss in 30s";
    meta.appendChild(timerText);

    const bar = document.createElement("div");
    bar.className = "bar";
    const progress = document.createElement("span");
    bar.appendChild(progress);

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
    connectBtn.focus();

    let dismissTimer = null;
    let secondsLeft = 30;
    dismissTimer = setInterval(() => {
      secondsLeft -= 1;
      timerText.textContent = `Auto-dismiss in ${Math.max(secondsLeft, 0)}s`;
      const percent = Math.max((secondsLeft / 30) * 100, 0);
      progress.style.width = `${percent}%`;
      if (secondsLeft <= 0) {
        clearInterval(dismissTimer);
        closeOverlay("timeout");
      }
    }, 1000);

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
      const matchId = peer.matchId || "unknown_match";
      console.log("Peer Connect: connect clicked, match_id:", matchId);
      closeOverlay("connect");
    });

    notNowBtn.addEventListener("click", () => {
      console.log("Peer Connect: not now clicked");
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
    createOverlay(suggestion);
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
    initInputShortcut();
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
