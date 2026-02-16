import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, BookOpen, FileText, Home, Info, LogIn, Menu, Shield, User, UserPlus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  to: string;
  label: string;
  startsWith?: string;
};

type SidebarLinkItem = NavLinkItem & {
  icon: typeof Home;
};

const navLinks: NavLinkItem[] = [
  { to: "/", label: "Bosh sahifa" },
  { to: "/test/cmlp60o1200049ba0h0afbnk5", label: "Kirish testi", startsWith: "/test/cmlp60o1200049ba0h0afbnk5" },
  { to: "/test", label: "Testlar", startsWith: "/test" },
  { to: "/test/cmlp64mej00079ba007o950h2", label: "Chiqish testi", startsWith: "/test/cmlp64mej00079ba007o950h2" },
  { to: "/materiallar", label: "Materiallar", startsWith: "/materiallar" },
  { to: "/o-nas", label: "O'zimiz haqida", startsWith: "/o-nas" },
];

const sidebarLinks: SidebarLinkItem[] = [
  { to: "/", label: "Bosh sahifa", icon: Home },

  // ✅ same order as nav
  { to: "/test/cmlp60o1200049ba0h0afbnk5", label: "Kirish testi", startsWith: "/test/cmlp60o1200049ba0h0afbnk5", icon: FileText },
  { to: "/test", label: "Testlar", startsWith: "/test", icon: FileText },
  { to: "/test/cmlp64mej00079ba007o950h2", label: "Chiqish testi", startsWith: "/test/cmlp64mej00079ba007o950h2", icon: FileText },

  { to: "/materiallar", label: "Materiallar", startsWith: "/materiallar", icon: BookOpen },
  { to: "/o-nas", label: "O'zimiz haqida", startsWith: "/o-nas", icon: Info },
  { to: "/kabinet", label: "Kabinet", startsWith: "/kabinet", icon: User },
  { to: "/kabinet?tab=materials", label: "Sevimlilar", startsWith: "/kabinet", icon: Star },
];
function isActive(currentPath: string, currentSearch: string, link: NavLinkItem): boolean {
  if (link.to.includes("?")) {
    return `${currentPath}${currentSearch}` === link.to;
  }
  if (link.to === "/") {
    return currentPath === "/";
  }
  if (link.startsWith) {
    return currentPath.startsWith(link.startsWith);
  }
  return currentPath === link.to;
}

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-80 bg-slate-900 text-slate-100">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-slate-100 text-sm">
                  <Brain className="h-5 w-5 text-cyan-300" />
                  IQ Bolalar menyusi
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-6 flex flex-col gap-1">
                {sidebarLinks.map((link) => {
                  const active = isActive(location.pathname, location.search, link);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors",
                        active ? "bg-cyan-300/20 text-cyan-200" : "text-slate-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* ✅ smaller brand text + truncation */}
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Brain className="h-6 w-6 text-accent" />
            <span className="hidden sm:inline min-w-0 max-w-[320px] md:max-w-[420px] lg:max-w-[520px] truncate font-['Space_Grotesk'] text-[10px] md:text-[11px] lg:text-xs leading-4 text-primary">
              Bolalarni mantiqiy va tanqidiy rijovlantrish
            </span>
          </Link>
        </div>

        {/* ✅ smaller nav text */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = isActive(location.pathname, location.search, link);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium leading-4 transition-colors hover:bg-muted",
                  active ? "bg-muted text-primary font-semibold" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          {user ? (
            <div className="flex items-center gap-1.5">
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-1 hidden sm:inline-flex h-8 px-2 text-[11px]">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}

              <Link to="/kabinet">
                <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                  <span className="hidden sm:inline text-[11px] leading-4 max-w-[140px] truncate">{user.name}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-[11px]">
                    {user.name[0].toUpperCase()}
                  </div>
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void logout()}
                className="hidden sm:inline-flex h-8 px-2 text-[11px]"
              >
                Chiqish
              </Button>
            </div>
          ) : (
            <>
              <Link to="/kirish">
                <Button variant="ghost" size="sm" className="gap-1 h-8 px-2 text-[11px]">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Kirish</span>
                </Button>
              </Link>
              <Link to="/royxat">
                <Button size="sm" className="gap-1 h-8 px-2 text-[11px]">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Ro'yxat</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
