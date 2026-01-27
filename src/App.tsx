import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CustomCursor, type CursorStyle, type CursorSize, type CursorTheme } from "@/components/CustomCursor";
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [cursorConfig, setCursorConfig] = useState({
    cursorStyle: 'elastic' as CursorStyle,
    cursorSize: 'medium' as CursorSize,
    cursorTheme: 'auto' as CursorTheme,
    speedSensitivity: 5,
    enabled: true,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CustomCursor
          cursorStyle={cursorConfig.cursorStyle}
          cursorSize={cursorConfig.cursorSize}
          cursorTheme={cursorConfig.cursorTheme}
          speedSensitivity={cursorConfig.speedSensitivity}
          enabled={cursorConfig.enabled}
        />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index cursorConfig={cursorConfig} onCursorConfigChange={setCursorConfig} />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
