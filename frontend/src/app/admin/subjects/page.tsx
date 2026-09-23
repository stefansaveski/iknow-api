"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminGet,
  adminSend,
  type AdminSubject,
  type SubjectRef,
} from "@/lib/admin-api";

const EMPTY_FORM = { name: "", code: "", awardedCredits: 6, dependencyCredit: 0 };

export default function AdminSubjectsPage() {
  const { t } = useTranslation();

  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [majors, setMajors] = useState<SubjectRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([
        adminGet<AdminSubject[]>("/api/admin/subjects"),
        adminGet<SubjectRef[]>("/api/admin/majors"),
      ]);
      setSubjects(s);
      setMajors(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<{ message?: string }>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      setNotice(result.message ?? null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.code ?? "").toLowerCase().includes(q),
    );
  }, [subjects, query]);

  function startEdit(s: AdminSubject) {
    setEditingId(s.id);
    setForm({
      name: s.name ?? "",
      code: s.code ?? "",
      awardedCredits: s.awardedCredits,
      dependencyCredit: s.dependencyCredit ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-primary text-white rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("admin_subjects")}</h1>
        <p className="text-lg opacity-90">{t("admin_subjects_intro")}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      {/* create / edit */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">
          {editingId === null ? t("admin_new_subject") : t("admin_edit_subject")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_subject_name")}</span>
            <input
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_subject_code")}</span>
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 font-mono"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_credits")}</span>
            <input
              type="number"
              min={1}
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={form.awardedCredits}
              onChange={(e) => setForm({ ...form, awardedCredits: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("admin_dependency_credit")}</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2"
              value={form.dependencyCredit}
              onChange={(e) => setForm({ ...form, dependencyCredit: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() =>
              void run(async () => {
                const body = {
                  Name: form.name,
                  Code: form.code,
                  AwardedCredits: form.awardedCredits,
                  DependencyCredit: form.dependencyCredit,
                };
                const result =
                  editingId === null
                    ? await adminSend("/api/admin/subjects", "POST", body)
                    : await adminSend(`/api/admin/subjects/${editingId}`, "PUT", body);
                cancelEdit();
                return result;
              })
            }
          >
            {editingId === null ? t("admin_create") : t("admin_save")}
          </button>
          {editingId !== null && (
            <button
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              onClick={cancelEdit}
              disabled={busy}
            >
              {t("cancel")}
            </button>
          )}
        </div>
      </div>

      {/* list */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 bg-primary text-white px-6 py-4">
          <h2 className="text-xl font-bold">
            {t("admin_subjects")} ({filtered.length})
          </h2>
          <input
            className="rounded-lg px-3 py-2 text-card-foreground bg-background"
            placeholder={t("admin_search_subject")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_subject_code")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_subject_name")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_credits")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_majors")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("admin_prerequisites")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4 text-muted-foreground" colSpan={6}>{t("loading")}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-4 text-muted-foreground" colSpan={6}>{t("admin_no_subjects")}</td></tr>
              ) : (
                filtered.map((s) => (
                  <ExpandableRow
                    key={s.id}
                    subject={s}
                    majors={majors}
                    subjects={subjects}
                    busy={busy}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onEdit={() => startEdit(s)}
                    run={run}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExpandableRow({
  subject,
  majors,
  subjects,
  busy,
  expanded,
  onToggle,
  onEdit,
  run,
}: {
  subject: AdminSubject;
  majors: SubjectRef[];
  subjects: AdminSubject[];
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  run: (action: () => Promise<{ message?: string }>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [majorId, setMajorId] = useState<number | "">("");
  const [semester, setSemester] = useState(1);
  const [prereqId, setPrereqId] = useState<number | "">("");

  // A subject already taken by students cannot be deleted; the FK forbids it.
  const deletable = subject.enrolledCount === 0;

  return (
    <>
      <tr className="hover:bg-accent">
        <td className="px-4 py-3 border-b font-mono text-card-foreground">{subject.code}</td>
        <td className="px-4 py-3 border-b text-card-foreground">{subject.name}</td>
        <td className="px-4 py-3 border-b text-card-foreground">{subject.awardedCredits}</td>
        <td className="px-4 py-3 border-b text-sm text-muted-foreground">
          {subject.majors.length === 0 ? "—" : subject.majors.map((m) => `${m.majorName} (${m.mandatorySemester})`).join(", ")}
        </td>
        <td className="px-4 py-3 border-b text-sm text-muted-foreground">
          {subject.prerequisites.length === 0 ? "—" : subject.prerequisites.map((p) => p.code).join(", ")}
        </td>
        <td className="px-4 py-3 border-b">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-border px-3 py-1.5 text-sm" onClick={onToggle}>
              {expanded ? t("admin_close") : t("admin_manage")}
            </button>
            <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50" onClick={onEdit} disabled={busy}>
              {t("edit_grade") === "Измени оценка" ? "Измени" : "Edit"}
            </button>
            <button
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
              disabled={busy || !deletable}
              title={deletable ? undefined : t("admin_delete_blocked", { count: subject.enrolledCount })}
              onClick={() => void run(() => adminSend(`/api/admin/subjects/${subject.id}`, "DELETE"))}
            >
              {t("admin_delete")}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="border-b bg-accent/40 px-4 py-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* majors */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-2">{t("admin_majors")}</h3>
                <ul className="mb-3 space-y-1 text-sm">
                  {subject.majors.map((m) => (
                    <li key={m.majorId} className="flex items-center justify-between gap-2">
                      <span>{m.majorName} — {t("enroll_semester_short")} {m.mandatorySemester}</span>
                      <button
                        className="text-red-700 hover:underline"
                        disabled={busy}
                        onClick={() => void run(() => adminSend(`/api/admin/subjects/${subject.id}/majors/${m.majorId}`, "DELETE"))}
                      >
                        {t("admin_remove")}
                      </button>
                    </li>
                  ))}
                  {subject.majors.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={majorId}
                    onChange={(e) => setMajorId(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="">{t("admin_pick_major")}</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                  />
                  <button
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    disabled={busy || majorId === ""}
                    onClick={() =>
                      void run(() =>
                        adminSend(`/api/admin/subjects/${subject.id}/majors`, "POST", {
                          MajorId: majorId,
                          MandatorySemester: semester,
                        }),
                      )
                    }
                  >
                    {t("admin_add")}
                  </button>
                </div>
              </div>

              {/* prerequisites */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-2">{t("admin_prerequisites")}</h3>
                <ul className="mb-3 space-y-1 text-sm">
                  {subject.prerequisites.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span>{p.code} — {p.name}</span>
                      <button
                        className="text-red-700 hover:underline"
                        disabled={busy}
                        onClick={() => void run(() => adminSend(`/api/admin/subjects/${subject.id}/prerequisites/${p.id}`, "DELETE"))}
                      >
                        {t("admin_remove")}
                      </button>
                    </li>
                  ))}
                  {subject.prerequisites.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={prereqId}
                    onChange={(e) => setPrereqId(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="">{t("admin_pick_prerequisite")}</option>
                    {subjects
                      .filter((other) => other.id !== subject.id)
                      .map((other) => (
                        <option key={other.id} value={other.id}>{other.code} — {other.name}</option>
                      ))}
                  </select>
                  <button
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    disabled={busy || prereqId === ""}
                    onClick={() =>
                      void run(() =>
                        adminSend(`/api/admin/subjects/${subject.id}/prerequisites`, "POST", {
                          DependencyId: prereqId,
                        }),
                      )
                    }
                  >
                    {t("admin_add")}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
