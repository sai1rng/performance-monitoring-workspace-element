import React from "react";
import styles from "./UserStatusIndicator.module.css";

interface UserStatusIndicatorProps {
  isOnline: boolean;
  size?: "small" | "medium" | "large";
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  isOnline,
  size = "medium",
}) => {
  const sizeMap = {
    small: 8,
    medium: 10,
    large: 12,
  };

  const dotSize = sizeMap[size];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          display: "inline-block",
          boxShadow: isOnline ? "0 0 0 2px rgba(76, 175, 80, 0.2)" : "none",
        }}
        className={isOnline ? styles.statusIndicatorGreen : styles.statusIndicatorGray}
      />
      <span>{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
};

export default UserStatusIndicator;
