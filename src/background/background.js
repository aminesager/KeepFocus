const DEFAULT_SITES = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
];

let BAD_SITES = [];

chrome.storage.local.get(["BAD_SITES"], (data) => {
  BAD_SITES = data.BAD_SITES || [];
  console.log("Loaded:", BAD_SITES);
  updateDNRRules(); // Call your function here
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed/updated");
  await initializeDefaultSettings();
  await updateDNRRules();
});

async function isAdultBlockingActive() {
  try {
    const data = await chrome.storage.local.get(["adultEnabled"]);
    return data.adultEnabled === true;
  } catch (error) {
    console.error("Error checking adult blocking:", error);
    return false;
  }
}

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
      "adultEnabled",
    ]);
    // Initialize adult content blocking (disabled by default)
    if (data.adultEnabled === undefined) {
      await chrome.storage.local.set({ adultEnabled: false });
      console.log("Adult content blocking disabled by default");
    }
    // Initialize default sites
    if (!data.defaultSites) {
      const defaultSitesState = {};
      DEFAULT_SITES.forEach((site) => {
        defaultSitesState[site] = true;
      });
      await chrome.storage.local.set({ defaultSites: defaultSitesState });
      console.log("Default sites initialized");
    }
    // Initialize other settings
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
    // Update DNR rules when relevant settings change
    const relevantKeys = [
      "blockedSites",
      "defaultSites",
      "redirectUrl",
      "breakEnabled",
      "pauseEnabled",
      "adultEnabled",
      "breakStartTime",
      "breakEndTime",
      "pauseStartTime",
      "pauseEndTime",
      "breakDays",
    ];
    const shouldUpdateRules = Object.keys(changes).some((key) =>
      relevantKeys.includes(key)
    );
    if (shouldUpdateRules) {
      console.log("Settings changed that affect blocking rules, updating...");
      updateDNRRules();
    }
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
      // Overnight pause (e.g., 10 PM to 6 AM)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Daytime pause
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
    // Get all necessary settings
    const data = await chrome.storage.local.get([
      "blockedSites",
      "defaultSites",
      "redirectUrl",
      "adultEnabled",
    ]);
    console.log(
      "adultEnabled from storage:",
      data.adultEnabled,
      typeof data.adultEnabled
    );
    // Check current statuses
    const breakActive = await isBreakTime();
    const pauseActive = await isPauseTime();
    const adultBlockingActive = data.adultEnabled === true;

    console.log("Blocked sites:", data.blockedSites);
    console.log("Default sites:", data.defaultSites);
    console.log("Redirect URL:", data.redirectUrl);
    // Get existing rules and remove them
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
    // If break or pause is active, don't block anything
    if (pauseActive || breakActive) {
      console.log("No blocking rules added (pause or break active)");
      return;
    }
    // Collect sites to block
    const customSites = Array.isArray(data.blockedSites)
      ? data.blockedSites
      : [];
    const defaultSites = data.defaultSites || {};
    const enabledDefaultSites = Object.keys(defaultSites).filter(
      (site) => defaultSites[site] === true
    );
    // Start with custom and default sites
    let allSites = [...new Set([...customSites, ...enabledDefaultSites])];
    // Add adult sites if adult blocking is enabled
    if (adultBlockingActive) {
      allSites = [...new Set([...allSites, ...BAD_SITES])];
      console.log("Adult blocking active, added adult sites:", BAD_SITES);
    }
    console.log("All sites to block:", allSites);
    if (allSites.length === 0) {
      console.log("No sites to block");
      return;
    }
    // Create new rules
    const newRules = [];
    const redirectUrl = data.redirectUrl?.trim();
    allSites.forEach((site, index) => {
      const ruleId = generateRuleId(index);
      const urlFilter = createUrlFilter(site);
      console.log(`Creating rule ${ruleId} for: ${site} -> ${urlFilter}`);
      if (redirectUrl && redirectUrl.length > 0) {
        try {
          let finalUrl = redirectUrl;
          // Add https:// if not present
          if (
            !redirectUrl.startsWith("http://") &&
            !redirectUrl.startsWith("https://")
          ) {
            finalUrl = "https://" + redirectUrl;
          }
          // Validate URL
          new URL(finalUrl);
          // Create redirect rule
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
          // Fallback to block rule
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
        // Create block rule (no redirect URL)
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
    // Add new rules if any exist
    if (newRules.length > 0) {
      console.log(`Adding ${newRules.length} rules`);
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules,
      });
      console.log(`Successfully added ${newRules.length} blocking rules`);
      // Verify rules were added
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

// Periodic rule checking
chrome.alarms.create("checkTime", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkTime") {
    console.log("Periodic time check, updating rules if needed");
    updateDNRRules();
  }
});

// Update rules when tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log("Tab URL changed, updating rules");
    updateDNRRules();
  }
});

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request.action);
  switch (request.action) {
    case "isBreakTime":
      isBreakTime().then(sendResponse);
      return true;
    case "isPauseTime":
      isPauseTime().then(sendResponse);
      return true;
    case "isAdultBlockingActive":
      isAdultBlockingActive().then(sendResponse);
      return true;
    case "getBlockedSites":
      chrome.storage.local.get(["blockedSites", "defaultSites"], (data) => {
        sendResponse({
          blockedSites: data.blockedSites || [],
          defaultSites: data.defaultSites || {},
        });
      });
      return true;
    case "updateRules":
      updateDNRRules();
      sendResponse({ success: true });
      return true;
    default:
      console.log("Unknown action:", request.action);
  }
});

// Initial rule update
updateDNRRules();
