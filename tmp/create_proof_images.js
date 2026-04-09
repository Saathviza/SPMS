const fs = require('fs');
const path = require('path');

// Source images (the two we successfully generated)
const CAMPING_IMG = path.resolve(__dirname, '../../../.gemini/antigravity/brain/982c1384-1242-41e6-becd-2c6e55d67e8e/scout_camping_proof_1773042438454.png');
const HIKING_IMG  = path.resolve(__dirname, '../../../.gemini/antigravity/brain/982c1384-1242-41e6-becd-2c6e55d67e8e/scout_hiking_proof_1773042452895.png');

// Destination folder - inside the backend uploads dir (where multer saves real uploads)
const DEST_DIR = path.resolve(__dirname, '../backend/uploads/activity-proofs');

// Proof image definitions: filename -> which source to use
const FILES = [
  { name: 'Navigation_Skills_Camp_proof.jpg',       src: HIKING_IMG  },
  { name: 'Environmental_Awareness_Program_proof.jpg', src: CAMPING_IMG },
  { name: 'Mountain_Hiking_Expedition_proof.jpg',   src: HIKING_IMG  },
  { name: 'Badge_Preparation_Class_proof.jpg',      src: CAMPING_IMG },
  { name: 'Community_Clean-Up_Drive_proof.jpg',     src: HIKING_IMG  },
  { name: 'First_Aid_Workshop_proof.jpg',           src: CAMPING_IMG },
  { name: 'Wilderness_Survival_Camp_proof.jpg',     src: CAMPING_IMG },
  { name: 'Navigation_Training_proof.jpg',          src: HIKING_IMG  },
  { name: 'Community_Service_proof.jpg',            src: HIKING_IMG  },
];

// Make sure upload dir exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
  console.log('📁 Created uploads/activity-proofs directory');
}

// Check sources exist
if (!fs.existsSync(CAMPING_IMG)) {
  console.error('❌ Camping image not found:', CAMPING_IMG);
  process.exit(1);
}
if (!fs.existsSync(HIKING_IMG)) {
  console.error('❌ Hiking image not found:', HIKING_IMG);
  process.exit(1);
}

// Copy files
let ok = 0;
for (const f of FILES) {
  const dest = path.join(DEST_DIR, f.name);
  fs.copyFileSync(f.src, dest);
  console.log(`✅ Created: ${f.name}`);
  ok++;
}

console.log(`\n🎉 Done! ${ok} proof image files created in:\n   ${DEST_DIR}`);
