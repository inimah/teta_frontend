// import React from "react";
import ReactDOM from "react-dom/client";

import "./App.css";
import App from "./App.tsx";
import { AuthContextProvider } from "./context/AuthContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode>
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
    // {/* </React.StrictMode> */}
  );
} else {
  console.error(
    "Root element not found. Check if 'root' exists in index.html."
  );
}
