# Peer Connect Chrome Extension (Prototype)

## Description
Peer Connect is a Chrome Extension prototype that detects moments when a user may benefit more from human guidance than AI or search results, then surfaces a subtle in-page suggestion to connect with a relevant peer.

The extension is designed for:
- Google Search
- Bing
- AI chat platforms (ChatGPT, Claude, Gemini)
- Form-heavy web pages

This prototype prioritizes interaction quality, accessibility, and low-friction UI behavior over backend integrations.

## Features

### 1) Context Detection and Triggering
- Threshold-based context scoring system
- Default trigger threshold: `0.60`
- Session guardrails to reduce interruption:
  - Maximum `2` suggestions per session
  - Cooldown period: `10` minutes between suggestions

### 2) Suggestion Overlay Experience
- Non-intrusive suggestion card anchored to the bottom-right of the page
- Peer summary preview:
  - Domain
  - Experience
  - Availability
- Primary actions:
  - **Connect**
  - **Not now**
- Auto-dismiss after `30` seconds on AI chat platforms

### 3) User Controls and Onboarding
- 3-step onboarding flow
- Settings popup with:
  - Pause / resume suggestions
  - Frequency controls
  - Goal context preference

### 4) UI Architecture and Quality
- Shadow DOM for style isolation
- Dark mode support via `prefers-color-scheme`
- Accessibility target: WCAG 2.1 AA
- Keyboard navigable interactions

### 5) Data and Security
- Uses `chrome.storage.local` for extension data
- Prototype includes encrypted storage handling

## Tech Stack
- **Platform:** Chrome Extension APIs (Manifest V3)
- **Languages:** JavaScript, HTML, CSS
- **Storage:** `chrome.storage.local` (encrypted at rest in project logic)
- **Styling:** Native CSS + Shadow DOM encapsulation
- **Build/Tooling:** None required (no bundler, no framework dependency)

## Project Structure
Basic structure (representative):

```text
peer-connect/
├── manifest.json
├── background.js
├── content.js
├── matcher.js
├── storage.js
├── crypto.js
├── popup.html
├── popup.css
├── popup.js
├── onboarding.html
├── onboarding.css
├── onboarding.js
├── options.html
├── options.css
├── options.js
├── peer-suggestion-overlay-prototype.html
├── styles/
│   └── shared.css
└── icons/
```

## How to Run
This prototype supports two ways to run depending on what you want to validate.

### Option A: Run the overlay prototype directly (fastest)
1. Open `peer-suggestion-overlay-prototype.html` in a browser.
2. Interact with the suggestion card UI and actions.

Example:

```bash
# From the project root
xdg-open peer-suggestion-overlay-prototype.html
```

### Option B: Load as an unpacked Chrome Extension
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project folder (`peer-connect`).
5. Open supported pages (Google, Bing, ChatGPT, Claude, Gemini, forms) to validate injection behavior.

## How to Test Features

### Context Triggering
- Visit a supported page and simulate/query scenarios that should increase context score.
- Confirm the suggestion appears only when score meets/exceeds `0.60`.

### Session Limits and Cooldown
- Trigger suggestions repeatedly.
- Validate:
  - No more than `2` suggestions in one session
  - New suggestion is blocked during the `10` minute cooldown

### Overlay Interaction
- Verify card appears bottom-right and does not block core page tasks.
- Click **Connect**:
  - Expected prototype behavior: `console.log` or `alert` stub
- Click **Not now**:
  - Card dismisses without navigation side effects

### AI Chat Auto-dismiss
- On ChatGPT/Claude/Gemini, keep card idle.
- Confirm dismissal after `30` seconds.

### Settings and Onboarding
- Walk through all 3 onboarding steps.
- Test popup controls:
  - Pause suggestions
  - Change suggestion frequency
  - Update goal context
- Validate values persist through extension storage behavior.

### Visual + Theming
- Toggle OS/browser dark mode.
- Verify color contrast and style adaptation.
- Confirm Shadow DOM styles stay isolated from host page CSS.

## Accessibility Notes
- Built toward **WCAG 2.1 AA** principles for contrast, focus visibility, and interaction clarity.
- Overlay is keyboard-accessible:
  - Reachable via `Tab`
  - Actionable with keyboard controls (`Enter`/`Space` where applicable)
- Focus management avoids trapping users in the overlay.
- Motion/timing behavior is limited and non-disruptive (including timed dismiss on AI chat).

## Design Decisions
- **Non-intrusive UI first:** Bottom-right placement reduces interruption during active tasks.
- **Context thresholding:** Prevents noisy or irrelevant prompts.
- **Session guardrails:** Balances usefulness with user trust.
- **Shadow DOM:** Ensures predictable styling across arbitrary host websites.
- **Prototype simplicity:** Single HTML component for rapid iteration and UX validation.

## Limitations (Prototype)
- `Connect` flow is stubbed (no real peer matching backend or messaging).
- Context scoring heuristics are basic and not model-trained.
- Browser coverage is focused on Chrome Extension behavior.
- No analytics pipeline for outcomes, CTR, or quality feedback.
- Encryption approach is prototype-level and not audited for production hardening.

## Future Improvements
- Integrate real peer-matching API and authenticated connect flow.
- Improve context scoring with richer signals and adaptive calibration.
- Add user-level personalization and smarter frequency controls.
- Implement telemetry and experiment framework (A/B testing).
- Expand automated test coverage (unit + E2E + accessibility checks).
- Add localization and broader browser support where feasible.

## Screenshots
> Add screenshots/gifs for:
> - Overlay card on Google/Bing
> - Overlay card on AI chat page
> - Onboarding steps
> - Settings popup
> - Dark mode variant

## License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

