console.log(translations);

function getPreferredLanguage() {
  const savedLang = localStorage.getItem("keepfocus_language");
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }

  const browserLang = navigator.language.split("-")[1];
  if (translations[browserLang]) {
    return browserLang;
  }

  return "en";
}

function getTranslatedSiteOption(optionId) {
  const lang = getPreferredLanguage();
  const t = translations[lang] || translations.en;

  if (t.siteOptions && t.siteOptions[optionId]) {
    return t.siteOptions[optionId];
  }

  if (translations.en.siteOptions && translations.en.siteOptions[optionId]) {
    return translations.en.siteOptions[optionId];
  }

  return optionId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

async function applyTranslations(language = null) {
  const lang = language || getPreferredLanguage();
  localStorage.setItem("keepfocus_language", lang);

  const t = translations[lang] || translations.en;

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

  document
    .querySelectorAll("[data-translation-placeholder]")
    .forEach((element) => {
      const key = element.getAttribute("data-translation-placeholder");
      if (t.placeholders && t.placeholders[key]) {
        element.placeholder = t.placeholders[key];
      }
    });

  const darkModeIcon = document.getElementById("darkModeIcon");
  if (darkModeIcon && t.header && t.header.themeToggle) {
    darkModeIcon.alt = t.header.themeToggle;
  }

  if (typeof Event !== "undefined") {
    const event = new CustomEvent("languageChanged", {
      detail: { language: lang },
    });
    document.dispatchEvent(event);
  }

  if (window.currentSite && typeof window.updateSiteOptionsUI === "function") {
    setTimeout(() => {
      const data = window.siteOptions || {};
      window.updateSiteOptionsUI(
        window.currentSite,
        data[window.currentSite] || {},
      );
    }, 50);
  }
}

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

window.applyTranslations = applyTranslations;
window.getPreferredLanguage = getPreferredLanguage;
window.updateCurrentSiteName = updateCurrentSiteName;
window.getTranslatedSiteOption = getTranslatedSiteOption;
