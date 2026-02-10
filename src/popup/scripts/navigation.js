// navigation.js - Navigation and site switching logic

// DOM elements for navigation
let currentSiteName, siteSettings, generalSettings, settingsNav;
let siteOptionsContainer;

// Current site state
window.currentSite = null;

// Site display names mapping
const SITE_DISPLAY_NAMES = {
  "facebook.com": "Facebook",
  "youtube.com": "YouTube",
  "x.com": "X",
  "instagram.com": "Instagram",
};

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
  "x.com": [
    { id: "blockTimeline", label: "Block Timeline" },
    { id: "hideAllMedia", label: "Hide All Media" },
    { id: "removeColors", label: "Remove Colors" },
  ],
};

// Initialize navigation module
// navigation.js - Navigation and site switching logic

// ... (keep all existing code at the top until initNavigation)

// Initialize navigation module
async function initNavigation() {
  // Get DOM elements
  currentSiteName = document.getElementById("currentSiteName");
  siteSettings = document.getElementById("siteSettings");
  generalSettings = document.getElementById("generalSettings");
  settingsNav = document.getElementById("settingsNav");
  siteOptionsContainer = document.querySelector(".site-options");

  // Get saved navigation state
  const data = await chrome.storage.local.get(["selectedNav"]);
  const savedNav = data.selectedNav || "facebook.com";

  // Setup navigation event listeners FIRST
  await setupNavigation();

  // ===== COMPREHENSIVE FIX =====
  // Wait a bit for DOM to be fully ready
  setTimeout(async () => {
    if (savedNav === "settings") {
      // Settings tab was saved
      if (settingsNav) {
        settingsNav.classList.add("active");
      }
      if (siteSettings) siteSettings.style.display = "none";
      if (generalSettings) generalSettings.style.display = "block";
      console.log("Restored settings tab");
    } else {
      // Site tab was saved
      // Find and activate the saved nav item
      const savedNavItem = document.querySelector(
        `.nav-item[data-site="${savedNav}"]:not(.settings-nav)`,
      );
      if (savedNavItem) {
        // Remove active from all
        document.querySelectorAll(".nav-item").forEach((nav) => {
          nav.classList.remove("active");
        });

        // Add active to saved
        savedNavItem.classList.add("active");

        // Set current site
        window.currentSite = savedNav;

        // Update display
        updateCurrentSiteDisplay();

        // Load site settings
        await loadSiteSettings(savedNav);

        // Show site settings
        if (siteSettings) siteSettings.style.display = "block";
        if (generalSettings) generalSettings.style.display = "none";

        console.log("Restored site tab:", savedNav);
      }
    }
  }, 50); // Small delay to ensure DOM is ready
  // ===== END FIX =====

  console.log("Navigation module initialized");
}

// ... (keep the rest of your existing navigation.js code)

// Setup navigation event listeners
async function setupNavigation() {
  const data = await chrome.storage.local.get(["selectedNav"]);
  const savedNav = data.selectedNav || "facebook.com";

  // Clear all active classes
  document.querySelectorAll(".nav-item").forEach((nav) => {
    nav.classList.remove("active");
  });

  // Setup site navigation items
  document.querySelectorAll(".nav-item:not(.settings-nav)").forEach((item) => {
    item.addEventListener("click", async () => {
      // Update active state
      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });
      item.classList.add("active");

      // Show site settings, hide general settings
      siteSettings.style.display = "block";
      generalSettings.style.display = "none";

      // Set current site
      window.currentSite = item.getAttribute("data-site");
      updateCurrentSiteDisplay();

      // Update translated site name
      const siteKey = window.currentSite.split(".")[0];
      if (typeof updateCurrentSiteName === "function") {
        updateCurrentSiteName(siteKey);
      }

      // Save navigation state
      await chrome.storage.local.set({
        selectedNav: window.currentSite,
      });

      // Load site-specific settings
      loadSiteSettings(window.currentSite);
    });

    // Restore saved active state
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

  // Setup settings navigation
  settingsNav.addEventListener("click", async () => {
    // Update active state
    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("active");
    });
    settingsNav.classList.add("active");

    // Show general settings, hide site settings
    siteSettings.style.display = "none";
    generalSettings.style.display = "block";

    // Save navigation state
    await chrome.storage.local.set({ selectedNav: "settings" });
  });

  // Restore settings nav if selected
  if (savedNav === "settings") {
    settingsNav.classList.add("active");
    siteSettings.style.display = "none";
    generalSettings.style.display = "block";
  }
}

// Update current site display
function updateCurrentSiteDisplay() {
  if (!currentSiteName) return;

  const siteKey = window.currentSite
    ? window.currentSite.split(".")[0]
    : "facebook";
  currentSiteName.textContent = getSiteDisplayName(window.currentSite);

  // Update translation attribute
  currentSiteName.setAttribute("data-translation", siteKey);
}

// Get display name for site
function getSiteDisplayName(site) {
  return SITE_DISPLAY_NAMES[site] || site;
}

// Load site-specific settings
async function loadSiteSettings(site) {
  // Get site options from storage
  const data = await chrome.storage.local.get(["defaultSites", "siteOptions"]);
  const defaultSites = data.defaultSites || {};
  const siteOptions = data.siteOptions || {};

  // Store site options globally (for translations)
  window.siteOptions = siteOptions;

  // Update site toggle if available
  const siteToggle = document.getElementById("siteToggle");
  if (siteToggle) {
    siteToggle.checked = defaultSites[site] !== false;
  }

  // Update site options UI
  updateSiteOptionsUI(site, siteOptions[site] || {});
}

// Update site options UI
function updateSiteOptionsUI(site, options) {
  if (!siteOptionsContainer) return;

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

  // Re-attach event listeners to new checkboxes
  document.querySelectorAll(".site-option").forEach((option) => {
    option.addEventListener("change", updateSiteOptions);
  });
}

// Update site options in storage
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

// Handle language changes (for site options translation)
function handleLanguageChange(e) {
  if (e.detail && e.detail.language) {
    if (window.currentSite) {
      loadSiteSettings(window.currentSite);
    }
  }
}

// Export functions for use by other modules
window.navigationModule = {
  init: initNavigation,
  handleLanguageChange: handleLanguageChange,
};

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  initNavigation();
}
