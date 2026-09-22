const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('route_output.json', 'utf8'));

const urduStepNames = [
  'ڈیفنس کالونی گلی سے جنوب کی طرف روانہ ہوں',
  'ڈیفنس کالونی سیکٹر روڈ پر دائیں مڑیں',
  'خیبر روڈ لنک کی طرف بائیں مڑیں',
  'گرینڈ ٹرنک روڈ پر دائیں مڑیں',
  'یونیورسٹی روڈ پر سیدھا جاری رکھیں',
  'یونیورسٹی روڈ فلائی اوور اور اسلامیہ کالج کے قریب سے گزریں',
  'ابدرہ روڈ کی طرف بائیں مڑیں (یونیورسٹی ٹاؤن داخلہ)',
  'کنیکٹنگ گلی میں بائیں مڑیں',
  'ابدرہ روڈ پر دائیں مڑیں',
  'سرکلر روڈ پر سیدھا جاری رکھیں',
  'منزل پر پہنچ گئے: ایس ایم آئی ٹی پشاور (سیلانی ماس آئی ٹی سینٹر)'
];

const englishStepNames = [
  'Head south on Defence Colony Street towards Khyber Road',
  'Turn right onto Defence Colony Sector Road',
  'Turn left towards Khyber Road / GT Road Link',
  'Turn right onto Grand Trunk Road (GT Road)',
  'Continue straight onto University Road',
  'Follow University Road past Islamia College & Board',
  'Turn left onto Abdarra Road (University Town Entry)',
  'Turn left onto Connecting Lane',
  'Turn right onto Abdarra Road',
  'Continue straight onto Circular Road / Lane',
  'Arrive at SMIT Peshawar (Saylani Mass IT Training Centre)'
];

const enrichedSteps = data.steps.map((s, i) => ({
  instruction: englishStepNames[i] || s.instruction,
  street: s.street === 'Connecting Road' ? 'Defence Colony Link Road' : s.street,
  streetUr: urduStepNames[i] || s.street,
  distance: s.distance,
  duration: s.duration,
  location: s.location,
  modifier: s.modifier,
  type: s.type
}));

let content = '// Real road navigation data: Defence Colony -> SMIT Peshawar (Saylani Mass IT Training Centre)\n';
content += 'export interface NavigationStep {\n';
content += '  instruction: string;\n';
content += '  street: string;\n';
content += '  streetUr?: string;\n';
content += '  distance: number;\n';
content += '  duration: number;\n';
content += '  location: [number, number];\n';
content += '  modifier?: string;\n';
content += '  type: string;\n';
content += '}\n\n';

content += '// Traveled portion: Defence Colony to Current Technician Location on University Road\n';
content += 'export const DEFENCE_COLONY_TO_SMIT_TRAVELED: [number, number][] = ' + JSON.stringify(data.traveled, null, 2) + ';\n\n';

content += '// Remaining portion: Technician Location on University Road to SMIT Peshawar\n';
content += 'export const DEFENCE_COLONY_TO_SMIT_REMAINING: [number, number][] = ' + JSON.stringify(data.remaining, null, 2) + ';\n\n';

content += '// Turn-by-turn navigation steps\n';
content += 'export const DEFENCE_COLONY_TO_SMIT_STEPS: NavigationStep[] = ' + JSON.stringify(enrichedSteps, null, 2) + ';\n\n';

content += '// Backward compatibility aliases\n';
content += 'export const UNIVERSITY_TOWN_TRAVELED_COORDS = DEFENCE_COLONY_TO_SMIT_TRAVELED;\n';
content += 'export const UNIVERSITY_TOWN_REMAINING_COORDS = DEFENCE_COLONY_TO_SMIT_REMAINING;\n';
content += 'export const UNIVERSITY_TOWN_NAVIGATION_STEPS = DEFENCE_COLONY_TO_SMIT_STEPS;\n';

fs.writeFileSync(
  path.join(__dirname, 'hunar-frontend', 'src', 'features', 'customer-visits', 'data', 'real-road-routes.ts'),
  content,
  'utf8'
);

console.log('Successfully wrote real-road-routes.ts');
