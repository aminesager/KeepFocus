const dropdown = document.getElementById("langDropdown");
const langOptionsBox = document.getElementById("langOptions");
const selectedFlag = document.getElementById("selectedFlag");
const selectedLang = document.getElementById("selectedLang");

dropdown.addEventListener("click", () => {
  langOptionsBox.style.display =
    langOptionsBox.style.display === "block" ? "none" : "block";
});

document.querySelectorAll(".lang-option").forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();

    selectedFlag.src = option.dataset.flag;
    selectedLang.textContent = option.dataset.label;

    langOptionsBox.style.display = "none";
  });
});

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    langOptionsBox.style.display = "none";
  }
});

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

// Current language
let currentLanguage = "en";

// Original variables from your code
const siteInput = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const siteList = document.getElementById("siteList");
const redirectInput = document.getElementById("redirectInput");
const setRedirectBtn = document.getElementById("setRedirectBtn");
const currentRedirect = document.getElementById("currentRedirect");
const breakToggle = document.getElementById("breakToggle");
const pauseToggle = document.getElementById("pauseToggle");
const breakSettings = document.getElementById("breakSettings");
const pauseSettings = document.getElementById("pauseSettings");
const breakStartTime = document.getElementById("breakStartTime");
const breakEndTime = document.getElementById("breakEndTime");
const pauseStartTime = document.getElementById("pauseStartTime");
const pauseEndTime = document.getElementById("pauseEndTime");
const breakDays = document.getElementById("breakDays");
const siteToggle = document.getElementById("siteToggle");
const currentSiteName = document.getElementById("currentSiteName");
const siteSettings = document.getElementById("siteSettings");
const generalSettings = document.getElementById("generalSettings");
const settingsNav = document.getElementById("settingsNav");
const navItems = document.querySelectorAll(".nav-item:not(.settings-nav)");
const languageSelect = document.getElementById("languageSelect");

const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

// Current site being configured
let currentSite = "facebook.com";

// Initialize the popup
document.addEventListener("DOMContentLoaded", initPopup);

async function initPopup() {
  await loadSettings();
  await loadBlockedSites();
  setupEventListeners();
  await setupNavigation(); // Make this async to load saved nav state
  loadSiteSettings(currentSite);
  setupDarkMode();
}

function setupEventListeners() {
  addBtn.addEventListener("click", addCustomSite);
  siteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addCustomSite();
  });
  setRedirectBtn.addEventListener("click", setRedirectUrl);
  redirectInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") setRedirectUrl();
  });
  breakToggle.addEventListener("change", toggleBreakTime);
  pauseToggle.addEventListener("change", togglePauseTime);
  breakStartTime.addEventListener("change", updateBreakTime);
  breakEndTime.addEventListener("change", updateBreakTime);
  pauseStartTime.addEventListener("change", updatePauseTime);
  pauseEndTime.addEventListener("change", updatePauseTime);

  // Site toggle
  siteToggle.addEventListener("change", toggleCurrentSite);
}

