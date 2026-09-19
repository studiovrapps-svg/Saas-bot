import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ClientDashboard from './pages/ClientDashboard';

// Interceptor global para inyectar el token JWT en todas las peticiones a la API
const originalFetch = window.fetch;
window.fetch = async function () {
    let [resource, config] = arguments;
    
    let url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
    
    if (url.includes('/api/')) {
        config = config || {};
        
        const token = localStorage.getItem('token');
        if (token) {
            if (config.headers instanceof Headers) {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else if (resource instanceof Request) {
                resource.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
    }
    
    const response = await originalFetch.apply(this, [resource, config]);
    
    if (response.status === 401 && url.includes('/api/') && !url.includes('/api/login')) {
        if (localStorage.getItem('token')) {
            localStorage.clear();
            window.location.href = '/';
        }
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
