import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, LayoutDashboard, Calendar, Package, FileSpreadsheet, Settings, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { User } from "@shared/schema";

const navItems = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/workshops", label: "סדנאות", icon: Calendar },
  { href: "/equipment", label: "מחסן", icon: Package },
  { href: "/admin/monthly-report", label: "דוח חודשי", icon: FileSpreadsheet },
  { href: "/admin/users", label: "משתמשים", icon: Users, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  instructor: "מנחה",
  admin: "מנהל",
  office: "משרד",
  warehouse: "מחסנאי",
};

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: svCalendlyData } = useQuery({
    queryKey: ["/api/settings/sv_calendly_url"],
    enabled: user.role === "admin",
  });
  const [calendlyInput, setCalendlyInput] = useState("");
  const calendlyLoaded = (svCalendlyData as any)?.value;

  const saveCalendlyMutation = useMutation({
    mutationFn: (value: string) =>
      apiRequest("/api/settings/sv_calendly_url", {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/sv_calendly_url"] });
    },
  });

  const isAdmin = user.role === "admin";

  return (
    <header>
      <div className="bg-brand-blue text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo-even-derech.png" alt="אבן דרך" className="h-10 object-contain brightness-0 invert" />
            </div>

            <nav className="flex items-center gap-0.5">
              {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                        isActive
                          ? "bg-white/20 font-semibold shadow-sm"
                          : "hover:bg-white/10 text-white/80"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium">{user.name}</span>
                <Badge className="bg-white/15 text-white/90 border-white/20 text-[10px] px-1.5 py-0 rounded-full">
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    if (!showSettings && calendlyLoaded) setCalendlyInput(calendlyLoaded);
                  }}
                  className={`p-2 rounded-full transition-colors ${showSettings ? "bg-white/20" : "hover:bg-white/10"}`}
                  title="הגדרות"
                >
                  <Settings size={16} />
                </button>
              )}
              <button
                onClick={() => logout()}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="התנתק"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-l from-brand-yellow via-brand-yellow to-brand-green" />
      {isAdmin && showSettings && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 max-w-7xl py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">הגדרות מנהל</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">קישור תיאום שיחת SV:</label>
              <Input
                dir="ltr"
                placeholder="https://calendly.com/..."
                value={calendlyInput || calendlyLoaded || ""}
                onChange={(e) => setCalendlyInput(e.target.value)}
                className="max-w-md text-sm"
              />
              <Button
                size="sm"
                className="bg-brand-green text-white hover:bg-brand-green/90 rounded-full"
                onClick={() => saveCalendlyMutation.mutate(calendlyInput || calendlyLoaded || "")}
                disabled={saveCalendlyMutation.isPending}
              >
                {saveCalendlyMutation.isPending ? "שומר..." : "שמור"}
              </Button>
              {saveCalendlyMutation.isSuccess && (
                <span className="text-sm text-green-600">נשמר!</span>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
