import React from "react";
import "./Divider.css";

function Divider({ className = "" }) {
  return (
    <div className={`section-divider ${className}`.trim()}>
      <span className="section-divider-line" />
    </div>
  );
}

export default Divider;