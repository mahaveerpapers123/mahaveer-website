import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./Products.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "all");
  const [loading, setLoading] = useState(true);

  const currentPage = useMemo(() => Number(searchParams.get("page")) || 1, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const queryCategory = searchParams.get("category") || "all";
    const queryPrice = searchParams.get("price") || "all";
    setSelectedCategory(queryCategory);
    setPriceRange(queryPrice);
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", "15");

        if (selectedCategory !== "all") {
          params.set("category", selectedCategory);
        }

        const response = await fetch(`${API_BASE}/api/products?${params.toString()}`);
        const data = await response.json();
        const rawItems = Array.isArray(data?.items) ? data.items : [];

        let filtered = rawItems;

        if (priceRange === "under-500") {
          filtered = rawItems.filter((item) => Number(item.mahaveer_price || 0) < 500);
        } else if (priceRange === "500-1000") {
          filtered = rawItems.filter((item) => {
            const price = Number(item.mahaveer_price || 0);
            return price >= 500 && price <= 1000;
          });
        } else if (priceRange === "above-1000") {
          filtered = rawItems.filter((item) => Number(item.mahaveer_price || 0) > 1000);
        }

        setProducts(filtered);
        setPagination({
          page: data?.page || currentPage,
          limit: 15,
          total: data?.total || filtered.length,
          totalPages: Math.max(1, Math.ceil((data?.total || filtered.length) / 15))
        });
      } catch {
        setProducts([]);
        setPagination({
          page: 1,
          limit: 15,
          total: 0,
          totalPages: 1
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, selectedCategory, priceRange]);

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
          image:
            product?.images?.[0] ||
            product?.image_url ||
            "/images/placeholder.png"
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
    const totalPages = pagination.totalPages;
    const current = pagination.page;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages];
    }

    if (current >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", current - 1, current, current + 1, "ellipsis-2", totalPages];
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
                  Showing <strong>{products.length}</strong> products
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
                      const image =
                        product?.images?.[0] ||
                        product?.image_url ||
                        "/images/placeholder.png";

                      return (
                        <div className="products-card" key={`${product.id}-${index}`}>
                          <div className="products-card-media">
                            <img
                              src={image}
                              alt={product.name}
                              className="products-card-image"
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
                                <label>HSN%</label>
                                <span>{Number(product.hsn_percentage || 0).toFixed(0)}%</span>
                              </div>
                              <div className="products-spec-item">
                                <label>Mahaveer</label>
                                <span>₹{Number(product.mahaveer_price || 0).toFixed(2)}</span>
                              </div>
                              <div className="products-spec-item">
                                <label>MRP</label>
                                <span>₹{Number(product.mrp || 0).toFixed(2)}</span>
                              </div>
                              <div className="products-spec-item">
                                <label>Width</label>
                                <span>{product.width ?? "-"}</span>
                              </div>
                              <div className="products-spec-item">
                                <label>Length</label>
                                <span>{product.length ?? "-"}</span>
                              </div>
                              <div className="products-spec-item">
                                <label>Height</label>
                                <span>{product.height ?? "-"}</span>
                              </div>
                              <div className="products-spec-item products-spec-item-wide">
                                <label>Weight</label>
                                <span>{product.weight ?? "-"}</span>
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