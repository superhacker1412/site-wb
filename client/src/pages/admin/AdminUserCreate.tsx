import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { useToast } from "@/hooks/use-toast";
import {
  GRADE_LETTER_NONE_VALUE,
  GRADE_LETTER_OPTIONS,
  GRADE_LETTER_OTHER_VALUE,
  GRADE_NUMBERS,
} from "@/constants/grade-options";
import { CityDirectory, DistrictDirectory, RegionDirectory, SchoolDirectory } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateFormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "ARCHIVED";
  regionId: string;
  cityId: string;
  districtId: string;
  customDistrictName: string;
  schoolId: string;
  customSchoolName: string;
  gradeNumber: string;
  gradeLetter: string;
};

const OTHER_SCHOOL_VALUE = "__other__";
const OTHER_DISTRICT_VALUE = "__other_district__";

function composeName(form: CreateFormState): string {
  return [form.lastName, form.firstName, form.middleName].filter(Boolean).join(" ").trim();
}

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const canManageRoles = currentUser?.role === "SUPER_ADMIN";

  const [form, setForm] = useState<CreateFormState>({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    role: "USER",
    status: "ACTIVE",
    regionId: "",
    cityId: "",
    districtId: "",
    customDistrictName: "",
    schoolId: "",
    customSchoolName: "",
    gradeNumber: "",
    gradeLetter: "",
  });
  const [saving, setSaving] = useState(false);
  const districtSelectValue = form.districtId || (form.customDistrictName ? OTHER_DISTRICT_VALUE : "");
  const isOtherDistrict = districtSelectValue === OTHER_DISTRICT_VALUE;
  const gradeLetterUpper = form.gradeLetter.trim().toUpperCase();
  const gradeLetterSelectValue = gradeLetterUpper
    ? GRADE_LETTER_OPTIONS.includes(gradeLetterUpper as (typeof GRADE_LETTER_OPTIONS)[number])
      ? gradeLetterUpper
      : GRADE_LETTER_OTHER_VALUE
    : GRADE_LETTER_NONE_VALUE;

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions", "active"],
    queryFn: () => apiFetch<{ regions: RegionDirectory[] }>("/locations/regions"),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "locations", "cities", form.regionId],
    queryFn: () => apiFetch<{ cities: CityDirectory[] }>(`/locations/cities?regionId=${encodeURIComponent(form.regionId)}`),
    enabled: Boolean(form.regionId),
  });

  const districtsQuery = useQuery({
    queryKey: ["admin", "locations", "districts", form.regionId, form.cityId],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("regionId", form.regionId);
      if (form.cityId) params.set("cityId", form.cityId);
      return apiFetch<{ districts: DistrictDirectory[] }>(`/locations/districts?${params.toString()}`);
    },
    enabled: Boolean(form.regionId),
  });

  const schoolsQuery = useQuery({
    queryKey: ["admin", "locations", "schools", form.districtId],
    queryFn: () => apiFetch<{ schools: SchoolDirectory[] }>(`/locations/schools?districtId=${encodeURIComponent(form.districtId)}`),
    enabled: Boolean(form.districtId),
  });

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

  const onSubmit = async () => {
    const name = composeName(form);
    if (!name) {
      toast({
        title: "FIO kiritilmagan",
        description: "Kamida familiya/ism/sharif kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await apiFetch("/admin/users", {
        method: "POST",
        body: {
          name,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          middleName: form.middleName.trim() || undefined,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: canManageRoles ? form.role : "USER",
          status: form.status,
          regionId: form.regionId || undefined,
          cityId: form.cityId || null,
          districtId: form.districtId || null,
          customDistrictName: form.districtId ? null : form.customDistrictName.trim() || null,
          schoolId: form.schoolId && form.schoolId !== OTHER_SCHOOL_VALUE ? form.schoolId : null,
          customSchoolName: form.schoolId === OTHER_SCHOOL_VALUE ? form.customSchoolName.trim() : null,
          gradeNumber: form.gradeNumber ? Number(form.gradeNumber) : undefined,
          gradeLetter: form.gradeLetter.trim() || undefined,
        },
      });
      toast({ title: "Foydalanuvchi yaratildi" });
      navigate("/admin/users");
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Yaratib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Yangi foydalanuvchi" description="Yangi foydalanuvchi qo'shish sahifasi." />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">Familiya</Label>
            <Input id="lastName" value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">Ism</Label>
            <Input id="firstName" value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="middleName">Sharif</Label>
            <Input id="middleName" value={form.middleName} onChange={(event) => setForm((prev) => ({ ...prev, middleName: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={canManageRoles ? form.role : "USER"}
              disabled={!canManageRoles}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as "USER" | "ADMIN" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Foydalanuvchi</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {!canManageRoles ? <p className="text-xs text-muted-foreground">ADMIN rolini faqat SUPER_ADMIN bera oladi.</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as "ACTIVE" | "ARCHIVED" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Faol</SelectItem>
                <SelectItem value="ARCHIVED">Arxiv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Viloyat</Label>
            <Select value={form.regionId} onValueChange={(value) => setForm((prev) => ({ ...prev, regionId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(regionsQuery.data?.regions || []).map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shahar (ixtiyoriy)</Label>
            <Select
              value={form.cityId || "__none__"}
              onValueChange={(value) => setForm((prev) => ({ ...prev, cityId: value === "__none__" ? "" : value }))}
              disabled={!form.regionId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Shaharsiz</SelectItem>
                {(citiesQuery.data?.cities || []).map((city) => (
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
              disabled={!form.regionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(districtsQuery.data?.districts || []).map((district) => (
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
              <Label htmlFor="customDistrictName">Boshqa tuman nomi</Label>
              <Input
                id="customDistrictName"
                value={form.customDistrictName}
                onChange={(event) => setForm((prev) => ({ ...prev, customDistrictName: event.target.value }))}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Maktab</Label>
            <Select
              value={form.schoolId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, schoolId: value }))}
              disabled={!form.districtId && !isOtherDistrict}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                {form.districtId
                  ? (schoolsQuery.data?.schools || []).map((school) => (
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
              <Label htmlFor="customSchoolName">Boshqa maktab nomi</Label>
              <Input
                id="customSchoolName"
                value={form.customSchoolName}
                onChange={(event) => setForm((prev) => ({ ...prev, customSchoolName: event.target.value }))}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Klass raqami</Label>
            <Select value={form.gradeNumber} onValueChange={(value) => setForm((prev) => ({ ...prev, gradeNumber: value }))}>
              <SelectTrigger>
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
                onChange={(event) => setForm((prev) => ({ ...prev, gradeLetter: event.target.value }))}
              />
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Ko'rinadigan ism</span>
            <span className="font-medium">{composeName(form) || "-"}</span>
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Yaratish"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/users")}>
              Bekor qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
