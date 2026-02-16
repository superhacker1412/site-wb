import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  Compass,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { apiFetch, toAssetUrl } from "@/lib/api";
import { Category, Material, QuizDirection } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CategoriesResponse = { categories: Category[] };
type MaterialsResponse = { materials: Material[] };
type DirectionsResponse = { directions: QuizDirection[] };

const benefits = [
  {
    icon: Brain,
    title: "Mantiqiy fikrlash",
    description: "Bola savolga javob topishdan oldin sabab-oqibatni o'ylaydi.",
  },
  {
    icon: Target,
    title: "Diqqat va intizom",
    description: "Har bir mashq bolani diqqatni jamlashga va yakuniga yetkazishga o'rgatadi.",
  },
  {
    icon: Lightbulb,
    title: "Ijodiy yondashuv",
    description: "Savollar turli formatda bo'lgani uchun bola turlicha fikrlaydi.",
  },
  {
    icon: ShieldCheck,
    title: "Xavfsiz o'quv muhit",
    description: "Tushunarli interfeys va yoshga mos kontent.",
  },
];

const processSteps = [
  {
    title: "1. Materialni tanlaydi",
    text: "Bola qiziq mavzuni topadi va qisqa, sodda tushuntirishni o'qiydi.",
  },
  {
    title: "2. Misol bilan mustahkamlaydi",
    text: "Har bir mavzudan keyin amaliy misollar bilan mavzu mustahkamlanadi.",
  },
  {
    title: "3. Testda sinab ko'radi",
    text: "Natija foiz ko'rinishida chiqadi va bola o'z rivojlanishini ko'radi.",
  },
  {
    title: "4. Yana qaytib ishlaydi",
    text: "Qiyin mavzularni qayta o'tib, natijani bosqichma-bosqich oshiradi.",
  },
];

