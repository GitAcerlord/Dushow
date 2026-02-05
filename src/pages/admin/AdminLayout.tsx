"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'ADMIN') {
        navigate('/');
        return;
      }
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b flex items-center justify-end px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">Gerente DUSHOW</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              AD
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;