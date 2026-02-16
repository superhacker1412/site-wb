import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { SiteAboutSettings } from "@/pages/admin/admin-types";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { formatDate } from "@/pages/admin/admin-ui";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AboutResponse = {
  settings: SiteAboutSettings;
};

type AboutFormState = {
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
  aboutMission: string;
  aboutAddress: string;
  aboutPhone: string;
  aboutEmail: string;
  aboutTelegram: string;
  aboutWorkingHours: string;
};

export default function AdminSiteSettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AboutFormState>({
    aboutTitle: "",
    aboutSubtitle: "",
    aboutDescription: "",
    aboutMission: "",
    aboutAddress: "",
    aboutPhone: "",
    aboutEmail: "",
    aboutTelegram: "",
    aboutWorkingHours: "",
  });

  const aboutQuery = useQuery({
    queryKey: ["admin", "site", "about"],
    queryFn: () => apiFetch<AboutResponse>("/admin/site/about"),
  });

  useEffect(() => {
    if (!aboutQuery.data?.settings) return;
    const settings = aboutQuery.data.settings;
    setForm({
      aboutTitle: settings.aboutTitle || "",
      aboutSubtitle: settings.aboutSubtitle || "",
      aboutDescription: settings.aboutDescription || "",
      aboutMission: settings.aboutMission || "",
      aboutAddress: settings.aboutAddress || "",
      aboutPhone: settings.aboutPhone || "",
      aboutEmail: settings.aboutEmail || "",
      aboutTelegram: settings.aboutTelegram || "",
      aboutWorkingHours: settings.aboutWorkingHours || "",
    });
  }, [aboutQuery.data?.settings]);

  const onSave = async () => {
    try {
      setSaving(true);
      await apiFetch("/admin/site/about", {
        method: "PATCH",
        body: {
          aboutTitle: form.aboutTitle,
          aboutSubtitle: form.aboutSubtitle,
          aboutDescription: form.aboutDescription,
          aboutMission: form.aboutMission,
          aboutAddress: form.aboutAddress,
          aboutPhone: form.aboutPhone,
          aboutEmail: form.aboutEmail,
          aboutTelegram: form.aboutTelegram || null,
          aboutWorkingHours: form.aboutWorkingHours || null,
        },
      });

      await aboutQuery.refetch();
      toast({ title: "Sahifa sozlamalari saqlandi" });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Saqlab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const settings = aboutQuery.data?.settings;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Sayt sozlamalari: Biz haqimizda"
        description="'Biz haqimizda' sahifasidagi kontent va kontakt ma'lumotlarini shu yerda yangilang."
      />

      <Card>
        <CardHeader>
          <CardTitle>Asosiy ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aboutTitle">Sarlavha</Label>
            <Input id="aboutTitle" value={form.aboutTitle} onChange={(event) => setForm((prev) => ({ ...prev, aboutTitle: event.target.value }))} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aboutSubtitle">Qisqa izoh</Label>
            <Textarea
              id="aboutSubtitle"
              rows={3}
              value={form.aboutSubtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, aboutSubtitle: event.target.value }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aboutDescription">Tavsif</Label>
            <Textarea
              id="aboutDescription"
              rows={6}
              value={form.aboutDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, aboutDescription: event.target.value }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aboutMission">Missiya</Label>
            <Textarea
              id="aboutMission"
              rows={5}
              value={form.aboutMission}
              onChange={(event) => setForm((prev) => ({ ...prev, aboutMission: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutAddress">Manzil</Label>
            <Input id="aboutAddress" value={form.aboutAddress} onChange={(event) => setForm((prev) => ({ ...prev, aboutAddress: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutPhone">Telefon</Label>
            <Input id="aboutPhone" value={form.aboutPhone} onChange={(event) => setForm((prev) => ({ ...prev, aboutPhone: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutEmail">Email</Label>
            <Input id="aboutEmail" type="email" value={form.aboutEmail} onChange={(event) => setForm((prev) => ({ ...prev, aboutEmail: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutTelegram">Telegram</Label>
            <Input id="aboutTelegram" value={form.aboutTelegram} onChange={(event) => setForm((prev) => ({ ...prev, aboutTelegram: event.target.value }))} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aboutWorkingHours">Ish vaqti</Label>
            <Input
              id="aboutWorkingHours"
              value={form.aboutWorkingHours}
              onChange={(event) => setForm((prev) => ({ ...prev, aboutWorkingHours: event.target.value }))}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Button onClick={onSave} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            <span className="text-xs text-muted-foreground">
              Oxirgi yangilanish: {formatDate(settings?.updatedAt)}
              {settings?.updatedBy ? ` | ${settings.updatedBy.name}` : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
