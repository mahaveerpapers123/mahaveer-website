import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./SignUp.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

function SignUp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("customer");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [businessForm, setBusinessForm] = useState({
    name: "",
    email: "",
    gstNumber: "",
    password: "",
    confirmPassword: ""
  });

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    if (customerForm.password !== customerForm.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: customerForm.name,
          email: customerForm.email,
          password: customerForm.password,
          userType: "b2c"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Signup failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: customerForm.name,
          email: customerForm.email,
          userType: "b2c"
        })
      );

      window.dispatchEvent(new Event("userUpdated"));
      setMessage("Account created successfully");
      navigate("/");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    if (businessForm.password !== businessForm.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: businessForm.name,
          email: businessForm.email,
          gstNumber: businessForm.gstNumber,
          password: businessForm.password,
          userType: "b2b"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Signup failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: businessForm.name,
          email: businessForm.email,
          gstNumber: businessForm.gstNumber,
          userType: "b2b"
        })
      );

      window.dispatchEvent(new Event("userUpdated"));
      setMessage("Account created successfully");
      navigate("/");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="signup-page">
        <div className="signup-shell">
          <div className="signup-card">
            <div className="signup-left">
              <span className="signup-kicker">Join Mahaveer</span>
              <h1>Create an Account</h1>
              <p>Enter your details below</p>

              <div className="signup-tabs">
                <button
                  type="button"
                  className={`signup-tab ${activeTab === "customer" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("customer");
                    setMessage("");
                  }}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={`signup-tab ${activeTab === "business" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("business");
                    setMessage("");
                  }}
                >
                  Business
                </button>
              </div>

              {message && (
                <div
                  className={`signup-message ${
                    message === "Account created successfully" ? "success" : "error"
                  }`}
                >
                  {message}
                </div>
              )}

              {activeTab === "customer" ? (
                <form className="signup-form" onSubmit={handleCustomerSignup}>
                  <div className="signup-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={customerForm.name}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={customerForm.email}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={customerForm.password}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>Re-type Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Re-type your password"
                      value={customerForm.confirmPassword}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>

                  <button type="submit" className="signup-submit-btn" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>

                  <p className="signup-bottom-text">
                    Already have an account?
                    <Link to="/signin" className="signup-inline-link">
                      Sign in Now
                    </Link>
                  </p>
                </form>
              ) : (
                <form className="signup-form" onSubmit={handleBusinessSignup}>
                  <div className="signup-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={businessForm.name}
                      onChange={handleBusinessChange}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={businessForm.email}
                      onChange={handleBusinessChange}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>GST Number *</label>
                    <input
                      type="text"
                      name="gstNumber"
                      placeholder="15-character GSTIN"
                      value={businessForm.gstNumber}
                      onChange={handleBusinessChange}
                      maxLength={15}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={businessForm.password}
                      onChange={handleBusinessChange}
                      required
                    />
                  </div>

                  <div className="signup-field">
                    <label>Re-type Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Re-type your password"
                      value={businessForm.confirmPassword}
                      onChange={handleBusinessChange}
                      required
                    />
                  </div>

                  <button type="submit" className="signup-submit-btn" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>

                  <p className="signup-bottom-text">
                    Already have an account?
                    <Link to="/signin" className="signup-inline-link">
                      Sign in Now
                    </Link>
                  </p>
                </form>
              )}
            </div>

            <div className="signup-right">
              <div className="signup-right-inner">
                <div className="signup-badge">Secure Access</div>
                <h2>Beautiful shopping starts with a simple account</h2>
                <p>
                  Create your account to manage orders, save your details, and enjoy a smoother
                  shopping experience across customer and business flows.
                </p>

                <div className="signup-feature-list">
                  <div className="signup-feature-item">
                    <span className="signup-feature-dot" />
                    <span>Clean and easy onboarding</span>
                  </div>
                  <div className="signup-feature-item">
                    <span className="signup-feature-dot" />
                    <span>Customer and business account support</span>
                  </div>
                  <div className="signup-feature-item">
                    <span className="signup-feature-dot" />
                    <span>Instant navbar update after login</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignUp;