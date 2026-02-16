import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit3, Eye, Plus, Search, UserX } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { roleLabel } from "@/lib/labels";
import { formatDate, statusBadge } from "@/pages/admin/admin-ui";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/api";
import { AdminCity, AdminDistrict, AdminRegion, AdminSchool } from "@/pages/admin/admin-types";
import { GRADE_LETTER_OPTIONS } from "@/constants/grade-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteConfirmButton from "@/components/admin/DeleteConfirmButton";

type UsersResponse = {
  users: Array<User & { createdAt: string; updatedAt: string }>;
};

function locationLabel(user: User): string {
  const region = user.region?.name;
  const city = user.city?.name;
  const district = user.district?.name || user.customDistrictName;
  const school = user.school?.name || user.customSchoolName;
  const grade = user.gradeNumber && user.gradeLetter ? `${user.gradeNumber}${user.gradeLetter}` : user.gradeNumber ? `${user.gradeNumber}` : null;

  return [region, city, district, school, grade ? `Sinf ${grade}` : null].filter(Boolean).join(" | ");
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [role, setRole] = useState<"ALL" | "USER" | "ADMIN" | "SUPER_ADMIN">("ALL");
  const [regionId, setRegionId] = useState("ALL");
  const [cityId, setCityId] = useState("ALL");
  const [districtId, setDistrictId] = useState("ALL");
  const [schoolId, setSchoolId] = useState("ALL");
  const [gradeNumber, setGradeNumber] = useState("ALL");
  const [gradeLetter, setGradeLetter] = useState("ALL");
  const { user: currentUser } = useAuth();
  const adminMutation = useAdminMutation();

  const regionsQuery = useQuery({
    queryKey: ["admin", "locations", "regions"],
    queryFn: () => apiFetch<{ regions: AdminRegion[] }>("/admin/locations/regions"),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "locations", "cities", regionId],
    queryFn: () =>
      apiFetch<{ cities: AdminCity[] }>(
        `/admin/locations/cities${regionId !== "ALL" ? `?regionId=${encodeURIComponent(regionId)}` : ""}`,
      ),
    enabled: regionId !== "ALL",
  });

  const districtsQuery = useQuery({
    queryKey: ["admin", "locations", "districts", regionId, cityId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (regionId !== "ALL") params.set("regionId", regionId);
      if (cityId !== "ALL") params.set("cityId", cityId);
      const query = params.toString();
      return apiFetch<{ districts: AdminDistrict[] }>(`/admin/locations/districts${query ? `?${query}` : ""}`);
    },
    enabled: regionId !== "ALL",
  });

  const schoolsQuery = useQuery({
    queryKey: ["admin", "locations", "schools", districtId],
    queryFn: () =>
      apiFetch<{ schools: AdminSchool[] }>(
        `/admin/locations/schools${districtId !== "ALL" ? `?districtId=${encodeURIComponent(districtId)}` : ""}`,
      ),
    enabled: districtId !== "ALL",
  });

  useEffect(() => {
    setCityId("ALL");
    setDistrictId("ALL");
    setSchoolId("ALL");
  }, [regionId]);

  useEffect(() => {
    setDistrictId("ALL");
    setSchoolId("ALL");
  }, [cityId]);

  useEffect(() => {
    setSchoolId("ALL");
  }, [districtId]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", search, status, role, regionId, cityId, districtId, schoolId, gradeNumber, gradeLetter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      if (role !== "ALL") params.set("role", role);
      if (regionId !== "ALL") params.set("regionId", regionId);
      if (cityId !== "ALL") params.set("cityId", cityId);
      if (districtId !== "ALL") params.set("districtId", districtId);
      if (schoolId !== "ALL") params.set("schoolId", schoolId);
      if (gradeNumber !== "ALL") params.set("gradeNumber", gradeNumber);
      if (gradeLetter !== "ALL") params.set("gradeLetter", gradeLetter);
      const query = params.toString();
      return apiFetch<UsersResponse>(`/admin/users${query ? `?${query}` : ""}`);
    },
  });

  const counts = useMemo(() => {
    const users = usersQuery.data?.users || [];
    return {
      total: users.length,
      active: users.filter((item) => item.status === "ACTIVE").length,
      archived: users.filter((item) => item.status === "ARCHIVED").length,
      admins: users.filter((item) => item.role === "ADMIN" || item.role === "SUPER_ADMIN").length,
    };
  }, [usersQuery.data?.users]);

  const canManageRoles = currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Foydalanuvchilar"
        description="Foydalanuvchilar ro'yxati, profil, tahrirlash, arxivlash va manzil/maktab filtrlari."
        actions={
          <Button asChild>
            <Link to="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Yangi user
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 lg:grid-cols-3">
            <div className="relative lg:col-span-3">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Ism/email/maktab bo'yicha qidirish..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>

            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha status</SelectItem>
                <SelectItem value="ACTIVE">Faol</SelectItem>
                <SelectItem value="ARCHIVED">Arxiv</SelectItem>
              </SelectContent>
            </Select>

            <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha role</SelectItem>
                <SelectItem value="USER">Foydalanuvchi</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Bosh admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeNumber} onValueChange={setGradeNumber}>
              <SelectTrigger>
                <SelectValue placeholder="Klass" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha klass</SelectItem>
                {Array.from({ length: 11 }, (_, index) => index + 1).map((grade) => (
                  <SelectItem key={grade} value={String(grade)}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={gradeLetter} onValueChange={setGradeLetter}>
              <SelectTrigger>
                <SelectValue placeholder="Klass harfi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha harflar</SelectItem>
                {GRADE_LETTER_OPTIONS.map((letter) => (
                  <SelectItem key={letter} value={letter}>
                    {letter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger>
                <SelectValue placeholder="Viloyat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha viloyat</SelectItem>
                {(regionsQuery.data?.regions || []).map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityId} onValueChange={setCityId} disabled={regionId === "ALL"}>
              <SelectTrigger>
                <SelectValue placeholder="Shahar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha shahar</SelectItem>
                {(citiesQuery.data?.cities || []).map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={districtId} onValueChange={setDistrictId} disabled={regionId === "ALL"}>
              <SelectTrigger>
                <SelectValue placeholder="Tuman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha tuman</SelectItem>
                {(districtsQuery.data?.districts || []).map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={schoolId} onValueChange={setSchoolId} disabled={districtId === "ALL"}>
              <SelectTrigger>
                <SelectValue placeholder="Maktab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha maktab</SelectItem>
                {(schoolsQuery.data?.schools || []).map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Jami</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Faol</p>
                <p className="text-2xl font-bold">{counts.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Arxiv</p>
                <p className="text-2xl font-bold">{counts.archived}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">Adminlar</p>
                <p className="text-2xl font-bold">{counts.admins}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(usersQuery.data?.users || []).map((user) => (
            <div key={user.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {user.name} ({user.email})
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {statusBadge(user.status)} <span className="ml-2">{roleLabel(user.role)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Ro'yxatdan o'tgan: {formatDate(user.createdAt)}</p>
                  {locationLabel(user) ? <p className="mt-1 text-xs text-muted-foreground">{locationLabel(user)}</p> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/users/${user.id}/profile`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </Button>

                  {user.role !== "SUPER_ADMIN" ? (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/users/${user.id}/edit`}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Tahrirlash
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={user.status === "ARCHIVED" ? "default" : "secondary"}
                        onClick={() =>
                          adminMutation.mutate({
                            path: `/admin/users/${user.id}/${user.status === "ARCHIVED" ? "unarchive" : "archive"}`,
                            method: "POST",
                          })
                        }
                        disabled={adminMutation.isPending}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        {user.status === "ARCHIVED" ? "Arxivdan chiqarish" : "Arxivlash"}
                      </Button>
                      <DeleteConfirmButton
                        entityTitle={`${user.name} (${user.email})`}
                        pending={adminMutation.isPending}
                        description={`"${user.name}" foydalanuvchisi butunlay o'chiriladi.`}
                        onConfirm={async () => {
                          await adminMutation.mutateAsync({
                            path: `/admin/users/${user.id}`,
                            method: "DELETE",
                          });
                        }}
                      />
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Bosh admin himoyalangan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {usersQuery.data?.users.length === 0 ? <p className="text-sm text-muted-foreground">Foydalanuvchi topilmadi.</p> : null}
          {!canManageRoles ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700">
              Rollarni boshqarish faqat SUPER_ADMIN uchun.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
