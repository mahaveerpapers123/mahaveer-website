import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./SignIn.css";
import Footer from "./Footer";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

function SignIn() {
  const navigate = useNavigate();

  const [customerForm, setCustomerForm] = useState({
    b2cEmail: "",
    b2cPassword: ""
  });

  const [businessForm, setBusinessForm] = useState({
    email: "",
    password: "",
    gstNumber: ""
  });

  const [customerLoading, setCustomerLoading] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [businessMessage, setBusinessMessage] = useState("");

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    return { error: text || "Something went wrong" };
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setCustomerLoading(true);
    setCustomerMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userType: "b2c",
          b2cEmail: customerForm.b2cEmail,
          b2cPassword: customerForm.b2cPassword
        })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        setCustomerMessage(data.error || "Login failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.userId,
          name: data.name,
          email: customerForm.b2cEmail,
          userType: "b2c"
        })
      );

      window.dispatchEvent(new Event("userUpdated"));
      setCustomerMessage("Login successful");
      navigate("/");
    } catch {
      setCustomerMessage("Something went wrong. Please try again.");
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleBusinessLogin = async (e) => {
    e.preventDefault();
    setBusinessLoading(true);
    setBusinessMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userType: "b2b",
          email: businessForm.email,
          password: businessForm.password,
          gstNumber: businessForm.gstNumber
        })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        setBusinessMessage(data.error || "Login failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.userId,
          name: data.name,
          email: businessForm.email,
          gstNumber: businessForm.gstNumber,
          userType: "b2b"
        })
      );

      window.dispatchEvent(new Event("userUpdated"));
      setBusinessMessage("Login successful");
      navigate("/");
    } catch {
      setBusinessMessage("Something went wrong. Please try again.");
    } finally {
      setBusinessLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="signin-page">
        <div className="signin-shell">
          <div className="signin-header">
            <span className="signin-kicker">Welcome Back</span>
            <h1 className="signin-title">Sign In to Your Account</h1>
            <p className="signin-subtitle">
              Access your customer or business account with secure sign in.
            </p>
          </div>

          <div className="signin-grid">
            <div className="signin-card">
              <div className="signin-card-top">
                <h2>Customer Sign In</h2>
                <p>Sign in with your email and password</p>
              </div>

              <form className="signin-form" onSubmit={handleCustomerLogin}>
                <div className="signin-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="b2cEmail"
                    placeholder="Enter your email address"
                    value={customerForm.b2cEmail}
                    onChange={handleCustomerChange}
                    required
                  />
                </div>

                <div className="signin-field">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="b2cPassword"
                    placeholder="Enter your password"
                    value={customerForm.b2cPassword}
                    onChange={handleCustomerChange}
                    required
                  />
                </div>

                <div className="signin-links-row">
                  <button type="button" className="signin-text-link">
                    Forgot Password?
                  </button>
                </div>

                {customerMessage && (
                  <div
                    className={`signin-message ${
                      customerMessage === "Login successful" ? "success" : "error"
                    }`}
                  >
                    {customerMessage}
                  </div>
                )}

                <button type="submit" className="signin-submit-btn" disabled={customerLoading}>
                  {customerLoading ? "Signing In..." : "Sign In"}
                </button>

                <p className="signin-bottom-text">
                  Don&apos;t have an account?
                  <Link to="/signup" className="signin-inline-link">
                    Sign Up Now
                  </Link>
                </p>
              </form>
            </div>

            <div className="signin-card">
              <div className="signin-card-top">
                <h2>Business Sign In</h2>
                <p>Use your business credentials and GST number</p>
              </div>

              <form className="signin-form" onSubmit={handleBusinessLogin}>
                <div className="signin-field">
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

                <div className="signin-field">
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

                <div className="signin-field">
                  <label>GST Number *</label>
                  <input
                    type="text"
                    name="gstNumber"
                    placeholder="15-character GSTIN"
                    value={businessForm.gstNumber}
                    onChange={handleBusinessChange}
                    required
                    maxLength={15}
                  />
                </div>

                <div className="signin-links-row">
                  <button type="button" className="signin-text-link">
                    Forgot Password?
                  </button>
                </div>

                {businessMessage && (
                  <div
                    className={`signin-message ${
                      businessMessage === "Login successful" ? "success" : "error"
                    }`}
                  >
                    {businessMessage}
                  </div>
                )}

                <button type="submit" className="signin-submit-btn" disabled={businessLoading}>
                  {businessLoading ? "Signing In..." : "Sign In"}
                </button>

                <p className="signin-bottom-text">
                  Don&apos;t have an account?
                  <Link to="/signup" className="signin-inline-link">
                    Sign Up Now
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignIn;