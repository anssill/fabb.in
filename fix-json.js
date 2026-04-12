const fs = require('fs');
const path = require('path');

function findFiles(dir, filter) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(findFiles(file, filter));
        } else { 
            if (file.endsWith(filter)) results.push(file);
        }
    });
    return results;
}

const files = findFiles(path.join(process.cwd(), 'src'), '.tsx');

files.forEach(filepath => {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;
    
    // Pattern 1: const data = await res.json()
    if (content.includes('await res.json()')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('await res.json()')) {
                const match = lines[i].match(/^(\s*)(const|let|var)\s+(\w+)\s*=\s*await\s+res\.json\(\)\s*$/);
                if (match) {
                    const indent = match[1];
                    const keyword = match[2];
                    const varName = match[3];
                    lines[i] = `${indent}const _text${i} = await res.text();\n${indent}${keyword} ${varName} = _text${i} ? JSON.parse(_text${i}) : {};`;
                    modified = true;
                } else {
                    // Fallback for more complex expressions in the same line
                    // e.g. const { error } = await res.json()
                    const complexMatch = lines[i].match(/^(\s*)(const|let|var)\s+\{(.*)\}\s*=\s*await\s+res\.json\(\)\s*$/);
                    if (complexMatch) {
                        const indent = complexMatch[1];
                        const keyword = complexMatch[2];
                        const destructuring = complexMatch[3];
                        lines[i] = `${indent}const _text${i} = await res.text();\n${indent}${keyword} {${destructuring}} = _text${i} ? JSON.parse(_text${i}) : {};`;
                        modified = true;
                    }
                }
            }
        }
        if (modified) {
            content = lines.join('\n');
        }
    }
    
    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Updated', filepath);
    }
});
