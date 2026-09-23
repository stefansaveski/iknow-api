import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadCyrillicFonts } from './pdf-fonts';
import { apiUrl } from './api';

/* ---------- shared types ---------- */

export type StudentInfo = {
  firstName: string;
  middleName: string;
  lastName: string;
  index: string;
  embg: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  citizenship: string;
  currentPlan: string;
  registryNumber: string;
  studyGroup: string;
  scholarship: string;
};

export type EnrollmentInfo = {
  enrollmentYear: string | number;
  status: string;
  cycle: string;
  program: string;
  quota: string;
};

export type BirthInfo = {
  placeOfBirth: string;
  municipalityOfBirth: string;
  country: string;
};

export type ContactInfo = {
  placeOfResidence: string;
  municipalityOfResidence: string;
  address: string;
  phone: string;
  mobilePhone: string;
  email: string;
};

export type PassedExam = {
  id: number;
  code: string;
  subject: string;
  credits: number;
  grade: number;
  date: string;
  semester: string;
  professor: string;
};

export type PreviousEducation = {
  type: string;
  profession: string;
  average: string | number;
  language: string;
  country: string;
  previousUniversity: string;
  previousFaculty: string;
};

/* ---------- helpers ---------- */

const PAGE_WIDTH = 210; // A4 mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

function drawUniversityHeader(doc: jsPDF, y: number): number {
  doc.setFont('Roboto', 'bold');

  doc.setFontSize(11);
  doc.text('УНИВЕРЗИТЕТ „СВ. КИРИЛ И МЕТОДИЈ" - СКОПЈЕ', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.text('ФАКУЛТЕТ ЗА ИНФОРМАТИЧКИ НАУКИ И', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5;
  doc.text('КОМПЈУТЕРСКО ИНЖЕНЕРСТВО', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5;

  // Horizontal line under header
  doc.setDrawColor(0, 114, 209); // primary blue
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  return y;
}

function drawDocumentTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14);
  doc.text(title, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;
  return y;
}

function drawInfoRow(doc: jsPDF, label: string, value: string, x: number, y: number, labelWidth = 50): number {
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.text(`${label}:`, x, y);
  doc.setFont('Roboto', 'normal');
  doc.text(String(value || '—'), x + labelWidth, y);
  return y + 5.5;
}

function drawFooter(doc: jsPDF, archiveNumber: string, date: string): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight - 40;

  doc.setDrawColor(0, 114, 209);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);

  doc.text(`Бр.: ${archiveNumber}`, MARGIN, y);
  doc.text(`Датум: ${date}`, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // Signature placeholders
  doc.text('Потпис на студентот:', MARGIN, y);
  doc.text('М.П.', PAGE_WIDTH / 2, y, { align: 'center' });
  doc.text('Одговорно лице:', PAGE_WIDTH - MARGIN - 35, y);
  y += 8;

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, MARGIN + 45, y);
  doc.line(PAGE_WIDTH / 2 - 15, y, PAGE_WIDTH / 2 + 15, y);
  doc.line(PAGE_WIDTH - MARGIN - 45, y, PAGE_WIDTH - MARGIN, y);
}

/* ==================================================================
   PDF 1 — Уверение за положени испити (Certificate of Passed Exams)
   ================================================================== */

