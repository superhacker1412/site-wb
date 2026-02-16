import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, MapPin, Phone, Send, Clock3, ArrowRight, Building2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AboutSettings = {
  id: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
  aboutMission: string;
  aboutAddress: string;
  aboutPhone: string;
  aboutEmail: string;
  aboutTelegram: string | null;
  aboutWorkingHours: string | null;
};

type AboutResponse = {
  settings: AboutSettings;
};

export default function AboutPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const aboutQuery = useQuery({
    queryKey: ["site", "about"],
    queryFn: () => apiFetch<AboutResponse>("/site/about"),
  });

  const feedbackMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/site/feedback", {
        method: "POST",
        body: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: form.subject || undefined,
          message: form.message,
        },
      }),
    onSuccess: (response) => {
      toast({ title: "Xabar yuborildi", description: response.message });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Yuborib bo'lmadi",
        variant: "destructive",
      });
    },
  });

  const settings = aboutQuery.data?.settings;

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 py-20 text-white">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="container relative z-10" data-aos="fade-up">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]">
              O'ZIMIZ HAQIMIZDA
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{settings?.aboutTitle || "Biz bolalarning kelajagi uchun ishlaymiz"}</h1>
            <p className="text-lg text-white/85">{settings?.aboutSubtitle || "Maqsadimiz - har bir bolada aqlli fikrlashni shakllantirish."}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/materiallar">
                <Button className="gap-2 bg-cyan-400 text-slate-900 hover:bg-cyan-300">
                  Materiallarni ko'rish
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/test">
                <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                  Testni boshlash
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-10 grid gap-4 md:grid-cols-2">
        <Card data-aos="fade-right">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bizning faoliyat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{settings?.aboutDescription || "Platforma orqali bolalar uchun mantiqiy va foydali bilimlarni yetkazamiz."}</p>
            <p>{settings?.aboutMission || "Har bir bolaning salohiyatini ochishga yordam beramiz."}</p>
          </CardContent>
        </Card>

        <Card data-aos="fade-left">
          <CardHeader>
            <CardTitle>Kontakt ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-cyan-600" />
              <span>{settings?.aboutAddress || "Manzil ko'rsatilmagan"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-cyan-600" />
              <span>{settings?.aboutPhone || "Telefon ko'rsatilmagan"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-cyan-600" />
              <span>{settings?.aboutEmail || "Email ko'rsatilmagan"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock3 className="h-4 w-4 text-cyan-600" />
              <span>{settings?.aboutWorkingHours || "Ish vaqti ko'rsatilmagan"}</span>
            </div>
            {settings?.aboutTelegram ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Telegram: {settings.aboutTelegram}</div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="container mt-8" data-aos="fade-up">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Qayta aloqa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Ismingiz</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon (ixtiyoriy)</Label>
              <Input id="phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Mavzu (ixtiyoriy)</Label>
              <Input id="subject" value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="message">Xabar</Label>
              <Textarea
                id="message"
                rows={6}
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={() => feedbackMutation.mutate()}
                disabled={feedbackMutation.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {feedbackMutation.isPending ? "Yuborilmoqda..." : "Xabar yuborish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
