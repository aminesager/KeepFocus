console.log(translations);

function getPreferredLanguage() {
  const savedLang = localStorage.getItem("keepfocus_language");
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }

  const browserLang = navigator.language.split("-")[0];
  if (translations[browserLang]) {
    return browserLang;
  }

  return "en";
}

// Function to get translated site option
function getTranslatedSiteOption(optionId) {
  const lang = getPreferredLanguage();
  const t = translations[lang] || translations.en;

  if (t.siteOptions && t.siteOptions[optionId]) {
    return t.siteOptions[optionId];
  }

  // Fallback to English if translation not found
  if (translations.en.siteOptions && translations.en.siteOptions[optionId]) {
    return translations.en.siteOptions[optionId];
  }

  // Fallback to converting id to readable text
  return optionId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

async function applyTranslations(language = null) {
  const lang = language || getPreferredLanguage();

  // Save language preference
  localStorage.setItem("keepfocus_language", lang);

  // Update selected language display
  const selectedLang = document.getElementById("selectedLang");
  if (selectedLang) {
    selectedLang.textContent = lang.toUpperCase();
  }

  const selectedFlag = document.getElementById("selectedFlag");
  if (selectedFlag) {
    const flagOption = document.querySelector(
      `.lang-option[data-value="${lang}"]`
    );
    if (flagOption) {
      selectedFlag.src = flagOption.getAttribute("data-flag");
    }
  }

  const t = translations[lang] || translations.en;

  // Apply translations to elements with data-translation attribute
  document.querySelectorAll("[data-translation]").forEach((element) => {
    const key = element.getAttribute("data-translation");
    const parts = key.split(".");

    if (parts.length === 1) {
      if (t.nav && t.nav[key]) {
        element.textContent = t.nav[key];
      } else if (t.siteSettings && t.siteSettings[key]) {
        element.textContent = t.siteSettings[key];
      } else if (t.header && t.header[key]) {
        element.textContent = t.header[key];
      } else if (t.generalSettings && t.generalSettings[key]) {
        element.textContent = t.generalSettings[key];
      } else if (t.buttons && t.buttons[key]) {
        element.textContent = t.buttons[key];
      } else if (t.toggleLabels && t.toggleLabels[key]) {
        element.textContent = t.toggleLabels[key];
      } else if (t.statusText && t.statusText[key]) {
        element.textContent = t.statusText[key];
      }
    } else if (parts.length === 2) {
      const [category, subKey] = parts;
      if (t[category] && t[category][subKey]) {
        element.textContent = t[category][subKey];
      }
    }
  });

  // Apply placeholders for inputs
  document
    .querySelectorAll("[data-translation-placeholder]")
    .forEach((element) => {
      const key = element.getAttribute("data-translation-placeholder");
      if (t.placeholders && t.placeholders[key]) {
        element.placeholder = t.placeholders[key];
      }
    });

  // Update alt attributes for theme toggle
  const darkModeIcon = document.getElementById("darkModeIcon");
  if (darkModeIcon && t.header && t.header.themeToggle) {
    darkModeIcon.alt = t.header.themeToggle;
  }

  // Dispatch language change event for popup.js
  if (typeof Event !== "undefined") {
    const event = new CustomEvent("languageChanged", {
      detail: { language: lang },
    });
    document.dispatchEvent(event);
  }

  // Trigger translation of site options if popup.js is loaded
  if (window.currentSite && typeof window.updateSiteOptionsUI === "function") {
    setTimeout(() => {
      const data = window.siteOptions || {};
      window.updateSiteOptionsUI(
        window.currentSite,
        data[window.currentSite] || {}
      );
    }, 50);
  }
}

// Helper function to update current site name based on active nav item
function updateCurrentSiteName(siteKey) {
  const currentSiteName = document.getElementById("currentSiteName");
  if (currentSiteName) {
    currentSiteName.setAttribute("data-translation", siteKey);
    const lang = getPreferredLanguage();
    const t = translations[lang] || translations.en;

    if (t.siteSettings && t.siteSettings[siteKey]) {
      currentSiteName.textContent = t.siteSettings[siteKey];
    }
  }
}

// Initialize translations when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Apply initial translations
  applyTranslations();

  // Set up language selector functionality
  const langDropdown = document.getElementById("langDropdown");
  const langOptions = document.getElementById("langOptions");
  const selectedFlag = document.getElementById("selectedFlag");
  const selectedLang = document.getElementById("selectedLang");

  if (langDropdown && langOptions) {
    // Show/hide language options on click
    langDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      langOptions.classList.toggle("show");
    });

    // Handle language option selection
    langOptions.querySelectorAll(".lang-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const lang = option.getAttribute("data-value");
        const flag = option.getAttribute("data-flag");

        if (selectedFlag) selectedFlag.src = flag;
        if (selectedLang) selectedLang.textContent = lang.toUpperCase();

        // Apply translations
        applyTranslations(lang);

        langOptions.classList.remove("show");
      });
    });

    document.addEventListener("click", () => {
      langOptions.classList.remove("show");
    });
  }

  if (typeof initPopup === "function") {
    setTimeout(() => {
      initPopup();
    }, 100);
  }
});

window.applyTranslations = applyTranslations;
window.getPreferredLanguage = getPreferredLanguage;
window.updateCurrentSiteName = updateCurrentSiteName;
window.getTranslatedSiteOption = getTranslatedSiteOption;
