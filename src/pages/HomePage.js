import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./HomePage.css";
import ReviewSection from "./ReviewSection";
import Footer from "./Footer";
import Divider from "./Divider";

const slides = [
  "/images/slide1.jpg",
  "/images/slide2.jpg",
  "/images/slide3.jpg",
  "/images/slide4.jpg"
];

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

const normalizeUrl = (url) => {
  if (typeof url !== "string") return "";
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
};

function HomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [quickViewItem, setQuickViewItem] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCategoryImage = async (slug) => {
      const trySlugs = [slug, slug?.split("/").pop() || slug];

      for (const currentSlug of trySlugs) {
        try {
          const response = await fetch(
            `${API_BASE}/api/products?category=${encodeURIComponent(currentSlug)}&limit=1`
          );
          if (!response.ok) continue;

          const data = await response.json();
          const image = data?.items?.[0]?.images?.[0];

          if (image) return normalizeUrl(image);
        } catch {}
      }

      return "";
    };

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const raw = await response.json();

        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.categories)
          ? raw.categories
          : [];

        const filtered = list
          .filter((item) => item?.label && item?.value && item.value !== "all")
          .slice(0, 6);

        const images = await Promise.all(
          filtered.map(async (item) => {
            const fromApi = normalizeUrl(item.image);
            if (fromApi) return fromApi;
            return await fetchCategoryImage(item.value);
          })
        );

        const finalCategories = filtered.map((item, index) => ({
          title: item.label,
          slug: item.value,
          image: images[index] || "/images/placeholder.png"
        }));

        setCategories(finalCategories);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProductsSections = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products?limit=120`);
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const shuffled = [...items].sort(() => Math.random() - 0.5);

        setNewArrivals(shuffled.slice(0, 12));
        setBestSellers(shuffled.slice(12, 24));
      } catch {
        setNewArrivals([]);
        setBestSellers([]);
      }
    };

    loadProductsSections();
  }, []);

  useEffect(() => {
    if (quickViewItem) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [quickViewItem]);

  const mobileCategories = useMemo(() => categories.slice(0, 2), [categories]);

  const handleCategoryClick = (slug) => {
    navigate(`/products?category=${encodeURIComponent(slug)}`);
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

  const goToProducts = () => {
    navigate("/products");
  };

  const goToProductsWithoutFilters = () => {
    navigate("/products-without-filters");
  };

  const renderStars = (product) => {
    const rating = Number(product.rating || 4);
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));
    return (
      <div className="homepage-product-stars" aria-label={`${fullStars} star rating`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className={index < fullStars ? "filled" : ""}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderProductCard = (product, index, onNavigate, variant = "compact") => {
    const image =
      product?.images?.[0] ||
      product?.image_url ||
      "/images/placeholder.png";

    return (
      <div className={`homepage-product-card ${variant === "wide" ? "homepage-product-card-wide" : ""}`} key={`${product.id}-${index}`}>
        <div
          className="homepage-product-media"
          onClick={onNavigate}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") onNavigate();
          }}
        >
          <img
            src={image}
            alt={product.name}
            className="homepage-product-image"
          />
          <div className="homepage-product-overlay">
            <button
              type="button"
              className="homepage-product-overlay-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
            >
              Add to Cart
            </button>
            <button
              type="button"
              className="homepage-product-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewItem(product);
              }}
              aria-label="Quick view"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M1.99988 12C3.59988 7.99998 7.39988 5.33331 11.9999 5.33331C16.5999 5.33331 20.3999 7.99998 21.9999 12C20.3999 16 16.5999 18.6666 11.9999 18.6666C7.39988 18.6666 3.59988 16 1.99988 12Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15.3333C13.8409 15.3333 15.3334 13.8408 15.3334 12C15.3334 10.159 13.8409 8.66666 12 8.66666C10.1591 8.66666 8.66663 10.159 8.66663 12C8.66663 13.8408 10.1591 15.3333 12 15.3333Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="homepage-product-body">
          <div className="homepage-product-head">
            <div className="homepage-product-title-wrap">
              <h3 onClick={onNavigate}>{product.name}</h3>
              <p>{product.model_name || "Model not available"}</p>
            </div>
            {renderStars(product)}
          </div>

          <div className="homepage-product-price-row">
            <strong>₹{Number(product.mahaveer_price || 0).toFixed(2)}</strong>
            {Number(product.mrp || 0) > 0 ? (
              <span>₹{Number(product.mrp || 0).toFixed(2)}</span>
            ) : null}
          </div>

          <div className="homepage-product-specs-grid">
            <div className="homepage-product-spec-item">
              <label>HSN%</label>
              <span>{Number(product.hsn_percentage || 0).toFixed(0)}%</span>
            </div>
            <div className="homepage-product-spec-item">
              <label>Mahaveer</label>
              <span>₹{Number(product.mahaveer_price || 0).toFixed(2)}</span>
            </div>
            <div className="homepage-product-spec-item">
              <label>MRP</label>
              <span>₹{Number(product.mrp || 0).toFixed(2)}</span>
            </div>
            <div className="homepage-product-spec-item">
              <label>Width</label>
              <span>{product.width ?? "-"}</span>
            </div>
            <div className="homepage-product-spec-item">
              <label>Length</label>
              <span>{product.length ?? "-"}</span>
            </div>
            <div className="homepage-product-spec-item">
              <label>Height</label>
              <span>{product.height ?? "-"}</span>
            </div>
            <div className="homepage-product-spec-item homepage-product-spec-item-wide">
              <label>Weight</label>
              <span>{product.weight ?? "-"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="homepage">
      <Navbar />
      <main className="homepage-content">
        <section className="homepage-hero">
          <div className="homepage-hero-slider">
            <div
              className="homepage-hero-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((image, index) => (
                <div className="homepage-hero-slide" key={index}>
                  <img
                    src={image}
                    alt={`Mahaveer slide ${index + 1}`}
                    className="homepage-hero-image"
                  />
                  <div className="homepage-hero-overlay" />
                </div>
              ))}
            </div>

            <div className="homepage-hero-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`homepage-hero-dot ${currentSlide === index ? "active" : ""}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="homepage-categories-section">
          <div className="homepage-categories-container">
            <div className="homepage-categories-header">
              <span className="homepage-categories-label">Categories</span>
              <h2 className="homepage-categories-title">Browse by Category</h2>
            </div>

            <div className="homepage-categories-grid homepage-categories-desktop">
              {categories.map((item, index) => (
                <button
                  type="button"
                  key={`${item.slug}-${index}`}
                  className="homepage-category-card"
                  onClick={() => handleCategoryClick(item.slug)}
                >
                  <div className="homepage-category-image-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="homepage-category-image"
                    />
                  </div>
                  <div className="homepage-category-content">
                    <h3>{item.title}</h3>
                    <span>Explore Now</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="homepage-categories-grid homepage-categories-mobile">
              {mobileCategories.map((item, index) => (
                <button
                  type="button"
                  key={`${item.slug}-${index}`}
                  className="homepage-category-card"
                  onClick={() => handleCategoryClick(item.slug)}
                >
                  <div className="homepage-category-image-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="homepage-category-image"
                    />
                  </div>
                  <div className="homepage-category-content">
                    <h3>{item.title}</h3>
                    <span>Explore Now</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <Divider />

        <section className="homepage-arrivals-section">
          <div className="homepage-arrivals-container">
            <div className="homepage-arrivals-header">
              <div>
                <span className="homepage-arrivals-label">Products</span>
                <h2 className="homepage-arrivals-title">New Arrivals</h2>
              </div>
              <button type="button" className="homepage-arrivals-view-top" onClick={goToProducts}>
                View All
              </button>
            </div>

            <div className="homepage-arrivals-grid">
              {newArrivals.map((product, index) =>
                renderProductCard(product, index, goToProducts, "compact")
              )}
            </div>

            <div className="homepage-arrivals-bottom">
              <button type="button" className="homepage-arrivals-view-center" onClick={goToProducts}>
                View All
              </button>
            </div>
          </div>
        </section>

        <Divider />

        <section className="homepage-best-section">
          <div className="homepage-best-container">
            <div className="homepage-best-header">
              <div>
                <span className="homepage-best-label">Featured Collection</span>
                <h2 className="homepage-best-title">Best Sellers</h2>
              </div>
              <button type="button" className="homepage-best-view-top" onClick={goToProductsWithoutFilters}>
                View All
              </button>
            </div>

            <div className="homepage-best-grid">
              {bestSellers.map((product, index) =>
                renderProductCard(product, index, goToProductsWithoutFilters, "wide")
              )}
            </div>

            <div className="homepage-best-bottom">
              <button
                type="button"
                className="homepage-best-view-center"
                onClick={goToProductsWithoutFilters}
              >
                View All
              </button>
            </div>
          </div>
        </section>
      </main>
      <Divider />

      {quickViewItem ? (
        <div className="homepage-quickview-overlay" onClick={() => setQuickViewItem(null)}>
          <div
            className="homepage-quickview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="homepage-quickview-close"
              onClick={() => setQuickViewItem(null)}
            >
              ×
            </button>

            <div className="homepage-quickview-grid">
              <div className="homepage-quickview-image-wrap">
                <img
                  src={
                    quickViewItem?.images?.[0] ||
                    quickViewItem?.image_url ||
                    "/images/placeholder.png"
                  }
                  alt={quickViewItem?.name}
                  className="homepage-quickview-image"
                />
              </div>

              <div className="homepage-quickview-content">
                <span className="homepage-quickview-kicker">Quick View</span>
                <h3>{quickViewItem?.name}</h3>
                <p>{quickViewItem?.brand || quickViewItem?.category_slug}</p>
                <div className="homepage-quickview-price">
                  ₹{Number(quickViewItem?.mahaveer_price || 0).toFixed(2)}
                </div>
                <div className="homepage-quickview-description">
                  {quickViewItem?.description || "Beautifully curated product from Mahaveer Papers."}
                </div>
                <div className="homepage-quickview-actions">
                  <button
                    type="button"
                    className="homepage-quickview-primary"
                    onClick={() => handleAddToCart(quickViewItem)}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="homepage-quickview-secondary"
                    onClick={goToProducts}
                  >
                    View All Products
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ReviewSection />
      <Footer />
    </div>
  );
}

export default HomePage;