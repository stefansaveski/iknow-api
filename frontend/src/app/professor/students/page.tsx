"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

type UsersBySubject = {
  /** users.id - what the grading endpoints expect as StudentId. */
  id: number;
  name?: string;
  /** users.index - the number shown to the professor and searched on. */
  index?: string;
  grade: number;
  semester?: string;
};

type SubjectsAndUsers = {
  name?: string;
  id?: number;
  code?: string;
  users: UsersBySubject[];
};

type GradePayload = {
  StudentId: number;
  SubjectId: number;
  Grade: number;
};

type FlatRow = {
  studentIdNum: number;
  studentIndex: string;
  studentName: string;
  subjectId: number;
  subjectName: string;
  semester: string;
  grade: number;
};

export default function ProfessorStudentsPage() {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<SubjectsAndUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [studentIdQuery, setStudentIdQuery] = useState<string>("");

  const [gradeSelection, setGradeSelection] = useState<Record<string, number>>({});
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("You are not signed in.");
      }

      const res = await fetch(apiUrl("/api/prof/students"), {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch students (${res.status})`);
      }
      const data = (await res.json()) as SubjectsAndUsers[];
      setSubjects(data);

      const nextSelections: Record<string, number> = {};
      for (const subj of data) {
        if (!subj.id) continue;
        for (const u of subj.users) {
          const key = `${subj.id}:${u.id}`;
          // grade_type only declares 6..10, so an ungraded row starts at 6.
          nextSelections[key] = u.grade >= 6 && u.grade <= 10 ? u.grade : 6;
        }
      }
      setGradeSelection(nextSelections);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    for (const subj of subjects) {
      if (!subj.id) continue;
      for (const u of subj.users) {
        rows.push({
          studentIdNum: u.id,
          studentIndex: u.index ?? "",
          studentName: u.name ?? "",
          subjectId: subj.id,
          subjectName: subj.name ?? "",
          semester: u.semester ?? "",
          grade: u.grade,
        });
      }
    }
    return rows;
  }, [subjects]);

  const filteredRows = useMemo(() => {
    const q = studentIdQuery.trim();
    return flatRows.filter((r) => {
      if (subjectFilter !== "all" && String(r.subjectId) !== subjectFilter) return false;
      if (q.length > 0 && !r.studentIndex.includes(q)) return false;
      return true;
    });
  }, [flatRows, subjectFilter, studentIdQuery]);

  async function postGrade(url: string, payload: GradePayload, busyKey: string) {
    setActionBusyKey(busyKey);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("You are not signed in.");
      }

      const res = await fetch(apiUrl(url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.message || `Request failed (${res.status})`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionBusyKey(null);
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-card-foreground">{t('prof_students_title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('prof_students_data_note')} <span className="font-mono">/api/prof/students</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">{t('filter_by_subject')}</label>
            <select
              className="border border-border rounded-lg px-3 py-2"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">{t('all_subjects')}</option>
              {subjects
                .filter((s) => typeof s.id === "number")
                .map((s) => (
                  <option key={String(s.id)} value={String(s.id)}>
                    {s.name ?? `${t('subject')} ${s.id}`}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">{t('find_student_by_id')}</label>
            <input
              className="border border-border rounded-lg px-3 py-2"
              placeholder={t('student_id_placeholder')}
              value={studentIdQuery}
              onChange={(e) => setStudentIdQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-border rounded-lg overflow-hidden">
          <thead className="bg-accent">
            <tr>
              <th className="text-left text-sm font-semibold text-muted-foreground px-4 py-3 border-b">{t('student')}</th>
              <th className="text-left text-sm font-semibold text-muted-foreground px-4 py-3 border-b">{t('id')}</th>
              <th className="text-left text-sm font-semibold text-muted-foreground px-4 py-3 border-b">{t('subject')}</th>
              <th className="text-left text-sm font-semibold text-muted-foreground px-4 py-3 border-b">{t('grade')}</th>
              <th className="text-left text-sm font-semibold text-muted-foreground px-4 py-3 border-b">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                  {t('loading')}
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                  {t('no_students_found')}
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const key = `${r.subjectId}:${r.studentIdNum}`;
                const selected = gradeSelection[key] ?? 6;
                const busy = actionBusyKey === key;

                return (
                  <tr key={key} className="hover:bg-accent">
                    <td className="px-4 py-3 border-b text-card-foreground">{r.studentName}</td>
                    <td className="px-4 py-3 border-b text-card-foreground">{r.studentIndex}</td>
                    <td className="px-4 py-3 border-b text-card-foreground">
                      {r.subjectName}
                      {r.semester && (
                        <span className="block text-xs text-muted-foreground">{r.semester}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        <select
                          className="border border-border rounded-lg px-3 py-2"
                          value={selected}
                          onChange={(e) =>
                            setGradeSelection((prev) => ({
                              ...prev,
                              [key]: Number.parseInt(e.target.value, 10),
                            }))
                          }
                        >
                          {[6, 7, 8, 9, 10].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-muted-foreground">
                          {t('current')}: {r.grade > 0 ? r.grade : t('none')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busy}
                          className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-50"
                          onClick={() => {
                            void postGrade(
                              "/api/prof/grade/add",
                              { StudentId: r.studentIdNum, SubjectId: r.subjectId, Grade: selected },
                              key,
                            );
                          }}
                        >
                          {t('add_grade')}
                        </button>

                        <button
                          disabled={busy}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                          onClick={() => {
                            void postGrade(
                              "/api/prof/grade/edit",
                              { StudentId: r.studentIdNum, SubjectId: r.subjectId, Grade: selected },
                              key,
                            );
                          }}
                        >
                          {t('edit_grade')}
                        </button>

                        <button
                          disabled={busy}
                          className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium disabled:opacity-50"
                          onClick={() => {
                            void postGrade(
                              "/api/prof/grade/remove",
                              { StudentId: r.studentIdNum, SubjectId: r.subjectId, Grade: 0 },
                              key,
                            );
                          }}
                        >
                          {t('remove_grade')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
