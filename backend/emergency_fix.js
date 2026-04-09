const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    const email = 'sherasaathvizarajkumar@gmail.com';
    const activityName = 'Navigation Skills Camp';

    console.log(`Starting cleanup for ${email} - ${activityName}...`);

    // 1. Find the User and Activity IDs
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) throw new Error('User not found');
    const userId = users[0].id;

    const [scouts] = await db.execute('SELECT id FROM scouts WHERE user_id = ?', [userId]);
    if (scouts.length === 0) throw new Error('Scout profile not found');
    const scoutId = scouts[0].id;

    const [acts] = await db.execute('SELECT id FROM activities WHERE activity_name = ?', [activityName]);
    if (acts.length === 0) throw new Error('Activity not found');
    const activityId = acts[0].id;

    // 2. Surgical Deletion of the "Fake" Demo Data
    // Delete proof submissions first (due to foreign keys)
    const [delProofs] = await db.execute(`
      DELETE FROM activity_proof_submissions 
      WHERE tracking_id IN (
        SELECT id FROM activity_tracking 
        WHERE scout_id = ? AND activity_id = ?
      )`, [scoutId, activityId]);
    console.log(`Deleted ${delProofs.affectedRows} proof submissions.`);

    // Delete tracking records
    const [delTracking] = await db.execute(`
      DELETE FROM activity_tracking 
      WHERE scout_id = ? AND activity_id = ?
    `, [scoutId, activityId]);
    console.log(`Deleted ${delTracking.affectedRows} tracking records.`);

    // Delete registrations
    const [delRegs] = await db.execute(`
      DELETE FROM activity_registrations 
      WHERE scout_id = ? AND activity_id = ?
    `, [scoutId, activityId]);
    console.log(`Deleted ${delRegs.affectedRows} registrations.`);

    console.log('--- CLEANUP SUCCESSFUL ---');

    // 3. Final Verification
    const [remaining] = await db.execute(`
      SELECT a.activity_name, a.activity_date 
      FROM activity_registrations r
      JOIN activities a ON r.activity_id = a.id
      WHERE r.scout_id = ?
    `, [scoutId]);
    
    console.log('Remaining activities for Scout:');
    console.table(remaining);

  } catch (err) {
    console.error('ERROR DURING FIX:', err.message);
  } finally {
    await db.end();
  }
}

run();
