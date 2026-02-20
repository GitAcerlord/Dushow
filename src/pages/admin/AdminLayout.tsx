"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminSession } from "@/hooks/use-admin-session";

const AdminLayout = () => {
  const { loading, profile } = useAdminSession();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar profile={profile} />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b flex items-center justify-end px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{profile?.full_name || "Admin DUSHOW"}</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {(profile?.full_name || "AD").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
