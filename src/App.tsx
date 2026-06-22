import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";

// Route-level lazy loading for bundle optimization
const Home = lazy(() => import("./pages/Home"));
const ChatInterface = lazy(() => import("./pages/ChatInterface"));
const Build = lazy(() => import("./pages/Build"));
const SharedProjectPage = lazy(() => import("./pages/SharedProjectPage"));

const LoadingFallback: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-studio-bg text-studio-text gap-4 select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-studio-accent/20 border-t-studio-accent rounded-full animate-spin" />
        <div className="absolute w-8 h-8 border border-studio-secondary/10 border-t-studio-secondary rounded-full animate-spin animate-reverse" style={{ animationDuration: "1.5s" }} />
      </div>
      <span className="text-[10px] font-bold tracking-[0.25em] text-studio-muted animate-pulse uppercase">
        Loading Nexo Workspace...
      </span>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/nexostudio/:chatId" element={<ChatInterface />} />
            <Route path="/demo" element={<ChatInterface />} />
            <Route path="/build" element={<Build />} />
            <Route path="/s/:shareId" element={<SharedProjectPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
