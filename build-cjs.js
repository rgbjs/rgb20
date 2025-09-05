#!/usr/bin/env node

/**
 * Build script to create CommonJS version from ES modules
 * Converts import/export syntax for Node.js compatibility
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function convertToCJS(content) {
    // Convert ES module imports to require()
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?/g, 
        'const { $1 } = require(\'$2\');');
    
    content = content.replace(/import\s+([^\s,{]+)\s+from\s+['"]([^'"]+)['"];?/g,
        'const $1 = require(\'$2\');');
    
    content = content.replace(/import\s+([^\s,{]+),\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"];?/g,
        'const $1 = require(\'$3\');\nconst { $2 } = $1;');

    // Convert named exports
    content = content.replace(/export\s+{\s*([^}]+)\s*};?/g, (match, exports) => {
        const exportNames = exports.split(',').map(name => name.trim());
        return exportNames.map(name => `module.exports.${name} = ${name};`).join('\n');
    });

    // Convert export const/function/class
    content = content.replace(/export\s+(const|function|class)\s+([^\s=({]+)/g, 
        '$1 $2');
    
    // Add module.exports for default and named exports at the end
    const exportStatements = [];
    
    // Find exported functions, classes, and constants
    const exportedItems = [];
    const constExports = content.match(/(?:^|\n)const\s+([^=\s]+)/g);
    const funcExports = content.match(/(?:^|\n)function\s+([^(]+)/g);
    const classExports = content.match(/(?:^|\n)class\s+([^{\s]+)/g);
    
    if (constExports) {
        constExports.forEach(match => {
            const name = match.replace(/(?:^|\n)const\s+/, '');
            if (name && !name.includes('=')) {
                exportedItems.push(name);
            }
        });
    }
    
    if (funcExports) {
        funcExports.forEach(match => {
            const name = match.replace(/(?:^|\n)function\s+/, '');
            exportedItems.push(name);
        });
    }
    
    if (classExports) {
        classExports.forEach(match => {
            const name = match.replace(/(?:^|\n)class\s+/, '');
            exportedItems.push(name);
        });
    }

    // Convert export default
    const defaultExportMatch = content.match(/export\s+default\s+([^;]+);?/);
    if (defaultExportMatch) {
        content = content.replace(/export\s+default\s+([^;]+);?/, '');
        exportStatements.push(`module.exports = ${defaultExportMatch[1]};`);
        exportedItems.forEach(item => {
            exportStatements.push(`module.exports.${item} = ${item};`);
        });
    } else {
        // No default export, just named exports
        exportedItems.forEach(item => {
            exportStatements.push(`module.exports.${item} = ${item};`);
        });
    }

    // Add all export statements at the end
    if (exportStatements.length > 0) {
        content += '\n\n// CommonJS exports\n' + exportStatements.join('\n');
    }

    return content;
}

console.log('🔧 Building CommonJS version...');

try {
    // Read the ES module file
    const esModuleContent = readFileSync(join(__dirname, 'index.js'), 'utf8');
    
    // Convert to CommonJS
    const cjsContent = convertToCJS(esModuleContent);
    
    // Write CommonJS version
    writeFileSync(join(__dirname, 'index.cjs'), cjsContent);
    
    console.log('✅ CommonJS build complete: index.cjs');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}