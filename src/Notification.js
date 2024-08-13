// Notification.js
import React from "react";

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-md shadow-lg text-white ${
        type === "error" ? "bg-red-500" : "bg-green-500"
      }`}
    >
      <span>{message}</span>
      <button className="ml-4 text-xl font-bold" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Notification;