async function setupNavigation() {
  // Load saved navigation state
  const data = await chrome.storage.local.get(["selectedNav", "lastSite"]);
  const savedNav = data.selectedNav || "facebook.com";
  const savedSite = data.lastSite || "facebook.com";

  // Set up navigation items
  document.querySelectorAll(".nav-item:not(.settings-nav)").forEach((item) => {
    item.addEventListener("click", async () => {
      // Update active state
      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });
      item.classList.add("active");

      // Show site settings
      siteSettings.style.display = "block";
      generalSettings.style.display = "none";

      // Update current site
      currentSite = item.getAttribute("data-site");
      updateCurrentSiteDisplay();

      // Save navigation state
      await chrome.storage.local.set({
        selectedNav: currentSite,
        lastSite: currentSite,
      });

      // Load site-specific settings
      loadSiteSettings(currentSite);
    });

    // Restore saved active state
    if (item.getAttribute("data-site") === savedNav) {
      item.classList.add("active");
      currentSite = savedSite;
      updateCurrentSiteDisplay();

      // Show site settings if not settings nav
      if (savedNav !== "settings") {
        siteSettings.style.display = "block";
        generalSettings.style.display = "none";
      }
    }
  });

  // Settings navigation
  settingsNav.addEventListener("click", async () => {
    // Update active state
    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("active");
    });
    settingsNav.classList.add("active");

    // Show general settings
    siteSettings.style.display = "none";
    generalSettings.style.display = "block";

    // Save navigation state
    await chrome.storage.local.set({ selectedNav: "settings" });
  });

  // Restore settings nav if it was selected
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
  const data = await chrome.storage.local.get(["defaultSites", "siteOptions"]);
  const defaultSites = data.defaultSites || {};
  const siteOptions = data.siteOptions || {};

  // Update site toggle
  siteToggle.checked = defaultSites[site] !== false;

  // Update site-specific options UI based on site
  updateSiteOptionsUI(site, siteOptions[site] || {});
}

function updateSiteOptionsUI(site, options) {
  const siteOptionsContainer = document.querySelector(".site-options");
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

  // Re-attach event listeners
  document.querySelectorAll(".site-option").forEach((option) => {
    option.addEventListener("change", updateSiteOptions);
  });
}

async function toggleCurrentSite() {
  const enabled = siteToggle.checked;
  const data = await chrome.storage.local.get(["defaultSites"]);
  const defaultSites = data.defaultSites || {};

  defaultSites[currentSite] = enabled;
  await chrome.storage.local.set({ defaultSites });
}

async function updateSiteOptions() {
  const data = await chrome.storage.local.get(["siteOptions"]);
  const siteOptions = data.siteOptions || {};

  // Get current options
  const options = {};
  document.querySelectorAll(".site-option").forEach((option) => {
    const optionName = option.getAttribute("data-option");
    options[optionName] = option.checked;
  });

  // Save to storage
  siteOptions[currentSite] = options;
  await chrome.storage.local.set({ siteOptions });
}

async function loadSettings() {
  const data = await chrome.storage.local.get([
    "redirectUrl",
    "breakEnabled",
    "pauseEnabled",
    "breakStartTime",
    "breakEndTime",
    "pauseStartTime",
    "pauseEndTime",
    "breakDays",
  ]);

  // Redirect URL
  redirectInput.value = data.redirectUrl || "";
  updateRedirectStatus();

  // Break time settings
  breakToggle.checked = data.breakEnabled || false;
  breakSettings.style.display = data.breakEnabled ? "block" : "none";
  breakStartTime.value = data.breakStartTime || "12:00";
  breakEndTime.value = data.breakEndTime || "13:00";

  // Pause time settings
  pauseToggle.checked = data.pauseEnabled || false;
  pauseSettings.style.display = data.pauseEnabled ? "block" : "none";
  pauseStartTime.value = data.pauseStartTime || "18:00";
  pauseEndTime.value = data.pauseEndTime || "08:00";

  // Break days
  renderDaySelector(data.breakDays || [1, 2, 3, 4, 5]);
}

function renderDaySelector(selectedDays) {
  breakDays.innerHTML = "";
  DAYS.forEach((day) => {
    const button = document.createElement("button");
    button.className = `day-btn ${
      selectedDays.includes(day.id) ? "active" : ""
    }`;

    button.textContent = day.label;

    button.addEventListener("click", () => toggleDay(day.id, button));
    breakDays.appendChild(button);
  });
}

async function toggleDay(dayId, button) {
  const data = await chrome.storage.local.get(["breakDays"]);
  const breakDays = data.breakDays || [];
  if (breakDays.includes(dayId)) {
    const index = breakDays.indexOf(dayId);
    breakDays.splice(index, 1);
    button.classList.remove("active");
  } else {
    breakDays.push(dayId);
    button.classList.add("active");
  }
  await chrome.storage.local.set({ breakDays });
}

