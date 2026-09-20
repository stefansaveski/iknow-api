"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminGet, adminSend, type AdminSemester } from "@/lib/admin-api";

export default function AdminSemestersPage() {
  const { t } = useTranslation();

  const [semesters, setSemesters] = useState<AdminSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<"winter" | "summer">("winter");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSemesters(await adminGet<AdminSemester[]>("/api/admin/semesters"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await adminSend("/api/admin/semesters", "POST", { Year: year, Type: type });
      setNotice(result.message ?? null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-primary text-white rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("admin_semesters")}</h1>
        <p className="text-lg opacity-90">{t("admin_semesters_intro")}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">{t("admin_new_semester")}</h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_year")}</span>
            <input
              type="number"
              min={2000}
              max={2100}
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_type")}</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as "winter" | "summer")}
            >
              <option value="winter">{t("admin_winter")}</option>
              <option value="summer">{t("admin_summer")}</option>
            </select>
          </label>
          <button
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void create()}
          >
            {t("admin_open_semester")}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-primary text-white px-6 py-4">
          <h2 className="text-xl font-bold">{t("admin_open_semesters")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("semester")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_enrolments")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_coverage")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4 text-muted-foreground" colSpan={4}>{t("loading")}</td></tr>
              ) : semesters.length === 0 ? (
                <tr><td className="px-4 py-4 text-muted-foreground" colSpan={4}>{t("admin_no_semesters")}</td></tr>
              ) : (
                semesters.map((s) => {
                  const uncovered = s.uncoveredSubjects.length;
                  return (
                    <>
                      <tr key={s.id} className="hover:bg-accent">
                        <td className="px-4 py-3 border-b text-card-foreground">{s.name}</td>
                        <td className="px-4 py-3 border-b text-card-foreground">{s.enrolmentCount}</td>
                        <td className="px-4 py-3 border-b">
                          {uncovered === 0 ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                              {t("admin_fully_covered")}
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-900">
                              {t("admin_uncovered_count", { count: uncovered })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {uncovered > 0 && (
                            <button
                              className="rounded-lg border border-border px-3 py-1.5 text-sm"
                              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            >
                              {expandedId === s.id ? t("admin_close") : t("admin_show_uncovered")}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === s.id && uncovered > 0 && (
                        <tr key={`${s.id}-detail`}>
                          <td colSpan={4} className="border-b bg-accent/40 px-4 py-4 text-sm">
                            <p className="mb-2 text-muted-foreground">{t("admin_uncovered_hint")}</p>
                            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                              {s.uncoveredSubjects.map((u) => (
                                <li key={u.id} className="text-card-foreground">
                                  <span className="font-mono">{u.code}</span> — {u.name}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
