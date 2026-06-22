const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, 'db.json')
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

// Remove test forms (id 14, 15) and their related data
const testFormIds = [14, 15]

if (db.evaluationForms) {
  db.evaluationForms = db.evaluationForms.filter(f => !testFormIds.includes(f.id))
}
if (db.evaluationQuestions) {
  db.evaluationQuestions = db.evaluationQuestions.filter(q => !testFormIds.includes(q.form_id))
}
if (db.evaluationWindows) {
  db.evaluationWindows = db.evaluationWindows.filter(w => !testFormIds.includes(w.form_id))
}
if (db.formPublishAudits) {
  db.formPublishAudits = db.formPublishAudits.filter(a => !testFormIds.includes(a.form_id))
}

// Also check for any questions with form_id that no longer exists
const validFormIds = new Set(db.evaluationForms.map(f => f.id))
if (db.evaluationQuestions) {
  db.evaluationQuestions = db.evaluationQuestions.filter(q => validFormIds.has(q.form_id))
}
if (db.evaluationWindows) {
  db.evaluationWindows = db.evaluationWindows.filter(w => validFormIds.has(w.form_id))
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
console.log('Cleaned up test data. Remaining forms:', db.evaluationForms.length)
console.log('Remaining questions:', db.evaluationQuestions.length)
console.log('Remaining windows:', db.evaluationWindows.length)
