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

const DEFAULT_SITES = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "twitter.com",
  "x.com",
];
