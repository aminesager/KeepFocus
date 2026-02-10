let currentSiteName, siteSettings, generalSettings, settingsNav;
let siteOptionsContainer;

window.currentSite = null;

const SITE_DISPLAY_NAMES = {
  "facebook.com": "Facebook",
  "youtube.com": "YouTube",
  "x.com": "X",
  "instagram.com": "Instagram",
};

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

async function initNavigation() {
  currentSiteName = document.getElementById("currentSiteName");
  siteSettings = document.getElementById("siteSettings");
  generalSettings = document.getElementById("generalSettings");
  settingsNav = document.getElementById("settingsNav");
  siteOptionsContainer = document.querySelector(".site-options");

  const data = await chrome.storage.local.get(["selectedNav"]);
  const savedNav = data.selectedNav || "facebook.com";

  await setupNavigation();

  if (savedNav === "settings") {
    if (settingsNav) settingsNav.classList.add("active");
    if (siteSettings) siteSettings.style.display = "none";
    if (generalSettings) generalSettings.style.display = "block";
  } else {
    const savedNavItem = document.querySelector(
      `.nav-item[data-site="${savedNav}"]:not(.settings-nav)`,
    );
    if (savedNavItem) {
      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });
      savedNavItem.classList.add("active");
      window.currentSite = savedNav;
      updateCurrentSiteDisplay();
      await loadSiteSettings(savedNav);
      if (siteSettings) siteSettings.style.display = "block";
      if (generalSettings) generalSettings.style.display = "none";
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

function updateCurrentSiteDisplay() {
  if (!currentSiteName) return;

  const siteKey = window.currentSite
    ? window.currentSite.split(".")[0]
    : "facebook";
  currentSiteName.textContent =
    SITE_DISPLAY_NAMES[window.currentSite] || window.currentSite;
  currentSiteName.setAttribute("data-translation", siteKey);
}

async function loadSiteSettings(site) {
  const data = await chrome.storage.local.get(["defaultSites", "siteOptions"]);
  const defaultSites = data.defaultSites || {};
  const siteOptions = data.siteOptions || {};

  const siteToggle = document.getElementById("siteToggle");
  if (siteToggle) {
    siteToggle.checked = defaultSites[site] !== false;
  }

  updateSiteOptionsUI(site, siteOptions[site] || {});
}

function updateSiteOptionsUI(site, options) {
  if (!siteOptionsContainer) return;

  const config = SITE_OPTIONS_CONFIG[site] || [];

  siteOptionsContainer.innerHTML = "";

  config.forEach((optionConfig) => {
    const div = document.createElement("div");
    div.className = "option-item";
    div.innerHTML = `
      <span class="option-label">${optionConfig.label}</span>
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
}

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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  initNavigation();
}
