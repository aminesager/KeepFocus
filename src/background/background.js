const DEFAULT_SITES = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "twitter.com",
  "x.com",
];

chrome.storage.local.get(["BAD_SITES"], (data) => {
  BAD_SITES = data.BAD_SITES || [];
  console.log("Loaded:", BAD_SITES);
  updateDNRRules();
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
      relevantKeys.includes(key),
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

// to be refactored separation of concerns
async function isBreakTime() {
  try {
    const data = await chrome.storage.local.get([
      "breakEnabled",
      "breakStartTime",
      "breakEndTime",
      "breakDays",
    ]);
    if (!data.breakEnabled) {
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

async function updateDNRRules() {
  try {
    // Fetch user settings from Chrome's local storage
    const data = await chrome.storage.local.get([
      "blockedSites",
      "defaultSites",
      "redirectUrl",
      "adultEnabled",
    ]);

    // Check if scheduled break or pause time is currently active
    const breakActive = await isBreakTime();
    const pauseActive = await isPauseTime();
    // Check if adult content blocking is enabled
    const adultBlockingActive = data.adultEnabled === true;

    // Get all existing DNR rules created by this extension
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    // Extract just the IDs of existing rules for removal
    const existingRuleIds = existingRules.map((r) => r.id);

    // If break or pause is active, remove any existing blocking rules and exit
    if (pauseActive || breakActive) {
      if (existingRuleIds.length > 0) {
        // Remove all existing blocking rules during break/pause periods
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
      }
      return; // No blocking during scheduled breaks
    }

    // Get custom sites manually added by user (ensure it's an array)
    const customSites = Array.isArray(data.blockedSites)
      ? data.blockedSites
      : [];
    // Get default sites (Facebook, YouTube, etc.) and filter only enabled ones
    const defaultSites = data.defaultSites || {};
    const enabledDefaultSites = Object.keys(defaultSites).filter(
      (site) => defaultSites[site] === true,
    );

    // Combine custom and enabled default sites, remove any duplicates
    let allSites = [...new Set([...customSites, ...enabledDefaultSites])];

    // If adult content blocking is enabled, add adult sites to the block list
    if (adultBlockingActive) {
      allSites = [...new Set([...allSites, ...BAD_SITES])];
    }

    // If no sites need to be blocked after all filtering
    if (allSites.length === 0) {
      // Remove any existing rules since nothing should be blocked now
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
      }
      return; // Exit early - nothing to block
    }

    // Array to hold new DNR rule objects we'll create
    const newRules = [];
    // Get redirect URL (if set) and trim whitespace
    const redirectUrl = data.redirectUrl?.trim();

    // Loop through each site that needs to be blocked/redirected
    allSites.forEach((site, index) => {
      // Generate sequential rule ID starting from 1
      const ruleId = index + 1;
      // Convert domain to DNR URL filter pattern (e.g., "facebook.com" → "||facebook.com^")
      const urlFilter = createUrlFilter(site);

      // If redirect URL is provided and not empty
      if (redirectUrl && redirectUrl.length > 0) {
        try {
          let finalUrl = redirectUrl;
          // Add https:// prefix if URL doesn't have protocol
          if (
            !redirectUrl.startsWith("http://") &&
            !redirectUrl.startsWith("https://")
          ) {
            finalUrl = "https://" + redirectUrl;
          }
          // Validate URL format (throws error if invalid)
          new URL(finalUrl);
          // Create redirect rule - sends user to productivity site instead
          newRules.push({
            id: ruleId, // Unique numeric identifier
            priority: 1, // Rule priority (higher wins)
            action: {
              type: "redirect", // Action type: redirect to another URL
              redirect: { url: finalUrl }, // Destination URL
            },
            condition: {
              urlFilter: urlFilter, // Pattern to match
              resourceTypes: ["main_frame"], // Only block top-level page loads
            },
          });
        } catch (error) {
          // If redirect URL is invalid, fall back to blocking instead
          newRules.push({
            id: ruleId,
            priority: 1,
            action: { type: "block" }, // Block the site completely
            condition: {
              urlFilter: urlFilter,
              resourceTypes: ["main_frame"],
            },
          });
        }
      } else {
        // No redirect URL set - create simple block rule
        newRules.push({
          id: ruleId,
          priority: 1,
          action: { type: "block" }, // Block the site
          condition: {
            urlFilter: urlFilter,
            resourceTypes: ["main_frame"],
          },
        });
      }
    });

    // ATOMIC OPERATION: Remove old rules and add new ones in single API call
    // This prevents race conditions and ensures consistent rule state
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds, // IDs of rules to remove
      addRules: newRules, // New rules to add
    });
  } catch (error) {
    // Catch and log any errors in the rule update process
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
