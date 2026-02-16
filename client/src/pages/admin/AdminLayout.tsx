import { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BadgePlus,
  ActivitySquare,
  Building2,
  BookOpenText,
  ClipboardList,
  FolderTree,
  Gauge,
  ListChecks,
  Mail,
  Map,
  MapPinned,
  PlusCircle,
  School,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/labels";

type AdminNavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

const navItems: AdminNavItem[] = [
  { to: "/admin/dashboard", label: "Boshqaruv paneli", icon: <Gauge className="h-4 w-4" /> },
  { to: "/admin/insights", label: "Foydalanuvchi statistikasi", icon: <ActivitySquare className="h-4 w-4" /> },
  { to: "/admin/users", label: "Foydalanuvchilar", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/regions", label: "Viloyatlar", icon: <MapPinned className="h-4 w-4" /> },
  { to: "/admin/cities", label: "Shaharlar", icon: <Building2 className="h-4 w-4" /> },
  { to: "/admin/districts", label: "Tumanlar", icon: <Map className="h-4 w-4" /> },
  { to: "/admin/schools", label: "Maktablar", icon: <School className="h-4 w-4" /> },
  { to: "/admin/categories", label: "Kategoriyalar", icon: <FolderTree className="h-4 w-4" /> },
  { to: "/admin/materials", label: "Materiallar", icon: <BookOpenText className="h-4 w-4" /> },
  { to: "/admin/directions", label: "Yo'nalishlar", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/questions", label: "Savollar", icon: <ListChecks className="h-4 w-4" /> },
  { to: "/admin/feedback", label: "Qayta aloqa", icon: <Mail className="h-4 w-4" /> },
  { to: "/admin/site/about", label: "Sayt: Biz haqimizda", icon: <Settings2 className="h-4 w-4" /> },
  { to: "/admin/site/footer", label: "Sayt: Pastki qism", icon: <Settings2 className="h-4 w-4" /> },
  { to: "/admin/audit", label: "Audit jurnali", icon: <ShieldCheck className="h-4 w-4" /> },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="container py-6">
      <div className="mb-5 rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin boshqaruv markazi</h1>
            <p className="text-sm text-white/80">Boshqaruv bo'limlari alohida sahifalarga ajratilgan: ro'yxat, yangi yozuv va tahrirlash.</p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm">
            <span className="text-white/70">Sessiya:</span>{" "}
            <span className="font-semibold">{user?.name || "Administrator"} ({roleLabel(user?.role)})</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Admin menyusi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tezkor Qo'shish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/users/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Yangi foydalanuvchi
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/materials/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yangi material
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/questions/new">
                  <BadgePlus className="mr-2 h-4 w-4" />
                  Yangi savol
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/schools/new">
                  <School className="mr-2 h-4 w-4" />
                  Yangi maktab
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Separator />
          <Button variant="outline" className="w-full" asChild>
            <Link to="/">Saytga qaytish</Link>
          </Button>
        </aside>

        <section className="space-y-4">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
