import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup, signOut } from "firebase/auth";
import Navbar from "./Navbar";
import "./SignIn.css";
import Footer from "./Footer";
import { auth, googleProvider } from "../firebase";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [businessMessage, setBusinessMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

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
          email: data.email || customerForm.b2cEmail,
          userType: data.userType || "b2c",
          authProvider: data.authProvider || "local",
          profileImage: data.profileImage || null
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
          email: data.email || businessForm.email,
          gstNumber: businessForm.gstNumber,
          userType: data.userType || "b2b",
          authProvider: data.authProvider || "local",
          profileImage: data.profileImage || null
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setCustomerMessage("");

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
        setCustomerMessage(data.error || "Google sign-in failed");
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
      setCustomerMessage("Login successful");
      navigate("/");
    } catch (error) {
      setCustomerMessage(error?.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setCustomerMessage("");
    setBusinessMessage("");

    try {
      await signOut(auth);
    } catch {}

    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));
    setLoggedInUser(null);
    navigate("/signin");
    setCustomerMessage("Logged out successfully");
    setBusinessMessage("Logged out successfully");
    setLogoutLoading(false);
  };

  const isLoggedIn = Boolean(loggedInUser);

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

          {isLoggedIn ? (
            <div className="signin-loggedin-card">
              <div className="signin-loggedin-badge">You are already signed in</div>
              <h2 className="signin-loggedin-title">
                Hello, {loggedInUser?.name || "User"}
              </h2>
              <p className="signin-loggedin-text">
                You are currently logged in with {loggedInUser?.email || "your account"}.
              </p>

              <div className="signin-loggedin-actions">
                <button
                  type="button"
                  className="signin-submit-btn"
                  onClick={() => navigate("/")}
                >
                  Go to Home
                </button>
                <button
                  type="button"
                  className="signin-logout-btn"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                >
                  {logoutLoading ? "Logging Out..." : "Logout"}
                </button>
              </div>
            </div>
          ) : (
            <div className="signin-grid">
              <div className="signin-card">
                <div className="signin-card-top">
                  <h2>Customer Sign In</h2>
                  <p>Sign in with your email and password</p>
                </div>

                <button
                  type="button"
                  className="google-auth-btn"
                  onClick={handleGoogleLogin}
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

                <div className="signin-divider">
                  <span>or</span>
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
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SignIn;