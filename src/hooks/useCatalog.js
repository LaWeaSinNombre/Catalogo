import { useState, useEffect, useCallback } from "react";
import { CONFIG } from "../config";

const SUPABASE_URL = CONFIG.supabaseUrl || "https://ysbcqzdsvhkyycwqryaf.supabase.co";
const SUPABASE_ANON_KEY = CONFIG.supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzYmNxemRzdmhreXljd3FyeWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTcyNTUsImV4cCI6MjEwNjczMzI1NX0.g1DA3-r92J5QAVEkoi4ia5QXQ0TOyv-zaPzrGAUmL0k";

const BUCKET_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/productos`;
const META_URL = `${SUPABASE_URL}/rest/v1/catalogo_metadata?select=version&id=eq.1`;
const CATALOGO_URL = `${SUPABASE_URL}/rest/v1/vista_catalogo?select=*`;

const CACHE_DATA_KEY = "cat_perfumes_data";
const CACHE_VERSION_KEY = "cat_perfumes_version";
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function processCatalogData(productos) {
  const visibles = productos.filter((p) => {
    const stRaw = typeof p.estado === "object" ? p.estado?.nombre : p.estado;
    const st = (stRaw || "").toString().toLowerCase().trim();
    return st !== "se dejo de vender" && st !== "se dejó de vender" && st !== "desactivado" && st !== "inactivo";
  });

  const allProducts = visibles.map((p, i) => {
    const catRaw = typeof p.categoria === "object" ? p.categoria?.nombre : p.categoria;
    const categoria = catRaw && catRaw.trim() !== "" ? catRaw.trim() : "General";

    // Estandarizado a la columna real: imagen_url
    let img = p.imagen_url || "";

    if (!img || img === "Default" || img.trim() === "" || img === "NULL") {
      // Si dice "Default" o está vacía, se asigna directamente la imagen local sin hacer peticiones
      img = CONFIG.defaultImg || "default-perfume.png";
    } else if (!img.startsWith("http://") && !img.startsWith("https://")) {
      img = `${BUCKET_BASE_URL}/${img.replace(/^\/+/, "")}`;
    }

    return {
      ...p,
      categoria,
      imagen_url: img,
      _idx: p.id !== undefined ? p.id : i
    };
  });

  const pages = ["cover", "index", "how"];
  const sections = [
    ["Índice", 1],
    ["¿Cómo pedir?", 2]
  ];

  const categoriasMap = {};
  allProducts.forEach((prod) => {
    const cat = prod.categoria;
    if (!categoriasMap[cat]) categoriasMap[cat] = [];
    categoriasMap[cat].push(prod);
  });

  Object.keys(categoriasMap).forEach((catName) => {
    const prodsInCat = categoriasMap[catName];
    const startPageIndex = pages.length;
    sections.push([catName, startPageIndex]);

    const rows = [];
    for (let i = 0; i < prodsInCat.length; i += 2) {
      rows.push({ r: prodsInCat.slice(i, i + 2) });
    }

    let rowIdx = 0;
    let isFirstPage = true;

    while (rowIdx < rows.length) {
      const pageContent = [];
      const currentPageIndex = pages.length;
      let pageRows;

      if (isFirstPage) {
        pageContent.push({ b: catName });
        pageRows = rows.slice(rowIdx, rowIdx + 3);
        rowIdx += 3;
        isFirstPage = false;
      } else {
        pageRows = rows.slice(rowIdx, rowIdx + 4);
        rowIdx += 4;
      }

      pageRows.forEach((r) => {
        pageContent.push(r);
        r.r.forEach((prod) => {
          prod._page = currentPageIndex;
        });
      });

      pages.push(pageContent);
    }
  });

  return { allProducts, pages, sections };
}

function getInitialCatalogState() {
  try {
    const cachedDataRaw = localStorage.getItem(CACHE_DATA_KEY);
    if (cachedDataRaw) {
      const parsed = JSON.parse(cachedDataRaw);
      return processCatalogData(parsed);
    }
  } catch (err) {
    console.error("Error al leer la caché inicial del catálogo:", err);
  }
  return { allProducts: [], pages: [], sections: [] };
}

export function useCatalog() {
  const [catalogData, setCatalogData] = useState(getInitialCatalogState);
  const [loading, setLoading] = useState(() => catalogData.allProducts.length === 0);
  const [error, setError] = useState(null);

  const checkAndUpdateCatalog = useCallback(async () => {
    const headers = {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    };

    try {
      const metaRes = await fetch(META_URL, { headers });
      let serverVersion = null;

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        if (metaData && metaData.length > 0) {
          serverVersion = metaData[0].version;
        }
      }

      const localVersion = localStorage.getItem(CACHE_VERSION_KEY);
      const cachedDataRaw = localStorage.getItem(CACHE_DATA_KEY);

      if (serverVersion && localVersion === String(serverVersion) && cachedDataRaw) {
        setLoading(false);
        return false;
      }

      const catRes = await fetch(CATALOGO_URL, { headers });
      if (!catRes.ok) throw new Error("Error HTTP " + catRes.status);
      const freshData = await catRes.json();

      localStorage.setItem(CACHE_DATA_KEY, JSON.stringify(freshData));
      if (serverVersion) {
        localStorage.setItem(CACHE_VERSION_KEY, String(serverVersion));
      }

      const processed = processCatalogData(freshData);
      setCatalogData(processed);
      setError(null);
      return true;
    } catch (err) {
      console.error("Error comprobando versión del catálogo:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      checkAndUpdateCatalog();
    }, 0);

    const interval = setInterval(() => {
      checkAndUpdateCatalog();
    }, CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndUpdateCatalog();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkAndUpdateCatalog]);

  return {
    allProducts: catalogData.allProducts,
    pages: catalogData.pages,
    sections: catalogData.sections,
    loading,
    error,
    checkAndUpdateCatalog
  };
}