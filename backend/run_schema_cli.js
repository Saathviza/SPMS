const cp = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const schemaPath = path.join(__dirname, 'schema.sql');
const mysqlCmd = `mysql -u ${process.env.DB_USER} -p${process.env.DB_PASS} < "${schemaPath}"`;

console.log(`Executing: ${mysqlCmd}`);

try {
    // We use cmd /c for Windows to handle redirection
    const output = cp.execSync(`cmd /c "${mysqlCmd}"`, { stdio: 'inherit' });
    console.log("✅ Schema re-imported successfully via mysql CLI.");
} catch (err) {
    console.error("❌ Error importing schema:", err.message);
}
