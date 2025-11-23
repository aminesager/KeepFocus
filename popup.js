const siteInput = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const siteList = document.getElementById("siteList");

// Load list on open
chrome.storage.local.get(["blockedSites"], (data) => {
  (data.blockedSites || []).forEach(addSiteToUI);
});

addBtn.addEventListener("click", () => {
  const site = siteInput.value.trim();
  if (!site) return;

  chrome.storage.local.get(["blockedSites"], (data) => {
    const list = data.blockedSites || [];
    if (!list.includes(site)) {
      list.push(site);
      chrome.storage.local.set({ blockedSites: list });
      addSiteToUI(site);
    }
  });

  siteInput.value = "";
});

function addSiteToUI(site) {
  const li = document.createElement("li");
  li.textContent = site;

  const removeBtn = document.createElement("span");
  removeBtn.textContent = "✖";
  removeBtn.className = "removeBtn";
  removeBtn.addEventListener("click", () => removeSite(site, li));

  li.appendChild(removeBtn);
  siteList.appendChild(li);
}

function removeSite(site, li) {
  chrome.storage.local.get(["blockedSites"], (data) => {
    const list = (data.blockedSites || []).filter((s) => s !== site);
    chrome.storage.local.set({ blockedSites: list });
  });

  li.remove();
}