export async function generatePassedExamsCertificate(
  student: StudentInfo,
  enrollment: EnrollmentInfo,
  passedExams: PassedExam[],
  archiveNumber: string,
  date: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await loadCyrillicFonts(doc);

  let y = 20;

  // --- Header ---
  y = drawUniversityHeader(doc, y);

  // --- Title ---
  y = drawDocumentTitle(doc, 'УВЕРЕНИЕ ЗА ПОЛОЖЕНИ ИСПИТИ', y);

  // --- Student Info Block ---
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);

  y = drawInfoRow(doc, 'Студент', `${student.firstName} ${student.middleName} ${student.lastName}`, MARGIN, y);
  y = drawInfoRow(doc, 'Индекс', student.index, MARGIN, y);
  y = drawInfoRow(doc, 'Студиска програма', enrollment.program, MARGIN, y);
  y = drawInfoRow(doc, 'Циклус на студии', enrollment.cycle, MARGIN, y);
  y = drawInfoRow(doc, 'Статус', enrollment.status, MARGIN, y);
  y += 4;

  // --- Passed Exams Table ---
  const tableBody = passedExams.map((exam, idx) => [
    String(idx + 1),
    exam.code,
    exam.subject,
    String(exam.credits),
    String(exam.grade),
    exam.date,
    exam.semester,
    exam.professor || '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Р.Б.', 'Шифра', 'Предмет', 'Кредити', 'Оцена', 'Датум', 'Семестар', 'Професор']],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 30, 30],
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [0, 114, 209],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 16 },
      2: { cellWidth: 50 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 20 },
      6: { cellWidth: 22 },
      7: { cellWidth: 26 },
    },
    margin: { left: MARGIN, right: MARGIN },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [245, 247, 250];
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // --- Summary ---
  const totalCredits = passedExams.reduce((sum, e) => sum + e.credits, 0);
  const grades = passedExams.map((e) => e.grade).filter((g) => g > 0);
  const average = grades.length > 0 ? (grades.reduce((s, g) => s + g, 0) / grades.length).toFixed(2) : '0.00';

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.text(`Вкупно положени предмети: ${passedExams.length}`, MARGIN, y);
  y += 6;
  doc.text(`Вкупно кредити: ${totalCredits}`, MARGIN, y);
  y += 6;
  doc.text(`Просечна оцена: ${average}`, MARGIN, y);

  // --- Footer ---
  drawFooter(doc, archiveNumber, date);

  doc.save(`Уверение_положени_испити_${student.index}.pdf`);
}

/* ==================================================================
   PDF 2 — УППИ образец (UPPI Form / Student Record)
   ================================================================== */

