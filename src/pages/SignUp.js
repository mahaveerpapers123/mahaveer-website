import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup, signOut } from "firebase/auth";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./SignUp.css";
import { auth, googleProvider } from "../firebase";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

function SignUp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("customer");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

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

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        setLoggedInUser(storedUser);
      } catch {
        setLoggedInUser(null);
      }
    };

    loadUser();
    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

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

      const data = await parseResponse(response);

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
          userType: "b2c",
          authProvider: "local",
          profileImage: null
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

      const data = await parseResponse(response);

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
          userType: "b2b",
          authProvider: "local",
          profileImage: null
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

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setMessage("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        setMessage(data.error || "Google sign-up failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.userId,
          name: data.name,
          email: data.email,
          userType: data.userType || "b2c",
          authProvider: data.authProvider || "google",
          profileImage: data.profileImage || null
        })
      );

      window.dispatchEvent(new Event("userUpdated"));
      setMessage("Account created successfully");
      navigate("/");
    } catch (error) {
      setMessage(error?.message || "Google sign-up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setMessage("");

    try {
      await signOut(auth);
    } catch {}

    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));
    setLoggedInUser(null);
    navigate("/signup");
    setMessage("Logged out successfully");
    setLogoutLoading(false);
  };

  const isLoggedIn = Boolean(loggedInUser);

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

              {isLoggedIn ? (
                <div className="signup-loggedin-wrap">
                  {message && (
                    <div
                      className={`signup-message ${
                        message === "Logged out successfully" ? "success" : "error"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <div className="signup-loggedin-badge">You are already signed in</div>
                  <h2 className="signup-loggedin-title">
                    Hello, {loggedInUser?.name || "User"}
                  </h2>
                  <p className="signup-loggedin-text">
                    You are currently logged in with {loggedInUser?.email || "your account"}.
                  </p>

                  <div className="signup-loggedin-actions">
                    <button
                      type="button"
                      className="signup-submit-btn"
                      onClick={() => navigate("/")}
                    >
                      Go to Home
                    </button>
                    <button
                      type="button"
                      className="signup-logout-btn"
                      onClick={handleLogout}
                      disabled={logoutLoading}
                    >
                      {logoutLoading ? "Logging Out..." : "Logout"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                    <>
                      <button
                        type="button"
                        className="google-auth-btn"
                        onClick={handleGoogleSignup}
                        disabled={googleLoading}
                      >
                        <span className="google-auth-icon">
                          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                            <path
                              fill="#EA4335"
                              d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.3-.2-1.9H12z"
                            />
                            <path
                              fill="#34A853"
                              d="M3.2 7.3l3.2 2.4C7.2 7.8 9.4 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 8.2 2 4.9 4.1 3.2 7.3z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1-4 0-5.2-2.6-5.5-3.9l-3.2 2.5C4.9 19.9 8.2 22 12 22z"
                            />
                            <path
                              fill="#4285F4"
                              d="M21.6 12.1c0-.7-.1-1.3-.2-1.9H12v3.9h5.5c-.3 1.4-1.1 2.5-2.1 3.1l3 2.4c1.7-1.6 3.2-4 3.2-7.5z"
                            />
                          </svg>
                        </span>
                        <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
                      </button>

                      <div className="signup-divider">
                        <span>or</span>
                      </div>

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
                    </>
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
                </>
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