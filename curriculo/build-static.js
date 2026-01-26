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

                            // Helper to get localized or string content
                            const getVal = (val, lang = 'br') => {
                                if (!val) return '';
                                if (typeof val === 'string') return val;
                                return val[lang] || val['br'] || '';
                            };

                            const sTitle = getVal(seo.title);
                            const sDesc = getVal(seo.description);
                            const sKw = getVal(seo.keywords);

                            // Replacements
                            if (sTitle) {
                                content = content.replace(/<title>[\s\S]*?<\/title>/, `<title>${sTitle}</title>`);
                                content = content.replace(/<meta\s+name="title"[\s\S]*?>/, `<meta name="title" content="${sTitle}">`);
                                content = content.replace(/<meta\s+property="og:title"[\s\S]*?>/, `<meta property="og:title" content="${sTitle}">`);
                                content = content.replace(/<meta\s+property="twitter:title"[\s\S]*?>/, `<meta property="twitter:title" content="${sTitle}">`);
                            }
                            if (sDesc) {
                                content = content.replace(/<meta\s+name="description"[\s\S]*?>/, `<meta name="description" content="${sDesc}">`);
                                content = content.replace(/<meta\s+property="og:description"[\s\S]*?>/, `<meta property="og:description" content="${sDesc}">`);
                                content = content.replace(/<meta\s+property="twitter:description"[\s\S]*?>/, `<meta property="twitter:description" content="${sDesc}">`);
                            }
                            if (sKw) {
                                content = content.replace(/<meta\s+name="keywords"[\s\S]*?>/, `<meta name="keywords" content="${sKw}">`);
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
                                // Assuming twitter:site or similar if it exists, but usually covered by card.
                            }
                            if (seo.siteName) {
                                // Check if tag exists, else append to head end (simple approach: replace </head> with tag + </head> if not found, but we are replacing existing tags mainly. The template might not have these.)
                                // Better strategy: Since they might not exist, we just APPEND them before </head> if we can't find a slot, OR replacing a comment placeholder if we added one.
                                // But to be safe and avoid complex parsing, let's assume standard template structure or just use Regex to find a good injection point if replacements fail?
                                // Actually, simpler: The user wants them. If they aren't in the HTML, regex replace won't work.
                                // Let's try to find <meta property="og:site_name"> first.
                                if (content.includes('property="og:site_name"')) {
                                    content = content.replace(/<meta\s+property="og:site_name"[\s\S]*?>/, `<meta property="og:site_name" content="${seo.siteName}">`);
                                } else {
                                    content = content.replace('</head>', `<meta property="og:site_name" content="${seo.siteName}">\n    </head>`);
                                }
                            }
                            if (seo.locale) {
                                if (content.includes('property="og:locale"')) {
                                    content = content.replace(/<meta\s+property="og:locale"[\s\S]*?>/, `<meta property="og:locale" content="${seo.locale}">`);
                                } else {
                                    content = content.replace('</head>', `<meta property="og:locale" content="${seo.locale}">\n    </head>`);
                                }
                            }
                            if (seo.themeColor) {
                                if (content.includes('name="theme-color"')) {
                                    content = content.replace(/<meta\s+name="theme-color"[\s\S]*?>/, `<meta name="theme-color" content="${seo.themeColor}">`);
                                } else {
                                    content = content.replace('</head>', `<meta name="theme-color" content="${seo.themeColor}">\n    </head>`);
                                }
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
