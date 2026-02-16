import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Search } from "lucide-react";

import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/pages/admin/AdminPageHeader";
import { FeedbackMessage, FeedbackStatus } from "@/pages/admin/admin-types";
import { formatDate } from "@/pages/admin/admin-ui";
import { useAdminMutation } from "@/pages/admin/use-admin-mutation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusOptions: FeedbackStatus[] = ["NEW", "READ", "RESOLVED", "ARCHIVED"];

function statusBadge(status: FeedbackStatus) {
  if (status === "NEW") return <Badge className="bg-blue-600">Yangi</Badge>;
  if (status === "READ") return <Badge className="bg-amber-600">O'qilgan</Badge>;
  if (status === "RESOLVED") return <Badge className="bg-emerald-600">Hal qilingan</Badge>;
  return <Badge variant="secondary">Arxiv</Badge>;
}

type FeedbackResponse = {
  total: number;
  messages: FeedbackMessage[];
};

export default function AdminFeedbackPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FeedbackStatus>("ALL");
  const [take, setTake] = useState("100");
  const adminMutation = useAdminMutation();

  const feedbackQuery = useQuery({
    queryKey: ["admin", "feedback", search, statusFilter, take],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("take", take);
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      return apiFetch<FeedbackResponse>(`/admin/feedback?${params.toString()}`);
    },
  });

  const counters = useMemo(() => {
    const messages = feedbackQuery.data?.messages || [];
    return {
      total: feedbackQuery.data?.total || 0,
      newCount: messages.filter((item) => item.status === "NEW").length,
      readCount: messages.filter((item) => item.status === "READ").length,
      resolvedCount: messages.filter((item) => item.status === "RESOLVED").length,
    };
  }, [feedbackQuery.data?.messages, feedbackQuery.data?.total]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Qayta aloqa xabarlari"
        description="Saytdan kelgan barcha murojaatlar. Statusni boshqarish va tezkor ko'rib chiqish."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_220px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ism, email, mavzu yoki xabar bo'yicha qidiring..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | FeedbackStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Barcha status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "NEW" ? "Yangi" : status === "READ" ? "O'qilgan" : status === "RESOLVED" ? "Hal qilingan" : "Arxiv"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          <Select value={take} onValueChange={setTake}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="300">300</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Jami</p>
            <p className="text-2xl font-bold">{counters.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Yangi</p>
            <p className="text-2xl font-bold">{counters.newCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">O'qilgan</p>
            <p className="text-2xl font-bold">{counters.readCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Hal qilingan</p>
            <p className="text-2xl font-bold">{counters.resolvedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Xabarlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(feedbackQuery.data?.messages || []).map((message) => (
            <div key={message.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{message.name}</p>
                    {statusBadge(message.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{message.email}{message.phone ? ` | ${message.phone}` : ""}</p>
                  <p className="mt-1 text-sm font-medium">{message.subject || "Mavzusiz"}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{message.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Yuborilgan: {formatDate(message.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    Ko'rilgan: {formatDate(message.reviewedAt)}
                    {message.reviewedBy ? ` | ${message.reviewedBy.name}` : ""}
                  </p>
                </div>

                <div className="w-full md:w-44">
                  <Select
                    value={message.status}
                    onValueChange={(value) =>
                      adminMutation.mutate({
                        path: `/admin/feedback/${message.id}`,
                        method: "PATCH",
                        body: { status: value as FeedbackStatus },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "NEW" ? "Yangi" : status === "READ" ? "O'qilgan" : status === "RESOLVED" ? "Hal qilingan" : "Arxiv"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          {(feedbackQuery.data?.messages || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Murojaatlar topilmadi.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
