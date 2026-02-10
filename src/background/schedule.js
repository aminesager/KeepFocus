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
