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
  
  // Evitamos validar la misma URL más de una vez
  if (checkedUrls.has(clean)) return;
  checkedUrls.add(clean);

  // Usamos Image() que no es bloqueado por CORS
  const img = new Image();
  img.src = clean;

  // Si el servidor responde con HTML o la imagen no existe, salta onerror
  img.onerror = () => {
    brokenUrls.add(clean);
  };
};

export const preloadAndValidateCatalog = (products) => {
  if (!Array.isArray(products)) return;

  products.forEach((prod) => {
    // Acepta tanto prod.imagen como prod.imagen_url
    const src = prod?.imagen || prod?.imagen_url;
    if (src) {
      precheckImage(src);
    }
  });
};