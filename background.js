const DEFAULT_SITES = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
];

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed/updated");
  await initializeDefaultSettings();
  await updateDNRRules();
});

async function initializeDefaultSettings() {
  try {
    const data = await chrome.storage.local.get([
      "blockedSites",
      "redirectUrl",
      "breakEnabled",
      "breakStartTime",
      "breakEndTime",
      "pauseEnabled",
      "pauseStartTime",
      "pauseEndTime",
      "breakDays",
      "defaultSites",
    ]);
    if (!data.defaultSites) {
      const defaultSitesState = {};
      DEFAULT_SITES.forEach((site) => {
        defaultSitesState[site] = true;
      });
      await chrome.storage.local.set({ defaultSites: defaultSitesState });
      console.log("Default sites initialized");
    }
    if (!data.redirectUrl) {
      await chrome.storage.local.set({ redirectUrl: "" });
    }
    if (!data.breakDays) {
      await chrome.storage.local.set({ breakDays: [1, 2, 3, 4, 5] });
    }
    const defaults = {
      breakEnabled: false,
      pauseEnabled: false,
      breakStartTime: "12:00",
      breakEndTime: "13:00",
      pauseStartTime: "18:00",
      pauseEndTime: "08:00",
      blockedSites: [],
    };
    const updates = {};
    for (const [key, value] of Object.entries(defaults)) {
      if (data[key] === undefined) {
        updates[key] = value;
      }
    }
    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
      console.log("Default settings initialized:", updates);
    }
  } catch (error) {
    console.error("Error initializing settings:", error);
  }
}

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, updating rules");
  updateDNRRules();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    console.log("Storage changed:", changes);
    updateDNRRules();

    // Notify content scripts about siteOptions changes
    if (changes.siteOptions) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && isSupportedSite(tab.url)) {
            chrome.tabs.sendMessage(tab.id, {
              action: "updateContentFiltering",
            });
          }
        });
      });
    }
  }
});

function isSupportedSite(url) {
  const supportedDomains = [
    "facebook.com",
    "youtube.com",
    "instagram.com",
    "twitter.com",
    "x.com",
  ];
  return supportedDomains.some((domain) => url.includes(domain));
}

async function isBreakTime() {
  try {
    const data = await chrome.storage.local.get([
      "breakEnabled",
      "breakStartTime",
      "breakEndTime",
      "breakDays",
    ]);
    if (!data.breakEnabled) {
      console.log("Break not enabled");
      return false;
    }
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    if (!data.breakDays || !data.breakDays.includes(currentDay)) {
      console.log("Not a break day");
      return false;
    }
    const startTime = timeToMinutes(data.breakStartTime);
    const endTime = timeToMinutes(data.breakEndTime);
    const result = currentTime >= startTime && currentTime <= endTime;
    console.log("Break time check:", result, currentTime, startTime, endTime);
    return result;
  } catch (error) {
    console.error("Error in isBreakTime:", error);
    return false;
  }
}

async function isPauseTime() {
  try {
    const data = await chrome.storage.local.get([
      "pauseEnabled",
      "pauseStartTime",
      "pauseEndTime",
    ]);
    if (!data.pauseEnabled) {
      return false;
    }
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = timeToMinutes(data.pauseStartTime);
    const endTime = timeToMinutes(data.pauseEndTime);
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  } catch (error) {
    console.error("Error in isPauseTime:", error);
    return false;
  }
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function createUrlFilter(domain) {
  let cleanDomain = domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
  return `||${cleanDomain}^`;
}

function generateRuleId(index) {
  return index + 1;
}

async function updateDNRRules() {
  try {
    console.log("=== Starting DNR Rules Update ===");
    const data = await chrome.storage.local.get([
      "blockedSites",
      "defaultSites",
      "redirectUrl",
    ]);
    const breakActive = await isBreakTime();
    const pauseActive = await isPauseTime();
    console.log("Break active:", breakActive, "Pause active:", pauseActive);
    console.log("Blocked sites:", data.blockedSites);
    console.log("Default sites:", data.defaultSites);
    console.log("Redirect URL:", data.redirectUrl);
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((r) => r.id);
    console.log("Existing rule IDs to remove:", existingRuleIds);
    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
      });
      console.log("Removed existing rules");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (pauseActive || breakActive) {
      console.log("No blocking rules added (pause or break active)");
      return;
    }
    const customSites = Array.isArray(data.blockedSites)
      ? data.blockedSites
      : [];
    const defaultSites = data.defaultSites || {};
    const enabledDefaultSites = Object.keys(defaultSites).filter(
      (site) => defaultSites[site] === true
    );
    const allSites = [...new Set([...customSites, ...enabledDefaultSites])];
    console.log("All sites to block:", allSites);
    if (allSites.length === 0) {
      console.log("No sites to block");
      return;
    }
    const newRules = [];
    const redirectUrl = data.redirectUrl?.trim();
    allSites.forEach((site, index) => {
      const ruleId = generateRuleId(index);
      const urlFilter = createUrlFilter(site);
      console.log(`Creating rule ${ruleId} for: ${site} -> ${urlFilter}`);
      if (redirectUrl && redirectUrl.length > 0) {
        try {
          let finalUrl = redirectUrl;
          if (
            !redirectUrl.startsWith("http://") &&
            !redirectUrl.startsWith("https://")
          ) {
            finalUrl = "https://" + redirectUrl;
          }
          new URL(finalUrl);
          newRules.push({
            id: ruleId,
            priority: 1,
            action: {
              type: "redirect",
              redirect: { url: finalUrl },
            },
            condition: {
              urlFilter: urlFilter,
              resourceTypes: ["main_frame"],
            },
          });
          console.log(`Created redirect rule to: ${finalUrl}`);
        } catch (error) {
          console.error("Invalid redirect URL, using block instead:", error);
          newRules.push({
            id: ruleId,
            priority: 1,
            action: { type: "block" },
            condition: {
              urlFilter: urlFilter,
              resourceTypes: ["main_frame"],
            },
          });
        }
      } else {
        newRules.push({
          id: ruleId,
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: urlFilter,
            resourceTypes: ["main_frame"],
          },
        });
      }
    });
    if (newRules.length > 0) {
      console.log(`Adding ${newRules.length} rules:`, newRules);
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules,
      });
      console.log(`Successfully added ${newRules.length} blocking rules`);
      const verifyRules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log("Verified rules count:", verifyRules.length);
      if (verifyRules.length === 0) {
        console.error(
          "ERROR: No rules were added despite having sites to block!"
        );
      } else {
        console.log("Rules successfully applied");
      }
    } else {
      console.log("No rules to add");
    }
    console.log("=== DNR Rules Update Complete ===");
  } catch (error) {
    console.error("Error in updateDNRRules:", error);
  }
}

chrome.alarms.create("checkTime", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkTime") {
    updateDNRRules();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateDNRRules();
  }
});

// Message handling for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "isBreakTime") {
    isBreakTime().then(sendResponse);
    return true;
  }
  if (request.action === "isPauseTime") {
    isPauseTime().then(sendResponse);
    return true;
  }
});

updateDNRRules();
