// src/routes/index.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
// import Workspace from '../pages/Workspace';
import Dashboard from '../pages/Dashboard';
import EditPanelPage from "../pages/EditPanelPage";
// import { AEBTestingDashboard, TestResultsPage } from "../pages";


export const AppRoutes = () => {
    return (
        <Routes>
            {/* <Route path="/" element={<Workspace />} /> */}
            {/* <Route path="/" element={<AEBTestingDashboard />} /> */}
            {/* <Route path="/:workspaceId/:compoundProductId/:provisionedCompoundProductId" element={<AEBTestingDashboard />} /> */}
            {/* <Route path="/test-results" element={<TestResultsPage />} /> */}
            {/* <Route path="/:workspaceId/:compoundProductId/:provisionedCompoundProductId/:productId/performance-monitoring-dashboard" element={<Dashboard />} /> */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/:workspaceId/:compoundProductId/:provisionedCompoundProductId/:productId/performance-monitoring-dashboard/edit-panel/:panelId" element={<EditPanelPage />} />
        </Routes>
    );
};