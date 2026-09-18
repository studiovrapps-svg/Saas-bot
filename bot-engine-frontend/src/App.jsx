import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ClientDashboard from './pages/ClientDashboard';

// Interceptor global para inyectar el token JWT en todas las peticiones a la API
const originalFetch = window.fetch;
window.fetch = async function () {
    let [resource, config] = arguments;
    if (typeof resource === 'string' && resource.includes('/api/')) {
        config = config || {};
        config.headers = config.headers || {};
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    const response = await originalFetch.apply(this, [resource, config]);
    if ((response.status === 401 || response.status === 403) && typeof resource === 'string' && resource.includes('/api/') && !resource.includes('/api/login')) {
        localStorage.clear();
        window.location.href = '/';
    }
    return response;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/:tenantId" element={<ClientDashboard />} />
      </Routes>
    </Router>
  );
}
export default App;
