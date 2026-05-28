import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./Products.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

const PAGE_LIMIT = 15;

const CATEGORY_DEFINITIONS = [
  {
    label: "Pens Collection",
    value: "pens",
    aliases: ["pen", "pens", "pen collection", "pens collection", "ball pen", "gel pen", "roller pen"],
    terms: ["pen", "pens", "ball pen", "gel pen", "roller pen", "ballpoint", "retractable", "pentonic", "montex", "parker", "pilot", "unomax", "linc", "hauser", "flair", "luxor", "cello", "reynolds", "add gel"]
  },
  {
    label: "Copier Papers",
    value: "copier-papers",
    aliases: ["copier", "copier paper", "copier papers", "paper", "papers"],
    terms: ["copier", "paper", "gsm", "a4", "a3", "reflection", "jk red", "jk easy", "jk a", "copy crown", "tnpl", "ledger", "bond", "navigator"]
  },
  {
    label: "Staplers & Pins",
    value: "staplers-pins",
    aliases: ["stapler", "staplers", "pins", "stapler pins"],
    terms: ["stapler", "pins", "kangaroo", "dp", "sr", "hp", "hs", "staple", "punch"]
  },
  {
    label: "Colours & Art",
    value: "colours-art",
    aliases: ["colour", "colours", "color", "colors", "art", "paint", "paints", "colour art"],
    terms: ["colour", "color", "crayon", "wax", "poster", "water col", "water color", "acrylic", "sketch", "artist", "canvas", "shades", "paint", "camlin", "camel", "faber castell", "kores"]
  },
  {
    label: "Pencils & Erasers",
    value: "pencils-erasers",
    aliases: ["pencil", "pencils", "eraser", "erasers", "pencil eraser"],
    terms: ["pencil", "eraser", "lead", "sharpener", "apsara", "nataraj", "doms", "camlin", "2b", "0.7mm", "0.5mm"]
  },
  {
    label: "Glue & Adhesives",
    value: "glue-adhesives",
    aliases: ["glue", "adhesive", "adhesives", "gum", "paste", "glue adhesive"],
    terms: ["glue", "gum", "paste", "fevicol", "fevistick", "fevistik", "fevibond", "adhesive", "fevi kwik", "camlin gum", "camlin paste"]
  },
  {
    label: "Calculators",
    value: "calculators",
    aliases: ["calculator", "calculators"],
    terms: ["calculator", "casio", "orpat", "scientific", "fx", "mj", "hl", "fc", "gst"]
  },
  {
    label: "Office Essentials",
    value: "office-essentials",
    aliases: ["office", "office essentials"],
    terms: ["marker", "whiteboard", "stamp", "cutter", "punch", "file", "clips", "board", "ink", "highlighter", "whitener", "correction"]
  },
  {
    label: "Sketch Pens",
    value: "sketch-pens",
    aliases: ["sketch", "sketch pen", "sketch pens"],
    terms: ["sketch", "marker", "brush pen", "dual tip", "calligraphy", "hotline", "fineliner"]
  },
  {
    label: "Crayons & Wax Colours",
    value: "crayons-wax",
    aliases: ["crayon", "crayons", "wax", "wax colours"],
    terms: ["crayon", "wax", "twistic", "plastic colour", "long wax", "jumbo wax"]
  },
  {
    label: "Canvas & Boards",
    value: "canvas-boards",
    aliases: ["canvas", "board", "boards", "canvas board"],
    terms: ["canvas", "board", "art board"]
  },
  {
    label: "Geometry & Scales",
    value: "geometry-scales",
    aliases: ["geometry", "scale", "scales", "ruler"],
    terms: ["geometry", "scale", "ruler", "geofine", "compass"]
  },
  {
    label: "Kids Art Kits",
    value: "kids-art-kits",
    aliases: ["kit", "kits", "art kit", "kids art kit"],
    terms: ["kit", "creative", "little artist", "prep kit", "writing kit", "schoola kit", "platinum kit"]
  }
];

