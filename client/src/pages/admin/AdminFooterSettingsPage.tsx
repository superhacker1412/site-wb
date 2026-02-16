import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { SiteFooterSettings } from "@/pages/admin/admin-types";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { formatDate } from "@/pages/admin/admin-ui";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FooterResponse = {
  settings: SiteFooterSettings;
};

type FooterFormState = {
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
  footerTelegram: string;
  footerWorkingHours: string;
  footerCopyright: string;
};

export default function AdminFooterSettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FooterFormState>({
    footerBrand: "",
    footerDescription: "",
    footerPagesTitle: "",
    footerContactsTitle: "",
    footerLinkHomeLabel: "",
    footerLinkHomePath: "",
    footerLinkMaterialsLabel: "",
    footerLinkMaterialsPath: "",
    footerLinkQuizLabel: "",
    footerLinkQuizPath: "",
    footerLinkAboutLabel: "",
    footerLinkAboutPath: "",
    footerAddress: "",
    footerPhone: "",
    footerEmail: "",
    footerTelegram: "",
    footerWorkingHours: "",
    footerCopyright: "",
  });

  const footerQuery = useQuery({
    queryKey: ["admin", "site", "footer"],
    queryFn: () => apiFetch<FooterResponse>("/admin/site/footer"),
  });

  useEffect(() => {
    if (!footerQuery.data?.settings) return;
    const settings = footerQuery.data.settings;
    setForm({
      footerBrand: settings.footerBrand || "",
      footerDescription: settings.footerDescription || "",
      footerPagesTitle: settings.footerPagesTitle || "",
      footerContactsTitle: settings.footerContactsTitle || "",
      footerLinkHomeLabel: settings.footerLinkHomeLabel || "",
      footerLinkHomePath: settings.footerLinkHomePath || "",
      footerLinkMaterialsLabel: settings.footerLinkMaterialsLabel || "",
      footerLinkMaterialsPath: settings.footerLinkMaterialsPath || "",
      footerLinkQuizLabel: settings.footerLinkQuizLabel || "",
      footerLinkQuizPath: settings.footerLinkQuizPath || "",
      footerLinkAboutLabel: settings.footerLinkAboutLabel || "",
      footerLinkAboutPath: settings.footerLinkAboutPath || "",
      footerAddress: settings.footerAddress || "",
      footerPhone: settings.footerPhone || "",
      footerEmail: settings.footerEmail || "",
      footerTelegram: settings.footerTelegram || "",
      footerWorkingHours: settings.footerWorkingHours || "",
      footerCopyright: settings.footerCopyright || "",
    });
  }, [footerQuery.data?.settings]);

  const onSave = async () => {
    try {
      setSaving(true);
      await apiFetch("/admin/site/footer", {
        method: "PATCH",
        body: {
          footerBrand: form.footerBrand,
          footerDescription: form.footerDescription,
          footerPagesTitle: form.footerPagesTitle,
          footerContactsTitle: form.footerContactsTitle,
          footerLinkHomeLabel: form.footerLinkHomeLabel,
          footerLinkHomePath: form.footerLinkHomePath,
          footerLinkMaterialsLabel: form.footerLinkMaterialsLabel,
          footerLinkMaterialsPath: form.footerLinkMaterialsPath,
          footerLinkQuizLabel: form.footerLinkQuizLabel,
          footerLinkQuizPath: form.footerLinkQuizPath,
          footerLinkAboutLabel: form.footerLinkAboutLabel,
          footerLinkAboutPath: form.footerLinkAboutPath,
          footerAddress: form.footerAddress,
          footerPhone: form.footerPhone,
          footerEmail: form.footerEmail,
          footerTelegram: form.footerTelegram || null,
          footerWorkingHours: form.footerWorkingHours || null,
          footerCopyright: form.footerCopyright,
        },
      });

      await footerQuery.refetch();
      toast({ title: "Footer sozlamalari saqlandi" });
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

  const settings = footerQuery.data?.settings;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Sayt sozlamalari: Footer"
        description="Footer bo'limidagi matnlar, linklar va kontaktlarni shu yerda boshqaring."
      />

      <Card>
        <CardHeader>
          <CardTitle>Asosiy blok</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="footerBrand">Brend nomi</Label>
            <Input id="footerBrand" value={form.footerBrand} onChange={(event) => setForm((prev) => ({ ...prev, footerBrand: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerCopyright">Copyright</Label>
            <Input
              id="footerCopyright"
              value={form.footerCopyright}
              onChange={(event) => setForm((prev) => ({ ...prev, footerCopyright: event.target.value }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="footerDescription">Tavsif</Label>
            <Textarea
              id="footerDescription"
              rows={4}
              value={form.footerDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, footerDescription: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerPagesTitle">Sahifalar sarlavhasi</Label>
            <Input
              id="footerPagesTitle"
              value={form.footerPagesTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, footerPagesTitle: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerContactsTitle">Kontakt sarlavhasi</Label>
            <Input
              id="footerContactsTitle"
              value={form.footerContactsTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, footerContactsTitle: event.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sahifa linklari</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="footerLinkHomeLabel">Havola 1 nomi</Label>
            <Input
              id="footerLinkHomeLabel"
              value={form.footerLinkHomeLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkHomeLabel: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerLinkHomePath">Havola 1 manzili</Label>
            <Input
              id="footerLinkHomePath"
              value={form.footerLinkHomePath}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkHomePath: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerLinkMaterialsLabel">Havola 2 nomi</Label>
            <Input
              id="footerLinkMaterialsLabel"
              value={form.footerLinkMaterialsLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkMaterialsLabel: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerLinkMaterialsPath">Havola 2 manzili</Label>
            <Input
              id="footerLinkMaterialsPath"
              value={form.footerLinkMaterialsPath}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkMaterialsPath: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerLinkQuizLabel">Havola 3 nomi</Label>
            <Input
              id="footerLinkQuizLabel"
              value={form.footerLinkQuizLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkQuizLabel: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerLinkQuizPath">Havola 3 manzili</Label>
            <Input
              id="footerLinkQuizPath"
              value={form.footerLinkQuizPath}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkQuizPath: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerLinkAboutLabel">Havola 4 nomi</Label>
            <Input
              id="footerLinkAboutLabel"
              value={form.footerLinkAboutLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkAboutLabel: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerLinkAboutPath">Havola 4 manzili</Label>
            <Input
              id="footerLinkAboutPath"
              value={form.footerLinkAboutPath}
              onChange={(event) => setForm((prev) => ({ ...prev, footerLinkAboutPath: event.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontakt ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="footerAddress">Manzil</Label>
            <Input id="footerAddress" value={form.footerAddress} onChange={(event) => setForm((prev) => ({ ...prev, footerAddress: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerPhone">Telefon</Label>
            <Input id="footerPhone" value={form.footerPhone} onChange={(event) => setForm((prev) => ({ ...prev, footerPhone: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerEmail">Email</Label>
            <Input id="footerEmail" type="email" value={form.footerEmail} onChange={(event) => setForm((prev) => ({ ...prev, footerEmail: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerTelegram">Telegram</Label>
            <Input
              id="footerTelegram"
              value={form.footerTelegram}
              onChange={(event) => setForm((prev) => ({ ...prev, footerTelegram: event.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="footerWorkingHours">Ish vaqti</Label>
            <Input
              id="footerWorkingHours"
              value={form.footerWorkingHours}
              onChange={(event) => setForm((prev) => ({ ...prev, footerWorkingHours: event.target.value }))}
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
