const mysql = require("mysql2/promise");
const fs = require('fs');
const path = require('path');

async function debug() {
    const outputPath = path.resolve('debug_counts_result.json');
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '2003',
            database: 'spms_db'
        });
        
        const [scouts] = await connection.query("SELECT id, scout_code FROM scouts");
        const [tracking] = await connection.query("SELECT scout_id, COUNT(*) as cnt FROM activity_tracking WHERE activity_status = 'COMPLETED' GROUP BY scout_id");
        const [service] = await connection.query("SELECT scout_id, SUM(hours) as total FROM service_logs WHERE status = 'APPROVED' GROUP BY scout_id");
        
        const result = {
            outputPath,
            scouts,
            tracking,
            service
        };
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    } catch (e) {
        fs.writeFileSync(path.resolve('debug_counts_err.txt'), e.stack);
    }
    process.exit();
}
debug();
