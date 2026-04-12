import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Checkout.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India"
};

function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [cartItems, setCartItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
      const items = Array.isArray(storedCart) ? storedCart : [];
      setCartItems(items);

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userName = storedUser?.name || "";
      const userEmail = storedUser?.email || "";

      setForm((prev) => ({
        ...prev,
        name: userName || prev.name,
        email: userEmail || prev.email
      }));
    } catch {
      setCartItems([]);
    }
  }, []);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.mahaveer_price || item.price || item.mrp || 0);
      return sum + price * quantity;
    }, 0);
  }, [cartItems]);

  const shippingCharge = useMemo(() => {
    if (subtotal <= 0) return 0;
    return subtotal >= 1000 ? 0 : 75;
  }, [subtotal]);

  const total = subtotal + shippingCharge;

  const normalizedItems = useMemo(() => {
    return cartItems.map((item) => ({
      id: item.id || item.product_id || null,
      product_id: item.id || item.product_id || null,
      product_name: item.name || item.product_name || "Item",
      name: item.name || item.product_name || "Item",
      quantity: Math.max(1, Number(item.quantity || 1)),
      image:
        item.image ||
        item.image_url ||
        (Array.isArray(item.images) ? item.images[0] : null) ||
        null,
      image_url:
        item.image ||
        item.image_url ||
        (Array.isArray(item.images) ? item.images[0] : null) ||
        null,
      mahaveer_price: Number(item.mahaveer_price || item.price || 0),
      mrp: Number(item.mrp || 0),
      hsn_percentage: Number(item.hsn_percentage || 0),
      width: item.width ?? null,
      height: item.height ?? null,
      length: item.length ?? null,
      weight: item.weight ?? null
    }));
  }, [cartItems]);

  const handleChange = (field, value) => {
    let nextValue = value;

    if (field === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (field === "postal_code") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [field]: nextValue
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      form.name,
      form.email,
      form.phone,
      form.line1,
      form.city,
      form.state,
      form.postal_code,
      form.country
    ];

    if (normalizedItems.length === 0) {
      return "Your cart is empty.";
    }

    if (requiredFields.some((value) => !String(value || "").trim())) {
      return "Please fill all required delivery details.";
    }

    if (!/^\d{10}$/.test(form.phone)) {
      return "Mobile number must be exactly 10 digits.";
    }

    if (!/^\d{6}$/.test(form.postal_code)) {
      return "Postal code must be exactly 6 digits.";
    }

    return "";
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validation = validateForm();
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setSubmitting(true);

    const payload = {
      billing: {
        name: form.name,
        email: form.email,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        country: form.country,
        phone: form.phone
      },
      shipping: {
        name: form.name,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        country: form.country,
        phone: form.phone
      },
      payment: {
        method: "COD"
      },
      items: normalizedItems,
      total
    };

    try {
      let response = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        response = await fetch(`${API_BASE}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to place order");
      }

      localStorage.removeItem("cartItems");
      window.dispatchEvent(new Event("cartUpdated"));
      setSuccessMessage("Your order has been placed successfully.");
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      setErrorMessage(error?.message || "Something went wrong while placing the order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />

      <main className="checkout-main">
        <div className="checkout-shell">
          <div className="checkout-hero">
            <div className="checkout-hero-content">
              <span className="checkout-kicker">Order Details</span>
              <h1>Checkout</h1>
              <p>Complete your delivery details and confirm your order in one simple step.</p>
            </div>

            <div className="checkout-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <Link to="/cart">Cart</Link>
              <span>/</span>
              <span>Checkout</span>
            </div>
          </div>

          <form className="checkout-layout" onSubmit={handlePlaceOrder}>
            <section className="checkout-forms">
              <div className="checkout-card checkout-form-card">
                <div className="checkout-card-head">
                  <div>
                    <span className="checkout-card-kicker">Delivery</span>
                    <h2>Contact and Address</h2>
                  </div>
                  <div className="checkout-card-badge">Cash on Delivery</div>
                </div>

                <div className="checkout-grid">
                  <div className="checkout-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="checkout-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="checkout-field checkout-field-wide">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Enter 10 digit mobile number"
                    />
                  </div>

                  <div className="checkout-field checkout-field-wide">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      value={form.line1}
                      onChange={(e) => handleChange("line1", e.target.value)}
                      placeholder="House no, street name"
                    />
                  </div>

                  <div className="checkout-field checkout-field-wide">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={form.line2}
                      onChange={(e) => handleChange("line2", e.target.value)}
                      placeholder="Apartment, landmark, area"
                    />
                  </div>

                  <div className="checkout-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="checkout-field">
                    <label>State</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="checkout-field">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={form.postal_code}
                      onChange={(e) => handleChange("postal_code", e.target.value)}
                      placeholder="Enter 6 digit postal code"
                    />
                  </div>

                  <div className="checkout-field">
                    <label>Country</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>

              <div className="checkout-card checkout-payment-card">
                <div className="checkout-card-head">
                  <div>
                    <span className="checkout-card-kicker">Payment</span>
                    <h2>Payment Method</h2>
                  </div>
                </div>

                <div className="checkout-payment-option">
                  <div className="checkout-payment-icon">₹</div>
                  <div className="checkout-payment-content">
                    <h3>Cash on Delivery</h3>
                    <p>Pay safely when your order arrives at your address.</p>
                  </div>
                  <div className="checkout-payment-status">Selected</div>
                </div>
              </div>

              {errorMessage ? <div className="checkout-alert error">{errorMessage}</div> : null}
              {successMessage ? <div className="checkout-alert success">{successMessage}</div> : null}
            </section>

            <aside className="checkout-summary">
              <div className="checkout-card checkout-summary-card">
                <div className="checkout-card-head">
                  <div>
                    <span className="checkout-card-kicker">Summary</span>
                    <h2>Order Summary</h2>
                  </div>
                </div>

                <div className="checkout-items">
                  {normalizedItems.length === 0 ? (
                    <div className="checkout-empty">
                      <p>Your cart is empty.</p>
                      <Link to="/cart" className="checkout-back-link">
                        Go to Cart
                      </Link>
                    </div>
                  ) : (
                    normalizedItems.map((item, index) => {
                      const image =
                        item.image_url ||
                        item.image ||
                        "/images/placeholder.png";

                      return (
                        <div className="checkout-item" key={`${item.product_id || item.name}-${index}`}>
                          <div className="checkout-item-image-wrap">
                            <img src={image} alt={item.product_name} className="checkout-item-image" />
                          </div>

                          <div className="checkout-item-content">
                            <h3>{item.product_name}</h3>
                            <p>Qty: {item.quantity}</p>
                            <strong>
                              ₹{(Number(item.mahaveer_price || 0) * Number(item.quantity || 1)).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="checkout-totals">
                  <div className="checkout-total-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="checkout-total-row">
                    <span>Shipping</span>
                    <span>{shippingCharge === 0 ? "Free" : `₹${shippingCharge.toFixed(2)}`}</span>
                  </div>

                  <div className="checkout-total-row grand">
                    <span>Total</span>
                    <strong>₹{total.toFixed(2)}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="checkout-place-order-btn"
                  disabled={submitting || normalizedItems.length === 0}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>

                <Link to="/cart" className="checkout-back-link secondary">
                  Back to Cart
                </Link>
              </div>
            </aside>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Checkout;