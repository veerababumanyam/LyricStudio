
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Studio from "./components/Studio";
import { AboutPage } from "./components/AboutPage";
import { LandingPage } from "./components/LandingPage";
import { StudioProvider } from "./contexts/StudioContext";
import "./global.css";

/**
 * swarasutra - Entry Point
 * Orchestrates the primary React mount.
 */

const App = () => {
  return (
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          {/* Landing Page (SEO Root) */}
          <Route path="/" element={
            <ErrorBoundary scope="Root: Landing">
              <LandingPage />
            </ErrorBoundary>
          } />

          {/* About Page Route */}
          <Route path="/about" element={
            <ErrorBoundary scope="Root: About">
              <AboutPage />
            </ErrorBoundary>
          } />

          {/* Studio Environment */}
          <Route path="/studio" element={
            <ErrorBoundary scope="Root: Studio">
              <Studio />
            </ErrorBoundary>
          } />



          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  );
};

const startApp = () => {
  console.log("%c swarasutra AI %c Initializing Orchestrator... ", "background: #2563EB; color: white; font-weight: bold;", "color: #06B6D4;");

  const container = document.getElementById("root");
  if (!container) {
    console.error("swarasutra: Fatal Boot Error - DOM target '#root' not found.");
    return;
  }

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("%c swarasutra AI %c Systems Online. ", "background: #2563EB; color: white; font-weight: bold;", "color: #4ade80;");
  } catch (error) {
    console.error("swarasutra: Initialization Failed:", error);
    // Security: Do not expose stack traces in the DOM in production
    const isDev = process.env.NODE_ENV === 'development';
    container.innerHTML = `
      <div style="color: #ff4444; padding: 40px; text-align: center; font-family: sans-serif; background: #020617; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="color: #2563EB;">swarasutra OS Error</h1>
        <p style="color: #94A3B8;">Critical System Fault. The application could not be loaded securely.</p>
        ${isDev ? `<pre style="text-align: left; background: #0F172A; padding: 20px; border-radius: 12px; font-size: 12px; margin-top: 20px; border: 1px solid #1E293B;">${error instanceof Error ? error.stack : 'Unknown error'}</pre>` : ''}
        <button onclick="window.location.reload()" style="margin-top: 24px; padding: 12px 24px; background: #2563EB; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">System Reboot</button>
      </div>
    `;
  }
};

// Start the boot sequence
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Unregister any existing service workers to avoid stale cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let unregisterPromises = [];
    for (const registration of registrations) {
      console.log('Force unregistering service worker:', registration);
      unregisterPromises.push(registration.unregister());
    }

    Promise.all(unregisterPromises).then(() => {
      if (navigator.serviceWorker.controller) {
        console.log('Page is still controlled by a Service Worker. Reloading to clear...');
        if (!sessionStorage.getItem('sw_cleanup_reload')) {
          sessionStorage.setItem('sw_cleanup_reload', 'true');
          window.location.reload();
        } else {
          console.warn('Service Worker cleanup reload loop detected. Please manually hard refresh (Cmd+Shift+R).');
          sessionStorage.removeItem('sw_cleanup_reload');
        }
      }
    });
  });
}