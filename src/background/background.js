importScripts(
  "schedule.js",
  "bg-utils.js",
  "store-manager.js",
  "adult-filter.js",
  "message-handler.js",
  "dnr-manager.js",
);

chrome.runtime.onInstalled.addListener(initializeDefaultSettings);
chrome.runtime.onStartup.addListener(updateDNRRules);

chrome.alarms.create("checkTime", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkTime") updateDNRRules();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) updateDNRRules();
});
