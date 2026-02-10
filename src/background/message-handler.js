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