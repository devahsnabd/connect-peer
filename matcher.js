(function initMatcher(global) {
  const SCORE_THRESHOLD = 0.6;
  const searchIntentKeywords = [
    "how to",
    "help",
    "career",
    "mentor",
    "stuck",
    "improve",
    "learn",
    "advice"
  ];
  function detectPageType(url, formFieldCount) {
    const hostname = url.hostname;
    const path = url.pathname;

    if (hostname.includes("google.") && path.includes("/search")) {
      return "search";
    }
    if (hostname.includes("bing.com") && path.includes("/search")) {
      return "search";
    }
    if (
      hostname.includes("chatgpt.com") ||
      hostname.includes("openai.com") ||
      hostname.includes("claude.ai") ||
      hostname.includes("gemini.google.com")
    ) {
      return "ai_chat";
    }
    if (formFieldCount >= 5) {
      return "form_heavy";
    }
    return "unsupported";
  }

  function scoreSearchIntent(queryText) {
    if (!queryText) {
      return 0;
    }
    const lowered = queryText.toLowerCase();
    const matched = searchIntentKeywords.filter((word) => lowered.includes(word)).length;
    if (matched >= 2) {
      return 0.35;
    }
    if (matched === 1) {
      return 0.2;
    }
    return 0;
  }

  function calculateRelevanceScore(params) {
    const {
      pageType,
      queryText = "",
      goalContextLength = 0,
      aiMessageCount = 0,
      isGoalTopic = false,
      timeOnPageMs = 0,
      formFieldCount = 0,
      frequency = "active"
    } = params;

    let score = 0.3;
    if (pageType === "search") {
      score += 0.2;
      score += scoreSearchIntent(queryText);
    }
    if (pageType === "ai_chat") {
      score += aiMessageCount >= 3 ? 0.3 : 0;
      score += isGoalTopic ? 0.2 : 0;
    }
    if (pageType === "form_heavy") {
      score += formFieldCount >= 5 ? 0.2 : 0;
      score += timeOnPageMs >= 60000 ? 0.2 : 0;
    }
    if (goalContextLength >= 20) {
      score += 0.1;
    }

    const multiplier = global.PeerConnectStorage
      ? global.PeerConnectStorage.mapFrequencyToMultiplier(frequency)
      : 1;
    return Math.min(1, score / multiplier);
  }

  async function getPeerSuggestion(context) {
    if (context.pageType === "search" && scoreSearchIntent(context.queryText || "") === 0) {
      return null;
    }

    const score = calculateRelevanceScore(context);
    if (score < SCORE_THRESHOLD) {
      return null;
    }

    // TODO: Replace with real peer matching API request.
    const apiAvailable = Math.random() > 0.1;
    if (!apiAvailable) {
      return null;
    }

    const queue = global.PeerConnectSession
      ? global.PeerConnectSession.getPeerQueue()
      : [];
    const peer = queue.length ? queue[Math.floor(Math.random() * queue.length)] : null;
    if (!peer) {
      return null;
    }
    return { ...peer, score };
  }

  global.PeerConnectMatcher = {
    SCORE_THRESHOLD,
    searchIntentKeywords,
    scoreSearchIntent,
    detectPageType,
    calculateRelevanceScore,
    getPeerSuggestion
  };
})(typeof window !== "undefined" ? window : self);
