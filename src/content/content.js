// Content script for modifying page content
console.log("KeepFocus content script loaded");

let currentStyles = null;

// Apply content modifications based on settings
async function applyContentModifications() {
  const hostname = window.location.hostname;
  const data = await chrome.storage.local.get(["siteOptions"]);
  const siteOptions = data.siteOptions || {};

  console.log("Applying content modifications for:", hostname);

  // Remove existing styles
  if (currentStyles) {
    currentStyles.remove();
    currentStyles = null;
  }

  if (hostname.includes("facebook.com")) {
    applyFacebookModifications(siteOptions["facebook.com"]);
  } else if (hostname.includes("youtube.com")) {
    applyYouTubeModifications(siteOptions["youtube.com"]);
  } else if (hostname.includes("instagram.com")) {
    applyInstagramModifications(siteOptions["instagram.com"]);
  } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    applyTwitterModifications(siteOptions["twitter.com"]);
  }
}

// Facebook modifications
function applyFacebookModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  if (options.hideFeed) {
    css += `
      [role="feed"], 
      [data-pagelet="Feed"],
      div[data-pagelet="MainFeed"],
      .x1yztbdb.x1n2onr6.xh8yej3,
      div[aria-label="News Feed"]
      { display: none !important; }
    `;
  }

  if (options.hideLikes) {
    css += `
      [aria-label*="Like"],
      [aria-label*="Reaction"],
      [aria-label*="Comment"],
      .x1i10hfl,
      .x6s0dn4,
      div[aria-label="Actions for this post"],
      span[aria-label*="reactions"],
      div[role="button"][aria-label*="Like"]
      { display: none !important; }
    `;
  }

  if (options.hideChat) {
    css += `
      [aria-label="Chat"],
      [data-pagelet="Dock"],
      .x1iyjqo2,
      div[aria-label="Chats"],
      div[role="complementary"][aria-label*="Chat"]
      { display: none !important; }
    `;
  }

  if (options.hideStories) {
    css += `
      [aria-label="Stories"],
      .x1rg5ohu,
      div[aria-label*="Stories"],
      div[role="region"][aria-label*="Stories"]
      { display: none !important; }
    `;
  }

  if (options.hideReels) {
    css += `
      [aria-label="Reels"],
      [href*="/reel/"],
      .x1qjc9v5,
      div[aria-label*="Reels"],
      a[href*="/reels/"]
      { display: none !important; }
    `;
  }

  if (options.removeColors) {
    css += `
      * {
        filter: grayscale(100%) !important;
      }
    `;
  }

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;
}

// YouTube modifications
function applyYouTubeModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  if (options.hideRecommendations) {
    css += `
      #contents.ytd-rich-grid-renderer,
      ytd-rich-grid-renderer,
      ytd-rich-grid-row,
      #secondary,
      #related,
      ytd-watch-next-secondary-results-renderer,
      .ytd-item-section-renderer
      { display: none !important; }
    `;
  }

  if (options.hideNews) {
    css += `
      ytd-rich-section-renderer,
      [aria-label*="news"],
      [title*="News"]
      { display: none !important; }
    `;
  }

  if (options.hideSidebar) {
    css += `
      #secondary,
      #guide,
      ytd-guide-renderer,
      #guide-inner-content
      { display: none !important; }
    `;
  }

  if (options.hideComments) {
    css += `
      ytd-comments,
      #comments,
      #comment-teaser,
      ytd-comment-thread-renderer
      { display: none !important; }
    `;
  }

  if (options.hideShorts) {
    css += `
      [title="Shorts"],
      ytd-reel-shelf-renderer,
      #shorts-container,
      a[href*="/shorts/"],
      ytd-rich-shelf-renderer[is-shorts]
      { display: none !important; }
    `;
  }

  if (options.removeColors) {
    css += `
      * {
        filter: grayscale(100%) !important;
      }
    `;
  }

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;

  if (
    options.redirectToSubs &&
    !window.location.pathname.includes("/feed/subscriptions")
  ) {
    if (window.location.pathname === "/") {
      window.location.href = "https://www.youtube.com/feed/subscriptions";
    }
  }
}

// Instagram modifications
function applyInstagramModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  if (options.hideFeed) {
    css += `
      main [role="main"] > div > div,
      ._aa6h,
      article,
      div[role="button"][tabindex="0"],
      section main
      { display: none !important; }
    `;
  }

  if (options.hideLikes) {
    css += `
    /* Hide like‑count / comment‑count / comments list / action buttons */
    a[href*="/liked_by"],
    a[href*="/likes"],
    a[href*="/comments"],
    a[href*="/liked"],

    button[aria-label="Like"],
    button[aria-label="Unlike"],
    button[aria-label="Comment"],
    button[aria-label="Share"],
    button[aria-label="Save"],
    svg[aria-label="Like"],
    svg[aria-label="Unlike"],
    svg[aria-label="Comment"],
    svg[aria-label="Share"],
    svg[aria-label="Save"]

    
     {
      display: none !important;
    }
  `;
  }

  if (options.hideStories) {
    css += `
      [aria-label="Story"],
      ._acaz,
      section[aria-label="Stories"],
      div[aria-label*="story"]
      { display: none !important; }
    `;
  }

  if (options.hideReels) {
    css += `
    /* Hide the entire Reels nav button by its exact href */
    a[href="/reels/"] {
      display: none !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }

    /* Also hide any children inside that button (icon, text) */
    a[href="/reels/"] * {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* Extra safety: ONLY hide Reels icon if it's INSIDE a nav button */
    a[href="/reels/"] svg[aria-label="Reels"] {
      display: none !important;
    }
  `;
  }

  if (options.removeColors) {
    css += `
      * {
        filter: grayscale(100%) !important;
      }
    `;
  }

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;
}

// Twitter modifications
function applyTwitterModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  if (options.blockTimeline) {
    css += `
      [data-testid="primaryColumn"],
      [aria-label="Timeline"],
      .r-1ye8kvj,
      [data-testid="tweet"],
      main[role="main"]
      { display: none !important; }
    `;
  }

  if (options.hideAllMedia) {
    css += `
      [data-testid="tweetPhoto"],
      [data-testid="tweetVideo"],
      [data-testid="videoPlayer"],
      img[alt*="Image"],
      video,
      [aria-label*="Image"],
      [aria-label*="Video"]
      { display: none !important; }
    `;
  }

  if (options.removeColors) {
    css += `
      * {
        filter: grayscale(100%) !important;
      }
    `;
  }

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyContentModifications);
} else {
  applyContentModifications();
}

// Re-apply when navigating (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(applyContentModifications, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Listen for storage changes to update modifications in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.siteOptions) {
    setTimeout(applyContentModifications, 500);
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateContentFiltering") {
    applyContentModifications();
  }
});
