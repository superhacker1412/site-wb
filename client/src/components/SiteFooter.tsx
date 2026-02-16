import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Brain, Clock3, Mail, MapPin, Phone } from "lucide-react";

import { apiFetch } from "@/lib/api";

type FooterResponse = {
  settings: {
    footerBrand: string;
    footerDescription: string;
    footerPagesTitle: string;
    footerContactsTitle: string;
    footerLinkHomeLabel: string;
    footerLinkHomePath: string;
    footerLinkMaterialsLabel: string;
    footerLinkMaterialsPath: string;
    footerLinkQuizLabel: string;
    footerLinkQuizPath: string;
    footerLinkAboutLabel: string;
    footerLinkAboutPath: string;
    footerAddress: string;
    footerPhone: string;
    footerEmail: string;
    footerTelegram: string | null;
    footerWorkingHours: string | null;
    footerCopyright: string;
  };
};

function isExternalLink(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

export default function SiteFooter() {
  const location = useLocation();

  const footerQuery = useQuery({
    queryKey: ["site", "footer"],
    queryFn: () => apiFetch<FooterResponse>("/site/footer"),
  });

  if (location.pathname.startsWith("/admin")) return null;

  const year = new Date().getFullYear();
  const settings = footerQuery.data?.settings;
  const links = [
    { label: settings?.footerLinkHomeLabel || "Bosh sahifa", path: settings?.footerLinkHomePath || "/" },
    { label: settings?.footerLinkMaterialsLabel || "Materiallar", path: settings?.footerLinkMaterialsPath || "/materiallar" },
    { label: settings?.footerLinkQuizLabel || "Testlar", path: settings?.footerLinkQuizPath || "/test" },
    { label: settings?.footerLinkAboutLabel || "O'zimiz haqida", path: settings?.footerLinkAboutPath || "/o-nas" },
  ];

  return (
    <footer className="border-t bg-slate-950 py-10 text-slate-200">
      <div className="container grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <Brain className="h-5 w-5 text-cyan-300" />
            {settings?.footerBrand || "IQ Bolalar"}
          </div>
          <p className="text-sm text-slate-400">
            {settings?.footerDescription || "Bolalar uchun mantiqiy fikrlash, testlar va foydali materiallar platformasi."}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">{settings?.footerPagesTitle || "Sahifalar"}</p>
          <div className="flex flex-col gap-1 text-slate-400">
            {links.map((link) =>
              isExternalLink(link.path) ? (
                <a
                  key={`${link.label}-${link.path}`}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={`${link.label}-${link.path}`} to={link.path} className="hover:text-cyan-300">
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">{settings?.footerContactsTitle || "Kontakt"}</p>
          <div className="space-y-2 text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4" />
              <span>{settings?.footerAddress || "Toshkent shahri"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{settings?.footerPhone || "+998 90 123 45 67"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{settings?.footerEmail || "info@iqbolalar.uz"}</span>
            </div>
            {settings?.footerWorkingHours ? (
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                <span>{settings.footerWorkingHours}</span>
              </div>
            ) : null}
            {settings?.footerTelegram ? (
              <div className="text-xs text-slate-500">Telegram: {settings.footerTelegram}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500">
        {year} {settings?.footerCopyright || "IQ Bolalar. Barcha huquqlar himoyalangan."}
      </div>
    </footer>
  );
}
