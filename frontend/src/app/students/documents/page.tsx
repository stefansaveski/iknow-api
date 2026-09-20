"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilePdf, 
  faChevronDown,
  faCheckCircle,
  faClock,
  faMoneyBillWave,
  faFileText,
  faChevronLeft,
  faChevronRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import documentsData from '@/data/documents.json';
import { useTranslation } from 'react-i18next';
import { getAccessToken } from '@/lib/auth';
import { downloadDocumentPDF } from '@/lib/pdf-generators';

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
  if (status === 'approved' || status === t('approved', 'Одобрено')) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">
        <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5" />
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
        {t('pending', 'Во обработка')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-accent text-muted-foreground rounded-full">
      <FontAwesomeIcon icon={faFileText} className="w-4 h-4" />
    </span>
  );
};

const PriceBadge = ({ price }: { price: number }) => {
  const { t } = useTranslation();
  if (price === 0) {
    return <span className="font-medium text-green-600">{t('free', '0,00')}</span>;
  }
  return <span className="font-medium text-blue-600">{price.toFixed(2)}</span>;
};

interface DocumentRecord {
  id: number;
  archive: string;
  date: string;
  request: string;
  price: number;
  paid: string;
  document: string;
  payOnline: boolean;
  status: string;
  comment: string;
}

export default function DocumentsPage() {
  const [selectedDocumentType, setSelectedDocumentType] = useState("select_document");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>(documentsData.documents as DocumentRecord[]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleDownload = async (docId: number, request: string, archive: string, date: string) => {
    const token = getAccessToken();
    if (!token) {
      alert(t('not_authenticated', 'Не сте најавени. Ве молиме најавете се повторно.'));
      return;
    }
    setDownloadingId(docId);
    try {
      await downloadDocumentPDF(request, archive, date, token);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('pdf_error', 'Грешка при генерирање на документот. Обидете се повторно.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = () => {
    if (selectedDocumentType === "select_document") return;

    const docType = documentsData.documentTypes.find(d => d.id === selectedDocumentType);
    if (!docType) return;

    setIsSubmitting(true);

    // Generate archive number (random 5-digit)
    const archiveNumber = String(90000 + Math.floor(Math.random() * 10000));

    // Current date in DD.MM.YYYY format
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

    const newDoc: DocumentRecord = {
      id: documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1,
      archive: archiveNumber,
      date: dateStr,
      request: docType.name,
      price: docType.price,
      paid: "Не",
      document: "Преземи",
      payOnline: docType.price > 0,
      status: "pending",
      comment: comment,
    };

    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDocumentType("select_document");
    setComment("");
    setIsSubmitting(false);
    alert(t('document_submitted', 'Барањето за документ е успешно поднесено!'));
  };

  const selectedDocument = documentsData.documentTypes.find(d => d.id === selectedDocumentType);
  const { paymentInfo } = documentsData;

  const totalPages = Math.ceil(documents.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentDocuments = documents.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-primary text-white rounded-xl p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-full p-4">
            <FontAwesomeIcon icon={faFilePdf} className="text-3xl text-[#0272D1]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('documents')}</h1>
            <p className="text-lg opacity-90">
              {t('documents_overview', 'Преглед на вашите документи и нивниот статус.')}
            </p>
          </div>
        </div>
      </div>

      {/* Document Request Form */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <h2 className="text-lg font-semibold text-card-foreground mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileText} className="text-primary" />
          {t('new_document_request', 'Ново барање за документ')}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('select_document', 'Избери документ')}:
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-card-foreground truncate">
                    {selectedDocument ? t(selectedDocument.id) : t('select_document', 'Избери документ')}
                  </span>
                  <FontAwesomeIcon 
                    icon={faChevronDown} 
                    className={`w-4 h-4 text-muted-foreground transition-transform ml-2 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {documentsData.documentTypes.map((docType) => (
                    <button
                      key={docType.id}
                      onClick={() => {
                        setSelectedDocumentType(docType.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-accent focus:outline-none focus:bg-accent border-b border-border last:border-b-0"
                    >
                      <div className="font-medium text-card-foreground">{t(docType.id)}</div>
                      {docType.price > 0 && (
                        <div className="text-xs text-blue-600 mt-1">{t('price', 'Цена')}: {docType.price} мкд</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('comment', 'Коментар')}:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              placeholder={t('add_comment', 'Додај коментар')}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedDocumentType === "select_document" || isSubmitting}
          >
            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faFileText} className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? t('submitting', 'Се поднесува...') : t('submit', 'Поднеси')}
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-primary text-white px-6 py-4">
          <h2 className="text-xl font-bold">{t('my_documents', 'Мои документи')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('archive', 'Архива')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('date', 'Датум')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('request', 'Барање')}</th>
                <th className="px-4 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('price', 'Цена')}</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('paid', 'Платено')}</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('document', 'Документ')}</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('pay_online', 'Плати онлајн')}</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('status', 'Статус')}</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('comment', 'Коментар')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-accent transition-colors">
                  <TableCell className="font-medium text-card-foreground">{document.id}</TableCell>
                  <TableCell className="font-mono text-sm text-primary font-medium">{document.archive}</TableCell>
                  <TableCell className="text-muted-foreground">{document.date}</TableCell>
                  <TableCell className="font-medium text-card-foreground max-w-xs">
                    {t(document.request)}
                  </TableCell>
                  <TableCell className="text-right">
                    <PriceBadge price={document.price} />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${document.paid === 'ДА' ? 'text-green-600' : 'text-red-500'}`}>
                      {document.paid}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <button 
                      onClick={() => handleDownload(document.id, document.request, document.archive, document.date)}
                      disabled={downloadingId === document.id}
                      className="text-primary hover:text-blue-700 font-medium text-sm underline disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-1"
                    >
                      {downloadingId === document.id ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                          {t('generating', 'Генерира...')}
                        </>
                      ) : (
                        t('download', document.document)
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    {document.payOnline ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-600" />
                    ) : (
                      <span className="text-muted-foreground">{t('none', '—')}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={document.status} />
                  </TableCell>
                  <TableCell>
                    {document.comment || (
                      <span className="text-muted-foreground">{t('none', '—')}</span>
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-accent px-6 py-4 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{t('show_rows', 'Прикажи редови')}:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                className="border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div>
              {t('page', 'Страница')} <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-12 border border-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
              /> {t('of', 'од')} {totalPages}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 bg-primary text-white rounded text-sm font-medium">
              {t('first', 'Прва')}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faAngleDoubleRight} className="w-4 h-4" />
            </button>
            <span className="ml-4 text-sm text-muted-foreground">
              {t('last', 'Последна')}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            {t('total', 'Вкупно')}: {documents.length}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 border-t border-blue-100 p-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed">
              {t('documents_payment_info', paymentInfo)}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full p-3">
              <FontAwesomeIcon icon={faFileText} className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground">{t('total_documents', 'Вкупно документи')}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {documents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 text-green-600 rounded-full p-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground">{t('approved', 'Одобрени')}</h3>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter(doc => doc.status === "approved").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-3">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground">{t('total_price', 'Вкупна цена')}</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {documents.reduce((sum, doc) => sum + doc.price, 0).toFixed(2)} {t('mkd', 'мкд')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
