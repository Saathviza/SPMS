const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '2003',
      database: process.env.DB_NAME || 'spms_db'
    });

    const [users] = await connection.execute('SELECT id, email FROM users WHERE email = ?', ['sherasaathvizarajkumar@gmail.com']);
    if (users.length === 0) {
      console.log('--- USER NOT FOUND ---');
      await connection.end();
      return;
    }

    const scoutId = users[0].id;
    console.log(`--- SCOUT ID: ${scoutId} (${users[0].email}) ---`);

    const [subs] = await connection.execute('SELECT id, activity_id, created_at FROM activity_submissions WHERE user_id = ?', [scoutId]);
    console.log('--- RECENT SUBMISSIONS ---');
    console.table(subs);

    const [regs] = await connection.execute('SELECT id, activity_id, created_at FROM activity_registrations WHERE user_id = ?', [scoutId]);
    console.log('--- RECENT REGISTRATIONS ---');
    console.table(regs);

    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