const normalizeUrl = (url) => {
  if (typeof url !== "string") return "";
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getProductImage = (product) =>
  normalizeUrl(
    product?.images?.[0] ||
      product?.image_url ||
      "/images/placeholder.png"
  );

const getProductSearchText = (product) =>
  normalizeText(
    [
      product?.name,
      product?.brand,
      product?.model_name,
      product?.description,
      product?.category_slug,
      product?.colour,
      product?.barcode,
      product?.hsn_code
    ]
      .filter(Boolean)
      .join(" ")
  );

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasWord = (text, word) => {
  const cleanWord = normalizeText(word);
  if (!cleanWord) return false;
  const regex = new RegExp(`(^|\\s)${escapeRegExp(cleanWord)}s?(\\s|$)`, "i");
  return regex.test(text);
};

const hasPhrase = (text, phrase) => {
  const cleanPhrase = normalizeText(phrase);
  if (!cleanPhrase) return false;
  if (cleanPhrase.length <= 3) return hasWord(text, cleanPhrase);
  return text.includes(cleanPhrase);
};

const productMatchesDefinition = (product, definition) => {
  const text = getProductSearchText(product);
  return definition.terms.some((term) => hasPhrase(text, term));
};

const productMatchesQuery = (product, query) => {
  const text = getProductSearchText(product);
  const words = normalizeText(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  return words.every((word) => hasPhrase(text, word));
};

const resolveDefinition = (value) => {
  const cleanValue = normalizeText(value);

  if (!cleanValue || cleanValue === "all") return null;

  const byValue = CATEGORY_DEFINITIONS.find((item) => normalizeText(item.value) === cleanValue);
  if (byValue) return byValue;

  const byAlias = CATEGORY_DEFINITIONS.find((item) =>
    item.aliases.some((alias) => normalizeText(alias) === cleanValue)
  );
  if (byAlias) return byAlias;

  const byPhrase = CATEGORY_DEFINITIONS.find((item) =>
    item.aliases.some((alias) => {
      const cleanAlias = normalizeText(alias);
      return cleanAlias.length > 3 && cleanValue.includes(cleanAlias);
    })
  );

  return byPhrase || null;
};

const normalizeCategoriesFromApi = (raw) => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.categories)
    ? raw.categories
    : [];

  return list
    .map((item) => ({
      label: item?.label || item?.title || item?.name || item?.value || "",
      value: item?.value || item?.slug || item?.category_slug || item?.label || item?.title || ""
    }))
    .filter((item) => item.label && item.value)
    .filter((item) => normalizeText(item.value) !== "all" && normalizeText(item.label) !== "all categories");
};

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1
  });
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [loading, setLoading] = useState(true);

  const currentPage = useMemo(() => Number(searchParams.get("page")) || 1, [searchParams]);

  const categories = useMemo(() => {
    const smartCategories = CATEGORY_DEFINITIONS.map((item) => ({
      label: item.label,
      value: item.value
    }));

    const merged = [
      { label: "All Categories", value: "all" },
      ...smartCategories,
      ...apiCategories
    ];

    const seen = new Set();

    return merged.filter((item) => {
      const key = normalizeText(item.value || item.label);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [apiCategories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();
        setApiCategories(normalizeCategoriesFromApi(data));
      } catch {
        setApiCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const queryCategory = searchParams.get("category") || "all";
    const queryPrice = searchParams.get("price") || "all";
    const querySearch = searchParams.get("query") || "";
    setSelectedCategory(queryCategory);
    setPriceRange(queryPrice);
    setSearchQuery(querySearch);
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE}/api/products?category=all&page=1&limit=1000`);
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        setAllProducts(items);
      } catch {
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (selectedCategory !== "all") {
      const definition = resolveDefinition(selectedCategory);

      if (definition) {
        filtered = filtered.filter((product) => productMatchesDefinition(product, definition));
      } else {
        const selectedText = normalizeText(selectedCategory);
        filtered = filtered.filter((product) => {
          const categorySlug = normalizeText(product?.category_slug);
          const productText = getProductSearchText(product);
          return categorySlug === selectedText || productText.includes(selectedText);
        });
      }
    }

    if (searchQuery) {
      const queryDefinition = resolveDefinition(searchQuery);

      if (queryDefinition) {
        filtered = filtered.filter((product) => productMatchesDefinition(product, queryDefinition));
      } else {
        filtered = filtered.filter((product) => productMatchesQuery(product, searchQuery));
      }
    }

    if (priceRange === "under-500") {
      filtered = filtered.filter((item) => Number(item.mahaveer_price || 0) < 500);
    } else if (priceRange === "500-1000") {
      filtered = filtered.filter((item) => {
        const price = Number(item.mahaveer_price || 0);
        return price >= 500 && price <= 1000;
      });
    } else if (priceRange === "above-1000") {
      filtered = filtered.filter((item) => Number(item.mahaveer_price || 0) > 1000);
    }

    return filtered;
  }, [allProducts, selectedCategory, searchQuery, priceRange]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PAGE_LIMIT));
  }, [filteredProducts]);

  const safePage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  const products = useMemo(() => {
    const start = (safePage - 1) * PAGE_LIMIT;
    return filteredProducts.slice(start, start + PAGE_LIMIT);
  }, [filteredProducts, safePage]);

  useEffect(() => {
    setPagination({
      page: safePage,
      limit: PAGE_LIMIT,
      total: filteredProducts.length,
      totalPages
    });
  }, [safePage, filteredProducts.length, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(totalPages));
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, totalPages, searchParams, setSearchParams]);

  const updateQueryParams = (updates) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (!updates.page) {
      params.set("page", "1");
    }

    setSearchParams(params);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    updateQueryParams({ category: value, page: "1" });
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
    updateQueryParams({ price: value, page: "1" });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (product) => {
    try {
      const existing = JSON.parse(localStorage.getItem("cartItems") || "[]");
      const items = Array.isArray(existing) ? existing : [];
      const index = items.findIndex((item) => String(item.id) === String(product.id));

      if (index > -1) {
        items[index] = {
          ...items[index],
          quantity: (items[index].quantity || 1) + 1
        };
      } else {
        items.push({
          id: product.id,
          name: product.name,
          model_name: product.model_name,
          brand: product.brand,
          category_slug: product.category_slug,
          price: Number(product.mahaveer_price || 0),
          mrp: Number(product.mrp || 0),
          mahaveer_price: Number(product.mahaveer_price || 0),
          quantity: 1,
          image: getProductImage(product)
        });
      }

      localStorage.setItem("cartItems", JSON.stringify(items));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {}
  };

  const renderStars = (product) => {
    const rating = Number(product.rating || 4);
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));

    return (
      <div className="products-stars" aria-label={`${fullStars} star rating`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className={index < fullStars ? "filled" : ""}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = pagination.page;

    if (total <= 5) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, "ellipsis", total];
    }

    if (current >= total - 2) {
      return [1, "ellipsis", total - 3, total - 2, total - 1, total];
    }

    return [1, "ellipsis", current - 1, current, current + 1, "ellipsis-2", total];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="products-page">
      <Navbar />

      <main className="products-main">
        <div className="products-shell">
          <div className="products-topbar">
            <div>
              <span className="products-kicker">Collection</span>
              <h1>Explore All Products</h1>
            </div>

            <div className="products-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <span>Products</span>
            </div>
          </div>

          <div className="products-layout">
            <aside className="products-sidebar">
              <div className="products-filter-card">
                <h3>Filters</h3>

                <div className="products-filter-block">
                  <label>Category</label>

                  <div className="products-filter-options">
                    {categories.map((category, index) => (
                      <button
                        type="button"
                        key={`${category.value}-${index}`}
                        className={selectedCategory === category.value ? "active" : ""}
                        onClick={() => handleCategoryChange(category.value)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="products-filter-block">
                  <label>Price Range</label>

                  <div className="products-filter-options">
                    <button
                      type="button"
                      className={priceRange === "all" ? "active" : ""}
                      onClick={() => handlePriceChange("all")}
                    >
                      All Prices
                    </button>

                    <button
                      type="button"
                      className={priceRange === "under-500" ? "active" : ""}
                      onClick={() => handlePriceChange("under-500")}
                    >
                      Under ₹500
                    </button>

                    <button
                      type="button"
                      className={priceRange === "500-1000" ? "active" : ""}
                      onClick={() => handlePriceChange("500-1000")}
                    >
                      ₹500 to ₹1000
                    </button>

                    <button
                      type="button"
                      className={priceRange === "above-1000" ? "active" : ""}
                      onClick={() => handlePriceChange("above-1000")}
                    >
                      Above ₹1000
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <section className="products-content">
              <div className="products-grid-top">
                <p>
                  Showing <strong>{products.length}</strong> of{" "}
                  <strong>{pagination.total}</strong> products
                </p>
              </div>

              {loading ? (
                <div className="products-empty-box">
                  <h3>Loading products...</h3>
                </div>
              ) : products.length === 0 ? (
                <div className="products-empty-box">
                  <h3>No Products Found</h3>
                  <p>Try a different category or price range.</p>
                </div>
              ) : (
                <>
                  <div className="products-grid">
                    {products.map((product, index) => {
                      const image = getProductImage(product);

                      return (
                        <div className="products-card" key={`${product.id}-${index}`}>
                          <div className="products-card-media">
                            <img
                              src={image}
                              alt={product.name}
                              className="products-card-image"
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.png";
                              }}
                            />

                            <div className="products-card-overlay">
                              <button
                                type="button"
                                className="products-add-cart-btn"
                                onClick={() => handleAddToCart(product)}
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>

                          <div className="products-card-body">
                            <div className="products-card-head">
                              <div className="products-card-title-wrap">
                                <h3>{product.name}</h3>
                                <p>{product.model_name || "Model not available"}</p>
                              </div>

                              {renderStars(product)}
                            </div>

                            <div className="products-card-price">
                              <strong>₹{Number(product.mahaveer_price || 0).toFixed(2)}</strong>

                              {Number(product.mrp || 0) > 0 ? (
                                <span>₹{Number(product.mrp || 0).toFixed(2)}</span>
                              ) : null}
                            </div>

                            <div className="products-specs-grid">
                              <div className="products-spec-item">
                                <label>Mahaveer</label>
                                <span>₹{Number(product.mahaveer_price || 0).toFixed(2)}</span>
                              </div>

                              <div className="products-spec-item">
                                <label>MRP</label>
                                <span>₹{Number(product.mrp || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {pagination.totalPages > 1 ? (
                    <div className="products-pagination">
                      <button
                        type="button"
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      >
                        Prev
                      </button>

                      {pageNumbers.map((page, index) =>
                        page === "ellipsis" || page === "ellipsis-2" ? (
                          <span key={`${page}-${index}`} className="products-pagination-dots">
                            ...
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={page}
                            className={pagination.page === page ? "active" : ""}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Products;