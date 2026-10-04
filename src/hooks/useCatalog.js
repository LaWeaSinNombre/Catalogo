import { useState, useEffect } from "react";
import { CONFIG } from "../config";

// Función pura fuera del Hook para transformar los datos sin causar efectos secundarios
function processCatalogData(productos) {
  const visibles = productos.filter((p) => {
    const st = (p.estado || "").toString().toLowerCase().trim();
    return st !== "se dejo de vender" && st !== "se dejó de vender" && st !== "desactivado";
  });

  const allProducts = visibles.map((p, i) => ({ ...p, _idx: i }));

  const pages = ["cover", "index", "how"];
  const sections = [
    ["Índice", 1],
    ["¿Cómo pedir?", 2]
  ];

  const categoriasMap = {};
  allProducts.forEach((prod) => {
    const cat = prod.categoria && prod.categoria.trim() !== "" ? prod.categoria : "General";
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

export function useCatalog() {
  const [allProducts, setAllProducts] = useState([]);
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      const CACHE_KEY = "catalogo_perfumes_data";
      const CACHE_TIME_KEY = "catalogo_perfumes_time";
      const now = Date.now();

      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const isCacheValid = cachedData && cachedTime && (now - Number(cachedTime) < CONFIG.cacheTTL);

      if (isCacheValid) {
        try {
          const data = JSON.parse(cachedData);
          const processed = processCatalogData(data);
          if (isMounted) {
            setAllProducts(processed.allProducts);
            setPages(processed.pages);
            setSections(processed.sections);
            setLoading(false);
          }
          return;
        } catch {
          console.warn("Caché dañado, cargando nuevamente...");
        }
      }

      try {
        const res = await fetch(CONFIG.googleSheetsUrl);
        if (!res.ok) throw new Error("Error " + res.status);
        const data = await res.json();

        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());

        const processed = processCatalogData(data);
        if (isMounted) {
          setAllProducts(processed.allProducts);
          setPages(processed.pages);
          setSections(processed.sections);
        }
      } catch (err) {
        console.error("Error cargando Google Sheets:", err);
        if (cachedData) {
          try {
            const processed = processCatalogData(JSON.parse(cachedData));
            if (isMounted) {
              setAllProducts(processed.allProducts);
              setPages(processed.pages);
              setSections(processed.sections);
            }
          } catch {
            if (isMounted) setError("No se pudieron cargar los productos.");
          }
        } else {
          if (isMounted) setError("No se pudieron cargar los productos.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  return { allProducts, pages, sections, loading, error };
}