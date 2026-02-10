let siteInput, addBtn, siteList, redirectInput, setRedirectBtn;
let currentRedirect, breakToggle, pauseToggle, adultToggle;
let breakSettings, pauseSettings, adultSettings;
let breakStartTime, breakEndTime, pauseStartTime, pauseEndTime;
let breakDays, siteToggle;

const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

function initSettings() {
  siteInput = document.getElementById("siteInput");
  addBtn = document.getElementById("addBtn");
  siteList = document.getElementById("siteList");
  redirectInput = document.getElementById("redirectInput");
  setRedirectBtn = document.getElementById("setRedirectBtn");
  currentRedirect = document.getElementById("currentRedirect");
  breakToggle = document.getElementById("breakToggle");
  pauseToggle = document.getElementById("pauseToggle");
  adultToggle = document.getElementById("adultToggle");
  breakSettings = document.getElementById("breakSettings");
  pauseSettings = document.getElementById("pauseSettings");
  adultSettings = document.getElementById("adultSettings");
  breakStartTime = document.getElementById("breakStartTime");
  breakEndTime = document.getElementById("breakEndTime");
  pauseStartTime = document.getElementById("pauseStartTime");
  pauseEndTime = document.getElementById("pauseEndTime");
  breakDays = document.getElementById("breakDays");
  siteToggle = document.getElementById("siteToggle");

  setupSettingsEventListeners();
  loadSettings();
  loadBlockedSites();
}

function setupSettingsEventListeners() {
  if (addBtn) addBtn.addEventListener("click", addCustomSite);
  if (siteInput)
    siteInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addCustomSite();
    });

  if (setRedirectBtn) setRedirectBtn.addEventListener("click", setRedirectUrl);
  if (redirectInput)
    redirectInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") setRedirectUrl();
    });

  if (breakToggle) breakToggle.addEventListener("change", toggleBreakTime);
  if (pauseToggle) pauseToggle.addEventListener("change", togglePauseTime);
  if (adultToggle) adultToggle.addEventListener("change", toggleAdultContent);

  if (breakStartTime)
    breakStartTime.addEventListener("change", updateBreakTime);
  if (breakEndTime) breakEndTime.addEventListener("change", updateBreakTime);
  if (pauseStartTime)
    pauseStartTime.addEventListener("change", updatePauseTime);
  if (pauseEndTime) pauseEndTime.addEventListener("change", updatePauseTime);

  if (siteToggle) siteToggle.addEventListener("change", toggleCurrentSite);
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
    "adultEnabled",
  ]);

  if (redirectInput) redirectInput.value = data.redirectUrl || "";
  updateRedirectStatus();

  if (breakToggle) {
    breakToggle.checked = data.breakEnabled || false;
    if (breakSettings)
      breakSettings.style.display = data.breakEnabled ? "block" : "none";
  }
  if (breakStartTime) breakStartTime.value = data.breakStartTime || "12:00";
  if (breakEndTime) breakEndTime.value = data.breakEndTime || "13:00";

  if (pauseToggle) {
    pauseToggle.checked = data.pauseEnabled || false;
    if (pauseSettings)
      pauseSettings.style.display = data.pauseEnabled ? "block" : "none";
  }
  if (pauseStartTime) pauseStartTime.value = data.pauseStartTime || "18:00";
  if (pauseEndTime) pauseEndTime.value = data.pauseEndTime || "08:00";

  renderDaySelector(data.breakDays || [1, 2, 3, 4, 5]);

  if (adultToggle) {
    adultToggle.checked = data.adultEnabled || false;
    if (adultSettings)
      adultSettings.style.display = data.adultEnabled ? "block" : "none";
  }
}

function renderDaySelector(selectedDays) {
  if (!breakDays) return;

  breakDays.innerHTML = "";
  DAYS.forEach((day) => {
    const button = document.createElement("button");
    button.className = `day-btn ${selectedDays.includes(day.id) ? "active" : ""}`;
    button.textContent = day.label;
    button.addEventListener("click", () => toggleDay(day.id, button));
    breakDays.appendChild(button);
  });
}

async function toggleDay(dayId, button) {
  const data = await chrome.storage.local.get(["breakDays"]);
  const breakDays = data.breakDays || [];
  if (breakDays.includes(dayId)) {
    breakDays.splice(breakDays.indexOf(dayId), 1);
    button.classList.remove("active");
  } else {
    breakDays.push(dayId);
    button.classList.add("active");
  }
  await chrome.storage.local.set({ breakDays });
}

async function loadBlockedSites() {
  const data = await chrome.storage.local.get(["blockedSites"]);
  if (!siteList) return;

  siteList.innerHTML = "";
  (data.blockedSites || []).forEach(addSiteToUI);
}

function addCustomSite() {
  if (!siteInput) return;

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
  if (!siteList) return;

  const li = document.createElement("li");
  const siteText = document.createElement("span");
  siteText.className = "site-text";
  siteText.textContent = site;
  const removeBtn = document.createElement("span");
  removeBtn.textContent = "X";
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
  if (!redirectInput) return;

  const url = redirectInput.value.trim();
  await chrome.storage.local.set({ redirectUrl: url });
  updateRedirectStatus();
}

async function toggleBreakTime() {
  if (!breakToggle) return;

  const enabled = breakToggle.checked;
  await chrome.storage.local.set({ breakEnabled: enabled });
  if (breakSettings) breakSettings.style.display = enabled ? "block" : "none";
}

async function togglePauseTime() {
  if (!pauseToggle) return;

  const enabled = pauseToggle.checked;
  await chrome.storage.local.set({ pauseEnabled: enabled });
  if (pauseSettings) pauseSettings.style.display = enabled ? "block" : "none";
}

async function toggleAdultContent() {
  if (!adultToggle) return;

  const enabled = adultToggle.checked;
  await chrome.storage.local.set({ adultEnabled: enabled });
  await chrome.runtime.sendMessage({ action: "updateRules" });
  if (adultSettings) adultSettings.style.display = enabled ? "block" : "none";
}

async function updateBreakTime() {
  if (!breakStartTime || !breakEndTime) return;

  await chrome.storage.local.set({
    breakStartTime: breakStartTime.value,
    breakEndTime: breakEndTime.value,
  });
}

async function updatePauseTime() {
  if (!pauseStartTime || !pauseEndTime) return;

  await chrome.storage.local.set({
    pauseStartTime: pauseStartTime.value,
    pauseEndTime: pauseEndTime.value,
  });
}

async function toggleCurrentSite() {
  if (!siteToggle || !window.currentSite) return;

  const enabled = siteToggle.checked;
  const data = await chrome.storage.local.get(["defaultSites"]);
  const defaultSites = data.defaultSites || {};

  defaultSites[window.currentSite] = enabled;
  await chrome.storage.local.set({ defaultSites });
}

function updateRedirectStatus() {
  chrome.storage.local.get(["redirectUrl"], (data) => {
    if (!currentRedirect) return;

    if (data.redirectUrl) {
      currentRedirect.textContent =
        "Currently redirecting to: " + data.redirectUrl;
    } else {
      currentRedirect.textContent = "No redirect URL set";
    }
  });
}

async function loadSiteSettings(site) {
  const data = await chrome.storage.local.get(["defaultSites", "siteOptions"]);
  const defaultSites = data.defaultSites || {};
  const siteOptions = data.siteOptions || {};

  if (siteToggle) {
    siteToggle.checked = defaultSites[site] !== false;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSettings);
} else {
  initSettings();
}
