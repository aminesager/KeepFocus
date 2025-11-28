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
const defaultSitesList = document.getElementById("defaultSitesList");
const statusIndicator = document.getElementById("statusIndicator");

const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

// Initialize the popup
document.addEventListener("DOMContentLoaded", initPopup);

async function initPopup() {
  await loadSettings();
  await loadBlockedSites();
  await loadDefaultSites();
  setupEventListeners();
  updateStatusIndicator();
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
  currentRedirect.textContent = data.redirectUrl
    ? `Currently redirecting to: ${data.redirectUrl}`
    : "No redirect URL set";
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

async function loadDefaultSites() {
  const data = await chrome.storage.local.get(["defaultSites"]);
  defaultSitesList.innerHTML = "";
  const defaultSites = data.defaultSites || {};
  for (const [site, enabled] of Object.entries(defaultSites)) {
    addDefaultSiteToUI(site, enabled);
  }
}

function addDefaultSiteToUI(site, enabled) {
  const div = document.createElement("div");
  div.className = "toggle-item";
  div.innerHTML = `
    <span class="toggle-label">${site}</span>
    <label class="switch">
      <input type="checkbox" ${enabled ? "checked" : ""}>
      <span class="slider"></span>
    </label>
  `;
  const checkbox = div.querySelector("input");
  checkbox.addEventListener("change", () =>
    toggleDefaultSite(site, checkbox.checked)
  );
  defaultSitesList.appendChild(div);
}

async function toggleDefaultSite(site, enabled) {
  const data = await chrome.storage.local.get(["defaultSites"]);
  const defaultSites = data.defaultSites || {};
  defaultSites[site] = enabled;
  await chrome.storage.local.set({ defaultSites });
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
  currentRedirect.textContent = url
    ? `Currently redirecting to: ${url}`
    : "No redirect URL set";
}

async function toggleBreakTime() {
  const enabled = breakToggle.checked;
  await chrome.storage.local.set({ breakEnabled: enabled });
  breakSettings.style.display = enabled ? "block" : "none";
  updateStatusIndicator();
}

async function togglePauseTime() {
  const enabled = pauseToggle.checked;
  await chrome.storage.local.set({ pauseEnabled: enabled });
  pauseSettings.style.display = enabled ? "block" : "none";
  updateStatusIndicator();
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

async function checkActualBlockingStatus() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const data = await chrome.storage.local.get([
      "breakEnabled",
      "pauseEnabled",
      "blockedSites",
      "defaultSites",
      "redirectUrl",
    ]);
    const breakActive = await chrome.runtime.sendMessage({
      action: "isBreakTime",
    });
    const pauseActive = await chrome.runtime.sendMessage({
      action: "isPauseTime",
    });
    const hasBlockingRules = rules.length > 0;
    const redirectUrl = data.redirectUrl?.trim();
    // Calculate total sites that should be blocked
    const customSites = Array.isArray(data.blockedSites)
      ? data.blockedSites
      : [];
    const defaultSites = data.defaultSites || {};
    const enabledDefaultSites = Object.keys(defaultSites).filter(
      (site) => defaultSites[site]
    );
    const totalSites = [...new Set([...customSites, ...enabledDefaultSites])]
      .length;
    const statusElement = statusIndicator.querySelector(".status-indicator");
    const textElement = statusIndicator.querySelector(".status-text");
    if (pauseActive) {
      statusElement.className = "status-indicator status-inactive";
      textElement.textContent = "Paused - No blocking";
    } else if (breakActive) {
      statusElement.className = "status-indicator status-inactive";
      textElement.textContent = "Break Time - No blocking";
    } else if (hasBlockingRules && totalSites > 0) {
      statusElement.className = "status-indicator status-active";
      if (redirectUrl) {
        textElement.textContent = `Active - Redirecting ${rules.length} sites`;
      } else {
        textElement.textContent = `Active - Blocking ${rules.length} sites`;
      }
    } else if (totalSites > 0 && !hasBlockingRules) {
      statusElement.className = "status-indicator status-inactive";
      textElement.textContent = "Error - Rules not applied";
    } else {
      statusElement.className = "status-indicator status-inactive";
      textElement.textContent = "Inactive - No sites to block";
    }
  } catch (error) {
    console.error("Error checking status:", error);
  }
}

// Check status every 2 seconds
setInterval(checkActualBlockingStatus, 2000);
checkActualBlockingStatus();

async function updateStatusIndicator() {
  const data = await chrome.storage.local.get(["breakEnabled", "pauseEnabled"]);
  const breakActive = await chrome.runtime.sendMessage({
    action: "isBreakTime",
  });
  const pauseActive = await chrome.runtime.sendMessage({
    action: "isPauseTime",
  });
  const statusElement = statusIndicator.querySelector(".status-indicator");
  const textElement = statusIndicator.querySelector(".status-text");
  if (pauseActive) {
    statusElement.className = "status-indicator status-inactive";
    textElement.textContent = "Paused - No blocking";
  } else if (breakActive) {
    statusElement.className = "status-indicator status-inactive";
    textElement.textContent = "Break Time - No blocking";
  } else {
    statusElement.className = "status-indicator status-active";
    textElement.textContent = "Active - Blocking websites";
  }
}
