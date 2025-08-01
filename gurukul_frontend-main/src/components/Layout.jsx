import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import { LoaderProvider, useLoader } from "../context/LoaderContext";
import { useTimeTracking } from "../hooks/useTimeTracking";
import SimpleModelViewer from "./SimpleModelViewer";
import SessionTracker from "./SessionTracker";
import { saveCurrentPath } from "../utils/routeUtils";

function LayoutContent({ children }) {
  const { show } = useLoader();
  const { handleTimeUpdate } = useTimeTracking();
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/home";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Save the current path whenever the location changes
  useEffect(() => {
    saveCurrentPath();
  }, [location.pathname]);

  return (
    <>
      {show && <PageLoader />}

      {/* Main Layout Container with 3D background */}
      <div className="min-h-screen h-screen flex flex-col overflow-hidden relative">
        {/* Session Tracker - Always active when user is logged in */}
        <SessionTracker onTimeUpdate={handleTimeUpdate} />

        {/* 3D Model Background - Behind everything */}
        <div className="absolute inset-0 z-0">
          <SimpleModelViewer modelPath="/school-modal/source/Ukrainian hata.glb" />
        </div>

        {/* Content wrapper with proper z-index */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header - Only show when sidebar is not collapsed */}
          {!sidebarCollapsed && (
            <Header
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              sidebarCollapsed={sidebarCollapsed}
            />
          )}

          {/* Collapsed Sidebar at Top - Only show when sidebar is collapsed */}
          {!isHome && sidebarCollapsed && (
            <div className="w-full">
              <Sidebar
                collapsed={true}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>
          )}

          {/* Main area with sidebar and content */}
          <div
            className={`flex flex-1 ${
              isHome
                ? "h-full"
                : sidebarCollapsed
                ? "h-[calc(100vh-40px)]"
                : "h-[calc(100vh-70px)]"
            } overflow-hidden p-2`}
          >
            {/* Sidebar - toggleable width (hidden on home) */}
            {!isHome && !sidebarCollapsed && (
              <div className="transition-all duration-300 ease-in-out flex-shrink-0 w-[240px] h-auto">
                <Sidebar
                  collapsed={false}
                  onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
              </div>
            )}
            {/* Main Content Area */}
            <div
              className={`flex-1 overflow-hidden ${
                sidebarCollapsed ? "w-full px-0 py-2" : "p-2"
              }`}
            >
              <div className="w-full h-full">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  return (
    <LoaderProvider>
      <LayoutContent>{children}</LayoutContent>
    </LoaderProvider>
  );
}
