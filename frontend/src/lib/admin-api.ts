import { apiUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export type AdminResult = { ok: boolean; message?: string; id?: number | null };

export type SubjectRef = { id: number; name?: string; code?: string | null };

export type SubjectMajor = {
  majorId: number;
  majorName?: string;
  mandatorySemester: number;
};

export type AdminSubject = {
  id: number;
  name?: string;
  code?: string;
  awardedCredits: number;
  dependencyCredit?: number | null;
  majors: SubjectMajor[];
  prerequisites: SubjectRef[];
  enrolledCount: number;
};

export type AdminSemester = {
  id: number;
  year: number;
  type?: string;
  name?: string;
  enrolmentCount: number;
  uncoveredSubjects: SubjectRef[];
};

export type ScheduleRow = {
  subjectId: number;
  subjectName?: string;
  subjectCode?: string;
  professorId: number;
  professorName?: string;
};

export type ProfessorLoad = {
  professorId: number;
  professorName?: string;
  subjects: number;
};

export type Schedule = {
  semesterId: number;
  semesterName?: string;
  assignments: ScheduleRow[];
  load: ProfessorLoad[];
  uncoveredSubjects: SubjectRef[];
  allSubjects: SubjectRef[];
  professors: { id: number; name?: string }[];
};

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) throw new Error("You are not signed in.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** GET that throws with the server message rather than a bare status code. */
export async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { cache: "no-store", headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/** POST/PUT/DELETE returning the standard {ok, message} envelope. */
export async function adminSend(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<AdminResult> {
  const res = await fetch(apiUrl(path), {
    method,
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = (await res.json().catch(() => null)) as AdminResult | null;
  if (!res.ok || !result?.ok) {
    throw new Error(result?.message || `Request failed (${res.status})`);
  }
  return result;
}
