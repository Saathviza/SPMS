const fs = require('fs');
const path = require('path');

process.on('uncaughtException', (err) => {
    const report = `UNCAUGHT EXCEPTION:\n${err.stack}\n`;
    console.error(report);
    fs.writeFileSync(path.join(__dirname, 'crash_report.txt'), report);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const report = `UNHANDLED REJECTION:\nReason: ${reason}\nStack: ${reason.stack}\n`;
    console.error(report);
    fs.writeFileSync(path.join(__dirname, 'crash_report.txt'), report);
    process.exit(1);
});

console.log("Starting app via logger...");
try {
    require('./app.js');
} catch (err) {
    const report = `REQUIRE ERROR:\n${err.stack}\n`;
    console.error(report);
    fs.writeFileSync(path.join(__dirname, 'crash_report.txt'), report);
    process.exit(1);
}
