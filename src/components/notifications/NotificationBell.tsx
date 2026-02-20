"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  link?: string | null;
  created_at?: string | null;
  is_read?: boolean | null;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasReadColumn, setHasReadColumn] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setNotifications([]);
        return;
      }

      const full = await supabase
        .from("notifications")
        .select("id, title, content, type, link, created_at, is_read, read_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!full.error) {
        setHasReadColumn(true);
        setNotifications((full.data as NotificationItem[]) || []);
        return;
      }

      const basic = await supabase
        .from("notifications")
        .select("id, title, content, type, link, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!basic.error) {
        setHasReadColumn(false);
        setNotifications(((basic.data as NotificationItem[]) || []).map((item) => ({ ...item, is_read: false })));
        return;
      }

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const next = payload.new as NotificationItem;
            setNotifications((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 20));
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const next = payload.new as NotificationItem;
            setNotifications((prev) => prev.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  const markAllAsRead = async () => {
    if (!hasReadColumn) return;
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
  };

  const openNotification = async (notification: NotificationItem) => {
    if (hasReadColumn && !notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notification.id);
      setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
    }

    if (notification.link) navigate(notification.link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative text-slate-400 hover:text-[#2D1B69] transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FFB703] text-[10px] font-black text-[#2D1B69] flex items-center justify-center border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px]">
        <div className="px-3 py-2 flex items-center justify-between">
          <DropdownMenuLabel className="p-0">Notificacoes</DropdownMenuLabel>
          {hasReadColumn && unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="w-3 h-3 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">Nenhuma notificacao.</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="items-start gap-2 py-3 cursor-pointer"
              onClick={() => openNotification(notification)}
            >
              <div className="mt-1">
                {!notification.is_read ? (
                  <span className="block w-2 h-2 rounded-full bg-indigo-500" />
                ) : (
                  <span className="block w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold leading-tight">{notification.title || "Atualizacao do sistema"}</p>
                  {notification.type && (
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {notification.type}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.content || "-"}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
