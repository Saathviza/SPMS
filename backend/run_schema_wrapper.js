const cp = require('child_process');
const fs = require('fs');
try {
    const result = cp.execSync('node run_schema.js');
    fs.writeFileSync('schema_output.txt', result.toString() || 'NO STDOUT');
} catch (e) {
    fs.writeFileSync('schema_output.txt', e.toString() + '\\n' + (e.stdout ? e.stdout.toString() : '') + '\\n' + (e.stderr ? e.stderr.toString() : ''));
}
