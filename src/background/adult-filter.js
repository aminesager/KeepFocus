chrome.storage.local.get(["BAD_SITES"], (data) => {
  BAD_SITES = data.BAD_SITES || [];
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