export async function generateUPPIForm(
  student: StudentInfo,
  enrollment: EnrollmentInfo,
  birth: BirthInfo,
  contact: ContactInfo,
  previousEdu: PreviousEducation,
  passedExams: PassedExam[],
  archiveNumber: string,
  date: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await loadCyrillicFonts(doc);

  let y = 20;

  // --- Header ---
  y = drawUniversityHeader(doc, y);

  // --- Title ---
  y = drawDocumentTitle(doc, 'УППИ ОБРАЗЕЦ', y);

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.text('УНИВЕРЗАЛНА ПРИЈАВА ЗА ПРАКТИЧНА ИНДИВИДУАЛНА РАБОТА', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  // --- Section: Personal Information ---
  doc.setFillColor(0, 114, 209);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('ЛИЧНИ ПОДАТОЦИ', MARGIN + 3, y + 0.5);
  doc.setTextColor(30, 30, 30);
  y += 10;

  const col2X = MARGIN + CONTENT_WIDTH / 2;

  y = drawInfoRow(doc, 'Име', student.firstName, MARGIN, y, 35);
  y -= 5.5;
  y = drawInfoRow(doc, 'Презиме', student.lastName, col2X, y, 35);
  y = drawInfoRow(doc, 'Татково име', student.middleName, MARGIN, y, 35);
  y -= 5.5;
  y = drawInfoRow(doc, 'ЕМБГ', student.embg, col2X, y, 35);
  y = drawInfoRow(doc, 'Датум на раѓање', student.dateOfBirth, MARGIN, y, 35);
  y -= 5.5;
  y = drawInfoRow(doc, 'Пол', student.gender, col2X, y, 35);
  y = drawInfoRow(doc, 'Националност', student.nationality, MARGIN, y, 35);
  y -= 5.5;
  y = drawInfoRow(doc, 'Државјанство', student.citizenship, col2X, y, 35);
  y += 3;

  // --- Section: Birth Info ---
  doc.setFillColor(0, 114, 209);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('ПОДАТОЦИ ЗА РАЃАЊЕ', MARGIN + 3, y + 0.5);
  doc.setTextColor(30, 30, 30);
  y += 10;

  y = drawInfoRow(doc, 'Место на раѓање', birth.placeOfBirth, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Општина', birth.municipalityOfBirth, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Држава', birth.country, MARGIN, y, 40);
  y += 3;

  // --- Section: Contact ---
  doc.setFillColor(0, 114, 209);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('КОНТАКТ ИНФОРМАЦИИ', MARGIN + 3, y + 0.5);
  doc.setTextColor(30, 30, 30);
  y += 10;

  y = drawInfoRow(doc, 'Место на живеење', contact.placeOfResidence, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Адреса', contact.address, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Телефон', contact.phone || contact.mobilePhone, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Е-пошта', contact.email, MARGIN, y, 40);
  y += 3;

  // --- Section: Enrollment ---
  doc.setFillColor(0, 114, 209);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('СТУДИСКИ ИНФОРМАЦИИ', MARGIN + 3, y + 0.5);
  doc.setTextColor(30, 30, 30);
  y += 10;

  y = drawInfoRow(doc, 'Индекс', student.index, MARGIN, y, 40);
  y -= 5.5;
  y = drawInfoRow(doc, 'Мат. број', student.registryNumber, col2X, y, 35);
  y = drawInfoRow(doc, 'Студиска програма', enrollment.program, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Циклус', enrollment.cycle, MARGIN, y, 40);
  y -= 5.5;
  y = drawInfoRow(doc, 'Статус', enrollment.status, col2X, y, 35);
  y = drawInfoRow(doc, 'Год. на запишување', String(enrollment.enrollmentYear), MARGIN, y, 40);
  y -= 5.5;
  y = drawInfoRow(doc, 'Квота', enrollment.quota, col2X, y, 35);
  y += 3;

  // --- Section: Previous Education ---
  doc.setFillColor(0, 114, 209);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('ПРЕТХОДНО ОБРАЗОВАНИЕ', MARGIN + 3, y + 0.5);
  doc.setTextColor(30, 30, 30);
  y += 10;

  y = drawInfoRow(doc, 'Вид', previousEdu.type, MARGIN, y, 40);
  y = drawInfoRow(doc, 'Просек', String(previousEdu.average), MARGIN, y, 40);
  y = drawInfoRow(doc, 'Јазик', previousEdu.language, MARGIN, y, 40);
  y += 3;

  // --- Section: Passed Exams mini-table ---
  doc.setFillColor(0, 114, 209);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('ПОЛОЖЕНИ ИСПИТИ', MARGIN + 3, y + 0.5);
  doc.setTextColor(30, 30, 30);
  y += 8;

  const examTableBody = passedExams.map((exam, idx) => [
    String(idx + 1),
    exam.code,
    exam.subject,
    String(exam.credits),
    String(exam.grade),
    exam.date,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Шифра', 'Предмет', 'Кредити', 'Оцена', 'Датум']],
    body: examTableBody,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 30, 30],
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [0, 114, 209],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 70 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: MARGIN, right: MARGIN },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [245, 247, 250];
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // Summary
  const totalCredits = passedExams.reduce((sum, e) => sum + e.credits, 0);
  const grades = passedExams.map((e) => e.grade).filter((g) => g > 0);
  const average = grades.length > 0 ? (grades.reduce((s, g) => s + g, 0) / grades.length).toFixed(2) : '0.00';

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.text(`Вкупно кредити: ${totalCredits}    |    Просечна оцена: ${average}`, MARGIN, y);

  // Footer
  drawFooter(doc, archiveNumber, date);

  doc.save(`УППИ_образец_${student.index}.pdf`);
}

/* ==================================================================
   PDF 3 — Уверение за редовен студент (Regular Student Certificate)
   ================================================================== */

export async function generateRegularStudentCertificate(
  student: StudentInfo,
  enrollment: EnrollmentInfo,
  passedExams: PassedExam[],
  archiveNumber: string,
  date: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await loadCyrillicFonts(doc);

  let y = 20;

  // --- Header ---
  y = drawUniversityHeader(doc, y);

  // --- Title ---
  y = drawDocumentTitle(doc, 'УВЕРЕНИЕ', y);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.text('за редовен студент', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // --- Body text ---
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);

  const totalCredits = passedExams.reduce((sum, e) => sum + e.credits, 0);
  const grades = passedExams.map((e) => e.grade).filter((g) => g > 0);
  const average = grades.length > 0 ? (grades.reduce((s, g) => s + g, 0) / grades.length).toFixed(2) : '0.00';

  const bodyText = [
    `Со ова се потврдува дека студентот/студентката`,
    ``,
    `${student.firstName} ${student.middleName} ${student.lastName}`,
    ``,
    `со индекс број ${student.index}, ЕМБГ ${student.embg},`,
    `е редовен студент на Факултетот за информатички науки и компјутерско`,
    `инженерство при Универзитетот „Св. Кирил и Методиј" - Скопје.`,
    ``,
    `Студиска програма: ${enrollment.program}`,
    `Циклус на студии: ${enrollment.cycle}`,
    `Статус: ${enrollment.status}`,
    `Година на запишување: ${enrollment.enrollmentYear}`,
    ``,
    `Студентот/студентката до сега има положено ${passedExams.length} испити,`,
    `со вкупно ${totalCredits} кредити и просечна оцена ${average}.`,
    ``,
    `Ова уверение се издава за потребите на студентот/студентката`,
    `и може да послужи за секоја законска употреба.`,
  ];

  for (const line of bodyText) {
    if (line === '') {
      y += 4;
    } else {
      if (line.startsWith(`${student.firstName}`)) {
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(12);
        doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(10);
      } else {
        doc.text(line, MARGIN, y);
      }
      y += 6;
    }
  }

  // Footer
  drawFooter(doc, archiveNumber, date);

  doc.save(`Уверение_редовен_студент_${student.index}.pdf`);
}

/* ==================================================================
   Generic document — fallback for other document types
   ================================================================== */

export async function generateGenericDocument(
  student: StudentInfo,
  enrollment: EnrollmentInfo,
  documentTitle: string,
  archiveNumber: string,
  date: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await loadCyrillicFonts(doc);

  let y = 20;

  y = drawUniversityHeader(doc, y);
  y = drawDocumentTitle(doc, documentTitle.toUpperCase(), y);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);

  y = drawInfoRow(doc, 'Студент', `${student.firstName} ${student.middleName} ${student.lastName}`, MARGIN, y);
  y = drawInfoRow(doc, 'Индекс', student.index, MARGIN, y);
  y = drawInfoRow(doc, 'ЕМБГ', student.embg, MARGIN, y);
  y = drawInfoRow(doc, 'Студиска програма', enrollment.program, MARGIN, y);
  y = drawInfoRow(doc, 'Циклус', enrollment.cycle, MARGIN, y);
  y = drawInfoRow(doc, 'Статус', enrollment.status, MARGIN, y);
  y += 8;

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.text('Документот е издаден по барање на студентот.', MARGIN, y);

  drawFooter(doc, archiveNumber, date);

  doc.save(`${documentTitle.replace(/\s+/g, '_')}_${student.index}.pdf`);
}

/* ==================================================================
   Themed request generators — one for each document type
   ================================================================== */

async function generateRequestDocument(
  student: StudentInfo,
  enrollment: EnrollmentInfo,
  title: string,
  bodyLines: string[],
  archiveNumber: string,
  date: string,
  filename: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await loadCyrillicFonts(doc);

  let y = 20;

  y = drawUniversityHeader(doc, y);
  y = drawDocumentTitle(doc, title, y);

  // Student info block
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  y = drawInfoRow(doc, 'Студент', `${student.firstName} ${student.middleName} ${student.lastName}`, MARGIN, y);
  y = drawInfoRow(doc, 'Индекс', student.index, MARGIN, y);
  y = drawInfoRow(doc, 'ЕМБГ', student.embg, MARGIN, y);
  y = drawInfoRow(doc, 'Студиска програма', enrollment.program, MARGIN, y);
  y = drawInfoRow(doc, 'Циклус', enrollment.cycle, MARGIN, y);
  y = drawInfoRow(doc, 'Статус', enrollment.status, MARGIN, y);
  y = drawInfoRow(doc, 'Година на упис', String(enrollment.enrollmentYear), MARGIN, y);
  y += 8;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  // Body text
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  for (const line of bodyLines) {
    if (line === '') {
      y += 5;
    } else {
      const wrapped = doc.splitTextToSize(line, CONTENT_WIDTH);
      for (const wl of wrapped) {
        doc.text(wl, MARGIN, y);
        y += 5.5;
      }
    }
  }

  drawFooter(doc, archiveNumber, date);
  doc.save(`${filename}_${student.index}.pdf`);
}

// --- Administrative Regulation ---
export async function generateAdministrativeRegulation(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА АДМИНИСТРАТИВНО РЕГУЛИРАЊЕ НА РЕТРОАКТИВЕН СЕМЕСТАР',
    [
      `До: Деканат на Факултетот за информатички науки и компјутерско инженерство`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `запишан/а на студиската програма ${enrollment.program}, ${enrollment.cycle} циклус студии,`,
      `со ова барање побарувам административно регулирање на ретроактивен семестар.`,
      '',
      `Молам да ми се одобри административна регулација на семестар кој не е запишан во предвидениот рок,`,
      `согласно одлуката на Факултетот и важечката регулатива.`,
      '',
      `Прилози: Уплатница за административна такса од 1000 ден.`,
    ],
    archiveNumber, date, 'Административно_регулирање');
}

// --- Late Exam Registration ---
export async function generateExamApplicationSatisfaction(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ЗАДОЧНО ПРИЈАВУВАЊЕ НА ИСПИТ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `запишан/а на студиската програма ${enrollment.program},`,
      `побарувам задочно пријавување на испит кој не е пријавен во предвидениот рок.`,
      '',
      `Причина за задоцнување: ___________________________________`,
      '',
      `Молам за одобрување на ова барање.`,
      '',
      `Прилози: Уплатница за административна такса од 1000 ден.`,
    ],
    archiveNumber, date, 'Задочно_пријавување_испит');
}

