import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LogOut, LayoutDashboard, CalendarDays, Package,
  FileSpreadsheet, Users, Bell, CalendarCheck, Menu, X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { useNotifications } from "../../hooks/useNotifications";
import { Badge } from "../ui/badge";
import type { User } from "@shared/schema";

const roleLabels: Record<string, string> = {
  instructor: "מנחה",
  admin: "מנהל",
  office: "משרד",
  warehouse: "מחסנאי",
};

const URGENCY_BG: Record<string, string> = {
  high: "bg-red-50 border-red-200",
  medium: "bg-yellow-50 border-yellow-200",
  low: "bg-blue-50 border-blue-200",
};

const URGENCY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
};

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const perms = usePermissions();
  const { notifications, count, highCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems = [
    { href: "/", label: "לוח בקרה", icon: LayoutDashboard, show: perms.canViewDashboard },
    { href: "/calendar", label: "לוח שנה", icon: CalendarCheck, show: perms.canViewCalendar },
    { href: "/workshops", label: "סדנאות", icon: CalendarDays, show: perms.canViewWorkshops },
    { href: "/equipment", label: "מחסן", icon: Package, show: perms.canViewEquipment },
    { href: "/admin/monthly-report", label: "דוח חודשי", icon: FileSpreadsheet, show: perms.canViewMonthlyReport },
    { href: "/admin/users", label: "משתמשים", icon: Users, show: perms.canViewUsers },
  ].filter(item => item.show);

  return (
    <header>
      <div className="bg-brand-blue text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src="/logo-even-derech.png"
                alt="אבן דרך"
                className="h-10 object-contain brightness-0 invert"
              />
            </div>

            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = location === href;
                return (
                  <Link key={href} href={href}>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                        isActive
                          ? "bg-white/20 font-semibold shadow-sm"
                          : "hover:bg-white/10 text-white/80"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden lg:inline">{label}</span>
                    </button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium">{user.name}</span>
                <Badge className="bg-white/15 text-white/90 border-white/20 text-[10px] px-1.5 py-0 rounded-full">
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(v => !v)}
                  className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="התראות"
                >
                  <Bell size={16} />
                  {count > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      highCount > 0 ? "bg-red-500" : "bg-yellow-400 text-foreground"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white text-foreground rounded-2xl shadow-stone-lg border overflow-hidden z-50">
                    <div className="px-4 py-3 border-b font-semibold text-sm flex items-center justify-between">
                      <span>התראות</span>
                      {count > 0 && (
                        <Badge className="bg-brand-blue text-white text-[10px] rounded-full border-0">
                          {count}
                        </Badge>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        אין התראות חדשות
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto divide-y">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 flex items-start gap-3 ${URGENCY_BG[n.urgency]}`}
                          >
                            <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${URGENCY_DOT[n.urgency]}`} />
                            <div>
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => logout()}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="התנתק"
              >
                <LogOut size={16} />
              </button>

              <button
                className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setMobileOpen(v => !v)}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-0.5 bg-gradient-to-l from-brand-yellow via-brand-yellow to-brand-green" />

      {mobileOpen && (
        <div className="md:hidden bg-brand-blue text-white border-t border-white/10">
          <div className="container mx-auto px-4 max-w-7xl py-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href}>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-right mb-1 ${
                      isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10 text-white/80"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
