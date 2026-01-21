const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src/pages');

function traverseAndFix(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            traverseAndFix(filePath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let original = content;

            // Fix ../../ui/ -> ../../components/ui/
            // Used in: src/pages/auth/*.js
            // src/pages/auth/X.js -> ../../components/ui/X.js is correct
            content = content.replace(/from ['"]\.\.\/\.\.\/ui\//g, "from '../../components/ui/");

            // Fix ./ui/ -> ../../components/ui/
            // Used in: src/pages/dashboards/*.js
            // src/pages/dashboards/X.js -> ../../components/ui/X.js is correct.
            content = content.replace(/from ['"]\.\/ui\//g, "from '../../components/ui/");

            // Fix ../ui/ -> ../../components/ui/
            // Used in : src/pages/scout/*.js
            // src/pages/scout/X.js -> ../../components/ui/X.js is correct.
            content = content.replace(/from ['"]\.\.\/ui\//g, "from '../../components/ui/");

            // Fix double fix if any (just in case)
            content = content.replace(/components\/components\/ui/g, "components/ui");

            // Fix missing imports from previous error logs (just in case they were totally wrong)
            // e.g. "Module not found: Error: Can't resolve '../../ui/card'" implies it was looking at ../../ui/card

            if (content !== original) {
                console.log(`Fixing ${filePath}`);
                fs.writeFileSync(filePath, content);
            }
        }
    });
}

traverseAndFix(rootDir);
console.log("Imports fixed.");
