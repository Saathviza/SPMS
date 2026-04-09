const pool = require('./src/config/db.config');

async function getGroups() {
    try {
        const [groups] = await pool.query("SELECT * FROM scout_groups");
        console.log("Groups:", JSON.stringify(groups, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

getGroups();
