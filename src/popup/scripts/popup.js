// popup.js - Main popup coordination ONLY

// Initialize the popup
document.addEventListener("DOMContentLoaded", initPopup);

async function initPopup() {
  // Note: navigation.js auto-initializes via DOMContentLoaded
  // Note: settings.js auto-initializes via DOMContentLoaded
  // Note: langSelector.js auto-initializes via DOMContentLoaded

  // Setup dark mode
  setupDarkMode();

  // Listen for language changes
  document.addEventListener("languageChanged", handleLanguageChange);

  // Smooth popup reveal
  requestAnimationFrame(() => {
    document.body.classList.add("popup-loaded");
  });

  console.log("Popup coordinator initialized");
}

// Handle language changes
function handleLanguageChange(e) {
  if (e.detail && e.detail.language) {
    // Forward to navigation module if available
    if (
      window.navigationModule &&
      window.navigationModule.handleLanguageChange
    ) {
      window.navigationModule.handleLanguageChange(e);
    }
  }
}

// Dark mode handling
function setupDarkMode() {
  chrome.storage.local.get(["darkMode", "theme"], (data) => {
    const isDarkMode = data.darkMode || data.theme === "dark";
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      const icon = document.getElementById("darkModeIcon");
      if (icon) {
        icon.src = "src/assets/icons/sun.svg";
      }
    }
  });
}

// Toggle dark mode
async function toggleDarkMode() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode");

  await chrome.storage.local.set({
    darkMode: !isDarkMode,
    theme: !isDarkMode ? "dark" : "light",
  });

  const icon = document.getElementById("darkModeIcon");
  if (icon) {
    icon.src = !isDarkMode
      ? "src/assets/icons/sun.svg"
      : "src/assets/icons/moon.svg";
  }
}

// Initialize dark mode toggle
document
  .getElementById("darkModeToggle")
  .addEventListener("click", toggleDarkMode);
