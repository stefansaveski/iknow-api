"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faChevronDown,
  faFileInvoice
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/lib/api';

interface Subject {
  id: number;
  code: string;
  hours: string;
  kojPat: number;
  name: string;
  semester: number;
  status: string;
  signature: string;
  group: string;
  professor: string;
}

type SemesterInfo = {
  id: number;
  name: string;
  status: string;
  serviceNumber: string | number;
};

type FinancialInfo = {
  sum: string | number;
  paid: string;
  due: string;
  materialCosts: string;
  credits: string;
  MKSA: string;
  electronicRegistration: string;
  eUKIM: string;
  bankProvision: string;
  total: string;
};

type CurrentSemester = {
  id: string;
  name: string;
  status: string;
  serviceNumber: string | number;
  ticketNumber: string;
  debt: string;
  financialInfo: FinancialInfo;
};

type SubjectsResponse = {
  currentSemester: CurrentSemester;
  semesters: SemesterInfo[];
  subjectsBySemester: Record<string, Subject[]>;
  semesterKeyById: Record<number, string>;
};

type ApiCurrentSemester = {
  id: string;
  name: string;
  status: string;
  serviceNumber: string | number;
  ticketNumber: string;
  debt: string;
  financialInfo: {
    sum: string | number;
    paid: string;
    due: string;
    materialCosts: string;
    credits: string;
    totalCredits?: string;
    mksa?: string;
    MKSA?: string;
    electronicRegistration: string;
    eUKIM: string;
    bankProvision: string;
    total: string;
  };
};

type ApiSubjectsResponse = {
  semesters: SemesterInfo[];
  currentSemester?: ApiCurrentSemester;
  currentSemestar?: ApiCurrentSemester;
  subjectsBySemester: Record<string, Subject[]>;
};

function normalizeKey(input: string) {
  return input.toLowerCase().replace(/\s|\(|\)|\.|,/g, '');
}

function detectSeasonFromName(name: string): 'summer' | 'winter' | null {
  const n = name.toLowerCase();
  if (n.includes('летен')) return 'summer';
  if (n.includes('зимски')) return 'winter';
  return null;
}

