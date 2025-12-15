// src/components/AccountDropdown.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function AccountDropdown() {
  const { signOut, user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);

  // 🔹 Load name from profiles.name
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.name) {
        setProfileName(data.name);
      }
    })();
  }, [user]);

  // 🔹 Build final display name (with fallbacks)
  const displayName =
    profileName ||
    (user as any)?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "friend";

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-4 py-2 bg-white/20 hover:bg-white/25 text-white">
        <User className="h-4 w-4" />
        <span>Hello, {displayName}!</span>
        <span className="ml-1">▾</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2 w-full">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2 w-full">
            <SettingsIcon className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={signOut}
          className="text-red-600 focus:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
