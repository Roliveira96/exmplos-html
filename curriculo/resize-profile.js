const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const input = path.join(__dirname, 'public', 'assets', 'img', 'perfil.webp');
// Create a temporary path to avoid reading/writing same file if sharp doesn't like it, 
// though sharp usually handles buffer well. Let's write to a temp file then rename.
const tempOutput = path.join(__dirname, 'public', 'assets', 'img', 'perfil-optimized.webp');

async function resizeProfile() {
    console.log("Resizing profile image...");
    if (!fs.existsSync(input)) {
        console.error("Profile image not found!");
        return;
    }

    try {
        await sharp(input)
            .resize(160, 160) // Exact size needed
            .webp({ quality: 85 })
            .toFile(tempOutput);

        // Replace original
        fs.unlinkSync(input);
        fs.renameSync(tempOutput, input);
        console.log("✅ Profile image resized to 160x160.");
    } catch (e) {
        console.error("Error resizing:", e);
    }
}

resizeProfile();