async function loadBlockedSites() {
  const data = await chrome.storage.local.get(["blockedSites"]);
  siteList.innerHTML = "";
  (data.blockedSites || []).forEach(addSiteToUI);
}

function addCustomSite() {
  const site = siteInput.value.trim();
  if (!site) return;
  chrome.storage.local.get(["blockedSites"], (data) => {
    const list = data.blockedSites || [];
    if (!list.includes(site)) {
      list.push(site);
      chrome.storage.local.set({ blockedSites: list });
      addSiteToUI(site);
    }
  });
  siteInput.value = "";
}

function addSiteToUI(site) {
  const li = document.createElement("li");
  const siteText = document.createElement("span");
  siteText.className = "site-text";
  siteText.textContent = site;
  const removeBtn = document.createElement("span");
  removeBtn.textContent = "Remove";
  removeBtn.className = "removeBtn";
  removeBtn.addEventListener("click", () => removeSite(site, li));
  li.appendChild(siteText);
  li.appendChild(removeBtn);
  siteList.appendChild(li);
}

function removeSite(site, li) {
  chrome.storage.local.get(["blockedSites"], (data) => {
    const list = (data.blockedSites || []).filter((s) => s !== site);
    chrome.storage.local.set({ blockedSites: list });
  });
  li.remove();
}

async function setRedirectUrl() {
  const url = redirectInput.value.trim();
  await chrome.storage.local.set({ redirectUrl: url });
  updateRedirectStatus();
}

async function toggleBreakTime() {
  const enabled = breakToggle.checked;
  await chrome.storage.local.set({ breakEnabled: enabled });
  breakSettings.style.display = enabled ? "block" : "none";
}

async function togglePauseTime() {
  const enabled = pauseToggle.checked;
  await chrome.storage.local.set({ pauseEnabled: enabled });
  pauseSettings.style.display = enabled ? "block" : "none";
}

async function updateBreakTime() {
  await chrome.storage.local.set({
    breakStartTime: breakStartTime.value,
    breakEndTime: breakEndTime.value,
  });
}

async function updatePauseTime() {
  await chrome.storage.local.set({
    pauseStartTime: pauseStartTime.value,
    pauseEndTime: pauseEndTime.value,
  });
}

function updateCurrentSiteDisplay() {
  const siteKey = currentSite.split(".")[0];
  currentSiteName.textContent = getSiteDisplayName(currentSite);
}

function updateRedirectStatus() {
  chrome.storage.local.get(["redirectUrl"], (data) => {
    if (data.redirectUrl) {
      currentRedirect.textContent =
        "Currently redirecting to: " + data.redirectUrl;
    } else {
      currentRedirect.textContent = "No redirect URL set";
    }
  });
}

// Dark mode handling
function setupDarkMode() {
  // Check if dark mode preference exists in storage
  chrome.storage.local.get(["darkMode", "theme"], (data) => {
    const isDarkMode = data.darkMode || data.theme === "dark";
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      // Update icon if it exists
      const icon = document.getElementById("darkModeIcon");
      if (icon) {
        icon.src = "icons/sun.svg";
      }
    }
  });
}

// Add dark mode toggle if needed
async function toggleDarkMode() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode");

  // Save theme preference
  await chrome.storage.local.set({
    darkMode: !isDarkMode,
    theme: !isDarkMode ? "dark" : "light",
  });

  // Update icon
  const icon = document.getElementById("darkModeIcon");
  if (icon) {
    icon.src = !isDarkMode ? "icons/sun.svg" : "icons/moon.svg";
  }
}

// Toggle dark mode when the button is clicked
document
  .getElementById("darkModeToggle")
  .addEventListener("click", toggleDarkMode);

// Initialize dark mode icon on load
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("darkModeIcon");
  if (icon) {
    chrome.storage.local.get(["darkMode", "theme"], (data) => {
      const isDarkMode = data.darkMode || data.theme === "dark";
      icon.src = isDarkMode ? "icons/sun.svg" : "icons/moon.svg";
    });
  }
});
