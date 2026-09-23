"use client"
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { getAccessToken } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

type PassedSubject = {
  id: number;
  subjectId: number;
  code: string;
  subject: string;
  credits: number;
  grade: number;
  gradeText: string;
  date: string; // DD.MM.YYYY
  semester: string;
  professor: string;
};

type PassedSubjectsResponse = {
  passedSubjects: PassedSubject[];
};

type ExamRow = {
  id: number;
  code: string;
  subject: string;
  date: string;
  semester: string;
  credits: number;
  grade: number;
};

const Exams = () => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<'grade' | 'date' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        const response = await fetch(apiUrl('/api/user/getPassedSubjects'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(text || `Failed to load passed subjects (${response.status})`);
        }

        const data = (await response.json()) as PassedSubjectsResponse;
        const rows: ExamRow[] = (data?.passedSubjects ?? []).map((s) => ({
          id: s.id,
          code: s.code,
          subject: s.subject,
          date: s.date,
          semester: s.semester,
          credits: s.credits,
          grade: s.grade,
        }));

        if (!cancelled) setExams(rows);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load passed subjects.');
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

  const stats = useMemo(() => {
    const passed = exams.length;
    const creditsCurrent = exams.reduce((sum, s) => sum + (typeof s.credits === 'number' ? s.credits : 0), 0);
    const numericGrades = exams.map((e) => (typeof e.grade === 'number' ? e.grade : null)).filter((g): g is number => g !== null);
    const average =
      numericGrades.length > 0
        ? numericGrades.reduce((sum, g) => sum + g, 0) / numericGrades.length
        : 0;

    const totalCredits = 240;
    const totalExams = 40;
    return {
      average: Number.isFinite(average) ? Number(average.toFixed(2)) : 0,
      credits: { current: creditsCurrent, total: totalCredits },
      passed,
      remaining: Math.max(0, totalExams - passed),
    };
  }, [exams]);

  const getGradeColor = (grade: number) => {
    if (grade >= 9) return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    if (grade >= 8) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    if (grade >= 6) return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  };

  const handleSortByGrade = () => {
    if (sortField === 'grade') {
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else if (sortOrder === 'asc') {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('desc');
      }
    } else {
      setSortField('grade');
      setSortOrder('desc');
    }
  };

  const handleSortByDate = () => {
    if (sortField === 'date') {
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else if (sortOrder === 'asc') {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('desc');
      }
    } else {
      setSortField('date');
      setSortOrder('desc');
    }
  };

  const getSortedExams = () => {
    if (!sortField || !sortOrder) return exams;
    
    return [...exams].sort((a, b) => {
      if (sortField === 'grade') {
        return sortOrder === 'asc' ? a.grade - b.grade : b.grade - a.grade;
      }
      
      if (sortField === 'date') {
        // Convert date strings to Date objects for proper sorting
        const dateA = new Date(a.date.split('.').reverse().join('-')); // Convert DD.MM.YYYY to YYYY-MM-DD
        const dateB = new Date(b.date.split('.').reverse().join('-'));
        
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      
      return 0;
    });
  };

  const getSortIcon = (field: 'grade' | 'date') => {
    if (sortField === field) {
      if (sortOrder === 'asc') return faSortUp;
      if (sortOrder === 'desc') return faSortDown;
    }
    return faSort;
  };

  const creditsPercentage = stats.credits.total > 0 ? (stats.credits.current / stats.credits.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-6">
        {t('loading', 'Loading...')}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {t('failed_to_load_exams', errorMessage)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 space-y-6">
      {/* Statistics Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Average Grade */}
          <div className="text-center">
            <div className="text-3xl font-bold text-card-foreground">{stats.average}</div>
            <div className="text-sm text-muted-foreground mt-1">{t('average', 'Просек')}</div>
          </div>

          {/* Credits */}
          <div className="text-center">
            <div className="text-3xl font-bold text-card-foreground">
              {stats.credits.current}
              <span className="text-lg text-muted-foreground">/{stats.credits.total}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t('credits', 'Кредити')}</div>
          </div>

          {/* Passed Exams */}
          <div className="text-center">
            <div className="text-3xl font-bold text-card-foreground">{stats.passed}</div>
            <div className="text-sm text-muted-foreground mt-1">{t('passed', 'Положени')}</div>
          </div>

          {/* Remaining Exams */}
          <div className="text-center">
            <div className="text-3xl font-bold text-card-foreground">{stats.remaining}</div>
            <div className="text-sm text-muted-foreground mt-1">{t('remaining', 'Останато')}</div>
          </div>
        </div>

        {/* Progress Bar spanning entire statistics section */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${creditsPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Exams Table */}
      <div>
        <h3 className="text-xl font-semibold text-card-foreground mb-4">{t('exams', 'Испити')}</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">#</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('subject', 'Предмет')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('semester', 'Семестар')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('credits', 'Кредити')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={handleSortByDate}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 transform hover:scale-105"
                  >
                    {t('date', 'Датум')}
                    <FontAwesomeIcon
                      icon={getSortIcon('date')}
                      className={`text-xs transition-colors duration-200 ${
                        sortField === 'date' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={handleSortByGrade}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 transform hover:scale-105"
                  >
                    {t('grade', 'Оценка')}
                    <FontAwesomeIcon
                      icon={getSortIcon('grade')}
                      className={`text-xs transition-colors duration-200 ${
                        sortField === 'grade' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {getSortedExams().map((exam) => (
                <tr key={exam.id} className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="py-4 px-4 text-sm text-card-foreground">{exam.id}</td>
                  <td className="py-4 px-4 text-sm text-card-foreground font-medium">{t(exam.subject, exam.subject)}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{t(exam.semester, exam.semester)}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{exam.credits}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{exam.date}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${getGradeColor(exam.grade)}`}>
                      {exam.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Exams;
