import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./ProductsWithoutFilters.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

function ProductsWithoutFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);

  const currentPage = useMemo(() => Number(searchParams.get("page")) || 1, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/products?page=${currentPage}&limit=24`);
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];

        setProducts(items);
        setPagination({
          page: data?.page || currentPage,
          limit: 24,
          total: data?.total || items.length,
          totalPages: Math.max(1, Math.ceil((data?.total || items.length) / 24))
        });
      } catch {
        setProducts([]);
        setPagination({
          page: 1,
          limit: 24,
          total: 0,
          totalPages: 1
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage]);

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
    const totalPages = pagination.totalPages;
    const current = pagination.page;

    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, "dots", totalPages];
    }

    if (current >= totalPages - 2) {
      return [1, "dots", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "dots", current - 1, current, current + 1, "dots-2", totalPages];
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
              <h1>Explore All Products</h1>
              <p>Discover curated paper and stationery products with clean details and easy browsing.</p>
            </div>

            <div className="products-without-hero-side">
              <div className="products-without-breadcrumb">
                <Link to="/">Home</Link>
                <span>/</span>
                <span>Products</span>
              </div>
              <div className="products-without-summary">
                <p>
                  Showing <strong>{products.length}</strong> products on this page
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
              <p>Please check back again.</p>
            </div>
          ) : (
            <>
              <div className="products-without-grid">
                {products.map((product, index) => {
                  const image =
                    product?.images?.[0] ||
                    product?.image_url ||
                    "/images/placeholder.png";

                  return (
                    <article className="products-without-card" key={`${product.id}-${index}`}>
                      <div className="products-without-media">
                        <img
                          src={image}
                          alt={product.name}
                          className="products-without-image"
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