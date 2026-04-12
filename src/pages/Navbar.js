import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cart from "./Cart";
import "./Navbar.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

function Navbar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [categories, setCategories] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();
        const normalized = Array.isArray(data) ? data : [];
        const filtered = normalized.filter((item) => {
          const label = (item?.label || "").trim().toLowerCase();
          const value = (item?.value || "").trim().toLowerCase();
          return label !== "all categories" && value !== "all";
        });
        const uniqueCategories = Array.from(
          new Map(filtered.map((item) => [item.label, item])).values()
        );
        setCategories(uniqueCategories);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchNavLinks = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/navlinks`);
        const data = await response.json();
        setMenuData(Array.isArray(data) ? data : []);
      } catch {
        setMenuData([]);
      }
    };

    fetchNavLinks();
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

  const craftItems = useMemo(() => {
    return menuData.filter((item) => {
      const title = (item.title || "").toLowerCase();
      return title.includes("craft");
    });
  }, [menuData]);

  const visibleCraftItems = useMemo(() => {
    if (craftItems.length > 0) return craftItems;
    return categories.slice(0, 10).map((item) => ({
      title: item.label,
      type: "category",
      path: item.value || item.label,
      slugKey: item.value || item.label
    }));
  }, [craftItems, categories]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (query) {
      navigate(
        `/shopping?query=${encodeURIComponent(query)}${
          selectedCategory !== "all" ? `&category=${encodeURIComponent(selectedCategory)}` : ""
        }`
      );
      return;
    }

    if (selectedCategory !== "all") {
      navigate(`/shopping?category=${encodeURIComponent(selectedCategory)}`);
    }
  };

  const handleCategorySelect = (item) => {
    const value = item.value || item.label;
    setSelectedCategory(value);
    setSelectedCategoryLabel(item.label || "All Categories");
    setIsCategoryOpen(false);
  };

  const handleNavigateItem = (itemOrPath) => {
    setIsCraftOpen(false);

    if (typeof itemOrPath === "string") {
      navigate(itemOrPath);
      return;
    }

    const item = itemOrPath;

    if (item.type === "product" && item.slugKey) {
      navigate(`/product/${encodeURIComponent(item.slugKey)}`);
      return;
    }

    if (item.type === "collection" && item.slugKey) {
      navigate(`/shopping?collection=${encodeURIComponent(item.slugKey)}`);
      return;
    }

    if (item.type === "category") {
      const keyFromPath =
        item.path && !item.path.startsWith("/") ? item.path : item.path?.slice(1);

      const key = keyFromPath || item.slugKey || item.title || "";
      if (key) {
        navigate(`/shopping?category=${encodeURIComponent(key)}`);
        return;
      }
    }

    if (item.path) {
      navigate(item.path);
      return;
    }

    if (item.title) {
      navigate(`/shopping?query=${encodeURIComponent(item.title)}`);
    }
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
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>

                      {isCategoryOpen && (
                        <div className="navbar-category-menu">
                          <button
                            type="button"
                            className={`navbar-category-item ${selectedCategory === "all" ? "active" : ""}`}
                            onClick={() =>
                              handleCategorySelect({ label: "All Categories", value: "all" })
                            }
                          >
                            All Categories
                          </button>
                          {categories.map((item, index) => (
                            <button
                              type="button"
                              key={`${item.value || item.label}-${index}`}
                              className={`navbar-category-item ${
                                selectedCategory === (item.value || item.label) ? "active" : ""
                              }`}
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
                        <path
                          d="M17.2687 15.6656L12.6281 11.8969C14.5406 9.28123 14.3437 5.5406 11.9531 3.1781C10.6875 1.91248 8.99995 1.20935 7.19995 1.20935C5.39995 1.20935 3.71245 1.91248 2.44683 3.1781C-0.168799 5.79373 -0.168799 10.0687 2.44683 12.6844C3.71245 13.95 5.39995 14.6531 7.19995 14.6531C8.91558 14.6531 10.5187 14.0062 11.7843 12.8531L16.4812 16.65C16.5937 16.7344 16.7343 16.7906 16.875 16.7906C17.0718 16.7906 17.2406 16.7062 17.3531 16.5656C17.5781 16.2844 17.55 15.8906 17.2687 15.6656ZM7.19995 13.3875C5.73745 13.3875 4.38745 12.825 3.34683 11.7844C1.20933 9.64685 1.20933 6.18748 3.34683 4.0781C4.38745 3.03748 5.73745 2.47498 7.19995 2.47498C8.66245 2.47498 10.0125 3.03748 11.0531 4.0781C13.1906 6.2156 13.1906 9.67498 11.0531 11.7844C10.0406 12.825 8.66245 13.3875 7.19995 13.3875Z"
                          fill="currentColor"
                        />
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
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 1.25C9.37666 1.25 7.25001 3.37665 7.25001 6C7.25001 8.62335 9.37666 10.75 12 10.75C14.6234 10.75 16.75 8.62335 16.75 6C16.75 3.37665 14.6234 1.25 12 1.25ZM8.75001 6C8.75001 4.20507 10.2051 2.75 12 2.75C13.7949 2.75 15.25 4.20507 15.25 6C15.25 7.79493 13.7949 9.25 12 9.25C10.2051 9.25 8.75001 7.79493 8.75001 6Z"
                        fill="#3c50e0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 12.25C9.68646 12.25 7.55494 12.7759 5.97546 13.6643C4.4195 14.5396 3.25001 15.8661 3.25001 17.5L3.24995 17.602C3.24882 18.7638 3.2474 20.222 4.52642 21.2635C5.15589 21.7761 6.03649 22.1406 7.22622 22.3815C8.41927 22.6229 9.97424 22.75 12 22.75C14.0258 22.75 15.5808 22.6229 16.7738 22.3815C17.9635 22.1406 18.8441 21.7761 19.4736 21.2635C20.7526 20.222 20.7512 18.7638 20.7501 17.602L20.75 17.5C20.75 15.8661 19.5805 14.5396 18.0246 13.6643C16.4451 12.7759 14.3136 12.25 12 12.25ZM4.75001 17.5C4.75001 16.6487 5.37139 15.7251 6.71085 14.9717C8.02681 14.2315 9.89529 13.75 12 13.75C14.1047 13.75 15.9732 14.2315 17.2892 14.9717C18.6286 15.7251 19.25 16.6487 19.25 17.5C19.25 18.8078 19.2097 19.544 18.5264 20.1004C18.1559 20.4022 17.5365 20.6967 16.4762 20.9113C15.4193 21.1252 13.9742 21.25 12 21.25C10.0258 21.25 8.58075 21.1252 7.5238 20.9113C6.46354 20.6967 5.84413 20.4022 5.4736 20.1004C4.79033 19.544 4.75001 18.8078 4.75001 17.5Z"
                        fill="#3c50e0"
                      />
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
                      <path
                        d="M15.5433 9.5172C15.829 9.21725 15.8174 8.74252 15.5174 8.45686C15.2175 8.17119 14.7428 8.18277 14.4571 8.48272L12.1431 10.9125L11.5433 10.2827C11.2576 9.98277 10.7829 9.97119 10.483 10.2569C10.183 10.5425 10.1714 11.0173 10.4571 11.3172L11.6 12.5172C11.7415 12.6658 11.9378 12.75 12.1431 12.75C12.3483 12.75 12.5446 12.6658 12.6862 12.5172L15.5433 9.5172Z"
                        fill="#3c50e0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.29266 2.7512C1.43005 2.36044 1.8582 2.15503 2.24896 2.29242L2.55036 2.39838C3.16689 2.61511 3.69052 2.79919 4.10261 3.00139C4.54324 3.21759 4.92109 3.48393 5.20527 3.89979C5.48725 4.31243 5.60367 4.76515 5.6574 5.26153C5.66124 5.29706 5.6648 5.33321 5.66809 5.36996L17.1203 5.36996C17.9389 5.36995 18.7735 5.36993 19.4606 5.44674C19.8103 5.48584 20.1569 5.54814 20.4634 5.65583C20.7639 5.76141 21.0942 5.93432 21.3292 6.23974C21.711 6.73613 21.7777 7.31414 21.7416 7.90034C21.7071 8.45845 21.5686 9.15234 21.4039 9.97723L21.3935 10.0295L21.3925 10.0341L20.8836 12.5033C20.7339 13.2298 20.6079 13.841 20.4455 14.3231C20.2731 14.8346 20.0341 15.2842 19.6076 15.6318C19.1811 15.9793 18.6925 16.1226 18.1568 16.1882C17.6518 16.25 17.0278 16.25 16.2862 16.25L10.8804 16.25C9.53464 16.25 8.44479 16.25 7.58656 16.1283C6.69032 16.0012 5.93752 15.7285 5.34366 15.1022C4.79742 14.526 4.50529 13.9144 4.35897 13.0601C4.22191 12.2598 4.20828 11.2125 4.20828 9.75996V7.03832C4.20828 6.29837 4.20726 5.80316 4.16611 5.42295C4.12678 5.0596 4.05708 4.87818 3.96682 4.74609C3.87876 4.61723 3.74509 4.4968 3.44186 4.34802C3.11902 4.18961 2.68026 4.03406 2.01266 3.79934L1.75145 3.7075C1.36068 3.57012 1.15527 3.14197 1.29266 2.7512ZM5.70828 6.86996L5.70828 9.75996C5.70828 11.249 5.72628 12.1578 5.83744 12.8068C5.93933 13.4018 6.11202 13.7324 6.43219 14.0701C6.70473 14.3576 7.08235 14.5418 7.79716 14.6432C8.53783 14.7482 9.5209 14.75 10.9377 14.75H16.2406C17.0399 14.75 17.5714 14.7487 17.9746 14.6993C18.3573 14.6525 18.5348 14.571 18.66 14.469C18.7853 14.3669 18.9009 14.2095 19.024 13.8441C19.1537 13.4592 19.2623 12.9389 19.4237 12.156L19.9225 9.73591L19.9229 9.73369C20.1005 8.84376 20.217 8.2515 20.2444 7.80793C20.2704 7.38648 20.2043 7.23927 20.1429 7.15786C20.1367 7.15259 20.0931 7.11565 19.9661 7.07101C19.8107 7.01639 19.5895 6.97049 19.2939 6.93745C18.6991 6.87096 17.9454 6.86996 17.089 6.86996H5.70828Z"
                        fill="#3c50e0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.2502 19.5C5.2502 20.7426 6.25756 21.75 7.5002 21.75C8.74285 21.75 9.7502 20.7426 9.7502 19.5C9.7502 18.2573 8.74285 17.25 7.5002 17.25C6.25756 17.25 5.2502 18.2573 5.2502 19.5ZM7.5002 20.25C7.08599 20.25 6.7502 19.9142 6.7502 19.5C6.7502 19.0857 7.08599 18.75 7.5002 18.75C7.91442 18.75 8.2502 19.0857 8.2502 19.5C8.2502 19.9142 7.91442 20.25 7.5002 20.25Z"
                        fill="#3c50e0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.25 19.5001C14.25 20.7427 15.2574 21.7501 16.5 21.7501C17.7426 21.7501 18.75 20.7427 18.75 19.5001C18.75 18.2574 17.7426 17.2501 16.5 17.2501C15.2574 17.2501 14.25 18.2574 14.25 19.5001ZM16.5 20.2501C16.0858 20.2501 15.75 19.9143 15.75 19.5001C15.75 19.0859 16.0858 18.7501 16.5 18.7501C16.9142 18.7501 17.25 19.0859 17.25 19.5001C17.25 19.9143 16.9142 20.2501 16.5 20.2501Z"
                        fill="#3c50e0"
                      />
                    </svg>
                    {isSignedIn && cartCount > 0 ? (
                      <span className="navbar-cart-badge">{cartCount}</span>
                    ) : null}
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
                <button
                  type="button"
                  className="navbar-craft-button"
                  onClick={() => setIsCraftOpen((prev) => !prev)}
                >
                  <span>Craft Material</span>
                  <span className={`navbar-arrow ${isCraftOpen ? "open" : ""}`}>
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {isCraftOpen && (
                  <div className="navbar-craft-menu">
                    {visibleCraftItems.map((item, index) => (
                      <button
                        key={`${item.title}-${index}`}
                        type="button"
                        className="navbar-craft-item"
                        onClick={() => handleNavigateItem(item)}
                      >
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
                      <path
                        d="M17.2687 15.6656L12.6281 11.8969C14.5406 9.28123 14.3437 5.5406 11.9531 3.1781C10.6875 1.91248 8.99995 1.20935 7.19995 1.20935C5.39995 1.20935 3.71245 1.91248 2.44683 3.1781C-0.168799 5.79373 -0.168799 10.0687 2.44683 12.6844C3.71245 13.95 5.39995 14.6531 7.19995 14.6531C8.91558 14.6531 10.5187 14.0062 11.7843 12.8531L16.4812 16.65C16.5937 16.7344 16.7343 16.7906 16.875 16.7906C17.0718 16.7906 17.2406 16.7062 17.3531 16.5656C17.5781 16.2844 17.55 15.8906 17.2687 15.6656ZM7.19995 13.3875C5.73745 13.3875 4.38745 12.825 3.34683 11.7844C1.20933 9.64685 1.20933 6.18748 3.34683 4.0781C4.38745 3.03748 5.73745 2.47498 7.19995 2.47498C8.66245 2.47498 10.0125 3.03748 11.0531 4.0781C13.1906 6.2156 13.1906 9.67498 11.0531 11.7844C10.0406 12.825 8.66245 13.3875 7.19995 13.3875Z"
                        fill="currentColor"
                      />
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