import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cart from "./Cart";
import "./Navbar.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

const PRODUCTS_ROUTE = "/products-without-filters";

const normalizeUrl = (url) => {
  if (typeof url !== "string") return "";
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
};

const getProductText = (product) =>
  [
    product?.name,
    product?.brand,
    product?.model_name,
    product?.description,
    product?.category_slug,
    product?.colour,
    product?.barcode
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getProductImage = (product) =>
  normalizeUrl(
    product?.images?.[0] ||
      product?.image_url ||
      "/images/placeholder.png"
  );

const matchesAny = (product, terms) => {
  const text = getProductText(product);
  return terms.some((term) => text.includes(term.toLowerCase()));
};

const CATEGORY_DEFINITIONS = [
  {
    label: "Pens Collection",
    value: "pens",
    query: "pen",
    terms: [" pen", "pens", "ball pen", "gel pen", "roller pen", "ballpoint", "pentonic", "pen(", "pen "]
  },
  {
    label: "Copier Papers",
    value: "copier-papers",
    query: "copier paper",
    terms: ["copier", "paper", "gsm", "a4", "a3", "reflection", "jk red", "jk easy", "tnpl", "ledger"]
  },
  {
    label: "Staplers & Pins",
    value: "staplers-pins",
    query: "stapler pins",
    terms: ["stapler", "pins", "kangaroo", "dp-", "sr-", "hp-", "hs-", "staple"]
  },
  {
    label: "Colours & Art",
    value: "colours-art",
    query: "colour art",
    terms: ["colour", "color", "crayon", "wax", "poster", "water col", "acrylic", "sketch", "artist", "canvas", "shades", "paint"]
  },
  {
    label: "Pencils & Erasers",
    value: "pencils-erasers",
    query: "pencil eraser",
    terms: ["pencil", "eraser", "lead", "sharpener", "apsara", "nataraj", "doms"]
  },
  {
    label: "Glue & Adhesives",
    value: "glue-adhesives",
    query: "glue adhesive",
    terms: ["glue", "gum", "paste", "fevicol", "fevistick", "fevistik", "fevibond", "adhesive", "fevi"]
  },
  {
    label: "Calculators",
    value: "calculators",
    query: "calculator",
    terms: ["calculator", "casio", "orpat", "scientific", "fx-", "mj-", "hl-", "fc-"]
  },
  {
    label: "Office Essentials",
    value: "office-essentials",
    query: "office",
    terms: ["marker", "whiteboard", "stamp", "cutter", "punch", "file", "office", "clips"]
  }
];

const CRAFT_DEFINITIONS = [
  {
    label: "Colours & Paints",
    value: "colours-paints",
    query: "colour paint",
    terms: ["colour", "color", "paint", "poster", "water col", "acrylic", "shades"]
  },
  {
    label: "Sketch Pens",
    value: "sketch-pens",
    query: "sketch pen",
    terms: ["sketch", "marker", "brush pen", "dual tip", "calligraphy"]
  },
  {
    label: "Crayons & Wax Colours",
    value: "crayons-wax",
    query: "crayon wax",
    terms: ["crayon", "wax", "twistic", "plastic colour"]
  },
  {
    label: "Canvas & Boards",
    value: "canvas-boards",
    query: "canvas board",
    terms: ["canvas", "board", "art board"]
  },
  {
    label: "Glue & Craft Adhesives",
    value: "craft-glue",
    query: "glue",
    terms: ["glue", "fevicol", "fevistik", "gum", "paste", "adhesive"]
  },
  {
    label: "Geometry & Scales",
    value: "geometry-scales",
    query: "geometry scale",
    terms: ["geometry", "scale", "ruler", "geofine", "compass"]
  },
  {
    label: "Pencils & Drawing",
    value: "drawing-pencils",
    query: "pencil drawing",
    terms: ["pencil", "drawing", "lead", "artist"]
  },
  {
    label: "Kids Art Kits",
    value: "kids-art-kits",
    query: "art kit",
    terms: ["kit", "creative", "little artist", "prep kit", "writing kit"]
  }
];

const buildSmartItems = (definitions, products) =>
  definitions.map((definition) => {
    const matchedProducts = products.filter((product) => matchesAny(product, definition.terms));
    const productWithImage =
      matchedProducts.find((product) => product?.images?.[0] || product?.image_url) ||
      matchedProducts[0] ||
      products.find((product) => product?.images?.[0] || product?.image_url);

    return {
      label: definition.label,
      title: definition.label,
      value: definition.value,
      query: definition.query,
      type: "query",
      count: matchedProducts.length,
      image: productWithImage ? getProductImage(productWithImage) : "/images/placeholder.png"
    };
  });

function Navbar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [categories, setCategories] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCategoryQuery, setSelectedCategoryQuery] = useState("");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCraftOpen, setIsCraftOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const lastScrollY = useRef(0);
  const categoryDropdownRef = useRef(null);
  const craftDropdownRef = useRef(null);

  const isSignedIn = Boolean(userName);

  useEffect(() => {
    const loadUser = () => {
      const storedUserRaw = localStorage.getItem("user");
      if (storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw);
          setUserName(storedUser?.name || "");
        } catch {
          setUserName("");
        }
      } else {
        setUserName("");
      }
    };

    loadUser();
    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

  useEffect(() => {
    const updateCartInfo = () => {
      let cart = [];
      try {
        const storedItems = localStorage.getItem("cartItems");
        cart = storedItems ? JSON.parse(storedItems) : [];
        if (!Array.isArray(cart)) cart = [];
      } catch {
        cart = [];
      }

      const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
      const totalValue = cart.reduce(
        (acc, item) => acc + Number(item.price || item.mahaveer_price || 0) * (item.quantity || 0),
        0
      );

      setCartCount(totalItems);
      setTotalPrice(totalValue);
    };

    updateCartInfo();
    window.addEventListener("cartUpdated", updateCartInfo);
    window.addEventListener("userUpdated", updateCartInfo);

    return () => {
      window.removeEventListener("cartUpdated", updateCartInfo);
      window.removeEventListener("userUpdated", updateCartInfo);
    };
  }, []);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products?category=all&limit=500`);
        const data = await response.json();
        const products = Array.isArray(data?.items) ? data.items : [];

        setCategories(buildSmartItems(CATEGORY_DEFINITIONS, products));
        setMenuData(buildSmartItems(CRAFT_DEFINITIONS, products));
      } catch {
        setCategories(buildSmartItems(CATEGORY_DEFINITIONS, []));
        setMenuData(buildSmartItems(CRAFT_DEFINITIONS, []));
      }
    };

    loadDropdownData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (craftDropdownRef.current && !craftDropdownRef.current.contains(event.target)) {
        setIsCraftOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const visibleCraftItems = useMemo(() => {
    if (menuData.length > 0) return menuData;
    return buildSmartItems(CRAFT_DEFINITIONS, []);
  }, [menuData]);

  const navigateToProducts = (query = "", group = "", label = "") => {
    const params = new URLSearchParams();
    const cleanQuery = String(query || "").trim();
    const cleanGroup = String(group || "").trim();
    const cleanLabel = String(label || "").trim();

    if (cleanQuery) params.set("query", cleanQuery);
    if (cleanGroup) params.set("group", cleanGroup);
    if (cleanLabel) params.set("label", cleanLabel);

    const path = params.toString() ? `${PRODUCTS_ROUTE}?${params.toString()}` : PRODUCTS_ROUTE;

    navigate(path);
    setIsCategoryOpen(false);
    setIsCraftOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (query) {
      navigateToProducts(query, selectedCategory !== "all" ? selectedCategory : "", selectedCategory !== "all" ? selectedCategoryLabel : "");
      return;
    }

    if (selectedCategoryQuery) {
      navigateToProducts(selectedCategoryQuery, selectedCategory, selectedCategoryLabel);
      return;
    }

    navigateToProducts("");
  };

  const handleCategorySelect = (item) => {
    if (item.value === "all") {
      setSelectedCategory("all");
      setSelectedCategoryQuery("");
      setSelectedCategoryLabel("All Categories");
      navigateToProducts("");
      return;
    }

    const value = item.value || item.label || "";
    const query = item.query || item.label || value;
    const label = item.label || "All Categories";

    setSelectedCategory(value);
    setSelectedCategoryQuery(query);
    setSelectedCategoryLabel(label);
    navigateToProducts(query, value, label);
  };

  const handleNavigateItem = (itemOrPath) => {
    if (typeof itemOrPath === "string") {
      navigate(itemOrPath);
      setIsCraftOpen(false);
      return;
    }

    const item = itemOrPath || {};
    const query = item.query || item.title || item.label || item.value || "";
    const group = item.value || "";
    const label = item.label || item.title || "";

    navigateToProducts(query, group, label);
  };

  const handleCartOpen = () => {
    setIsCartOpen(true);
  };

  const renderCartText = () => {
    if (!isSignedIn) return "Cart";
    if (cartCount > 0) return `₹${totalPrice.toFixed(2)}`;
    return "Shop Now";
  };

  return (
    <>
      <header className={`navbar-wrapper ${showNavbar ? "navbar-visible" : "navbar-hidden"}`}>
        <div className="navbar-gradient">
          <div className="navbar-top">
            <div className="navbar-top-inner">
              <div className="navbar-top-left">
                <Link to="/" className="navbar-logo-link">
                  <img src="/images/BTLogo.png" alt="Mahaveer Logo" className="navbar-logo" />
                </Link>
              </div>

              <div className="navbar-top-middle">
                <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
                  <div className="navbar-search">
                    <div className="navbar-category-dropdown" ref={categoryDropdownRef}>
                      <button
                        type="button"
                        className="navbar-category-button"
                        onClick={() => setIsCategoryOpen((prev) => !prev)}
                      >
                        <span className="navbar-category-button-label">{selectedCategoryLabel}</span>
                        <span className={`navbar-arrow ${isCategoryOpen ? "open" : ""}`}>
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>

                      {isCategoryOpen && (
                        <div className="navbar-category-menu">
                          <button
                            type="button"
                            className={`navbar-category-item ${selectedCategory === "all" ? "active" : ""}`}
                            onClick={() => handleCategorySelect({ label: "All Categories", value: "all", query: "" })}
                          >
                            All Categories
                          </button>

                          {categories.map((item, index) => (
                            <button
                              type="button"
                              key={`${item.value || item.label}-${index}`}
                              className={`navbar-category-item ${selectedCategory === (item.value || item.label) ? "active" : ""}`}
                              onClick={() => handleCategorySelect(item)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="navbar-search-divider" />

                    <input
                      type="search"
                      className="navbar-search-input"
                      placeholder="I am shopping for..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <button type="submit" className="navbar-search-icon-button" aria-label="Search">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.2687 15.6656L12.6281 11.8969C14.5406 9.28123 14.3437 5.5406 11.9531 3.1781C10.6875 1.91248 8.99995 1.20935 7.19995 1.20935C5.39995 1.20935 3.71245 1.91248 2.44683 3.1781C-0.168799 5.79373 -0.168799 10.0687 2.44683 12.6844C3.71245 13.95 5.39995 14.6531 7.19995 14.6531C8.91558 14.6531 10.5187 14.0062 11.7843 12.8531L16.4812 16.65C16.5937 16.7344 16.7343 16.7906 16.875 16.7906C17.0718 16.7906 17.2406 16.7062 17.3531 16.5656C17.5781 16.2844 17.55 15.8906 17.2687 15.6656ZM7.19995 13.3875C5.73745 13.3875 4.38745 12.825 3.34683 11.7844C1.20933 9.64685 1.20933 6.18748 3.34683 4.0781C4.38745 3.03748 5.73745 2.47498 7.19995 2.47498C8.66245 2.47498 10.0125 3.03748 11.0531 4.0781C13.1906 6.2156 13.1906 9.67498 11.0531 11.7844C10.0406 12.825 8.66245 13.3875 7.19995 13.3875Z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              <div className="navbar-top-right">
                <div className="navbar-right-divider" />

                <Link to="/signin" className="navbar-account">
                  <span className="navbar-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C9.37666 1.25 7.25001 3.37665 7.25001 6C7.25001 8.62335 9.37666 10.75 12 10.75C14.6234 10.75 16.75 8.62335 16.75 6C16.75 3.37665 14.6234 1.25 12 1.25ZM8.75001 6C8.75001 4.20507 10.2051 2.75 12 2.75C13.7949 2.75 15.25 4.20507 15.25 6C15.25 7.79493 13.7949 9.25 12 9.25C10.2051 9.25 8.75001 7.79493 8.75001 6Z" fill="#3c50e0" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 12.25C9.68646 12.25 7.55494 12.7759 5.97546 13.6643C4.4195 14.5396 3.25001 15.8661 3.25001 17.5L3.24995 17.602C3.24882 18.7638 3.2474 20.222 4.52642 21.2635C5.15589 21.7761 6.03649 22.1406 7.22622 22.3815C8.41927 22.6229 9.97424 22.75 12 22.75C14.0258 22.75 15.5808 22.6229 16.7738 22.3815C17.9635 22.1406 18.8441 21.7761 19.4736 21.2635C20.7526 20.222 20.7512 18.7638 20.7501 17.602L20.75 17.5C20.75 15.8661 19.5805 14.5396 18.0246 13.6643C16.4451 12.7759 14.3136 12.25 12 12.25ZM4.75001 17.5C4.75001 16.6487 5.37139 15.7251 6.71085 14.9717C8.02681 14.2315 9.89529 13.75 12 13.75C14.1047 13.75 15.9732 14.2315 17.2892 14.9717C18.6286 15.7251 19.25 16.6487 19.25 17.5C19.25 18.8078 19.2097 19.544 18.5264 20.1004C18.1559 20.4022 17.5365 20.6967 16.4762 20.9113C15.4193 21.1252 13.9742 21.25 12 21.25C10.0258 21.25 8.58075 21.1252 7.5238 20.9113C6.46354 20.6967 5.84413 20.4022 5.4736 20.1004C4.79033 19.544 4.75001 18.8078 4.75001 17.5Z" fill="#3c50e0" />
                    </svg>
                  </span>
                  <span className="navbar-account-text">
                    <span className="navbar-account-label">Account</span>
                    <span className="navbar-account-name">{userName || "Sign In"}</span>
                  </span>
                </Link>

                <button type="button" className="navbar-cart" onClick={handleCartOpen}>
                  <span className="navbar-icon-wrap navbar-cart-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 4H4.7C5.1 4 5.45 4.27 5.55 4.66L6.1 6.75M6.1 6.75H20.25C20.8 6.75 21.2 7.27 21.06 7.8L19.65 13.25C19.38 14.3 18.43 15.03 17.35 15.03H9.35C8.25 15.03 7.29 14.28 7.04 13.21L6.1 6.75ZM8.75 18.75C8.75 19.44 8.19 20 7.5 20C6.81 20 6.25 19.44 6.25 18.75C6.25 18.06 6.81 17.5 7.5 17.5C8.19 17.5 8.75 18.06 8.75 18.75ZM19.25 18.75C19.25 19.44 18.69 20 18 20C17.31 20 16.75 19.44 16.75 18.75C16.75 18.06 17.31 17.5 18 17.5C18.69 17.5 19.25 18.06 19.25 18.75Z" stroke="#3c50e0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isSignedIn && cartCount > 0 ? <span className="navbar-cart-badge">{cartCount}</span> : null}
                  </span>
                  <span className="navbar-cart-text">
                    <span className="navbar-account-label">Cart</span>
                    <span className="navbar-account-name">{renderCartText()}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="navbar-bottom">
            <div className="navbar-bottom-inner">
              <div className="navbar-craft-dropdown" ref={craftDropdownRef}>
                <button type="button" className="navbar-craft-button" onClick={() => setIsCraftOpen((prev) => !prev)}>
                  <span>Craft Material</span>
                  <span className={`navbar-arrow ${isCraftOpen ? "open" : ""}`}>
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {isCraftOpen && (
                  <div className="navbar-craft-menu">
                    {visibleCraftItems.map((item, index) => (
                      <button key={`${item.title}-${index}`} type="button" className="navbar-craft-item" onClick={() => handleNavigateItem(item)}>
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form className="navbar-mobile-search-form" onSubmit={handleSearchSubmit}>
                <div className="navbar-mobile-search">
                  <input
                    type="search"
                    className="navbar-mobile-search-input"
                    placeholder="I am shopping for..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="navbar-mobile-search-icon-button" aria-label="Search">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.2687 15.6656L12.6281 11.8969C14.5406 9.28123 14.3437 5.5406 11.9531 3.1781C10.6875 1.91248 8.99995 1.20935 7.19995 1.20935C5.39995 1.20935 3.71245 1.91248 2.44683 3.1781C-0.168799 5.79373 -0.168799 10.0687 2.44683 12.6844C3.71245 13.95 5.39995 14.6531 7.19995 14.6531C8.91558 14.6531 10.5187 14.0062 11.7843 12.8531L16.4812 16.65C16.5937 16.7344 16.7343 16.7906 16.875 16.7906C17.0718 16.7906 17.2406 16.7062 17.3531 16.5656C17.5781 16.2844 17.55 15.8906 17.2687 15.6656ZM7.19995 13.3875C5.73745 13.3875 4.38745 12.825 3.34683 11.7844C1.20933 9.64685 1.20933 6.18748 3.34683 4.0781C4.38745 3.03748 5.73745 2.47498 7.19995 2.47498C8.66245 2.47498 10.0125 3.03748 11.0531 4.0781C13.1906 6.2156 13.1906 9.67498 11.0531 11.7844C10.0406 12.825 8.66245 13.3875 7.19995 13.3875Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </header>

      <Cart mode="drawer" isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

export default Navbar;