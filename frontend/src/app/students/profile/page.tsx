"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faIdCard, 
  faGraduationCap, 
  faAddressCard, 
  faSchool,
  faCalendarAlt,
  faFlag,
  faVenus,
  faMars,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faPassport
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/lib/api';

type PersonalInfo = {
  firstName: string;
  middleName: string;
  lastName: string;
  maidenName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  citizenship: string;
  scholarship: string;
  currentPlan: string;
  registryNumber: string;
  studyGroup: string;
  notes?: string;
  index: string;
  embg: string;
};

type BirthInfo = {
  placeOfBirth: string;
  municipalityOfBirth: string;
  country: string;
};

type PreviousEducation = {
  type: string;
  profession: string;
  average: string | number;
  language: string;
  country: string;
  previousUniversity: string;
  previousFaculty: string;
  previousStudyMode: string;
};

type EnrollmentInfo = {
  enrollmentYear: string | number;
  status: string;
  cycle: string;
  program: string;
  quota: string;
  secondaryEducationNumber: string;
  previousEducationCredits: string | number;
};

type Contact = {
  placeOfResidence: string;
  municipalityOfResidence: string;
  country: string;
  address: string;
  temporaryAddress: string;
  phone: string;
  mobilePhone: string;
  passportNumber: string;
  passportExpiryDate: string;
  email: string;
  microsoftEmail: string;
};

type StudentProfile = {
  personalInfo: PersonalInfo;
  birthInfo: BirthInfo;
  previousEducation: PreviousEducation;
  enrollmentInfo: EnrollmentInfo;
  contact: Contact;
};

interface InfoRowProps {
  label: string;
  value: string | number;
  icon?: IconDefinition;
}

const InfoRow = ({ label, value, icon }: InfoRowProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 text-muted-foreground font-medium">
        {icon && <FontAwesomeIcon icon={icon} className="w-4 h-4" />}
        <span>{t(label)}:</span>
      </div>
      <div className="text-card-foreground font-semibold text-right max-w-xs break-words">
        {value || t('n_a')}
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: IconDefinition;
  children: React.ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="bg-primary text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={icon} className="text-xl" />
          <h2 className="text-xl font-bold">{t(title)}</h2>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
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
        const response = await fetch(apiUrl('/api/user/getUser'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(text || `Failed to load profile (${response.status})`);
        }

        const data = (await response.json()) as StudentProfile;
        if (!cancelled) setStudentData(data);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile.');
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

  if (errorMessage || !studentData) {
    return (
      <div className="min-h-screen pb-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage ?? t('failed_to_load_profile')}
        </div>
      </div>
    );
  }

  const { personalInfo, birthInfo, previousEducation, enrollmentInfo, contact } = studentData;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-primary text-white rounded-xl p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <FontAwesomeIcon icon={faUser} className="text-3xl text-[#0272D1]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {personalInfo.firstName} {personalInfo.middleName} {personalInfo.lastName}
            </h1>
            <div className="text-lg opacity-90">
              {t('index')}: {personalInfo.index} | {t('embg')}: {personalInfo.embg}
            </div>
            <div className="text-base opacity-80 mt-1">
              {enrollmentInfo.program}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Personal Information */}
        <Section title="personal_info" icon={faIdCard}>
          <InfoRow label="first_name" value={personalInfo.firstName} />
          <InfoRow label="middle_name" value={personalInfo.middleName} />
          <InfoRow label="last_name" value={personalInfo.lastName} />
          <InfoRow label="maiden_name" value={personalInfo.maidenName} />
          <InfoRow 
            label="date_of_birth" 
            value={personalInfo.dateOfBirth} 
            icon={faCalendarAlt} 
          />
          <InfoRow 
            label="gender" 
            value={personalInfo.gender} 
            icon={personalInfo.gender === t('male') ? faMars : faVenus} 
          />
          <InfoRow 
            label="nationality" 
            value={personalInfo.nationality} 
            icon={faFlag} 
          />
          <InfoRow label="citizenship" value={personalInfo.citizenship} />
          <InfoRow label="scholarship" value={personalInfo.scholarship} />
          <InfoRow label="current_plan" value={personalInfo.currentPlan} />
          <InfoRow label="registry_number" value={personalInfo.registryNumber} />
          <InfoRow label="study_group" value={personalInfo.studyGroup} />
          {personalInfo.notes && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">{t('note')}:</div>
              <div className="text-sm text-blue-700">{personalInfo.notes}</div>
            </div>
          )}
        </Section>

        {/* Birth Information */}
        <Section title="birth_info" icon={faMapMarkerAlt}>
          <InfoRow label="place_of_birth" value={birthInfo.placeOfBirth} />
          <InfoRow label="municipality_of_birth" value={birthInfo.municipalityOfBirth} />
          <InfoRow label="country" value={birthInfo.country} />
        </Section>

        {/* Previous Education */}
        <Section title="previous_education" icon={faSchool}>
          <InfoRow label="type" value={previousEducation.type} />
          <InfoRow label="profession" value={previousEducation.profession} />
          <InfoRow label="average" value={previousEducation.average} />
          <InfoRow label="language" value={previousEducation.language} />
          <InfoRow label="country" value={previousEducation.country} />
          <InfoRow label="previous_university" value={previousEducation.previousUniversity} />
          <InfoRow label="previous_faculty" value={previousEducation.previousFaculty} />
          <InfoRow label="previous_study_mode" value={previousEducation.previousStudyMode} />
        </Section>

        {/* Enrollment Information */}
        <Section title="enrollment_info" icon={faGraduationCap}>
          <InfoRow label="enrollment_year" value={enrollmentInfo.enrollmentYear} />
          <InfoRow label="status" value={enrollmentInfo.status} />
          <InfoRow label="cycle" value={enrollmentInfo.cycle} />
          <InfoRow label="program" value={enrollmentInfo.program} />
          <InfoRow label="quota" value={enrollmentInfo.quota} />
          <InfoRow label="secondary_education_number" value={enrollmentInfo.secondaryEducationNumber} />
          <InfoRow label="previous_education_credits" value={enrollmentInfo.previousEducationCredits} />
        </Section>

        {/* Contact Information */}
        <div className="lg:col-span-2">
          <Section title="contact" icon={faAddressCard}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <InfoRow 
                  label="place_of_residence" 
                  value={contact.placeOfResidence} 
                  icon={faMapMarkerAlt} 
                />
                <InfoRow label="municipality_of_residence" value={contact.municipalityOfResidence} />
                <InfoRow label="country" value={contact.country} />
                <InfoRow label="address" value={contact.address} />
                <InfoRow label="temporary_address" value={contact.temporaryAddress} />
              </div>
              <div>
                <InfoRow label="phone" value={contact.phone} icon={faPhone} />
                <InfoRow label="mobile_phone" value={contact.mobilePhone} icon={faPhone} />
                <InfoRow label="passport_number" value={contact.passportNumber} icon={faPassport} />
                <InfoRow label="passport_expiry_date" value={contact.passportExpiryDate} />
                <InfoRow 
                  label="email" 
                  value={contact.email} 
                  icon={faEnvelope} 
                />
                <InfoRow 
                  label="microsoft_email" 
                  value={contact.microsoftEmail} 
                  icon={faEnvelope} 
                />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}