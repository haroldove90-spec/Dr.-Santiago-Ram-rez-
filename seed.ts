import Database from 'better-sqlite3';

const db = new Database('neuroflow.db');

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
      JSON.stringify({ phone: '555-0101', email: 'sarah.c@example.com', emergencyContact: 'Kyle Reese (Son) - 555-0102' }),
      JSON.stringify({
        chiefComplaint: 'Sudden onset right-sided weakness',
        historyOfPresentIllness: 'Patient presented with acute onset hemiparesis and aphasia starting 2 hours prior to arrival.',
        pastMedicalHistory: ['Hypertension', 'Hyperlipidemia'],
        familyHistory: ['Father: Stroke at 70'],
        socialHistory: 'Non-smoker, social drinker'
      }),
      '2023-10-24', '2023-11-01T09:00:00',
      JSON.stringify(['High Stroke Risk', 'Aspirin Allergy'])
    );

    insertMed.run(Number(p1.lastInsertRowid), 'Atorvastatin', '40mg', 'Daily', '2023-10-24', 1);
    insertMed.run(Number(p1.lastInsertRowid), 'Clopidogrel', '75mg', 'Daily', '2023-10-24', 1);

    insertScale.run(Number(p1.lastInsertRowid), 'NIHSS', 12, '2023-10-24T10:30:00', 'Admission score', JSON.stringify({}));

    // Patient 2
    const p2 = insertPatient.run(
      'N-10235', 'John', 'Doe', '1980-08-15', 'male',
      JSON.stringify({ phone: '555-0201', email: 'j.doe@example.com', emergencyContact: 'Jane Doe (Wife) - 555-0202' }),
      JSON.stringify({
        chiefComplaint: 'Tremor in right hand',
        historyOfPresentIllness: 'Noticed resting tremor in right hand 3 months ago. Getting progressively worse.',
        pastMedicalHistory: ['None'],
        familyHistory: ['None'],
        socialHistory: 'Smoker (1 pack/day)'
      }),
      '2023-10-23', '2023-11-15T14:00:00',
      JSON.stringify([])
    );
    
    insertMed.run(Number(p2.lastInsertRowid), 'Levodopa', '25/100mg', 'TID', '2023-10-23', 1);

    console.log('Database seeded successfully.');
  }
} catch (error) {
  console.error('Error seeding database:', error);
}
