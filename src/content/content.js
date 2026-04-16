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

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (hostname.includes("facebook.com")) {
    applyFacebookModifications(siteOptions["facebook.com"]);
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************
  else if (hostname.includes("youtube.com")) {
    applyYouTubeModifications(siteOptions["youtube.com"]);
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************
  else if (hostname.includes("instagram.com")) {
    applyInstagramModifications(siteOptions["instagram.com"]);
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************
  else if (hostname.includes("x.com") || hostname.includes("x.com")) {
    applyXModifications(siteOptions["x.com"]);
  }
}

//***********************************************************************************************************************************
//***********************************************************************************************************************************

function applyFacebookModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideFeed) {
    css += `
      /* Hide chat dock and chat sidebar */
      div[data-pagelet="Dock"],
      div[aria-label="Chats"],
      div[aria-label="Chat"],
      aside[aria-label*="Chat"],
      div[role="complementary"][aria-label*="Chat"]
      { display: none !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideLikes) {
    css += `
    /* Hide Like, Comment, Share buttons and reaction counts */
     .x1diwwjn {
      display: none !important;
    }
  `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideChat) {
    css += `
    /* Hide chat dock and sidebar */
    .xwib8y2 .x1y1aw1k .xdj266r {
      display: none !important;
    }
  `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideStories) {
    css += `
      [data-pagelet="Stories"],
      [data-pagelet="StoriesContainer"],
      div[aria-label="Stories"],
      div[aria-label*="Stories"],
      [role="region"][aria-label*="Stories"],
      [role="region"][aria-label*="stories"]
      { display: none !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideReels) {
    css += `
      div[data-pagelet*="Reels"],
      div[aria-label="Reels"],
      div[aria-label*="Reels"],
      div[role="region"][aria-label*="Reels"],
      a[href*="/reel/"],
      a[href*="/reels/"]
      { display: none !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.removeColors) {
    css += `
      html
      { filter: grayscale(100%) !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;
}

//***********************************************************************************************************************************
//***********************************************************************************************************************************

// YouTube modifications
function applyYouTubeModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

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

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideNews) {
    css += `
      ytd-rich-section-renderer,
      [aria-label*="news"],
      [title*="News"]
      { display: none !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideSidebar) {
    css += `
      #secondary,
      #guide,
      ytd-guide-renderer,
      #guide-inner-content
      { display: none !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideComments) {
    css += `
      ytd-comments,
      #comments,
      #comment-teaser,
      ytd-comment-thread-renderer
      { display: none !important; }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

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

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.removeColors) {
    css += `
      * {
        filter: grayscale(100%) !important;
      }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (
    options.redirectToSubs &&
    !window.location.pathname.includes("/feed/subscriptions")
  ) {
    if (window.location.pathname === "/") {
      window.location.href = "https://www.youtube.com/feed/subscriptions";
    }
  }
}

//***********************************************************************************************************************************
//***********************************************************************************************************************************

// Instagram modifications
function applyInstagramModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideFeed) {
    css += `
    main > div > div:first-child > div:first-child {
      display: none !important;
    }
  `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideLikes) {
    css += `
    .x6s0dn4.xrvj5dj.x1o61qjw.x12nagc.x1gslohp {
      display: none !important;
    }
  `;
  }

  // THIS IS A PLANNED FEATURE IN THE FUTURE, REQUIRED TOGGLE CREATION AND WIRING ACROSS ALL FILES + TRANSLATION
  //   if (options.hideChatSection) {
  //     css += `
  //     .x1i10hfl.x9f619.x1ypdohk.xdl72j9.x2lah0s.x3ct3a4.xdj266r.x14z9mp.xat24cr.x1lziwak.x2lwn1j.xeuugli.xexx8yu.x18d9i69.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1q0g3np.x87ps6o.x1lku1pv.x1a2a7pz.x6s0dn4.x7r02ix.x1ss9elp.x11ppq56.xvhwddo.x1o29io0.x13fuv20.x18b5jzi.x1q0q8m5.x1t7ytsu.x1w60jca.x3nfvp2.xl56j7k.x1n2onr6.x6zsckl.x10qfohq.xdwr3uu.xly64p6.x178xt8z.x1lun4ml.xso031l.xpilrb4.xnnlda6.xv54qhq.xf7dkkf.x1ddxa5k.xysibl7.x4yb96v.x1kylhsf.xed3198
  //  {
  //       display: none !important;
  //     }
  //   `;
  //   }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideStories) {
    css += `
    .x1qjc9v5.x1q0g3np.x5yr21d.xw2csxc.x10wlt62.x1n2onr6.x1rohswg.x78zum5.x1y1aw1k.xrw5ot4.xwib8y2.x7coems.xfk6m8, ._afxw._al46._aahm._akl_._aul3._al47{
      display: none !important;
    }
  `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.hideReels) {
    css += `
    a[href="/reels/"] {
      display: none !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }

    a[href="/reels/"] * {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    a[href="/reels/"] svg[aria-label="Reels"] {
      display: none !important;
    }
  `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.removeColors) {
    css += `
      * {
        filter: saturate(0%) !important;
      }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  style.textContent = css;
  document.head.appendChild(style);
  currentStyles = style;

  if (options.hideReels && window.location.pathname.includes("/reels")) {
    window.location.href = "https://www.instagram.com/";
  }
  if (options.hideStories && window.location.pathname.includes("/stories")) {
    window.location.href = "https://www.instagram.com/";
  }
}

//***********************************************************************************************************************************
//***********************************************************************************************************************************

// X modifications
function applyXModifications(options) {
  if (!options) return;

  const style = document.createElement("style");
  style.id = "keepfocus-styles";

  let css = "";

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

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

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

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

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

  if (options.removeColors) {
    css += `
      * {
        filter: grayscale(100%) !important;
      }
    `;
  }

  //***********************************************************************************************************************************
  //***********************************************************************************************************************************

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
