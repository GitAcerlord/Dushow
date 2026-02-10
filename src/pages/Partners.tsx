"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Loader2, ExternalLink, Building2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import PublicNavbar from '@/components/layout/PublicNavbar';
import Footer from '@/components/layout/Footer';

const Partners = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase.from('partners').select('*').eq('is_active', true);
      setPartners(data || []);
      setLoading(false);
    };
    fetchPartners();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Empresas Parceiras</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">As maiores casas de shows, buffets e produtoras que confiam na DUSHOW.</p>
        </div>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-8 border-none shadow-sm bg-white rounded-[2.5rem] flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all group">
                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{partner.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{partner.segment}</p>
                </div>
                {partner.link && (
                  <a href={partner.link} target="_blank" rel="noreferrer" className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Partners;