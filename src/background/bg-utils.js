function createUrlFilter(domain) {
  let cleanDomain = domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
  return `||${cleanDomain}^`;
}


function isSupportedSite(url) {
  const supportedDomains = [
    "facebook.com",
    "youtube.com",
    "instagram.com",
    "twitter.com",
    "x.com",
  ];
  return supportedDomains.some((domain) => url.includes(domain));
}


function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
