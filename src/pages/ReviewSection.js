import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./ReviewSection.css";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://mahaveerpapersbe.vercel.app";

const fallbackReviews = [
  {
    id: 1,
    name: "Rahul Kumar",
    role: "Customer",
    image: "/images/user/user-01.png",
    rating: 5,
    title: "Great quality products",
    body: "The product quality is really good and the delivery was smooth. I loved the overall experience."
  },
  {
    id: 2,
    name: "Sneha Reddy",
    role: "Customer",
    image: "/images/user/user-02.png",
    rating: 4,
    title: "Very reliable service",
    body: "I found exactly what I needed. The platform is clean and easy to use. Will definitely order again."
  },
  {
    id: 3,
    name: "Vikram Sharma",
    role: "Business Buyer",
    image: "/images/user/user-03.png",
    rating: 5,
    title: "Perfect for bulk purchase",
    body: "As a business buyer, I really liked the pricing and smooth experience. Products arrived in excellent condition."
  }
];

const getSession = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return { loggedIn: false, name: "", email: "" };
    const user = JSON.parse(raw);
    return {
      loggedIn: Boolean(user?.name || user?.email || user?.id),
      name: user?.name || "",
      email: user?.email || ""
    };
  } catch {
    return { loggedIn: false, name: "", email: "" };
  }
};

function Portal({ children }) {
  const [mounted, setMounted] = React.useState(false);
  const portalRef = React.useRef(null);

  if (!portalRef.current && typeof document !== "undefined") {
    const div = document.createElement("div");
    div.id = "review-section-portal";
    portalRef.current = div;
  }

  useEffect(() => {
    if (!portalRef.current || typeof document === "undefined") return;
    document.body.appendChild(portalRef.current);
    setMounted(true);
    return () => {
      if (portalRef.current && document.body.contains(portalRef.current)) {
        document.body.removeChild(portalRef.current);
      }
    };
  }, []);

  if (!mounted || !portalRef.current) return null;
  return createPortal(children, portalRef.current);
}

function ReviewCard({ item }) {
  const stars = Math.max(0, Math.min(5, Number(item.rating || 5)));

  return (
    <div className="review-section-card">
      <div className="review-section-card-top">
        <div className="review-section-user">
          <div className="review-section-avatar-wrap">
            <img
              src={item.image || "/images/user/user-01.png"}
              alt={item.name || "User"}
              className="review-section-avatar"
            />
          </div>
          <div className="review-section-user-text">
            <h4>{item.name || "User"}</h4>
            <p>{item.role || "Customer"}</p>
          </div>
        </div>

        <div className="review-section-stars">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} className={index < stars ? "filled" : ""}>
              ★
            </span>
          ))}
        </div>
      </div>

      <h3>{item.title || "Wonderful experience"}</h3>
      <p className="review-section-body">{item.body || ""}</p>
    </div>
  );
}