// --- Semester Enrollment After Deadline ---
export async function generateSemesterEnrollmentAfterDeadline(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ЗАПИШУВАЊЕ НА СЕМЕСТАР ПО ИСТЕК НА РОК',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам да ми се одобри запишување на нареден семестар по истекот на официјалниот рок.`,
      '',
      `Причина за задоцнето запишување: ___________________________________`,
      '',
      `Молам за одобрување.`,
      '',
      `Прилози: Уплатница за административна такса од 1500 ден.`,
    ],
    archiveNumber, date, 'Запишување_семестар_по_рок');
}

// --- Certificate Issuance ---
export async function generateCertificateIssuanceVarious(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ИЗДАВАЊЕ НА ПОТВРДИ ПО РАЗНИ ОСНОВИ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам издавање на потврда за следната намена:`,
      '',
      `Намена: ___________________________________`,
      '',
      `Молам да ми биде издадена бараната потврда.`,
      '',
      `Прилози: Уплатница за административна такса од 1500 ден.`,
    ],
    archiveNumber, date, 'Издавање_потврди');
}

// --- Study Suspension ---
export async function generateStudySuspension(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА МИРУВАЊЕ НА СТУДИИТЕ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `запишан/а на студиската програма ${enrollment.program},`,
      `побарувам мирување на студиите за период од ______ семестри.`,
      '',
      `Причина за мирување: ___________________________________`,
      '',
      `Изјавувам дека сум запознаен/а со правилата за продолжување на студиите`,
      `по истекот на периодот на мирување.`,
      '',
      `Прилози: Уплатница за административна такса од 2000 ден.`,
    ],
    archiveNumber, date, 'Мирување_студии');
}

// --- Diploma Thesis Cancellation ---
export async function generateDiplomaThesisCancellation(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ОТКАЖУВАЊЕ НА ПРИЈАВЕНА ТЕМА ЗА ДИПЛОМСКА РАБОТА',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам откажување на претходно пријавената тема за дипломска работа.`,
      '',
      `Назив на темата: ___________________________________`,
      `Ментор: ___________________________________`,
      '',
      `Причина за откажување: ___________________________________`,
      '',
      `Прилози: Уплатница за административна такса од 1000 ден.`,
    ],
    archiveNumber, date, 'Откажување_дипломска');
}