export default function Landing() {
  const categoriesQuery = useQuery({
    queryKey: ["categories", "landing"],
    queryFn: () => apiFetch<CategoriesResponse>("/categories"),
  });

  const materialsQuery = useQuery({
    queryKey: ["materials", "landing", "active"],
    queryFn: () => apiFetch<MaterialsResponse>("/materials?status=ACTIVE"),
  });

  const directionsQuery = useQuery({
    queryKey: ["quiz", "directions", "landing", "active"],
    queryFn: () => apiFetch<DirectionsResponse>("/quiz/directions?status=ACTIVE"),
  });

  const categories = categoriesQuery.data?.categories || [];
  const materials = (materialsQuery.data?.materials || []).slice(0, 6);
  const directions = (directionsQuery.data?.directions || []).slice(0, 6);

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-cyan-900 py-20 md:py-28">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="container relative z-10 text-primary-foreground">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
  <div className="space-y-4 md:space-y-5" data-aos="fade-right">
    {/* ✅ badge text smaller */}
    <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1.5 text-[11px] md:text-xs leading-4">
      <Sparkles className="h-3.5 w-3.5" />
      Uzingizning mantiqiy va tanqidiy fikrlashingizni rivojlantring
    </div>

    {/* ✅ title smaller */}
    <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
      Umum talim maktablarida oquvchilarning
      <span className="block text-cyan-300"> mantiqiy va tanqidiy fikrlashini</span>
      rivojlantirish uchun zamonaviy platforma
    </h1>

    {/* ✅ paragraph smaller */}
    <p className="max-w-2xl text-sm md:text-base text-primary-foreground/85 leading-5 md:leading-6">
      Bu yerda bola nafaqat test yechadi, balki mantiqiy fikrlash, tahlil qilish va muammoni yechish odatini shakllantiradi.
      Har bir mavzu oddiy tilda, misollar bilan va amaliy natija bilan beriladi.
    </p>

    {/* ✅ buttons smaller height/text */}
    <div className="flex flex-wrap gap-2">
      <Link to="/materiallar">
        <Button size="sm" className="gap-2 bg-cyan-300 text-slate-900 hover:bg-cyan-200 h-9 px-4 text-sm">
          Materiallarni ochish
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Link to="/test">
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-4 text-sm border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
        >
          Testni boshlash
        </Button>
      </Link>
    </div>
  </div>

  <Card className="border-white/20 bg-white/10 text-white backdrop-blur" data-aos="fade-left">
    <CardHeader className="pb-3">
      {/* ✅ card title smaller */}
      <CardTitle className="flex items-center gap-2 text-white text-sm md:text-base">
        <Rocket className="h-4 w-4 text-cyan-300" />
        Nima o'zgaradi?
      </CardTitle>
    </CardHeader>

    {/* ✅ card content text smaller */}
    <CardContent className="space-y-2 text-[11px] md:text-xs text-white/90 leading-4">
      <div className="rounded-lg border border-white/20 bg-white/5 p-2.5">
        Bola savolga shoshilmasdan, mantiq bilan javob berishni o'rganadi.
      </div>
      <div className="rounded-lg border border-white/20 bg-white/5 p-2.5">
        Yechilgan testlar orqali o'sish dinamikasi ko'rinadi.
      </div>
      <div className="rounded-lg border border-white/20 bg-white/5 p-2.5">
        Ota-ona bolaning qaysi yo'nalishda kuchli ekanini aniq ko'radi.
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="rounded-md bg-white/10 p-2">
          <p className="text-lg md:text-xl font-bold leading-6">{categories.length}</p>
          <p className="text-[10px] md:text-[11px] text-white/70 leading-4">Kategoriya</p>
        </div>
        <div className="rounded-md bg-white/10 p-2">
          <p className="text-lg md:text-xl font-bold leading-6">{materialsQuery.data?.materials.length || 0}</p>
          <p className="text-[10px] md:text-[11px] text-white/70 leading-4">Material</p>
        </div>
        <div className="rounded-md bg-white/10 p-2">
          <p className="text-lg md:text-xl font-bold leading-6">{directionsQuery.data?.directions.length || 0}</p>
          <p className="text-[10px] md:text-[11px] text-white/70 leading-4">Yo'nalish</p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

        </div>
      </section>

      <section className="container mt-12" data-aos="fade-up">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} data-aos="zoom-in" data-aos-delay={index * 80}>
                <CardContent className="space-y-2 p-5">
                  <div className="inline-flex rounded-lg bg-cyan-100 p-2 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mt-12">
        <div className="mb-6 flex items-center justify-between" data-aos="fade-up">
          <div>
            <h2 className="text-3xl font-bold">Yo'nalishlar va mavzular</h2>
            <p className="text-muted-foreground">
              Bolaga qiziqarli bo'lgan yo'nalishni tanlang va bosqichma-bosqich rivojlaning.
            </p>
          </div>
          <Link to="/materiallar" className="hidden md:block">
            <Button variant="outline" className="gap-2">
              Barchasini ko'rish
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/materiallar?category=${category.id}`}
              data-aos="fade-up"
              data-aos-delay={index * 60}
            >
              <Card className="h-full border-primary/10 transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{category.icon}</div>
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bu yo'nalishda bolangiz mantiqiy fikrlashni mustahkamlaydi.
                  </p>
                  {category.status === "ARCHIVED" ? <Badge variant="secondary">Arxiv</Badge> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mt-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Card data-aos="fade-right" className="border-cyan-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-cyan-600" />
                O'qish jarayoni qanday?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-lg border p-3"
                  data-aos="fade-up"
                  data-aos-delay={index * 80}
                >
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4" data-aos="fade-left">
            <h3 className="text-2xl font-bold">Bolaga mos amaliy kontent</h3>
            <p className="text-muted-foreground">
              Materiallar qisqa bloklarda beriladi. Har bir mavzudan keyin test topshirib, bola o'zini tekshiradi va nimani takrorlash kerakligini biladi.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {materials.slice(0, 4).map((material, index) => (
                <Link
                  key={material.id}
                  to={`/materiallar/${material.id}`}
                  data-aos="zoom-in"
                  data-aos-delay={index * 90}
                >
                  <Card className="h-full overflow-hidden">
                    {material.imagePath ? (
                      <img
                        src={toAssetUrl(material.imagePath)}
                        alt={material.title}
                        className="aspect-video w-full object-cover"
                      />
                    ) : null}
                    <CardContent className="space-y-1 p-3">
                      <p className="line-clamp-1 font-semibold">{material.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{material.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-14">
        <div className="mb-6" data-aos="fade-up">
          <h2 className="text-3xl font-bold">Test yo'nalishlari</h2>
          <p className="text-muted-foreground">
            Bola turli yo'nalishlarda o'zini tekshiradi va qaysi mavzuda kuchli ekanini ko'radi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {directions.map((direction, index) => (
            <Link
              key={direction.id}
              to={`/test/${direction.id}`} // ✅ FIX: было "/test"
              data-aos="fade-up"
              data-aos-delay={index * 70}
            >
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-2 p-5">
                  <div className="text-3xl">{direction.icon}</div>
                  <p className="font-semibold">{direction.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{direction.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    Savollar soni: {direction.questionCount || 0}
                  </div>
                  {direction.status === "ARCHIVED" ? <Badge variant="secondary">Arxiv</Badge> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mt-16" data-aos="zoom-in">
        <Card className="overflow-hidden border-none bg-gradient-to-r from-primary to-cyan-800 text-primary-foreground">
          <CardContent className="p-10 text-center md:p-14">
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs uppercase tracking-[0.2em]">
                <CheckCircle2 className="h-4 w-4" />
                Boshlash vaqti keldi
              </div>
              <h2 className="text-3xl font-extrabold md:text-4xl">Farzandingizning bilim yo'lini bugun boshlang</h2>
              <p className="text-primary-foreground/85">
                Unga shunchaki test emas, balki mustaqil fikrlash, tahlil qilish va qaror qabul qilish odatini bering.
              </p>
              <div className="pt-2">
                <Link to="/materiallar">
                  <Button size="lg" className="gap-2 bg-cyan-300 text-slate-900 hover:bg-cyan-200">
                    Sinab ko'rish
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
