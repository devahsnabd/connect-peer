(function initPeerConnectionPage() {
  const els = {
    sessionTitle: document.getElementById("sessionTitle"),
    sessionMessage: document.getElementById("sessionMessage"),
    statusPill: document.getElementById("statusPill"),
    peerTitle: document.getElementById("peerTitle"),
    peerSummary: document.getElementById("peerSummary"),
    peerDomain: document.getElementById("peerDomain"),
    peerExperience: document.getElementById("peerExperience"),
    peerAvailability: document.getElementById("peerAvailability"),
    matchIdField: document.getElementById("matchIdField"),
    contextTokenField: document.getElementById("contextTokenField"),
    primaryActionBtn: document.getElementById("primaryActionBtn"),
    secondaryActionBtn: document.getElementById("secondaryActionBtn")
  };

  function setPeer(peer) {
    els.peerTitle.textContent = peer.title || "Peer match";
    els.peerSummary.textContent = peer.supportingText || "Your session is ready.";
    els.peerDomain.textContent = peer.domain || "-";
    els.peerExperience.textContent = peer.experience || "-";
    els.peerAvailability.textContent = peer.availability || "-";
  }

  function bindButtons(mode) {
    if (mode === "active") {
      els.primaryActionBtn.textContent = "Start session";
      els.secondaryActionBtn.textContent = "Join waitlist";
      els.primaryActionBtn.addEventListener("click", () => {
        window.alert("Prototype: peer session would start here.");
      });
      els.secondaryActionBtn.addEventListener("click", () => {
        window.alert("Prototype: waitlist saved.");
      });
      return;
    }

    els.primaryActionBtn.textContent = "Join waitlist";
    els.secondaryActionBtn.textContent = "See other matches";
    els.primaryActionBtn.addEventListener("click", () => {
      window.alert("Prototype: waitlist saved.");
    });
    els.secondaryActionBtn.addEventListener("click", () => {
      window.alert("Prototype: no additional matches are currently available.");
    });
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("match_id") || "";
    const contextToken = params.get("context_token") || "";
    const result = PeerConnectSession.resolveSession(matchId);

    els.matchIdField.value = matchId;
    els.contextTokenField.value = contextToken;

    if (result.activePeer) {
      setPeer(result.activePeer);
    }

    if (result.requestedPeer && result.requestedPeer.isAvailable) {
      els.statusPill.textContent = "Matched peer available";
      els.sessionTitle.textContent = "Your matched peer is ready";
      els.sessionMessage.textContent =
        "This session used the match and context token from the URL to pre-populate the connection.";
      bindButtons("active");
      return;
    }

    if (result.fallbackPeer) {
      setPeer(result.fallbackPeer);
      els.statusPill.textContent = "Primary match unavailable";
      els.sessionTitle.textContent = "Showing the next best available match";
      els.sessionMessage.textContent =
        "Your original match is unavailable, so we swapped in the next best peer while preserving the session context.";
      bindButtons("active");
      return;
    }

    els.statusPill.textContent = "No live match available";
    els.sessionTitle.textContent = "Join the waitlist";
    els.sessionMessage.textContent =
      "No matched peers are available right now. You can join the waitlist and keep this session context.";
    els.peerTitle.textContent = "Waitlist option";
    els.peerSummary.textContent =
      "We saved the session identifiers so the next available peer can be matched against the same request.";
    els.peerDomain.textContent = "Pending";
    els.peerExperience.textContent = "Pending";
    els.peerAvailability.textContent = "Waitlist";
    bindButtons("waitlist");
  }

  init();
})();
