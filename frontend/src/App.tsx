import React from "react";
import { Routes, Route } from "react-router-dom";
import SelectionScreen from "./pages/SelectionScreen";
import LoginPage from "./pages/UserPages/LoginPage";
import DashboardPage from "./pages/UserPages/DashboardPage";
import MultiChannelSelectionPage from "./pages/UserPages/MultiChannelSelectionPage";
import RealTimePreviewPage from "./pages/UserPages/RealTimePreviewPage";
import PreviewPage from "./pages/UserPages/PreviewPage";
import AdjustImagePage from "./pages/UserPages/AdjustImagePage";

const App: React.FC = () => {
    return (
        <Routes>
            {/* Homepage */}
            <Route path="/" element={<SelectionScreen />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/user-dashboard" element={<DashboardPage />} />
            <Route path="/multi-select" element={<MultiChannelSelectionPage />} />
            <Route path="/real-time-prev" element={<RealTimePreviewPage />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/adjust-img" element={<AdjustImagePage />} />
        </Routes>
    );
};

export default App;
