"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, MapPin, Heart, Loader2, Crown, ArrowRight, Filter } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { getSafeImageUrl } from '@/utils/url-validator';
import { cn } from '@/lib/utils';

const Discovery = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTaxonomy();
    fetchArtists();
  }, []);

  const fetchTaxonomy = async () => {
    const { data: cats } = await supabase.from('professional_categories').select('*').order('order');
    const { data: subs } = await supabase.from('professional_subcategories').select('*');
    setCategories(cats || []);
    setSubcategories(subs || []);
  };

  const fetchArtists = async () => {
    setLoading(true);
    // Busca perfis e seus relacionamentos de categoria
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        profile_professional_categories (
          category_id,
          subcategory_id
        )
      `)
      .eq('role', 'PRO')
      .eq('is_active', true)
      .order('is_superstar', { ascending: false });
    
    setArtists(data || []);
    setLoading(false);
  };

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || artist.profile_professional_categories?.some((c: any) => {
      const cat = categories.find(cat => cat.slug === activeTab);
      return c.category_id === cat?.id;
    });
    const matchesSub = !selectedSub || artist.profile_professional_categories?.some((c: any) => c.subcategory_id === selectedSub);
    
    return matchesSearch && matchesTab && matchesSub;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Descobrir Talentos</h1>
          <p className="text-slate-500 font-medium">Categorias oficiais auditadas pela DUSHOW.</p>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input 
            className="pl-12 h-14 bg-white rounded-2xl border-none shadow-sm focus-visible:ring-blue-500" 
            placeholder="Buscar por nome artístico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={(val) => { setActiveTab(val); setSelectedSub(null); }} className="space-y-8">
        <TabsList className="bg-transparent h-auto flex-wrap justify-start gap-2 p-0">
          <TabsTrigger value="all" className="rounded-full px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-blue-600 font-bold transition-all">
            Todos
          </TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.slug} className="rounded-full px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white border-2 border-slate-100 data-[state=active]:border-blue-600 font-bold transition-all bg-white">
              {cat.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeTab !== "all" && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4">
            <Filter className="w-4 h-4 text-slate-400 mr-2 self-center" />
            {subcategories.filter(s => {
              const cat = categories.find(c => c.slug === activeTab);
              return s.category_id === cat?.id;
            }).map(sub => (
              <Badge
                key={sub.id}
                variant={selectedSub === sub.id ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-1.5 rounded-full border-2 transition-all",
                  selectedSub === sub.id ? "bg-blue-600 border-blue-600" : "bg-white border-slate-100 text-slate-500 hover:border-blue-200"
                )}
                onClick={() => setSelectedSub(selectedSub === sub.id ? null : sub.id)}
              >
                {sub.title}
              </Badge>
            ))}
          </div>
        )}
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredArtists.map((artist) => (
            <Card key={artist.id} className="group overflow-hidden border-none shadow-sm bg-white rounded-[2.5rem] hover:shadow-2xl transition-all duration-500">
              <div className="h-64 bg-slate-100 relative overflow-hidden">
                <img 
                  src={getSafeImageUrl(artist.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.full_name}`)} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={artist.full_name}
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {artist.is_superstar && <Badge className="bg-amber-500 border-none shadow-lg"><Crown className="w-3 h-3 mr-1" /> Superstar</Badge>}
                  {artist.is_verified && <Badge className="bg-blue-500 border-none shadow-lg"><Star className="w-3 h-3 mr-1 fill-current" /> Verificado</Badge>}
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h3 className="font-black text-2xl text-slate-900 truncate">{artist.full_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-black">
                      <Star className="w-4 h-4 fill-current" /> {artist.rating || "5.0"}
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {artist.location || "Brasil"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {artist.profile_professional_categories?.slice(0, 2).map((c: any) => {
                    const sub = subcategories.find(s => s.id === c.subcategory_id);
                    return (
                      <Badge key={c.subcategory_id} variant="secondary" className="bg-slate-50 text-slate-500 border-none text-[10px] font-bold uppercase">
                        {sub?.title}
                      </Badge>
                    );
                  })}
                </div>

                <Button 
                  className="w-full bg-slate-900 hover:bg-blue-600 h-12 rounded-2xl font-black transition-all gap-2"
                  onClick={() => navigate(`/client/artist/${artist.id}`)}
                >
                  Ver Perfil Completo <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discovery;