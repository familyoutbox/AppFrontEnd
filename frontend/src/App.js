import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import RequirementsWizard from './pages/RequirementsWizard/RequirementsWizard';
import OrchestratorWizard from './pages/OrchestratorWizard/OrchestratorWizard';
import ProjectView from './pages/ProjectView/ProjectView';
import ProjectImport from './pages/ProjectImport/ProjectImport';
import Settings from './pages/Settings/Settings';
import TeamManagement from './pages/TeamManagement/TeamManagement';
// import PreviewPage from './pages/PreviewPage/PreviewPage';

function App() {
  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('auth_token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/wizard" element={<RequirementsWizard />} />
        <Route path="/orchestrator" element={<OrchestratorWizard />} />
        <Route
          path="/project/:projectId"
          element={
            <PrivateRoute>
              <ProjectView />
            </PrivateRoute>
          }
        />
        <Route
          path="/import"
          element={
            <PrivateRoute>
              <ProjectImport />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <TeamManagement />
            </PrivateRoute>
          }
        />
        {/* <Route
          path="/preview/:projectId/:file"
          element={
            <PrivateRoute>
              <PreviewPage />
            </PrivateRoute>
          }
        /> */}
        <Route path="/" element={
          localStorage.getItem('auth_token') ? <Navigate to="/wizard" /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
