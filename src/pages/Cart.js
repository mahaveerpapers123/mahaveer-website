import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Cart.css";
import Footer from "./Footer";

function Cart({ mode = "page", isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState({
    open: false,
    index: null,
    name: ""
  });

  const isDrawer = mode === "drawer";
  const isSignedIn = Boolean(user?.name);

  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem("cartItems");
        const parsed = stored ? JSON.parse(stored) : [];
        setCartItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCartItems([]);
      }
    };

    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser || null);
      } catch {
        setUser(null);
      }
    };

    loadCart();
    loadUser();
    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

  useEffect(() => {
    if (isDrawer) {
      document.body.style.overflow = isOpen ? "hidden" : "";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isDrawer, isOpen]);

  useEffect(() => {
    if (confirmRemove.open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [confirmRemove.open]);

  const updateCartItems = (nextItems) => {
    localStorage.setItem("cartItems", JSON.stringify(nextItems));
    setCartItems(nextItems);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const openRemovePopup = (index) => {
    const item = cartItems[index];
    setConfirmRemove({
      open: true,
      index,
      name: item?.name || item?.product_name || "this product"
    });
  };

  const closeRemovePopup = () => {
    setConfirmRemove({
      open: false,
      index: null,
      name: ""
    });
  };

  const confirmRemoveItem = () => {
    if (confirmRemove.index === null) return;
    const next = cartItems.filter((_, i) => i !== confirmRemove.index);
    updateCartItems(next);
    closeRemovePopup();
  };

  const handleIncrease = (index) => {
    const next = cartItems.map((item, i) =>
      i === index ? { ...item, quantity: (item.quantity || 1) + 1 } : item
    );
    updateCartItems(next);
  };

  const handleDecrease = (index) => {
    const target = cartItems[index];
    const quantity = target?.quantity || 1;

    if (quantity <= 1) {
      openRemovePopup(index);
      return;
    }

    const next = cartItems.map((item, i) =>
      i === index ? { ...item, quantity: quantity - 1 } : item
    );
    updateCartItems(next);
  };

  const handleRemove = (index) => {
    openRemovePopup(index);
  };

  const handleClear = () => {
    if (cartItems.length === 0) return;
    setConfirmRemove({
      open: true,
      index: -1,
      name: "all products"
    });
  };

  const confirmRemoveAll = () => {
    updateCartItems([]);
    closeRemovePopup();
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + Number(item.price || item.mahaveer_price || 0) * (item.quantity || 1),
      0
    );
  }, [cartItems]);

  const itemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  const shipping = cartItems.length > 0 ? 0 : 0;
  const total = subtotal + shipping;

  const handleProceed = () => {
    if (isDrawer) {
      onClose();
    }
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    if (isDrawer) {
      onClose();
    }
    navigate("/");
  };

  const renderEmpty = () => (
    <div className="cart-empty">
      <div className="cart-empty-icon">🛒</div>
      <h3>Your cart is empty</h3>
      <p>Add products to continue shopping.</p>
      <button type="button" className="cart-primary-btn" onClick={handleContinueShopping}>
        Start Shopping
      </button>
    </div>
  );

  const renderGuest = () => (
    <div className="cart-guest">
      <div className="cart-guest-badge">Sign in required</div>
      <h3>Sign in to continue</h3>
      <p>Login or create an account to view your cart and prices.</p>
      <div className="cart-guest-actions">
        <Link to="/signin" className="cart-primary-link" onClick={onClose}>
          Sign In
        </Link>
        <Link to="/signup" className="cart-secondary-link" onClick={onClose}>
          Create Account
        </Link>
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="cart-layout">
      <div className="cart-items-panel">
        <div className="cart-panel-head">
          <div>
            <span className="cart-panel-kicker">Shopping Bag</span>
            <h2>{itemCount} Item{itemCount !== 1 ? "s" : ""}</h2>
          </div>
          {cartItems.length > 0 ? (
            <button type="button" className="cart-clear-btn" onClick={handleClear}>
              Clear Cart
            </button>
          ) : null}
        </div>

        <div className="cart-item-list">
          {cartItems.map((item, index) => {
            const price = Number(item.price || item.mahaveer_price || 0);
            const quantity = item.quantity || 1;
            const lineTotal = price * quantity;
            const image =
              item.image ||
              item.image_url ||
              (Array.isArray(item.images) ? item.images[0] : "") ||
              "/images/placeholder.png";

            return (
              <div className="cart-item-row" key={`${item.id || item.name}-${index}`}>
                <div className="cart-item-image-wrap">
                  <img src={image} alt={item.name || "Product"} className="cart-item-image" />
                </div>

                <div className="cart-item-content">
                  <div className="cart-item-top">
                    <div className="cart-item-text">
                      <h3>{item.name || item.product_name || "Product"}</h3>
                      <p>{item.brand || item.category_slug || "Mahaveer Selection"}</p>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => handleRemove(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-item-bottom">
                    <div className="cart-qty-box">
                      <button type="button" onClick={() => handleDecrease(index)}>
                        −
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => handleIncrease(index)}>
                        +
                      </button>
                    </div>

                    <div className="cart-price-box">
                      <span>₹{price.toFixed(2)}</span>
                      <strong>₹{lineTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cart-summary-panel">
        <div className="cart-summary-box">
          <span className="cart-panel-kicker">Summary</span>
          <h3>Order Details</h3>

          <div className="cart-summary-row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>

          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="cart-summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
          </div>

          <div className="cart-summary-total">
            <span>Total</span>
            <strong>₹{total.toFixed(2)}</strong>
          </div>

          <button type="button" className="cart-primary-btn" onClick={handleProceed}>
            Proceed to Checkout
          </button>

          <button type="button" className="cart-secondary-btn" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );

  const renderConfirmPopup = () => {
    if (!confirmRemove.open) return null;

    const isClearAll = confirmRemove.index === -1;

    return (
      <div className="cart-confirm-overlay" onClick={closeRemovePopup}>
        <div className="cart-confirm-popup" onClick={(e) => e.stopPropagation()}>
          <h4>{isClearAll ? "Clear cart?" : "Remove product?"}</h4>
          <p>
            {isClearAll
              ? "Are you sure you want to remove all products from the cart?"
              : `Are you sure you want to remove ${confirmRemove.name} from the cart?`}
          </p>
          <div className="cart-confirm-actions">
            <button type="button" className="cart-secondary-btn popup-btn" onClick={closeRemovePopup}>
              No
            </button>
            <button
              type="button"
              className="cart-primary-btn popup-btn"
              onClick={isClearAll ? confirmRemoveAll : confirmRemoveItem}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isDrawer) {
    return (
      <>
        <div className={`cart-drawer-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
        <aside className={`cart-drawer ${isOpen ? "open" : ""}`}>
          <div className="cart-drawer-head">
            <div>
              <span className="cart-panel-kicker">Quick Cart</span>
              <h2>Your Bag</h2>
            </div>
            <button type="button" className="cart-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="cart-drawer-body">
            {!isSignedIn
              ? renderGuest()
              : cartItems.length === 0
              ? renderEmpty()
              : renderItems()}
          </div>
        </aside>
        {renderConfirmPopup()}
      </>
    );
  }

  return (
    <div className="cart-page">
      <Navbar />
      <main className="cart-page-main">
        <div className="cart-page-shell">
          <div className="cart-breadcrumb-row">
            <h1>Cart</h1>
            <div className="cart-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <span>Cart</span>
            </div>
          </div>

          {!isSignedIn
            ? renderGuest()
            : cartItems.length === 0
            ? renderEmpty()
            : renderItems()}
        </div>
      </main>
      {renderConfirmPopup()}
    </div>
    
  );
  <Footer />
}

export default Cart;