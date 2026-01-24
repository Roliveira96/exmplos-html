const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const fontsCssPath = path.join(__dirname, 'src', 'fonts.css');

// 1. Fix Font Display
console.log("Fixing font-display in fonts.css...");
let cssContent = fs.readFileSync(fontsCssPath, 'utf8');
// Replace 'font-display: swap;' (if exists) or insert it.
// Actually, the google fonts usually come with swap, but let's enforce it.
// And for Font Awesome, it sends 'block'. We want 'swap'.

// Replace existing
cssContent = cssContent.replace(/font-display:\s*block/g, 'font-display: swap');
cssContent = cssContent.replace(/font-display:\s*auto/g, 'font-display: swap');

// Check if there are font-face rules without font-display and add it
// This regex looks for @font-face { ... } and checks if font-display is missing. 
// A bit complex with regex, simpler to just replace "src:" with "font-display: swap; src:" if not present?
// No, safer to just replace all "font-display: block" which FA uses. Google fonts generally use swap if requested properly.
// The previous file view showed "font-display: swap" for google fonts already.
// So we mainly need to fix FontAwesome which was "block".
fs.writeFileSync(fontsCssPath, cssContent);
console.log("✅ fonts.css updated.");


// 2. Generate Thumbnails
const imgDir = path.join(__dirname, 'public', 'assets', 'img', 'certificates');
const outputDir = imgDir; // Save in same dir with prefix/suffix? Or overwrite if careful.
// Lighthouse complained about 450px images in 300px slots.
// Let's create a 'thumb-' version for these.

async function generateThumbnails() {
    if (!fs.existsSync(imgDir)) {
        console.log("No certificates directory found.");
        return;
    }
    const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.webp') && !f.startsWith('thumb-'));

    console.log(`Generating thumbnails for ${files.length} images...`);

    for (const file of files) {
        const inputPath = path.join(imgDir, file);
        const outputPath = path.join(imgDir, `thumb-${file}`);

        try {
            await sharp(inputPath)
                .resize({ width: 335 }) // Exact width needed for the cards
                .toFile(outputPath);
            process.stdout.write(".");
        } catch (e) {
            console.error(`Error resizing ${file}:`, e);
        }
    }
    console.log("\n✅ Thumbnails generated.");
}

generateThumbnails();
