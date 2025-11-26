import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load the heavy Studio component
const Studio = React.lazy(() => import("./components/Studio").then(module => ({ default: module.Studio })));

// --- Root App with Router ---
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
            <ErrorBoundary scope="Landing Page">
                <div className="flex flex-col min-h-screen">
                   <Header />
                   <LandingPage />
                </div>
            </ErrorBoundary>
        } />
        <Route path="/studio" element={
            <ErrorBoundary scope="Studio App">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-screen w-full bg-background text-foreground">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-muted-foreground">Loading Studio...</p>
                     </div>
                  </div>
                }>
                    <Studio />
                </Suspense>
            </ErrorBoundary>
        } />
      </Routes>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);