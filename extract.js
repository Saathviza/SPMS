const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const filePath = path.join(__dirname, 'manual book', "Scout's Progress Record Book Final Singhala,English.pdf");

fs.writeFileSync('debug.log', 'Start\n');

(async () => {
    try {
        fs.appendFileSync('debug.log', 'Reading file...\n');
        const dataBuffer = fs.readFileSync(filePath);
        fs.appendFileSync('debug.log', 'Parsing PDF...\n');
        const data = await pdf(dataBuffer);
        fs.appendFileSync('debug.log', 'Writing output...\n');
        fs.writeFileSync('pdf_output.txt', data.text);
        fs.appendFileSync('debug.log', `SUCCESS: Parsed ${data.numpages} pages.\n`);
    } catch (e) {
        fs.appendFileSync('debug.log', "ERROR reading file: " + e.message + "\n");
    }
})();
