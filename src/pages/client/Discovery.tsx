"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, MapPin, Loader2, Crown, ArrowRight, Filter } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { getSafeImageUrl } from '@/utils/url-validator';
import { cn } from '@/lib/utils';

const Discovery = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [profileCategories, setProfileCategories] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('professional_categories').select('*').order('order');
    const { data: links } = await supabase.from('profile_professional_categories').select('profile_id, category_id');
    const { data: pros } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'PRO')
      .eq('is_active', true)
      .or('pref_public_profile.is.null,pref_public_profile.eq.true')
      .not('avatar_url', 'is', null)
      .neq('avatar_url', '')
      .order('is_superstar', { ascending: false });
    setCategories(cats || []);
    setProfileCategories(links || []);
    setArtists(pros || []);
    setLoading(false);
  };

  const selectedCategory = categories.find((cat) => cat.slug === activeTab);
  const filteredArtists = artists.filter((artist) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || artist.full_name?.toLowerCase().includes(term);
    if (!matchesSearch) return false;
    const loc = locationTerm.trim().toLowerCase();
    const matchesLocation = !loc || String(artist.location || "").toLowerCase().includes(loc);
    if (!matchesLocation) return false;

    if (activeTab === "all") return true;

    const linkedToCategory = selectedCategory
      ? profileCategories.some((row) => row.profile_id === artist.id && row.category_id === selectedCategory.id)
      : false;
    const profileCategory = String(artist.category || artist.categoria_principal || "").toLowerCase();
    const matchesLegacyCategory = selectedCategory
      ? profileCategory.includes(String(selectedCategory.title || "").toLowerCase()) ||
        profileCategory.includes(String(selectedCategory.slug || "").toLowerCase())
      : false;

    return linkedToCategory || matchesLegacyCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#2D1B69] tracking-tight">Descobrir Talentos</h1>
          <p className="text-slate-500 font-medium">Encontre a atração perfeita para o seu evento.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input 
            className="pl-12 h-14 bg-white rounded-2xl border-none shadow-sm focus-visible:ring-[#2D1B69]" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full lg:max-w-sm">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            className="pl-12 h-14 bg-white rounded-2xl border-none shadow-sm focus-visible:ring-[#2D1B69]"
            placeholder="Filtrar por cidade/região..."
            value={locationTerm}
            onChange={(e) => setLocationTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-auto">
        <TabsList className="bg-transparent h-auto flex justify-start gap-2 p-0">
          <TabsTrigger value="all" className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2D1B69] data-[state=active]:text-white border-2 border-slate-100 font-bold">Todos</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.slug} className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2D1B69] data-[state=active]:text-white border-2 border-slate-100 font-bold bg-white">{cat.title}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#2D1B69] w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtists.map((artist) => (
            <Card key={artist.id} className="group overflow-hidden border-none shadow-sm bg-white rounded-[2.5rem] hover:shadow-xl transition-all duration-500">
              <div className="h-56 bg-slate-100 relative overflow-hidden">
                <img 
                  src={getSafeImageUrl(artist.avatar_url, `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.full_name}`)} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={artist.full_name}
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {artist.is_superstar && <Badge className="bg-[#FFB703] text-[#2D1B69] border-none shadow-lg font-black">SUPERSTAR</Badge>}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-black text-xl text-[#2D1B69] truncate">{artist.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 text-[#FFB703] fill-current" />
                    <span className="text-xs font-black text-slate-400">{artist.rating || "5.0"}</span>
                    <span className="text-slate-200">|</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">{artist.location || "Brasil"}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#2D1B69] hover:bg-[#1a1040] h-12 rounded-xl font-black transition-all gap-2"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  Ver Perfil <ArrowRight className="w-4 h-4" />
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
