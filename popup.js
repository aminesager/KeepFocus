// popup.js - Main popup logic WITHOUT settings code

// Site-specific option configurations
const SITE_OPTIONS_CONFIG = {
  "facebook.com": [
    { id: "hideFeed", label: "Hide Feed" },
    { id: "hideLikes", label: "Hide Likes and Comments" },
    { id: "hideChat", label: "Hide Chat Bar" },
    { id: "hideStories", label: "Hide Stories" },
    { id: "hideReels", label: "Hide Reels" },
    { id: "removeColors", label: "Remove Colors" },
  ],
  "youtube.com": [
    { id: "hideRecommendations", label: "Hide Recommendations" },
    { id: "redirectToSubs", label: "Force Redirect to Subscriptions" },
    { id: "hideNews", label: "Hide News" },
    { id: "hideSidebar", label: "Hide Sidebar" },
    { id: "hideComments", label: "Hide Comments" },
    { id: "hideShorts", label: "Hide Shorts" },
    { id: "removeColors", label: "Remove Colors" },
  ],
  "instagram.com": [
    { id: "hideFeed", label: "Hide Feed" },
    { id: "hideLikes", label: "Hide Likes and Comments" },
    { id: "hideStories", label: "Hide Stories" },
    { id: "hideReels", label: "Hide Reels" },
    { id: "removeColors", label: "Remove Colors" },
  ],
  "twitter.com": [
    { id: "blockTimeline", label: "Block Timeline" },
    { id: "hideAllMedia", label: "Hide All Media" },
    { id: "removeColors", label: "Remove Colors" },
  ],
};

// DOM elements (navigation only)
const currentSiteName = document.getElementById("currentSiteName");
const siteSettings = document.getElementById("siteSettings");
const generalSettings = document.getElementById("generalSettings");
const settingsNav = document.getElementById("settingsNav");

// Site options storage reference
window.siteOptions = {};

// Initialize the popup
document.addEventListener("DOMContentLoaded", initPopup);

async function initPopup() {
  // Initialize settings module
  if (window.settingsModule && window.settingsModule.init) {
    // Settings will auto-initialize via DOMContentLoaded
    console.log("Settings module available");
  }

  await setupNavigation();

  if (window.currentSite) {
    loadSiteSettings(window.currentSite);
  }

  setupDarkMode();
  document.addEventListener("languageChanged", handleLanguageChange);

  // Smooth popup reveal
  requestAnimationFrame(() => {
    document.body.classList.add("popup-loaded");
  });
}

function handleLanguageChange(e) {
  if (e.detail && e.detail.language) {
    if (window.currentSite) {
      loadSiteSettings(window.currentSite);
    }
  }
}

async function setupNavigation() {
  const data = await chrome.storage.local.get(["selectedNav"]);
  const savedNav = data.selectedNav || "facebook.com";

  document.querySelectorAll(".nav-item").forEach((nav) => {
    nav.classList.remove("active");
  });

  document.querySelectorAll(".nav-item:not(.settings-nav)").forEach((item) => {
    item.addEventListener("click", async () => {
      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });
      item.classList.add("active");

      siteSettings.style.display = "block";
      generalSettings.style.display = "none";

      window.currentSite = item.getAttribute("data-site");
      updateCurrentSiteDisplay();

      const siteKey = window.currentSite.split(".")[0];
      if (typeof updateCurrentSiteName === "function") {
        updateCurrentSiteName(siteKey);
      }

      await chrome.storage.local.set({
        selectedNav: window.currentSite,
      });

      loadSiteSettings(window.currentSite);
    });

    if (item.getAttribute("data-site") === savedNav) {
      item.classList.add("active");
      window.currentSite = savedNav;
      updateCurrentSiteDisplay();

      if (savedNav !== "settings") {
        siteSettings.style.display = "block";
        generalSettings.style.display = "none";
      }
    }
  });

  settingsNav.addEventListener("click", async () => {
    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("active");
    });
    settingsNav.classList.add("active");

    siteSettings.style.display = "none";
    generalSettings.style.display = "block";

    await chrome.storage.local.set({ selectedNav: "settings" });
  });

  if (savedNav === "settings") {
    settingsNav.classList.add("active");
    siteSettings.style.display = "none";
    generalSettings.style.display = "block";
  }
}