// --- Graduation Package ---
export async function generateDiplomaPackage(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПАКЕТ ЗА ДИПЛОМИРАЊЕ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `запишан/а на студиската програма ${enrollment.program}, ${enrollment.cycle} циклус,`,
      `побарувам издавање на пакет за дипломирање.`,
      '',
      `Со ова потврдувам дека ги имам исполнето сите услови за дипломирање`,
      `согласно студиската програма и правилникот на Факултетот.`,
      '',
      `Пакетот за дипломирање ги вклучува: диплома, додаток на диплома и свечена промоција.`,
      '',
      `Прилози: Уплатница за административна такса од 6200 ден.`,
    ],
    archiveNumber, date, 'Пакет_дипломирање');
}

// --- Exam Cancellation ---
export async function generateExamCancellation(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПОНИШТУВАЊЕ НА ИСПИТ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам поништување на испит по предметот:`,
      '',
      `Предмет: ___________________________________`,
      `Датум на полагање: ___________________________________`,
      '',
      `Причина за поништување: ___________________________________`,
      '',
      `Прилози: Уплатница за административна такса од 2000 ден.`,
    ],
    archiveNumber, date, 'Поништување_испит');
}

// --- Study Continuation ---
export async function generateStudyContinuation(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПРОДОЛЖУВАЊЕ НА СТУДИИ ВО МИРУВАЊЕ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам продолжување на студиите по периодот на мирување.`,
      '',
      `Период на мирување: од ____________ до ____________`,
      '',
      `Молам да ми се одобри продолжување на студиите согласно тековната`,
      `студиска програма и важечкиот правилник.`,
      '',
      `Прилози: Уплатница за административна такса од 2000 ден.`,
    ],
    archiveNumber, date, 'Продолжување_студии');
}

