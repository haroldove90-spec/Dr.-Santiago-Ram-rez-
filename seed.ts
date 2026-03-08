import db from './src/db';

// Seed data
try {
  const check = db.prepare('SELECT count(*) as count FROM patients').get() as { count: number };
  
  if (check.count === 0) {
    console.log('Seeding database...');
    
    const insertPatient = db.prepare(`
      INSERT INTO patients (mrn, firstName, lastName, dateOfBirth, gender, contact, history, lastVisit, nextAppointment, alerts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMed = db.prepare(`
      INSERT INTO medications (patientId, name, dosage, frequency, startDate, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertScale = db.prepare(`
      INSERT INTO clinical_scales (patientId, name, score, date, notes, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Patient 1
    const p1 = insertPatient.run(
      'N-10234', 'Sarah', 'Connor', '1965-05-12', 'female',
      JSON.stringify({ phone: '555-0101', email: 'sarah.c@example.com', emergencyContact: 'Kyle Reese (Hijo) - 555-0102' }),
      JSON.stringify({
        chiefComplaint: 'Debilidad súbita en el lado derecho',
        historyOfPresentIllness: 'La paciente presentó hemiparesia aguda y afasia comenzando 2 horas antes de la llegada.',
        pastMedicalHistory: ['Hipertensión', 'Hiperlipidemia'],
        familyHistory: ['Padre: Ictus a los 70'],
        socialHistory: 'No fumadora, bebedora social'
      }),
      '2025-10-24', '2025-11-01T09:00:00',
      JSON.stringify(['Alto Riesgo de Ictus', 'Alergia a Aspirina'])
    );

    insertMed.run(Number(p1.lastInsertRowid), 'Atorvastatina', '40mg', 'Diario', '2025-10-24', 1);
    insertMed.run(Number(p1.lastInsertRowid), 'Clopidogrel', '75mg', 'Diario', '2025-10-24', 1);

    insertScale.run(Number(p1.lastInsertRowid), 'NIHSS', 12, '2025-10-24T10:30:00', 'Puntuación de admisión', JSON.stringify({}));

    // Patient 2
    const p2 = insertPatient.run(
      'N-10235', 'Juan', 'Pérez', '1980-08-15', 'male',
      JSON.stringify({ phone: '555-0201', email: 'j.doe@example.com', emergencyContact: 'Juana Pérez (Esposa) - 555-0202' }),
      JSON.stringify({
        chiefComplaint: 'Temblor en mano derecha',
        historyOfPresentIllness: 'Notó temblor en reposo en la mano derecha hace 3 meses. Empeorando progresivamente.',
        pastMedicalHistory: ['Ninguno'],
        familyHistory: ['Ninguno'],
        socialHistory: 'Fumador (1 paquete/día)'
      }),
      '2025-10-23', '2025-11-15T14:00:00',
      JSON.stringify([])
    );
    
    insertMed.run(Number(p2.lastInsertRowid), 'Levodopa', '25/100mg', 'TID', '2025-10-23', 1);

    console.log('Database seeded successfully.');
  }
} catch (error) {
  console.error('Error seeding database:', error);
}
