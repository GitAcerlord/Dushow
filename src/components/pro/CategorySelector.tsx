"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

interface CategorySelectorProps {
  profileId: string;
  onSave?: () => void;
}

const CategorySelector = ({ profileId, onSave }: CategorySelectorProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('professional_categories').select('*').order('order');
    const { data: subs } = await supabase.from('professional_subcategories').select('*');
    const { data: mySelection } = await supabase.from('profile_professional_categories').select('*').eq('profile_id', profileId);
    
    setCategories(cats || []);
    setSubcategories(subs || []);
    setSelected(mySelection || []);
    setLoading(false);
  };

  const toggleSubcategory = (catId: string, subId: string) => {
    const exists = selected.find(s => s.subcategory_id === subId);
    if (exists) {
      setSelected(selected.filter(s => s.subcategory_id !== subId));
    } else {
      setSelected([...selected, { profile_id: profileId, category_id: catId, subcategory_id: subId }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Remove seleções antigas e insere novas
    await supabase.from('profile_professional_categories').delete().eq('profile_id', profileId);
    if (selected.length > 0) {
      await supabase.from('profile_professional_categories').insert(selected);
    }
    setSaving(false);
    if (onSave) onSave();
  };

  if (loading) return <Loader2 className="animate-spin text-indigo-600" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              {cat.title}
            </h4>
            <div className="flex flex-wrap gap-2">
              {subcategories.filter(s => s.category_id === cat.id).map((sub) => {
                const isSelected = selected.some(s => s.subcategory_id === sub.id);
                return (
                  <Badge
                    key={sub.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-4 py-1.5 rounded-full transition-all border-2",
                      isSelected ? "bg-indigo-600 border-indigo-600" : "hover:border-indigo-200 text-slate-500"
                    )}
                    onClick={() => toggleSubcategory(cat.id, sub.id)}
                  >
                    {sub.title}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 h-12 rounded-xl font-bold">
        {saving ? <Loader2 className="animate-spin" /> : "Salvar Categorias Oficiais"}
      </Button>
    </div>
  );
};

export default CategorySelector;