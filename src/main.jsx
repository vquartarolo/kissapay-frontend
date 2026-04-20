import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import MasterApp from "./pages/master/MasterApp";

const isMaster = window.location.pathname.startsWith("/master");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isMaster ? (
      <MasterApp />
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>
);