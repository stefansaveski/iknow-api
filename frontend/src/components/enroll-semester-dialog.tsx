"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type SubjectOption = {
  id: number;
  name?: string;
  code?: string;
  credits: number;
  mandatorySemester: number;
  alreadyPassed: boolean;
};

type MajorOption = {
  id: number;
  name?: string;
  subjects: SubjectOption[];
};

type SemesterOption = {
  id: number;
  name?: string;
  year: number;
  type?: string;
};

type EnrollmentOptions = {
  requiredSubjects: number;
  semesters: SemesterOption[];
  majors: MajorOption[];
  defaultMajorId: number | null;
};

export default function EnrollSemesterDialog({
  open,
  onClose,
  onEnrolled,
}: {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const { t } = useTranslation();

  const [options, setOptions] = useState<EnrollmentOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [majorId, setMajorId] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        if (!token) throw new Error(t("enroll_not_signed_in"));

        const res = await fetch(apiUrl("/api/enrollment/options"), {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${t("enroll_options_failed")} (${res.status})`);

        const data = (await res.json()) as EnrollmentOptions;
        if (cancelled) return;

        setOptions(data);
        setSemesterId(data.semesters[0]?.id ?? null);
        setMajorId(data.defaultMajorId ?? data.majors[0]?.id ?? null);
        setPicked([]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const required = options?.requiredSubjects ?? 5;

  const subjects = useMemo(
    () => options?.majors.find((m) => m.id === majorId)?.subjects ?? [],
    [options, majorId],
  );

  function toggle(subjectId: number) {
    setPicked((prev) => {
      if (prev.includes(subjectId)) return prev.filter((id) => id !== subjectId);
      if (prev.length >= required) return prev; // the cap is the point of the form
      return [...prev, subjectId];
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error(t("enroll_not_signed_in"));

      const res = await fetch(apiUrl("/api/enrollment"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          SemesterId: semesterId,
          MajorId: majorId,
          SubjectIds: picked,
        }),
      });

      const body = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.message || `${t("enroll_failed")} (${res.status})`);
      }

      onEnrolled();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const noSemestersLeft = !loading && options !== null && options.semesters.length === 0;
  const canSubmit =
    !submitting && semesterId !== null && majorId !== null && picked.length === required;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl bg-primary px-6 py-4 text-white">
          <h2 className="text-xl font-bold">{t("enroll_semester")}</h2>
          <button
            className="rounded-lg px-3 py-1 text-sm hover:bg-white/20"
            onClick={onClose}
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-muted-foreground">{t("loading")}</p>
          ) : noSemestersLeft ? (
            <p className="text-muted-foreground">{t("enroll_no_semesters")}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col">
                  <label className="text-sm text-muted-foreground">{t("semester")}</label>
                  <select
                    className="rounded-lg border border-border bg-background px-3 py-2"
                    value={semesterId ?? ""}
                    onChange={(e) => setSemesterId(Number.parseInt(e.target.value, 10))}
                  >
                    {options?.semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-muted-foreground">{t("direction")}</label>
                  <select
                    className="rounded-lg border border-border bg-background px-3 py-2"
                    value={majorId ?? ""}
                    onChange={(e) => {
                      setMajorId(Number.parseInt(e.target.value, 10));
                      setPicked([]); // subjects differ per programme
                    }}
                  >
                    {options?.majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground">{t("subjects")}</h3>
                <span
                  className={`text-sm font-medium ${
                    picked.length === required ? "text-green-700" : "text-muted-foreground"
                  }`}
                >
                  {picked.length} / {required}
                </span>
              </div>

              <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-border">
                {subjects.map((s) => {
                  const checked = picked.includes(s.id);
                  const atLimit = !checked && picked.length >= required;
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
                        atLimit ? "opacity-50" : "cursor-pointer hover:bg-accent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={atLimit}
                        onChange={() => toggle(s.id)}
                      />
                      <span className="flex-1">
                        <span className="text-card-foreground">{s.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{s.code}</span>
                        {s.alreadyPassed && (
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            {t("enroll_already_passed")}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("enroll_semester_short")} {s.mandatorySemester} · {s.credits} {t("enroll_credits")}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              onClick={onClose}
              disabled={submitting}
            >
              {t("cancel")}
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() => void submit()}
              disabled={!canSubmit}
            >
              {submitting ? t("loading") : t("enroll_confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
