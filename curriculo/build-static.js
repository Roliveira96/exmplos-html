const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const minifyHtml = require('html-minifier-terser').minify;
const { minify: minifyJs } = require('terser');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

console.log('🏗️  Starting OPTIMIZED static build...');

// 1. Clean dist folder
if (fs.existsSync(distDir)) {
    console.log('🧹 Cleaning dist folder...');
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// 2. Build CSS (already minified by Tailwind)
console.log('🎨 Building CSS...');
try {
    execSync('npm run build-css', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error building CSS:', error);
    process.exit(1);
}

// 3. Process files (Minify JS/HTML, Copy others)
console.log('⚡ Processing and minifying files...');

async function processDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    const items = fs.readdirSync(src);

    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stats = fs.statSync(srcPath);

        if (stats.isDirectory()) {
            await processDirectory(srcPath, destPath);
        } else {
            console.log(`Processing: ${item}`);
            if (item.endsWith('.html')) {
                // Minify HTML
                try {
                    const content = fs.readFileSync(srcPath, 'utf8');
                    const minified = await minifyHtml(content, {
                        collapseWhitespace: true,
                        removeComments: true,
                        minifyCSS: true,
                        minifyJS: true,
                        removeAttributeQuotes: true,
                        removeEmptyAttributes: true
                    });
                    fs.writeFileSync(destPath, minified);
                } catch (e) {
                    console.error(`Error minifying HTML ${item}:`, e);
                    fs.copyFileSync(srcPath, destPath); // Fallback
                }
            } else if (item.endsWith('.js')) {
                // Minify JS
                try {
                    const content = fs.readFileSync(srcPath, 'utf8');
                    const result = await minifyJs(content, {
                        compress: true,
                        mangle: true
                    });
                    fs.writeFileSync(destPath, result.code);
                } catch (e) {
                    console.error(`Error minifying JS ${item}:`, e);
                    fs.copyFileSync(srcPath, destPath); // Fallback
                }
            } else {
                // Copy other files directly
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

// Start processing
(async () => {
    try {
        await processDirectory(publicDir, distDir);
        console.log('✅ Build complete! SUPER OPTIMIZED version in "dist".');
        console.log('⚠️  NOTE: Server-side features (TTS) removed for static build.');
    } catch (e) {
        console.error('Build failed:', e);
        process.exit(1);
    }
})();
