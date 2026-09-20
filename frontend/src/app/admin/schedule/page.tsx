"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminGet, adminSend, type AdminSemester, type Schedule } from "@/lib/admin-api";

export default function AdminSchedulePage() {
  const { t } = useTranslation();

  const [semesters, setSemesters] = useState<AdminSemester[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState<number | "">("");
  const [professorId, setProfessorId] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      try {
        const list = await adminGet<AdminSemester[]>("/api/admin/semesters");
        setSemesters(list);
        setSemesterId(list[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadSchedule = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      setSchedule(await adminGet<Schedule>(`/api/admin/schedule/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (semesterId !== null) void loadSchedule(semesterId);
  }, [semesterId, loadSchedule]);

  async function run(action: () => Promise<{ message?: string }>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      setNotice(result.message ?? null);
      if (semesterId !== null) await loadSchedule(semesterId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-primary text-white rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("admin_schedule")}</h1>
        <p className="text-lg opacity-90">{t("admin_schedule_intro")}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("semester")}</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={semesterId ?? ""}
              onChange={(e) => setSemesterId(Number(e.target.value))}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("subject")}</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">{t("admin_pick_subject")}</option>
              {schedule?.allSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_professor")}</span>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">{t("admin_pick_professor")}</option>
              {schedule?.professors.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <button
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy || subjectId === "" || professorId === "" || semesterId === null}
            onClick={() =>
              void run(() =>
                adminSend("/api/admin/schedule", "POST", {
                  ProfessorId: professorId,
                  SemesterId: semesterId,
                  SubjectId: subjectId,
                }),
              )
            }
          >
            {t("admin_assign")}
          </button>
        </div>
      </div>

      {schedule && schedule.uncoveredSubjects.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          <strong>{t("admin_uncovered_count", { count: schedule.uncoveredSubjects.length })}</strong>
          <span className="ml-2">{t("admin_uncovered_hint")}</span>
          <div className="mt-2 font-mono text-xs">
            {schedule.uncoveredSubjects.map((u) => u.code).join(", ")}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="bg-primary text-white px-6 py-4">
            <h2 className="text-xl font-bold">
              {t("admin_assignments")} {schedule ? `— ${schedule.semesterName}` : ""}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_subject_code")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("subject")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_professor")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-4 text-muted-foreground" colSpan={4}>{t("loading")}</td></tr>
                ) : !schedule || schedule.assignments.length === 0 ? (
                  <tr><td className="px-4 py-4 text-muted-foreground" colSpan={4}>{t("admin_no_assignments")}</td></tr>
                ) : (
                  schedule.assignments.map((a) => (
                    <tr key={`${a.subjectId}-${a.professorId}`} className="hover:bg-accent">
                      <td className="px-4 py-3 border-b font-mono text-card-foreground">{a.subjectCode}</td>
                      <td className="px-4 py-3 border-b text-card-foreground">{a.subjectName}</td>
                      <td className="px-4 py-3 border-b text-card-foreground">{a.professorName}</td>
                      <td className="px-4 py-3 border-b">
                        <button
                          className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                          disabled={busy}
                          onClick={() =>
                            void run(() =>
                              adminSend("/api/admin/schedule", "DELETE", {
                                ProfessorId: a.professorId,
                                SemesterId: schedule.semesterId,
                                SubjectId: a.subjectId,
                              }),
                            )
                          }
                        >
                          {t("admin_remove")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="bg-primary text-white px-6 py-4">
            <h2 className="text-xl font-bold">{t("admin_load")}</h2>
          </div>
          <ul className="divide-y divide-border">
            {schedule?.load.map((l) => (
              <li key={l.professorId} className="flex items-center justify-between px-4 py-3">
                <span className="text-card-foreground">{l.professorName}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-sm text-muted-foreground">{l.subjects}</span>
              </li>
            ))}
            {!schedule?.load.length && (
              <li className="px-4 py-3 text-muted-foreground">{t("admin_no_professors")}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
