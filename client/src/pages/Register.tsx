import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import {
  GRADE_LETTER_NONE_VALUE,
  GRADE_LETTER_OPTIONS,
  GRADE_LETTER_OTHER_VALUE,
  GRADE_NUMBERS,
} from "@/constants/grade-options";
import { CityDirectory, DistrictDirectory, RegionDirectory, SchoolDirectory } from "@/types/api";

type RegistrationForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  regionId: string;
  cityId: string;
  districtId: string;
  customDistrictName: string;
  schoolId: string;
  customSchoolName: string;
  gradeNumber: string;
  gradeLetter: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const OTHER_SCHOOL_VALUE = "__other__";
const OTHER_DISTRICT_VALUE = "__other_district__";

export default function Register() {
  const [form, setForm] = useState<RegistrationForm>({
    firstName: "",
    lastName: "",
    middleName: "",
    regionId: "",
    cityId: "",
    districtId: "",
    customDistrictName: "",
    schoolId: "",
    customSchoolName: "",
    gradeNumber: "",
    gradeLetter: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [pending, setPending] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const redirectTo = (location.state as { from?: string } | undefined)?.from || "/kabinet";

  const regionsQuery = useQuery({
    queryKey: ["register", "regions"],
    queryFn: () => apiFetch<{ regions: RegionDirectory[] }>("/locations/regions"),
  });

  const citiesQuery = useQuery({
    queryKey: ["register", "cities", form.regionId],
    queryFn: () => apiFetch<{ cities: CityDirectory[] }>(`/locations/cities?regionId=${encodeURIComponent(form.regionId)}`),
    enabled: Boolean(form.regionId),
  });

  const districtsQuery = useQuery({
    queryKey: ["register", "districts", form.regionId, form.cityId],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("regionId", form.regionId);
      if (form.cityId) {
        params.set("cityId", form.cityId);
      }
      return apiFetch<{ districts: DistrictDirectory[] }>(`/locations/districts?${params.toString()}`);
    },
    enabled: Boolean(form.regionId),
  });

  const schoolsQuery = useQuery({
    queryKey: ["register", "schools", form.districtId],
    queryFn: () => apiFetch<{ schools: SchoolDirectory[] }>(`/locations/schools?districtId=${encodeURIComponent(form.districtId)}`),
    enabled: Boolean(form.districtId),
  });

  const regions = regionsQuery.data?.regions || [];
  const cities = citiesQuery.data?.cities || [];
  const districts = districtsQuery.data?.districts || [];
  const schools = schoolsQuery.data?.schools || [];
  const hasCities = cities.length > 0;
  const districtSelectValue = form.districtId || (form.customDistrictName ? OTHER_DISTRICT_VALUE : "");
  const gradeLetterUpper = form.gradeLetter.trim().toUpperCase();
  const gradeLetterSelectValue = gradeLetterUpper
    ? GRADE_LETTER_OPTIONS.includes(gradeLetterUpper as (typeof GRADE_LETTER_OPTIONS)[number])
      ? gradeLetterUpper
      : GRADE_LETTER_OTHER_VALUE
    : GRADE_LETTER_NONE_VALUE;
  const isOtherDistrict = districtSelectValue === OTHER_DISTRICT_VALUE;
  const isOtherSchool = form.schoolId === OTHER_SCHOOL_VALUE;
  const canSelectSchool = Boolean(form.districtId) || isOtherDistrict;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      cityId: "",
      districtId: "",
      customDistrictName: "",
      schoolId: "",
      customSchoolName: "",
    }));
  }, [form.regionId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      districtId: "",
      customDistrictName: "",
      schoolId: "",
      customSchoolName: "",
    }));
  }, [form.cityId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      schoolId: "",
      customSchoolName: "",
    }));
  }, [form.districtId]);

  const onInput =
    (field: keyof RegistrationForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({
        title: "Parollar mos emas",
        description: "Parol va tasdiqlash bir xil bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    const gradeNumber = Number(form.gradeNumber);
    if (!Number.isInteger(gradeNumber) || gradeNumber < 1 || gradeNumber > 11) {
      toast({
        title: "Klass noto'g'ri",
        description: "Klass raqami 1 dan 11 gacha bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    if (!form.gradeLetter.trim()) {
      toast({
        title: "Klass harfi kiritilmagan",
        description: "Klass harfini tanlang yoki qo'lda kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!form.regionId) {
      toast({
        title: "Viloyat tanlanmagan",
        description: "Iltimos, viloyatni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!form.districtId && !form.customDistrictName.trim()) {
      toast({
        title: "Tuman tanlanmagan",
        description: "Tumanni tanlang yoki qo'lda kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!form.schoolId) {
      toast({
        title: "Maktab tanlanmagan",
        description: "Iltimos, maktabni tanlang",
        variant: "destructive",
      });
      return;
    }

    if (isOtherSchool && !form.customSchoolName.trim()) {
      toast({
        title: "Maktab nomini kiriting",
        description: "Boshqa tanlanganda maktab nomini yozish majburiy",
        variant: "destructive",
      });
      return;
    }

    try {
      setPending(true);
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
        regionId: form.regionId,
        cityId: form.cityId || null,
        districtId: form.districtId || null,
        customDistrictName: form.districtId ? null : form.customDistrictName.trim(),
        schoolId: isOtherSchool ? null : form.schoolId,
        customSchoolName: isOtherSchool ? form.customSchoolName.trim() : null,
        gradeNumber,
        gradeLetter: form.gradeLetter.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast({
        title: "Ro'yxatdan o'tishda xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-8">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <Brain className="mx-auto mb-3 h-10 w-10 text-accent" />
            <h1 className="text-2xl font-bold">Ro'yxatdan o'tish</h1>
            <p className="text-sm text-muted-foreground">To'liq profil va maktab ma'lumotlari bilan ro'yxatdan o'ting</p>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">Familiya</Label>
              <Input id="lastName" value={form.lastName} onChange={onInput("lastName")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Ism</Label>
              <Input id="firstName" value={form.firstName} onChange={onInput("firstName")} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="middleName">Sharif</Label>
              <Input id="middleName" value={form.middleName} onChange={onInput("middleName")} required />
            </div>

            <div className="space-y-2">
              <Label>Viloyat</Label>
              <Select
                value={form.regionId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, regionId: value }))}
                disabled={regionsQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={regionsQuery.isLoading ? "Yuklanmoqda..." : "Viloyatni tanlang"} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shahar (agar mavjud bo'lsa)</Label>
              <Select
                value={form.cityId || "__none__"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    cityId: value === "__none__" ? "" : value,
                  }))
                }
                disabled={!form.regionId || citiesQuery.isLoading || !hasCities}
              >
                <SelectTrigger>
                  <SelectValue placeholder={hasCities ? "Shaharni tanlang (ixtiyoriy)" : "Bu viloyatda shahar tanlovi yo'q"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Shaharsiz</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tuman</Label>
              <Select
                value={districtSelectValue}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    districtId: value === OTHER_DISTRICT_VALUE ? "" : value,
                    customDistrictName: value === OTHER_DISTRICT_VALUE ? prev.customDistrictName : "",
                    schoolId: value === OTHER_DISTRICT_VALUE ? OTHER_SCHOOL_VALUE : "",
                    customSchoolName: "",
                  }))
                }
                disabled={!form.regionId || districtsQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={districtsQuery.isLoading ? "Yuklanmoqda..." : "Tumanni tanlang"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_DISTRICT_VALUE}>Boshqa (qo'lda kiritish)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isOtherDistrict ? (
              <div className="space-y-2">
                <Label htmlFor="customDistrictName">Tuman nomini kiriting</Label>
                <Input id="customDistrictName" value={form.customDistrictName} onChange={onInput("customDistrictName")} required />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Maktab</Label>
              <Select
                value={form.schoolId}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    schoolId: value,
                    customSchoolName: value === OTHER_SCHOOL_VALUE ? prev.customSchoolName : "",
                  }))
                }
                disabled={!canSelectSchool || schoolsQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={schoolsQuery.isLoading ? "Yuklanmoqda..." : "Maktabni tanlang"} />
                </SelectTrigger>
                <SelectContent>
                  {form.districtId
                    ? schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))
                    : null}
                  <SelectItem value={OTHER_SCHOOL_VALUE}>Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.schoolId === OTHER_SCHOOL_VALUE ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customSchoolName">Maktab nomini kiriting</Label>
                <Input id="customSchoolName" value={form.customSchoolName} onChange={onInput("customSchoolName")} required />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="gradeNumber">Klass raqami</Label>
              <Select
                value={form.gradeNumber}
                onValueChange={(value) => setForm((prev) => ({ ...prev, gradeNumber: value }))}
              >
                <SelectTrigger id="gradeNumber">
                  <SelectValue placeholder="1-11" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_NUMBERS.map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLetter">Klass harfi</Label>
              <Select
                value={gradeLetterSelectValue}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    gradeLetter:
                      value === GRADE_LETTER_NONE_VALUE
                        ? ""
                        : value === GRADE_LETTER_OTHER_VALUE
                          ? prev.gradeLetter
                          : value,
                  }))
                }
              >
                <SelectTrigger id="gradeLetter">
                  <SelectValue placeholder="Klass harfini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GRADE_LETTER_NONE_VALUE}>Tanlanmagan</SelectItem>
                  {GRADE_LETTER_OPTIONS.map((letter) => (
                    <SelectItem key={letter} value={letter}>
                      {letter}
                    </SelectItem>
                  ))}
                  <SelectItem value={GRADE_LETTER_OTHER_VALUE}>Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gradeLetterSelectValue === GRADE_LETTER_OTHER_VALUE ? (
              <div className="space-y-2">
                <Label htmlFor="gradeLetterCustom">Klass harfi (qo'lda)</Label>
                <Input
                  id="gradeLetterCustom"
                  value={form.gradeLetter}
                  onChange={onInput("gradeLetter")}
                  placeholder="Masalan: CH"
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={onInput("email")} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input id="password" type="password" value={form.password} onChange={onInput("password")} required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={onInput("confirmPassword")} required />
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Akkauntingiz bormi?{" "}
            <Link to="/kirish" className="font-medium text-accent hover:underline">
              Tizimga kiring
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
