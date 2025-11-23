// Load stored sites on startup
chrome.storage.local.get(["blockedSites"], (result) => {
  updateDNRRules(result.blockedSites || []);
});

// Listen to changes in blocklist
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites) {
    updateDNRRules(changes.blockedSites.newValue || []);
  }
});

async function updateDNRRules(sites) {
  // 1: Get all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((r) => r.id);

  // 2: Remove ALL old rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
  });

  // 3: Build and add new rules
  const newRules = sites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: site,
      resourceTypes: ["main_frame"],
    },
  }));

  if (newRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules,
    });
  }
}
    