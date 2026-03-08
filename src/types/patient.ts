export interface ClinicalScale {
  id: string;
  name: string; // e.g., "NIHSS", "mRS", "Glasgow"
  score: number;
  date: string; // ISO date
  notes?: string;
  details: Record<string, number | string>; // Specific breakdown
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  active: boolean;
}

export interface ImagingStudy {
  id: string;
  type: string; // MRI, CT, PET
  date: string;
  summary: string;
  imageUrl?: string; // Thumbnail or link to PACS
  dicomUrl?: string;
}

export interface NeurologicalHistory {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string[];
  familyHistory: string[];
  socialHistory: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  contact: {
    phone: string;
    email: string;
    emergencyContact: string;
  };
  history: NeurologicalHistory;
  medications: Medication[];
  clinicalScales: ClinicalScale[];
  imagingStudies: ImagingStudy[];
  lastVisit: string;
  nextAppointment?: string;
  alerts: string[]; // e.g., "High Stroke Risk", "Allergy: Penicillin"
}
