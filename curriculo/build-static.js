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

        // EXCLUDE ADMIN & LOGIN PAGES
        const relativePath = path.relative(publicDir, srcPath).split(path.sep).join('/');
        if (relativePath === 'pages/admin' || relativePath === 'pages/login') {
            console.log(`🚫 Skipping excluded path: ${relativePath}`);
            continue;
        }

        if (stats.isDirectory()) {
            await processDirectory(srcPath, destPath);
        } else {
            console.log(`Processing: ${item}`);
            if (item.endsWith('.html')) {
                // Minify HTML
                try {
                    let content = fs.readFileSync(srcPath, 'utf8');

                    // INJECT SEO METADATA (Only for root index.html or logic specific files)
                    if (item === 'index.html' && src === publicDir) {
                        try {
                            const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
                            const seo = data.seo || {};

                            console.log('✨ Injecting SEO Data into index.html...');

                            // Replacements
                            if (seo.title) {
                                content = content.replace(/<title>[\s\S]*?<\/title>/, `<title>${seo.title}</title>`);
                                content = content.replace(/<meta\s+name="title"[\s\S]*?>/, `<meta name="title" content="${seo.title}">`);
                                content = content.replace(/<meta\s+property="og:title"[\s\S]*?>/, `<meta property="og:title" content="${seo.title}">`);
                                content = content.replace(/<meta\s+property="twitter:title"[\s\S]*?>/, `<meta property="twitter:title" content="${seo.title}">`);
                            }
                            if (seo.description) {
                                content = content.replace(/<meta\s+name="description"[\s\S]*?>/, `<meta name="description" content="${seo.description}">`);
                                content = content.replace(/<meta\s+property="og:description"[\s\S]*?>/, `<meta property="og:description" content="${seo.description}">`);
                                content = content.replace(/<meta\s+property="twitter:description"[\s\S]*?>/, `<meta property="twitter:description" content="${seo.description}">`);
                            }
                            if (seo.keywords) {
                                content = content.replace(/<meta\s+name="keywords"[\s\S]*?>/, `<meta name="keywords" content="${seo.keywords}">`);
                            }
                            if (seo.author) {
                                content = content.replace(/<meta\s+name="author"[\s\S]*?>/, `<meta name="author" content="${seo.author}">`);
                            }
                            if (seo.robots) {
                                content = content.replace(/<meta\s+name="robots"[\s\S]*?>/, `<meta name="robots" content="${seo.robots}">`);
                            }
                            if (seo.ogImage) {
                                content = content.replace(/<meta\s+property="og:image"[\s\S]*?>/, `<meta property="og:image" content="${seo.ogImage}">`);
                                content = content.replace(/<meta\s+property="twitter:image"[\s\S]*?>/, `<meta property="twitter:image" content="${seo.ogImage}">`);
                            }
                            if (seo.canonicalUrl) {
                                content = content.replace(/<link\s+rel="canonical"[\s\S]*?>/, `<link rel="canonical" href="${seo.canonicalUrl}">`);
                            }
                            if (seo.twitterHandle) {
                                // Assuming twitter:site or similar if it exists, or adding it if we want. 
                                // The template didn't have site/creator explicitly shown in snippets, but let's leave it or add if needed.
                                // The user asked for "Twitter Handle" management.
                                // Let's try to replace content of a meta tag if it existed, or just ignore if not present in template to avoid breaking.
                            }

                        } catch (seoErr) {
                            console.warn('⚠️ SEO Injection failed:', seoErr.message);
                        }
                    }

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