function getSiteDisplayName(site) {
  const names = {
    "facebook.com": "Facebook",
    "youtube.com": "YouTube",
    "twitter.com": "Twitter",
    "instagram.com": "Instagram",
  };
  return names[site] || site;
}

async function loadSiteSettings(site) {
  // Use settings module if available
  if (window.settingsModule && window.settingsModule.loadSiteSettings) {
    await window.settingsModule.loadSiteSettings(site);
  } else {
    // Fallback to direct call
    const data = await chrome.storage.local.get([
      "defaultSites",
      "siteOptions",
    ]);
    const defaultSites = data.defaultSites || {};
    const siteOptions = data.siteOptions || {};

    window.siteOptions = siteOptions;

    const siteToggle = document.getElementById("siteToggle");
    if (siteToggle) {
      siteToggle.checked = defaultSites[site] !== false;
    }

    updateSiteOptionsUI(site, siteOptions[site] || {});
  }
}

// Make this function globally accessible
window.updateSiteOptionsUI = function (site, options) {
  const siteOptionsContainer = document.querySelector(".site-options");
  const config = SITE_OPTIONS_CONFIG[site] || [];

  siteOptionsContainer.innerHTML = "";

  config.forEach((optionConfig) => {
    const div = document.createElement("div");
    div.className = "option-item";

    let label = optionConfig.label;
    if (typeof getTranslatedSiteOption === "function") {
      const translatedLabel = getTranslatedSiteOption(optionConfig.id);
      if (translatedLabel) {
        label = translatedLabel;
      }
    }

    div.innerHTML = `
      <span class="option-label">${label}</span>
      <label class="switch">
        <input type="checkbox" class="site-option" data-option="${
          optionConfig.id
        }" ${options[optionConfig.id] ? "checked" : ""}>
        <span class="slider"></span>
      </label>
    `;
    siteOptionsContainer.appendChild(div);
  });

  document.querySelectorAll(".site-option").forEach((option) => {
    option.addEventListener("change", updateSiteOptions);
  });
};

async function updateSiteOptions() {
  const data = await chrome.storage.local.get(["siteOptions"]);
  const siteOptions = data.siteOptions || {};

  const options = {};
  document.querySelectorAll(".site-option").forEach((option) => {
    const optionName = option.getAttribute("data-option");
    options[optionName] = option.checked;
  });

  siteOptions[window.currentSite] = options;
  await chrome.storage.local.set({ siteOptions });
  window.siteOptions = siteOptions;
}

function updateCurrentSiteDisplay() {
  const siteKey = window.currentSite.split(".")[0];
  if (currentSiteName) {
    currentSiteName.textContent = getSiteDisplayName(window.currentSite);
  }
}

// Dark mode handling
function setupDarkMode() {
  chrome.storage.local.get(["darkMode", "theme"], (data) => {
    const isDarkMode = data.darkMode || data.theme === "dark";
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      const icon = document.getElementById("darkModeIcon");
      if (icon) {
        icon.src = "icons/sun.svg";
      }
    }
  });
}

async function toggleDarkMode() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode");

  await chrome.storage.local.set({
    darkMode: !isDarkMode,
    theme: !isDarkMode ? "dark" : "light",
  });

  const icon = document.getElementById("darkModeIcon");
  if (icon) {
    icon.src = !isDarkMode ? "icons/sun.svg" : "icons/moon.svg";
  }
}

// Initialize dark mode toggle
document
  .getElementById("darkModeToggle")
  .addEventListener("click", toggleDarkMode);
