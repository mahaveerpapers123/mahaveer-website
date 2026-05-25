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

const getProductImage = (product) =>
  normalizeUrl(
    product?.images?.[0] ||
      product?.image_url ||
      "/images/placeholder.png"
  );

const getProductText = (product) =>
  [
    product?.name,
    product?.brand,
    product?.model_name,
    product?.description,
    product?.category_slug
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const matchesAny = (product, terms) => {
  const text = getProductText(product);
  return terms.some((term) => text.includes(term.toLowerCase()));
};

const buildSmartCategories = (items) => {
  const definitions = [
    {
      title: "Pens Collection",
      query: "pen",
      terms: ["pen", "ball pen", "gel", "roller", "pentonic", "hauser", "flair", "parker", "unomax"]
    },
    {
      title: "Copier Papers",
      query: "copier",
      terms: ["copier", "gsm", "paper", "a4", "a3", "reflection", "jk", "b2b copier"]
    },
    {
      title: "Staplers & Pins",
      query: "stapler",
      terms: ["stapler", "pins", "kangaroo", "dp-", "sr-", "hp-", "hs-"]
    },
    {
      title: "Colours & Art",
      query: "colour",
      terms: ["colour", "color", "crayon", "wax", "poster", "water", "acrylic", "sketch", "artist", "canvas", "shades"]
    },
    {
      title: "Pencils & Erasers",
      query: "pencil",
      terms: ["pencil", "eraser", "lead", "sharpener", "apsara", "nataraj", "doms"]
    },
    {
      title: "Glue & Adhesives",
      query: "glue",
      terms: ["glue", "gum", "paste", "fevicol", "fevistick", "fevistik", "fevibond", "adhesive"]
    }
  ];

  return definitions.map((category) => {
    const matchedProducts = items.filter((product) => matchesAny(product, category.terms));
    const productWithImage =
      matchedProducts.find((product) => product?.images?.[0] || product?.image_url) ||
      matchedProducts[0] ||
      items.find((product) => product?.images?.[0] || product?.image_url);

    return {
      title: category.title,
      query: category.query,
      image: productWithImage ? getProductImage(productWithImage) : "/images/placeholder.png",
      count: matchedProducts.length,
      type: "query"
    };
  });
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
    const loadHomeData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products?category=all&limit=500`);
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const shuffled = [...items].sort(() => Math.random() - 0.5);

        setNewArrivals(shuffled.slice(0, 12));
        setBestSellers(shuffled.slice(12, 24));
        setCategories(buildSmartCategories(items));
      } catch {
        setNewArrivals([]);
        setBestSellers([]);
        setCategories([
          {
            title: "Pens Collection",
            query: "pen",
            image: "/images/placeholder.png",
            count: 0,
            type: "query"
          },
          {
            title: "Copier Papers",
            query: "copier",
            image: "/images/placeholder.png",
            count: 0,
            type: "query"
          },
          {
            title: "Staplers & Pins",
            query: "stapler",
            image: "/images/placeholder.png",
            count: 0,
            type: "query"
          },
          {
            title: "Colours & Art",
            query: "colour",
            image: "/images/placeholder.png",
            count: 0,
            type: "query"
          },
          {
            title: "Pencils & Erasers",
            query: "pencil",
            image: "/images/placeholder.png",
            count: 0,
            type: "query"
          },
          {
            title: "Glue & Adhesives",
            query: "glue",
            image: "/images/placeholder.png",
            count: 0,
            type: "query"
          }
        ]);
      }
    };

    loadHomeData();
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

  const handleCategoryClick = (item) => {
    if (item?.type === "query") {
      navigate(`/products?category=all&query=${encodeURIComponent(item.query)}`);
      return;
    }

    navigate(`/products?category=${encodeURIComponent(item.slug || "all")}`);
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
    const image = getProductImage(product);

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
            onError={(e) => {
              e.currentTarget.src = "/images/placeholder.png";
            }}
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
                  key={`${item.title}-${index}`}
                  className="homepage-category-card"
                  onClick={() => handleCategoryClick(item)}
                >
                  <div className="homepage-category-image-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="homepage-category-image"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder.png";
                      }}
                    />
                  </div>
                  <div className="homepage-category-content">
                    <h3>{item.title}</h3>
                    <span>{item.count > 0 ? `${item.count} Products` : "Explore Now"}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="homepage-categories-grid homepage-categories-mobile">
              {mobileCategories.map((item, index) => (
                <button
                  type="button"
                  key={`${item.title}-${index}`}
                  className="homepage-category-card"
                  onClick={() => handleCategoryClick(item)}
                >
                  <div className="homepage-category-image-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="homepage-category-image"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder.png";
                      }}
                    />
                  </div>
                  <div className="homepage-category-content">
                    <h3>{item.title}</h3>
                    <span>{item.count > 0 ? `${item.count} Products` : "Explore Now"}</span>
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
                  src={getProductImage(quickViewItem)}
                  alt={quickViewItem?.name}
                  className="homepage-quickview-image"
                  onError={(e) => {
                    e.currentTarget.src = "/images/placeholder.png";
                  }}
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