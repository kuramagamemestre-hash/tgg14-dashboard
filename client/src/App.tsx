import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout";
import Login from "@/components/login";
import Register from "@/components/register";
import Dashboard from "@/pages/dashboard";
import Bosses from "@/pages/bosses";
import Members from "@/pages/members";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register 
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <Login 
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <Layout onLogout={logout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/bosses" component={Bosses} />
        <Route path="/members" component={Members} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
