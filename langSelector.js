// langSelector.js - Language dropdown UI logic ONLY

function initLanguageSelector() {
  const dropdown = document.getElementById("langDropdown");
  const langOptionsBox = document.getElementById("langOptions");
  const selectedFlag = document.getElementById("selectedFlag");
  const selectedLang = document.getElementById("selectedLang");

  if (!dropdown || !langOptionsBox) {
    return;
  }

  function restoreSavedLanguage() {
    const savedLang = localStorage.getItem("keepfocus_language") || "en";

    const savedOption = document.querySelector(
      `.lang-option[data-value="${savedLang}"]`,
    );
    if (savedOption && selectedFlag && selectedLang) {
      // Update flag and language code
      selectedFlag.src = savedOption.dataset.flag;
      selectedLang.textContent = savedLang.toUpperCase();
    }
  }

  restoreSavedLanguage();

  dropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    langOptionsBox.style.display =
      langOptionsBox.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();

      selectedFlag.src = option.dataset.flag;
      selectedLang.textContent = option.dataset.value.toUpperCase();

      langOptionsBox.style.display = "none";

      if (typeof applyTranslations === "function") {
        applyTranslations(option.dataset.value);
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      langOptionsBox.style.display = "none";
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLanguageSelector);
} else {
  initLanguageSelector();
}
