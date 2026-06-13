const fs = require('fs');
const path = require('path');

const src = 'C:/Users/moham/.gemini/antigravity-ide/brain/6965127b-5ed7-4ff6-85c0-b576ac5a5c57';
const dest = 'C:/Users/moham/CarbFoot/CarbFoot/screenshots';

const files = [
  ['home_page_screenshot_1781367607857.png', 'home.png'],
  ['assessment_page_1781367621076.png', 'assessment.png'],
  ['dashboard_page_1781367633119.png', 'dashboard.png'],
  ['simulator_page_1781367642865.png', 'simulator.png'],
  ['goals_page_1781367653839.png', 'goals.png'],
  ['challenges_page_1781367663508.png', 'challenges.png'],
  ['home_mobile_1781367677360.png', 'home-mobile.png'],
  ['challenges_mobile_1781367694884.png', 'challenges-mobile.png'],
];

if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

files.forEach(([from, to]) => {
  const srcPath = path.join(src, from);
  const destPath = path.join(dest, to);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ ${to}`);
  } else {
    console.log(`✗ Missing: ${from}`);
  }
});

console.log('Done!');
