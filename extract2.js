const fs = require('fs');
fs.writeFileSync('debug.log', 'Start of script\n');
try {
    const pdf = require('pdf-parse');
    const path = require('path');
    const filePath = path.join(__dirname, 'manual book', "Scout's Progress Record Book Final Singhala,English.pdf");
    fs.appendFileSync('debug.log', 'File path: ' + filePath + '\n');
    const dataBuffer = fs.readFileSync(filePath);
    fs.appendFileSync('debug.log', 'File read\n');
    pdf(dataBuffer).then(function(data) {
        fs.writeFileSync('pdf_output.txt', data.text);
        fs.appendFileSync('debug.log', 'Done\n');
    }).catch(function(err) {
        fs.appendFileSync('debug.log', 'Promise error: ' + err.message + '\n');
    });
} catch(e) {
    fs.appendFileSync('debug.log', 'Exception: ' + e.message + '\n' + e.stack + '\n');
}
