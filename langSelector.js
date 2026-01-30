// langSelector.js - Language dropdown UI logic ONLY

function initLanguageSelector() {
  const dropdown = document.getElementById("langDropdown");
  const langOptionsBox = document.getElementById("langOptions");
  const selectedFlag = document.getElementById("selectedFlag");
  const selectedLang = document.getElementById("selectedLang");

  if (!dropdown || !langOptionsBox) {
    console.warn("Language selector elements not found");
    return;
  }

  // Toggle dropdown visibility using inline styles (same as original)
  dropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    langOptionsBox.style.display =
      langOptionsBox.style.display === "block" ? "none" : "block";
  });

  // Handle language selection
  document.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();

      selectedFlag.src = option.dataset.flag;
      selectedLang.textContent = option.dataset.value.toUpperCase();

      // Close dropdown
      langOptionsBox.style.display = "none";

      // Apply translations if function exists
      if (typeof applyTranslations === "function") {
        applyTranslations(option.dataset.value);
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      langOptionsBox.style.display = "none";
    }
  });

  console.log("Language selector initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLanguageSelector);
} else {
  initLanguageSelector();
}
