const pool = require('./src/config/db.config');

async function checkSchema() {
    try {
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Tables:", tables);
        for (let table of tables) {
            const tableName = Object.values(table)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.log(`Columns for ${tableName}:`, columns.map(c => c.Field));
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