// --- Elective Subject Change ---
export async function generateElectiveSubjectChange(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПРОМЕНА НА ИЗБОРЕН ПРЕДМЕТ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам промена на изборен предмет.`,
      '',
      `Предмет што се менува: ___________________________________`,
      `Нов изборен предмет: ___________________________________`,
      '',
      `Причина за промена: ___________________________________`,
      '',
      `Прилози: Уплатница за административна такса од 1500 ден.`,
    ],
    archiveNumber, date, 'Промена_изборен_предмет');
}

// --- Passed Subject Change ---
export async function generatePassedSubjectChange(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПРОМЕНА НА ПОЛОЖЕН ПРЕДМЕТ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам промена / корекција на запис за положен предмет.`,
      '',
      `Предмет: ___________________________________`,
      `Датум на полагање: ___________________________________`,
      `Оцена: ___________________________________`,
      '',
      `Детали за промена: ___________________________________`,
    ],
    archiveNumber, date, 'Промена_положен_предмет');
}

// --- Study Program Change (Same Accreditation) ---
export async function generateProgramChangeSameAccreditation(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПРОМЕНА НА СТУДИСКА ПРОГРАМА ОД ИСТА АКРЕДИТАЦИЈА',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `тековно запишан/а на програмата ${enrollment.program},`,
      `побарувам промена на студиска програма во рамки на истата акредитација.`,
      '',
      `Нова студиска програма: ___________________________________`,
      '',
      `Причина за промена: ___________________________________`,
      '',
      `Прилози: Уплатница за административна такса од 2000 ден.`,
    ],
    archiveNumber, date, 'Промена_програма_иста_акредитација');
}

// --- Study Program Change (New Accreditation) ---
export async function generateProgramChangeNewAccreditation(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'БАРАЊЕ ЗА ПРОМЕНА НА СТУДИСКА ПРОГРАМА ОД ПОНОВА АКРЕДИТАЦИЈА',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `тековно запишан/а на програмата ${enrollment.program},`,
      `побарувам промена на студиска програма во рамки на нова акредитација.`,
      '',
      `Нова студиска програма: ___________________________________`,
      `Нова акредитација: ___________________________________`,
      '',
      `Причина за промена: ___________________________________`,
      '',
      `Прилози: Уплатница за административна такса од 3000 ден.`,
    ],
    archiveNumber, date, 'Промена_програма_нова_акредитација');
}

// --- Diploma Supplement ---
export async function generateDiplomaSupplement(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'ДОДАТОК НА ДИПЛОМА',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `запишан/а на студиската програма ${enrollment.program}, ${enrollment.cycle} циклус,`,
      `побарувам издавање на додаток на диплома.`,
      '',
      `Додатокот на дипломата се издава како придружен документ`,
      `кон дипломата за завршените студии.`,
    ],
    archiveNumber, date, 'Додаток_диплома');
}

// --- Diploma Supplement Second Cycle ---
export async function generateDiplomaSupplementSecondCycle(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'ДОДАТОК НА ДИПЛОМА (ВТОР ЦИКЛУС)',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `запишан/а на студиската програма ${enrollment.program}, втор циклус на студии,`,
      `побарувам издавање на додаток на диплома за вториот циклус студии.`,
      '',
      `Додатокот на дипломата се издава како придружен документ`,
      `кон магистерската диплома.`,
    ],
    archiveNumber, date, 'Додаток_диплома_втор_циклус');
}

// --- MKSA ---
export async function generateMKSA(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'МКСА - МАКЕДОНСКА КВАЛИФИКАЦИСКА РАМКА',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам издавање на МКСА (Македонска Квалификациска Рамка) документ.`,
      '',
      `Студиска програма: ${enrollment.program}`,
      `Циклус: ${enrollment.cycle}`,
      '',
      `Документот е потребен за целите на: ___________________________________`,
      '',
      `Прилози: Уплатница за административна такса од 750 ден.`,
    ],
    archiveNumber, date, 'МКСА');
}

// --- Exam Recognition ---
export async function generateExamRecognition(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'ПРИЗНАВАЊЕ НА ПОЛОЖЕНИ ИСПИТИ',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам признавање на положени испити од претходна институција / програма.`,
      '',
      `Претходна институција: ___________________________________`,
      `Претходна програма: ___________________________________`,
      '',
      `Листа на предмети за признавање:`,
      `1. ___________________________________`,
      `2. ___________________________________`,
      `3. ___________________________________`,
      '',
      `Прилози: Уверение за положени испити од претходна институција.`,
    ],
    archiveNumber, date, 'Признавање_испити');
}

