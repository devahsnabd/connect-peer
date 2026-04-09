(function initConnectSession(global) {
  const PEER_CONNECTION_PAGE = "peer-connection.html";
  const MOCK_PEERS = [
    {
      matchId: "abc123",
      contextToken: "xyz789",
      title: "Solved a similar challenge",
      supportingText: "A quick peer conversation may help more than another search result right now.",
      domain: "Product Design",
      experience: "6+ years",
      availability: "Today",
      isAvailable: false
    },
    {
      matchId: "def456",
      contextToken: "uvw111",
      title: "Solved a similar challenge",
      supportingText: "Peer recently navigated a similar blocker and can share practical next steps.",
      domain: "Frontend",
      experience: "5+ years",
      availability: "Today",
      isAvailable: true
    },
    {
      matchId: "ghi789",
      contextToken: "rst222",
      title: "Solved a similar challenge",
      supportingText: "A peer with adjacent experience is available to help you pressure-test the next move.",
      domain: "Career Strategy",
      experience: "8+ years",
      availability: "Tomorrow",
      isAvailable: true
    }
  ];

  function clonePeer(peer) {
    return peer ? { ...peer } : null;
  }

  function getPeerQueue() {
    return MOCK_PEERS.map(clonePeer);
  }

  function getDefaultPeer() {
    return clonePeer(MOCK_PEERS[0]);
  }

  function getPeerByMatchId(matchId) {
    return clonePeer(MOCK_PEERS.find((peer) => peer.matchId === matchId) || null);
  }

  function getNextAvailablePeer(excludedMatchIds) {
    const excluded = new Set(excludedMatchIds || []);
    return clonePeer(
      MOCK_PEERS.find((peer) => peer.isAvailable && !excluded.has(peer.matchId)) || null
    );
  }

  function buildConnectionUrl(peer, options) {
    const selectedPeer = peer || getDefaultPeer();
    const params = new URLSearchParams();
    params.set("match_id", selectedPeer.matchId);
    params.set("context_token", selectedPeer.contextToken);
    if (options && options.source) {
      params.set("source", options.source);
    }
    const baseUrl =
      typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL(PEER_CONNECTION_PAGE)
        : PEER_CONNECTION_PAGE;
    return `${baseUrl}?${params.toString()}`;
  }

  function resolveSession(matchId) {
    const requestedPeer = getPeerByMatchId(matchId) || getDefaultPeer();
    if (requestedPeer && requestedPeer.isAvailable) {
      return {
        requestedPeer,
        activePeer: requestedPeer,
        fallbackPeer: null,
        waitlistOnly: false
      };
    }

    const fallbackPeer = getNextAvailablePeer([requestedPeer ? requestedPeer.matchId : ""]);
    return {
      requestedPeer,
      activePeer: fallbackPeer,
      fallbackPeer,
      waitlistOnly: !fallbackPeer
    };
  }

  global.PeerConnectSession = {
    PEER_CONNECTION_PAGE,
    getPeerQueue,
    getDefaultPeer,
    getPeerByMatchId,
    getNextAvailablePeer,
    buildConnectionUrl,
    resolveSession
  };
})(typeof window !== "undefined" ? window : self);
