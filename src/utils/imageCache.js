const brokenUrls = new Set();
const checkedUrls = new Set();

export const isUrlBroken = (url) => {
  if (!url) return true;
  return brokenUrls.has(url.trim());
};

export const markUrlAsBroken = (url) => {
  if (url) brokenUrls.add(url.trim());
};

export const precheckImage = (url) => {
  if (!url) return;
  const clean = url.trim();
  if (checkedUrls.has(clean)) return;

  checkedUrls.add(clean);
  const img = new Image();
  img.src = clean;
  img.onerror = () => {
    brokenUrls.add(clean);
  };
};