const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const con = await mysql.createConnection({
      host: '127.0.0.1', 
      user: 'root', 
      password: process.env.DB_PASS || '2003',
      database: 'spms_db'
    });
    
    // First, let's find her User ID
    const [users] = await con.execute('SELECT id, email, full_name FROM users WHERE email = ?', ['sherasaathvizarajkumar@gmail.com']);
    
    if (users.length === 0) {
      console.log("No scout found with that email.");
      process.exit();
    }
    
    const userId = users[0].id;
    console.log("Found User ID:", userId);
    
    // Check if the username column needs to be populated
    const username = users[0].email.split('@')[0];
    await con.execute('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
    
    // Find Scout ID to perhaps update NIC or Contact
    const [scouts] = await con.execute('SELECT id FROM scouts WHERE user_id = ?', [userId]);
    
    if (scouts.length > 0) {
      await con.execute(
        `UPDATE scouts 
         SET contact_number = 'NOT YET PROVIDED', nic_or_school_id = 'NOT YET PROVIDED' 
         WHERE user_id = ? AND (nic_or_school_id IS NULL OR contact_number IS NULL)`, 
        [userId]
      );
      console.log("Scout details updated successfully with placeholders.");
    }
    
    console.log("Finished updating the specific scout.");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
