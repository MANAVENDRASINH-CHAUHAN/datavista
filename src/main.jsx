import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider";
import { WorkspaceSettingsProvider } from "./context/WorkspaceSettingsProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceSettingsProvider>
          <App />
        </WorkspaceSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