function buildSemesterKeyById(semesters: SemesterInfo[], keys: string[]) {
  const keyBySeason: Partial<Record<'summer' | 'winter', string>> = {};
  for (const key of keys) {
    const k = key.toLowerCase();
    if (k.includes('summer')) keyBySeason.summer = key;
    if (k.includes('winter')) keyBySeason.winter = key;
  }

  const mapping: Record<number, string> = {};
  for (const s of semesters) {
    const season = detectSeasonFromName(s.name);
    const mapped = season ? keyBySeason[season] : undefined;
    if (mapped) mapping[s.id] = mapped;
  }

  // Fallback: if we couldn't infer seasons, try matching by normalized names.
  if (Object.keys(mapping).length === 0) {
    for (const s of semesters) {
      const ns = normalizeKey(s.name);
      const match = keys.find((k) => normalizeKey(k).includes(ns) || ns.includes(normalizeKey(k)));
      if (match) mapping[s.id] = match;
    }
  }

  // Last resort: map in order.
  if (Object.keys(mapping).length === 0) {
    semesters.forEach((s, idx) => {
      if (keys[idx]) mapping[s.id] = keys[idx];
    });
  }

  return mapping;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const TableCell = ({ children, className = "" }: TableCellProps) => (
  <td className={`px-4 py-3 text-sm border-b border-border ${className}`}>
    {children}
  </td>
);

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const baseClasses = "px-3 py-1 rounded-md text-xs font-medium";
  if (status === t('mandatory_short')) {
    return (
      <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
        {t('mandatory_short')}
      </span>
    );
  } else if (status === t('elective_short')) {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-800`}>
        {t('elective_short')}
      </span>
    );
  }
  return (
    <span className={`${baseClasses} bg-accent text-gray-800`}>
      {t(status) || status}
    </span>
  );
};

export default function SubjectsPage() {
  const [subjectsData, setSubjectsData] = useState<SubjectsResponse | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);

      const token = getAccessToken();
      if (!token) {
        setErrorMessage('Not authenticated. Please login again.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/user/getSubjects'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(text || `Failed to load subjects (${response.status})`);
        }

        const apiData = (await response.json()) as ApiSubjectsResponse;
        if (cancelled) return;

        const current = apiData.currentSemester ?? apiData.currentSemestar;
        if (!current) {
          throw new Error('Response missing currentSemestar/currentSemester');
        }

        const keys = Object.keys(apiData.subjectsBySemester ?? {});
        const semesterKeyById = buildSemesterKeyById(apiData.semesters ?? [], keys);

        const normalized: SubjectsResponse = {
          semesters: apiData.semesters ?? [],
          subjectsBySemester: apiData.subjectsBySemester ?? {},
          semesterKeyById,
          currentSemester: {
            id: current.id,
            name: current.name,
            status: current.status,
            serviceNumber: current.serviceNumber,
            ticketNumber: current.ticketNumber,
            debt: current.debt,
            financialInfo: {
              sum: current.financialInfo.sum,
              paid: current.financialInfo.paid,
              due: current.financialInfo.due,
              materialCosts: current.financialInfo.materialCosts,
              credits: current.financialInfo.credits,
              MKSA: current.financialInfo.MKSA ?? current.financialInfo.mksa ?? '',
              electronicRegistration: current.financialInfo.electronicRegistration,
              eUKIM: current.financialInfo.eUKIM,
              bankProvision: current.financialInfo.bankProvision,
              total: current.financialInfo.total,
            },
          },
        };

        setSubjectsData(normalized);

        setSelectedSemester((prev) => {
          if (prev !== null) return prev;
          const season = detectSeasonFromName(current.name);
          if (season) {
            const key = keys.find((k) => k.toLowerCase().includes(season));
            if (key) {
              const matchId = normalized.semesters.find((s) => normalized.semesterKeyById[s.id] === key)?.id;
              if (typeof matchId === 'number') return matchId;
            }
          }
          return normalized.semesters[0]?.id ?? null;
        });
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load subjects.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          {t('loading')}
        </div>
      </div>
    );
  }

  if (errorMessage || !subjectsData || selectedSemester === null) {
    return (
      <div className="min-h-screen pb-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage ?? t('failed_to_load_subjects')}
        </div>
      </div>
    );
  }
  
  const currentSemesterData =
    subjectsData.semesters.find((s) => s.id === selectedSemester) ?? subjectsData.semesters[0];
  const semesterKey =
    subjectsData.semesterKeyById[selectedSemester] ??
    Object.keys(subjectsData.subjectsBySemester)[0];
  const currentSubjects: Subject[] = semesterKey ? subjectsData.subjectsBySemester[semesterKey] || [] : [];
  const { currentSemester } = subjectsData;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-primary text-white rounded-xl p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-full p-4">
            <FontAwesomeIcon icon={faBook} className="text-3xl text-[#0272D1]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('subjects')}</h1>
            <p className="text-lg opacity-90">
              {t('subjects_overview')}
            </p>
          </div>
        </div>
      </div>

      {/* Status and Selection Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column - Status and Dropdown */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Status Card */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="text-sm text-muted-foreground mb-2">
              {t('status')}: <span className="text-primary font-semibold">{t('enrolled_by_student')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('ticket_number')}: <span className="font-semibold">{currentSemester.ticketNumber}</span>
            </div>
          </div>

          {/* Semester Selection */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="text-sm text-muted-foreground mb-2">
              {t('debt_from_documents')}: <span className="font-semibold">{currentSemester.debt}</span>
            </div>
            
            <div className="relative mt-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('select_semester')}:
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">
                      {currentSemesterData.name}
                    </span>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                    {subjectsData.semesters.map((semester) => (
                      <button
                        key={semester.id}
                        onClick={() => {
                          setSelectedSemester(semester.id);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent focus:outline-none focus:bg-accent first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="font-medium text-card-foreground">{semester.name}</div>
                        <div className="text-xs text-muted-foreground">{t('status')}: {semester.status}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm">
              <div className="text-primary font-medium">
                {t('serial_number')}: {currentSemesterData.serviceNumber}
              </div>
            </div>
          </div>

          {/* Enrolled Subjects */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faBook} className="w-4 h-4 text-primary" />
              {t('enrolled_subjects')}
            </h3>
            <div className="text-3xl font-bold text-primary">
              {currentSubjects.length}
            </div>
          </div>
        </div>

        {/* Right Column - Financial Information */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="bg-primary text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faFileInvoice} />
                {t('financial_info')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Financial Column */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('sum')}:</span>
                    <span className="font-semibold text-primary">{currentSemester.financialInfo.sum}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('paid')}:</span>
                    <span className="font-semibold text-green-600">{currentSemester.financialInfo.paid}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('due')}:</span>
                    <span className="font-semibold text-red-600">{currentSemester.financialInfo.due}</span>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">{t('material_costs')}:</div>
                    <div className="text-sm text-blue-700">{t('material_costs_info')}</div>
                  </div>
                </div>

                {/* Right Financial Column */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('credits')}:</span>
                    <span className="font-semibold text-primary">{currentSemester.financialInfo.credits}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('mksa')}:</span>
                    <span className="font-semibold">{currentSemester.financialInfo.MKSA}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('electronic_registration')}:</span>
                    <span className="font-semibold">{currentSemester.financialInfo.electronicRegistration}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('eukim')}:</span>
                    <span className="font-semibold">{currentSemester.financialInfo.eUKIM}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{t('bank_provision')}:</span>
                    <span className="font-semibold">{currentSemester.financialInfo.bankProvision}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-primary bg-primary bg-opacity-5 rounded-lg px-4">
                    <span className="font-bold text-white">{t('total')}:</span>
                    <span className="font-bold text-xl text-white">{currentSemester.financialInfo.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-primary text-white px-6 py-4">
          <h2 className="text-xl font-bold">{t('subjects_list')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('code')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('hours')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('which_time')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('subject')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('semester')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('status')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('signature')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('group')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('professor')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentSubjects.map((subject: Subject) => (
                <tr key={subject.id} className="hover:bg-accent transition-colors">
                  <TableCell className="font-medium text-card-foreground">{subject.id}</TableCell>
                  <TableCell className="font-mono text-sm text-primary font-medium">{subject.code}</TableCell>
                  <TableCell className="font-medium">{subject.hours}</TableCell>
                  <TableCell className="text-center font-medium">{subject.kojPat}</TableCell>
                  <TableCell className="font-medium text-card-foreground max-w-xs">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBook} className="w-4 h-4 text-primary" />
                      {t(subject.name, subject.name)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-primary">{t(subject.semester.toString(), subject.semester.toString())}</TableCell>
                  <TableCell>
                    <StatusBadge status={subject.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.signature ? t(subject.signature, subject.signature) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {subject.group ? t(subject.group, subject.group) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {subject.professor ? t(subject.professor, subject.professor) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