function ReviewSection({ productId }) {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState(fallbackReviews.slice(0, 3));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  const validProductId = useMemo(() => {
    if (!productId) return null;
    return String(productId);
  }, [productId]);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 900) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1200) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  useEffect(() => {
    const session = getSession();
    setName(session.name || "");
    setEmail(session.email || "");
  }, []);

  useEffect(() => {
    const loadReviews = async () => {
      if (!validProductId) return;
      try {
        const response = await fetch(`${API_BASE}/api/reviews?product_id=${validProductId}`);
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        if (items.length > 0) {
          setReviews(
            items.slice(0, 3).map((item, index) => ({
              id: item.id || index,
              name: item.user_name || "User",
              role: "Customer",
              image: item.images?.[0] || "/images/user/user-01.png",
              rating: item.rating || 5,
              title: item.title || "Customer Review",
              body: item.body || ""
            }))
          );
        }
      } catch {}
    };

    loadReviews();
  }, [validProductId]);

  useEffect(() => {
    if (!isModalOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  useEffect(() => {
    const maxIndex = Math.max(0, reviews.length - cardsPerView);
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [cardsPerView, reviews.length, currentIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    const maxIndex = Math.max(0, reviews.length - cardsPerView);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [reviews.length, cardsPerView]);

  const handleOpenReview = () => {
    const session = getSession();
    if (!session.loggedIn) {
      navigate("/signin");
      return;
    }
    setName(session.name || "");
    setEmail(session.email || "");
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setRating(0);
    setHover(0);
    setTitle("");
    setFeedback("");
  };

  const handleSubmit = async () => {
    const session = getSession();
    if (!session.loggedIn || rating === 0 || !feedback.trim()) return;

    if (!validProductId) {
      const nextReview = {
        id: Date.now(),
        name: name || session.name || "User",
        role: "Customer",
        image: "/images/user/user-01.png",
        rating,
        title: title || "Customer Review",
        body: feedback
      };
      setReviews((prev) => [nextReview, ...prev].slice(0, 3));
      setCurrentIndex(0);
      handleClose();
      return;
    }

    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: validProductId,
          user_name: name || session.name || "User",
          user_email: email || session.email || "",
          rating,
          title: title.trim() || null,
          body: feedback.trim(),
          images: null
        })
      });

      const nextReview = {
        id: Date.now(),
        name: name || session.name || "User",
        role: "Customer",
        image: "/images/user/user-01.png",
        rating,
        title: title || "Customer Review",
        body: feedback
      };
      setReviews((prev) => [nextReview, ...prev].slice(0, 3));
      setCurrentIndex(0);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const cardWidth = 100 / cardsPerView;

  return (
    <>
      <Portal>
        {isModalOpen ? (
          <div className="review-section-modal-overlay">
            <div className="review-section-modal-backdrop" onClick={handleClose} />
            <div className="review-section-modal">
              <button
                type="button"
                className="review-section-modal-close"
                onClick={handleClose}
              >
                ×
              </button>

              <h3>Share your review</h3>

              <div className="review-section-rating-row">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = hover >= star || rating >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="review-section-star-btn"
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <span className={filled ? "filled" : ""}>★</span>
                    </button>
                  );
                })}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="review-section-input"
              />

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your feedback..."
                className="review-section-textarea"
              />

              <div className="review-section-form-grid">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="review-section-input"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="review-section-input"
                />
              </div>

              <div className="review-section-modal-actions">
                <button
                  type="button"
                  className="review-section-cancel-btn"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="review-section-submit-btn"
                  onClick={handleSubmit}
                  disabled={rating === 0 || !feedback.trim() || submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Portal>

      <section className="review-section">
        <div className="review-section-container">
          <div className="review-section-header">
            <div>
              <span className="review-section-kicker">Best Reviews</span>
              <h2>User Feedbacks</h2>
            </div>

            <div className="review-section-controls">
              <button
                type="button"
                className="review-section-write-btn"
                onClick={handleOpenReview}
              >
                Write a review
              </button>

              <button type="button" className="review-section-nav-btn" onClick={handlePrev}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.4881 4.43057C15.8026 4.70014 15.839 5.17361 15.5694 5.48811L9.98781 12L15.5694 18.5119C15.839 18.8264 15.8026 19.2999 15.4881 19.5695C15.1736 19.839 14.7001 19.8026 14.4306 19.4881L8.43056 12.4881C8.18981 12.2072 8.18981 11.7928 8.43056 11.5119L14.4306 4.51192C14.7001 4.19743 15.1736 4.161 15.4881 4.43057Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <button type="button" className="review-section-nav-btn" onClick={handleNext}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="review-section-carousel">
            <div
              className="review-section-track"
              style={{
                width: `${(reviews.length * 100) / cardsPerView}%`,
                transform: `translateX(-${currentIndex * cardWidth}%)`
              }}
            >
              {reviews.map((item, index) => (
                <div
                  key={item.id || index}
                  className="review-section-slide"
                  style={{ width: `${cardWidth}%` }}
                >
                  <ReviewCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ReviewSection;