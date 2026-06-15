import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ChatInterface from './pages/ChatInterface';
import Build from './pages/Build';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<ChatInterface />} />
          <Route path="/build" element={<Build />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;