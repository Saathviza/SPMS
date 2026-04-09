const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const filePath = path.join(__dirname, 'manual book', "Scout's Progress Record Book Final Singhala,English.pdf");

(async () => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        fs.writeFileSync('pdf_output.txt', data.text);
        console.log(`SUCCESS: Parsed ${data.numpages} pages.`);
    } catch (e) {
        console.error("ERROR reading file:", e.message);
    }
})();
