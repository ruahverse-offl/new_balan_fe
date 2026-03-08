const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/Home.jsx',
    'src/pages/Clinic.jsx',
    'src/pages/Pharmacy.jsx',
    'src/pages/Insurance.jsx',
    'src/pages/Polyclinic.jsx',
    'src/pages/About.jsx',
    'src/pages/Admin.jsx',
    'src/App.jsx',
    'src/main.jsx',
    'src/index.css'
];

files.forEach(relativePath => {
    const filePath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        let content;

        // Check for UTF-16LE BOM (0xFF 0xFE)
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            content = buffer.toString('utf16le');
            console.log(`${relativePath}: Detected UTF-16LE with BOM`);
        }
        // Check for UTF-16BE BOM (0xFE 0xFF)
        else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
            content = buffer.toString('utf16be');
            console.log(`${relativePath}: Detected UTF-16BE with BOM`);
        }
        // Check if it looks like UTF-16LE without BOM (common on Windows)
        else if (buffer.length > 4 && buffer[1] === 0 && buffer[3] === 0) {
            content = buffer.toString('utf16le');
            console.log(`${relativePath}: Detected UTF-16LE without BOM`);
        }
        else {
            content = buffer.toString('utf8');
            console.log(`${relativePath}: Read as UTF-8`);
        }

        // Remove BOM
        content = content.replace(/^\uFEFF/, '');

        // Write back as standard UTF-8 without BOM
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully normalized: ${relativePath}`);
    }
});
