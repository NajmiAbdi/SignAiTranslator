// App.tsx - manual login version
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Pages & Layout
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import DatasetsPage from './pages/DatasetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

function App() {
  // ✅ Manual login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to pass to LoginPage
  const handleLogin = () => setIsLoggedIn(true);

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ✅ Routes for logged in admin
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