// --- Student Card (Old) ---
export async function generateStudentCardOld(
  student: StudentInfo, enrollment: EnrollmentInfo, archiveNumber: string, date: string,
): Promise<void> {
  await generateRequestDocument(student, enrollment,
    'СТУДЕНТСКИ КАРТОН (СТАРО)',
    [
      `До: Деканат на ФИНКИ`,
      '',
      `Јас, ${student.firstName} ${student.middleName} ${student.lastName}, студент/ка со индекс ${student.index},`,
      `побарувам издавање на студентски картон (стар формат).`,
      '',
      `Студиска програма: ${enrollment.program}`,
      `Година на упис: ${enrollment.enrollmentYear}`,
      '',
      `Молам да ми биде издаден студентски картон.`,
    ],
    archiveNumber, date, 'Студентски_картон');
}

/* ==================================================================
   Main dispatcher — called from the Documents page
   ================================================================== */

// Map document type IDs → generator function names
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'административно регулирање': 'administrative_regulation',
  'задочно пријавување': 'exam_application_satisfaction',
  'запишување на семестар по истек': 'semester_enrollment_after_deadline',
  'издавање потврди': 'certificate_issuance_various',
  'мирување на студиите': 'student_status_verification',
  'откажување на пријавена тема': 'diploma_thesis_postponement',
  'пакет за дипломирање': 'diploma_package',
  'поништување на испит': 'exam_postponement',
  'потврда за редовен студент': 'regular_student_certificate',
  'продолжување на студии во мирување': 'study_continuation_verification',
  'промена на изборен предмет': 'failed_subject_grade_change',
  'промена на положен предмет': 'passed_subject_grade_change',
  'промена на студиска програма од иста': 'study_program_change_same_accreditation',
  'промена на студиска програма од понова': 'study_program_change_new_accreditation',
  'додаток на диплома (втор циклус)': 'diploma_supplement_second_cycle',
  'додаток на диплома': 'diploma_supplement',
  'мкса': 'mksa',
  'признавање на положени испити': 'exam_recognition',
  'студентски картон': 'student_card_old',
};

function identifyDocumentType(request: string): string | null {
  const lower = request.toLowerCase();

  // Exact-match patterns (check longer patterns first)
  if (lower.includes('положени испити')) return 'passed_exams_certificate';
  if (lower.includes('уппи')) return 'uppi_form';
  if (lower.includes('редовен студент')) return 'regular_student_certificate';

  // Match by document type keywords
  for (const [keyword, docType] of Object.entries(DOCUMENT_TYPE_MAP)) {
    if (lower.includes(keyword)) return docType;
  }

  return null;
}

