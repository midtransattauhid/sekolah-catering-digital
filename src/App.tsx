
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Children from "@/pages/Children";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import OrderFood from "@/pages/OrderFood";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import MenuManagement from "@/pages/admin/MenuManagement";
import CategoryManagement from "@/pages/admin/CategoryManagement";
import OrderManagement from "@/pages/admin/OrderManagement";
import ScheduleManagement from "@/pages/admin/ScheduleManagement";
import UserManagement from "@/pages/admin/UserManagement";
import Reports from "@/pages/admin/Reports";
import OrderRecap from "@/pages/admin/OrderRecap";
import PopulateDailyMenus from "@/pages/admin/PopulateDailyMenus";
import CashierDashboard from "@/pages/cashier/CashierDashboard";
import CashierReports from "@/pages/cashier/CashierReports";
import NotFound from "@/pages/NotFound";
import "./App.css";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const queryClient = new QueryClient();

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/children" element={<Children />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/order-food" element={<OrderFood />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/menu-management" element={<MenuManagement />} />
            <Route path="/admin/category-management" element={<CategoryManagement />} />
            <Route path="/admin/order-management" element={<OrderManagement />} />
            <Route path="/admin/schedule-management" element={<ScheduleManagement />} />
            <Route path="/admin/user-management" element={<UserManagement />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/order-recap" element={<OrderRecap />} />
            <Route path="/admin/populate-daily-menus" element={<PopulateDailyMenus />} />
            
            {/* Cashier routes */}
            <Route path="/cashier" element={<CashierDashboard />} />
            <Route path="/cashier/reports" element={<CashierReports />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
