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

export interface GlasgowComaScale {
  ocular: number; // 1-4
  verbal: number | string; // 1-5 or '1T'
  motor: number; // 1-6
  total: number | string;
}

export interface NeurologicalExam {
  gcs?: GlasgowComaScale;
  cranialNerves?: string;
  motorSystem?: string;
  reflexes?: string;
  sensorySystem?: string;
  coordinationAndGait?: string;
  meningealSigns?: 'Ausentes' | 'Presentes' | 'Dudosos' | '';
}

export interface NeurologicalHistory {
  // Perfil
  advanceDirectives?: string;
  
  // Anamnesis
  chiefComplaint: string;
  symptomOnset?: string;
  evolution?: 'Aguda' | 'Subaguda' | 'Crónica' | 'Fluctuante' | '';
  currentDeficit?: string;
  pastMedicalHistory: string | string[];
  surgicalHistory?: string;
  familyHistory: string | string[];
  allergies?: string;
  socialHistory: string;
  
  // Examen Físico
  generalExam?: string;
  neurologicalExam?: NeurologicalExam;
  
  // Imagenología (Resumen en historial, aunque hay un módulo aparte)
  imagingType?: string[];
  imagingDate?: string;
  imagingFindings?: string;
  imagingComparison?: string;
  dicomUrl?: string;

  // Planificación Quirúrgica
  therapeuticDecision?: 'Tratamiento Médico' | 'Cirugía Electiva' | 'Cirugía de Urgencia' | 'Paliativo' | '';
  proposedProcedure?: string;
  surgicalRisk?: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | '';
  outcomeScale?: string;
  evolutionNotes?: string;

  // Legacy fields (kept for compatibility)
  historyOfPresentIllness?: string;
  assessment?: string;
  plan?: string;
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
