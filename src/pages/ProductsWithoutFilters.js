import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./ProductsWithoutFilters.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

const PAGE_LIMIT = 24;

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

const productMatchesGenericQuery = (product, query) => {
  const text = getProductSearchText(product);
  const words = normalizeText(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  return words.every((word) => hasPhrase(text, word));
};

const resolveDefinition = (query, group) => {
  const cleanGroup = normalizeText(group);
  const cleanQuery = normalizeText(query);

  if (cleanGroup) {
    const byGroup = CATEGORY_DEFINITIONS.find((item) => normalizeText(item.value) === cleanGroup);
    if (byGroup) return byGroup;
  }

  if (cleanQuery) {
    const exact = CATEGORY_DEFINITIONS.find((item) =>
      item.aliases.some((alias) => normalizeText(alias) === cleanQuery)
    );

    if (exact) return exact;

    const phrase = CATEGORY_DEFINITIONS.find((item) =>
      item.aliases.some((alias) => {
        const cleanAlias = normalizeText(alias);
        return cleanAlias.length > 3 && cleanQuery.includes(cleanAlias);
      })
    );

    if (phrase) return phrase;
  }

  return null;
};

function ProductsWithoutFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentPage = useMemo(() => {
    const page = Number(searchParams.get("page")) || 1;
    return Math.max(1, page);
  }, [searchParams]);

  const query = useMemo(() => searchParams.get("query") || "", [searchParams]);
  const group = useMemo(() => searchParams.get("group") || "", [searchParams]);
  const label = useMemo(() => searchParams.get("label") || "", [searchParams]);

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

  const activeDefinition = useMemo(() => resolveDefinition(query, group), [query, group]);

  const filteredProducts = useMemo(() => {
    if (!query && !group) return allProducts;

    if (activeDefinition) {
      return allProducts.filter((product) => productMatchesDefinition(product, activeDefinition));
    }

    return allProducts.filter((product) => productMatchesGenericQuery(product, query));
  }, [allProducts, query, group, activeDefinition]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PAGE_LIMIT));
  }, [filteredProducts]);

  const safePage = useMemo(() => {
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const products = useMemo(() => {
    const start = (safePage - 1) * PAGE_LIMIT;
    return filteredProducts.slice(start, start + PAGE_LIMIT);
  }, [filteredProducts, safePage]);

  const pagination = useMemo(
    () => ({
      page: safePage,
      limit: PAGE_LIMIT,
      total: filteredProducts.length,
      totalPages
    }),
    [safePage, filteredProducts.length, totalPages]
  );

  const pageTitle = useMemo(() => {
    if (label) return label;
    if (activeDefinition?.label) return activeDefinition.label;
    if (query) return `Search results for "${query}"`;
    return "Explore All Products";
  }, [label, activeDefinition, query]);

  const pageDescription = useMemo(() => {
    if (query || group) {
      return `Showing products matched for ${label || activeDefinition?.label || query}.`;
    }

    return "Discover curated paper and stationery products with clean details and easy browsing.";
  }, [query, group, label, activeDefinition]);

  useEffect(() => {
    if (currentPage > totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(totalPages));
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, totalPages, searchParams, setSearchParams]);

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

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderStars = (product) => {
    const rating = Number(product.rating || 4);
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));

    return (
      <div className="products-without-stars" aria-label={`${fullStars} star rating`}>
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

    if (total <= 6) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, "dots", total];
    }

    if (current >= total - 2) {
      return [1, "dots", total - 3, total - 2, total - 1, total];
    }

    return [1, "dots", current - 1, current, current + 1, "dots-2", total];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="products-without-page">
      <Navbar />

      <main className="products-without-main">
        <div className="products-without-shell">
          <div className="products-without-hero">
            <div className="products-without-hero-content">
              <span className="products-without-kicker">Collection</span>
              <h1>{pageTitle}</h1>
              <p>{pageDescription}</p>
            </div>

            <div className="products-without-hero-side">
              <div className="products-without-breadcrumb">
                <Link to="/">Home</Link>
                <span>/</span>
                <span>Products</span>
              </div>

              <div className="products-without-summary">
                <p>
                  Showing <strong>{products.length}</strong> of{" "}
                  <strong>{pagination.total}</strong> products
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="products-without-empty">
              <h3>Loading products...</h3>
            </div>
          ) : products.length === 0 ? (
            <div className="products-without-empty">
              <h3>No Products Found</h3>
              <p>Please try another search or category.</p>
            </div>
          ) : (
            <>
              <div className="products-without-grid">
                {products.map((product, index) => {
                  const image = getProductImage(product);

                  return (
                    <article className="products-without-card" key={`${product.id}-${index}`}>
                      <div className="products-without-media">
                        <img
                          src={image}
                          alt={product.name}
                          className="products-without-image"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder.png";
                          }}
                        />

                        <div className="products-without-badge">
                          {product.brand || "Mahaveer"}
                        </div>

                        <div className="products-without-overlay">
                          <button
                            type="button"
                            className="products-without-cart-btn"
                            onClick={() => handleAddToCart(product)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>

                      <div className="products-without-body">
                        <div className="products-without-head">
                          <div className="products-without-title-wrap">
                            <h3>{product.name}</h3>
                            <p>{product.model_name || product.brand || "Mahaveer Papers"}</p>
                          </div>

                          {renderStars(product)}
                        </div>

                        <div className="products-without-price-row">
                          <strong>₹{Number(product.mahaveer_price || 0).toFixed(2)}</strong>
                          {Number(product.mrp || 0) > 0 ? (
                            <span>₹{Number(product.mrp || 0).toFixed(2)}</span>
                          ) : null}
                        </div>

                        <div className="products-without-specs">
                          <div className="products-without-spec products-without-spec-highlight">
                            <label>HSN%</label>
                            <span>{Number(product.hsn_percentage || 0).toFixed(0)}%</span>
                          </div>

                          <div className="products-without-spec">
                            <label>Width</label>
                            <span>{product.width ?? "-"}</span>
                          </div>

                          <div className="products-without-spec">
                            <label>Length</label>
                            <span>{product.length ?? "-"}</span>
                          </div>

                          <div className="products-without-spec">
                            <label>Height</label>
                            <span>{product.height ?? "-"}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {pagination.totalPages > 1 ? (
                <div className="products-without-pagination">
                  <button
                    type="button"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Prev
                  </button>

                  {pageNumbers.map((page, index) =>
                    page === "dots" || page === "dots-2" ? (
                      <span
                        key={`${page}-${index}`}
                        className="products-without-pagination-dots"
                      >
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ProductsWithoutFilters;