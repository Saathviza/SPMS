const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const [users] = await db.execute('SELECT id, full_name FROM users WHERE email = ?', ['sherasaathvizarajkumar@gmail.com']);
  const userId = users[0].id;
  const [scouts] = await db.execute('SELECT id FROM scouts WHERE user_id = ?', [userId]);
  const scoutId = scouts[0].id;

  const [subs] = await db.execute(`
    SELECT a.activity_name, a.activity_date, t.activity_status 
    FROM activity_tracking t 
    JOIN activities a ON t.activity_id = a.id 
    WHERE t.scout_id = ?
  `, [scoutId]);
  
  console.log('ACTIVE REGISTRATIONS & SUBMISSIONS FOR ' + users[0].full_name);
  console.table(subs);
  
  await db.end();
}

run();
