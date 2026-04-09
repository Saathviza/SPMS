const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const filePath = path.join(__dirname, 'manual book', "Scout's Progress Record Book Final Singhala,English.pdf");

async function parsePages() {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        fs.writeFileSync('debug.log', 'File read successfully (Buffer size: ' + dataBuffer.length + ')\n');
        
        // Custom render page function to only log pages we care about (we can't just slice buffer)
        let options = {
            max: 0 // Process all pages but no wait, let's just dump it and see if memory hits
        }

        const data = await pdf(dataBuffer, options);
        fs.writeFileSync('pdf_output.txt', data.text);
        fs.appendFileSync('debug.log', 'Success: parsed ' + data.numpages + ' pages.\n');
    } catch (err) {
        fs.appendFileSync('debug.log', 'Error: ' + err.toString() + '\n' + err.stack);
    }
}

parsePages();
