import React from "react";

const TetaIcon: React.FC<{ className?: string; alt?: string }> = ({ className, alt }) => {
  return (
    <img
      src="/Teta_girl.png"
      alt={alt || "TETA Chatbot Logo"}
      className={className || "w-40 h-25"}
    />
  );
};

export default TetaIcon;
