import { useState, useEffect } from "react";
import { CONFIG } from "../config";

// Credenciales y URLs de Supabase
const SUPABASE_URL = CONFIG.supabaseUrl || "https://ysbcqzdsvhkyycwqryaf.supabase.co";
const SUPABASE_ANON_KEY = CONFIG.supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzYmNxemRzdmhreXljd3FyeWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTcyNTUsImV4cCI6MjEwNjczMzI1NX0.g1DA3-r92J5QAVEkoi4ia5QXQ0TOyv-zaPzrGAUmL0k";

const BUCKET_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/productos`;
// URL corregida apuntando a vista_catalogo
const DB_API_URL = `${SUPABASE_URL}/rest/v1/vista_catalogo?select=*`;

// Función pura para transformar los datos de la vista a la estructura de la revista
function processCatalogData(productos) {
  // 1. Filtrar productos inactivos
  const visibles = productos.filter((p) => {
    const stRaw = typeof p.estado === "object" ? p.estado?.nombre : p.estado;
    const st = (stRaw || "").toString().toLowerCase().trim();
    return st !== "se dejo de vender" && st !== "se dejó de vender" && st !== "desactivado" && st !== "inactivo";
  });

  // 2. Normalizar campos (Categoría, URL completa de Imagen, _idx)
  const allProducts = visibles.map((p, i) => {
    const catRaw = typeof p.categoria === "object" ? p.categoria?.nombre : p.categoria;
    const categoria = catRaw && catRaw.trim() !== "" ? catRaw.trim() : "General";

    let img = p.imagen || p.imagen_url || "";
    if (img && !img.startsWith("http://") && !img.startsWith("https://")) {
      img = `${BUCKET_BASE_URL}/${img.replace(/^\/+/, "")}`;
    }

    return {
      ...p,
      categoria,
      imagen: img,
      _idx: p.id !== undefined ? p.id : i
    };
  });

  // 3. Generar la paginación y secciones de la revista
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

export function useCatalog() {
  const [allProducts, setAllProducts] = useState([]);
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      const CACHE_KEY = "catalogo_perfumes_db_data";
      const CACHE_TIME_KEY = "catalogo_perfumes_db_time";
      const now = Date.now();

      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const isCacheValid = cachedData && cachedTime && (now - Number(cachedTime) < (CONFIG.cacheTTL || 300000));

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
          console.warn("Caché dañado, consultando base de datos...");
        }
      }

      try {
        const res = await fetch(DB_API_URL, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!res.ok) throw new Error("Error HTTP " + res.status);
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
        console.error("Error cargando productos desde la base de datos:", err);
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