export async function downloadDocumentPDF(
  documentRequest: string,
  archiveNumber: string,
  documentDate: string,
  accessToken: string,
): Promise<void> {
  // Fetch student profile
  const profileRes = await fetch(apiUrl('/api/user/getUser'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw new Error('Не може да се вчита профилот на студентот');

  const profile = await profileRes.json();
  const { personalInfo, enrollmentInfo, birthInfo, contact, previousEducation } = profile;

  const student: StudentInfo = {
    firstName: personalInfo.firstName,
    middleName: personalInfo.middleName,
    lastName: personalInfo.lastName,
    index: personalInfo.index,
    embg: personalInfo.embg,
    dateOfBirth: personalInfo.dateOfBirth,
    gender: personalInfo.gender,
    nationality: personalInfo.nationality,
    citizenship: personalInfo.citizenship,
    currentPlan: personalInfo.currentPlan,
    registryNumber: personalInfo.registryNumber,
    studyGroup: personalInfo.studyGroup,
    scholarship: personalInfo.scholarship,
  };

  const enrollment: EnrollmentInfo = {
    enrollmentYear: enrollmentInfo.enrollmentYear,
    status: enrollmentInfo.status,
    cycle: enrollmentInfo.cycle,
    program: enrollmentInfo.program,
    quota: enrollmentInfo.quota,
  };

  const docType = identifyDocumentType(documentRequest);

  // Types that need passed exams data
  const needsExams = docType === 'passed_exams_certificate' || docType === 'uppi_form' || docType === 'regular_student_certificate';

  let passedExams: PassedExam[] = [];
  if (needsExams) {
    const examsRes = await fetch(apiUrl('/api/user/getPassedSubjects'), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (examsRes.ok) {
      const examsData = await examsRes.json();
      passedExams = (examsData?.passedSubjects ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as number,
        code: s.code as string,
        subject: s.subject as string,
        credits: s.credits as number,
        grade: s.grade as number,
        date: s.date as string,
        semester: s.semester as string,
        professor: (s.professor as string) || '—',
      }));
    }
  }

  switch (docType) {
    case 'passed_exams_certificate':
      await generatePassedExamsCertificate(student, enrollment, passedExams, archiveNumber, documentDate);
      break;
    case 'uppi_form': {
      const birth: BirthInfo = {
        placeOfBirth: birthInfo.placeOfBirth,
        municipalityOfBirth: birthInfo.municipalityOfBirth,
        country: birthInfo.country,
      };
      const contactInfo: ContactInfo = {
        placeOfResidence: contact.placeOfResidence,
        municipalityOfResidence: contact.municipalityOfResidence,
        address: contact.address,
        phone: contact.phone,
        mobilePhone: contact.mobilePhone,
        email: contact.email,
      };
      const prevEdu: PreviousEducation = {
        type: previousEducation.type,
        profession: previousEducation.profession,
        average: previousEducation.average,
        language: previousEducation.language,
        country: previousEducation.country,
        previousUniversity: previousEducation.previousUniversity,
        previousFaculty: previousEducation.previousFaculty,
      };
      await generateUPPIForm(student, enrollment, birth, contactInfo, prevEdu, passedExams, archiveNumber, documentDate);
      break;
    }
    case 'regular_student_certificate':
      await generateRegularStudentCertificate(student, enrollment, passedExams, archiveNumber, documentDate);
      break;
    case 'administrative_regulation':
      await generateAdministrativeRegulation(student, enrollment, archiveNumber, documentDate);
      break;
    case 'exam_application_satisfaction':
      await generateExamApplicationSatisfaction(student, enrollment, archiveNumber, documentDate);
      break;
    case 'semester_enrollment_after_deadline':
      await generateSemesterEnrollmentAfterDeadline(student, enrollment, archiveNumber, documentDate);
      break;
    case 'certificate_issuance_various':
      await generateCertificateIssuanceVarious(student, enrollment, archiveNumber, documentDate);
      break;
    case 'student_status_verification':
      await generateStudySuspension(student, enrollment, archiveNumber, documentDate);
      break;
    case 'diploma_thesis_postponement':
      await generateDiplomaThesisCancellation(student, enrollment, archiveNumber, documentDate);
      break;
    case 'diploma_package':
      await generateDiplomaPackage(student, enrollment, archiveNumber, documentDate);
      break;
    case 'exam_postponement':
      await generateExamCancellation(student, enrollment, archiveNumber, documentDate);
      break;
    case 'study_continuation_verification':
      await generateStudyContinuation(student, enrollment, archiveNumber, documentDate);
      break;
    case 'failed_subject_grade_change':
      await generateElectiveSubjectChange(student, enrollment, archiveNumber, documentDate);
      break;
    case 'passed_subject_grade_change':
      await generatePassedSubjectChange(student, enrollment, archiveNumber, documentDate);
      break;
    case 'study_program_change_same_accreditation':
      await generateProgramChangeSameAccreditation(student, enrollment, archiveNumber, documentDate);
      break;
    case 'study_program_change_new_accreditation':
      await generateProgramChangeNewAccreditation(student, enrollment, archiveNumber, documentDate);
      break;
    case 'diploma_supplement':
      await generateDiplomaSupplement(student, enrollment, archiveNumber, documentDate);
      break;
    case 'diploma_supplement_second_cycle':
      await generateDiplomaSupplementSecondCycle(student, enrollment, archiveNumber, documentDate);
      break;
    case 'mksa':
      await generateMKSA(student, enrollment, archiveNumber, documentDate);
      break;
    case 'exam_recognition':
      await generateExamRecognition(student, enrollment, archiveNumber, documentDate);
      break;
    case 'student_card_old':
      await generateStudentCardOld(student, enrollment, archiveNumber, documentDate);
      break;
    default:
      await generateGenericDocument(student, enrollment, documentRequest, archiveNumber, documentDate);
      break;
  }
}
