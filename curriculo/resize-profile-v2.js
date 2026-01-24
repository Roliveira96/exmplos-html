const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const input = path.join(__dirname, 'public', 'assets', 'img', 'perfil.webp');
const output = path.join(__dirname, 'public', 'assets', 'img', 'perfil-160.webp');

async function resizeProfile() {
    console.log("Creating optimized profile image (perfil-160.webp)...");
    if (!fs.existsSync(input)) {
        console.error("Profile image not found at " + input);
        return;
    }

    try {
        await sharp(input)
            .resize(160, 160)
            .webp({ quality: 85 })
            .toFile(output);

        console.log("✅ Created perfil-160.webp");
    } catch (e) {
        console.error("Error resizing:", e);
    }
}

resizeProfile();
