import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CityDirectory, DistrictDirectory, RegionDirectory, SchoolDirectory, User } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import {
  GRADE_LETTER_NONE_VALUE,
  GRADE_LETTER_OPTIONS,
  GRADE_LETTER_OTHER_VALUE,
  GRADE_NUMBERS,
} from "@/constants/grade-options";

type EditFormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "ARCHIVED";
  password: string;
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

function composeName(form: Pick<EditFormState, "firstName" | "lastName" | "middleName">): string {
  return [form.lastName, form.firstName, form.middleName].filter(Boolean).join(" ").trim();
}

export default function AdminUserEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<EditFormState>({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    role: "USER",
    status: "ACTIVE",
    password: "",
    regionId: "",
    cityId: "",
    districtId: "",
    customDistrictName: "",
    schoolId: "",
    customSchoolName: "",
    gradeNumber: "",
    gradeLetter: "",
  });

  const userQuery = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => apiFetch<{ user: User }>(`/admin/users/${id}`),
    enabled: Boolean(id),
  });

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
    if (!userQuery.data?.user) return;
    const user = userQuery.data.user;
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleName: user.middleName || "",
      email: user.email,
      role: user.role === "SUPER_ADMIN" ? "ADMIN" : user.role,
      status: user.status,
      password: "",
      regionId: user.regionId || "",
      cityId: user.cityId || "",
      districtId: user.districtId || "",
      customDistrictName: user.customDistrictName || "",
      schoolId: user.schoolId || (user.customSchoolName ? OTHER_SCHOOL_VALUE : ""),
      customSchoolName: user.customSchoolName || "",
      gradeNumber: user.gradeNumber ? String(user.gradeNumber) : "",
      gradeLetter: user.gradeLetter || "",
    });
  }, [userQuery.data?.user]);

  const targetUser = userQuery.data?.user;
  const isProtectedUser = targetUser?.role === "SUPER_ADMIN";
  const canManageRoles = currentUser?.role === "SUPER_ADMIN";
  const canEditRole = canManageRoles && !isProtectedUser;
  const districtSelectValue = form.districtId || (form.customDistrictName ? OTHER_DISTRICT_VALUE : "__none__");
  const isOtherDistrict = districtSelectValue === OTHER_DISTRICT_VALUE;
  const gradeLetterUpper = form.gradeLetter.trim().toUpperCase();
  const gradeLetterSelectValue = gradeLetterUpper
    ? GRADE_LETTER_OPTIONS.includes(gradeLetterUpper as (typeof GRADE_LETTER_OPTIONS)[number])
      ? gradeLetterUpper
      : GRADE_LETTER_OTHER_VALUE
    : GRADE_LETTER_NONE_VALUE;

  const fullName = useMemo(() => composeName(form), [form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;

      await apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: {
          name: fullName || targetUser?.name || undefined,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          middleName: form.middleName.trim() || undefined,
          email: form.email.trim().toLowerCase(),
          status: form.status,
          ...(canEditRole ? { role: form.role } : {}),
          regionId: form.regionId || null,
          cityId: form.cityId || null,
          districtId: form.districtId || null,
          customDistrictName: form.districtId ? null : form.customDistrictName.trim() || null,
          schoolId: form.schoolId && form.schoolId !== OTHER_SCHOOL_VALUE ? form.schoolId : null,
          customSchoolName: form.schoolId === OTHER_SCHOOL_VALUE ? form.customSchoolName.trim() : null,
          gradeNumber: form.gradeNumber ? Number(form.gradeNumber) : null,
          gradeLetter: form.gradeLetter.trim() || null,
          ...(form.password ? { password: form.password } : {}),
        },
      });
    },
    onSuccess: () => {
      toast({ title: "Foydalanuvchi yangilandi" });
      navigate("/admin/users");
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Yangilab bo'lmadi",
        variant: "destructive",
      });
    },
  });

  if (userQuery.isLoading) {
    return <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!userQuery.data?.user) {
    return (
      <div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Foydalanuvchi topilmadi</p>
            <Button asChild className="mt-4">
              <Link to="/admin/users">Foydalanuvchilar ro'yxatiga qaytish</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Foydalanuvchini tahrirlash" description="Profil, rol, status, joylashuv, maktab va parolni yangilash." />
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Foydalanuvchini tahrirlash</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProtectedUser && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
              Bosh admin yozuvi himoyalangan: uni o'zgartirish yoki arxivlash mumkin emas.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">Familiya</Label>
              <Input
                id="lastName"
                value={form.lastName}
                disabled={isProtectedUser}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Ism</Label>
              <Input
                id="firstName"
                value={form.firstName}
                disabled={isProtectedUser}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="middleName">Sharif</Label>
              <Input
                id="middleName"
                value={form.middleName}
                disabled={isProtectedUser}
                onChange={(event) => setForm((prev) => ({ ...prev, middleName: event.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Ko'rinadigan ism:</span> <span className="font-medium">{fullName || targetUser.name}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              disabled={isProtectedUser}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              {isProtectedUser ? (
                <Input value="SUPER_ADMIN" disabled />
              ) : (
                <Select
                  value={form.role}
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
              )}
              {!canManageRoles && !isProtectedUser ? <p className="text-xs text-muted-foreground">Rolni faqat SUPER_ADMIN o'zgartira oladi.</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                disabled={isProtectedUser}
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Viloyat</Label>
              <Select
                value={form.regionId || "__none__"}
                disabled={isProtectedUser}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    regionId: value === "__none__" ? "" : value,
                    cityId: "",
                    districtId: "",
                    schoolId: "",
                    customSchoolName: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanlanmagan</SelectItem>
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
                disabled={!form.regionId || isProtectedUser}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    cityId: value === "__none__" ? "" : value,
                    districtId: "",
                    schoolId: "",
                    customSchoolName: "",
                  }))
                }
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
                disabled={!form.regionId || isProtectedUser}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    districtId: value === "__none__" || value === OTHER_DISTRICT_VALUE ? "" : value,
                    customDistrictName: value === OTHER_DISTRICT_VALUE ? prev.customDistrictName : "",
                    schoolId: value === OTHER_DISTRICT_VALUE ? OTHER_SCHOOL_VALUE : "",
                    customSchoolName: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanlanmagan</SelectItem>
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
                  disabled={isProtectedUser}
                  onChange={(event) => setForm((prev) => ({ ...prev, customDistrictName: event.target.value }))}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Maktab</Label>
              <Select
                value={form.schoolId || "__none__"}
                disabled={(!form.districtId && !isOtherDistrict) || isProtectedUser}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    schoolId: value === "__none__" ? "" : value,
                    customSchoolName: value === OTHER_SCHOOL_VALUE ? prev.customSchoolName : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanlanmagan</SelectItem>
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
                  disabled={isProtectedUser}
                  onChange={(event) => setForm((prev) => ({ ...prev, customSchoolName: event.target.value }))}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Klass raqami</Label>
              <Select
                value={form.gradeNumber || "__none__"}
                disabled={isProtectedUser}
                onValueChange={(value) => setForm((prev) => ({ ...prev, gradeNumber: value === "__none__" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanlanmagan</SelectItem>
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
                disabled={isProtectedUser}
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
                  disabled={isProtectedUser}
                  onChange={(event) => setForm((prev) => ({ ...prev, gradeLetter: event.target.value }))}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Yangi parol (ixtiyoriy)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Bo'sh qoldirsangiz o'zgarmaydi"
              value={form.password}
              disabled={isProtectedUser}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isProtectedUser}>
              {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
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
