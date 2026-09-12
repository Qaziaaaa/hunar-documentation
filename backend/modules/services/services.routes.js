const express = require('express');

const router = express.Router();

const SERVICES = [
  { id: 'ac', name: 'AC Repair', icon: 'snow', css: '#0f8b8d', bg: '#e6f7f7', count: 24, desc: 'Cooling, gas refill, capacitor, compressor issues' },
  { id: 'plumbing', name: 'Plumbing', icon: 'drop', css: '#0f8b8d', bg: '#e6f7f7', count: 31, desc: 'Leaks, taps, pipes, water heaters, blocked drains' },
  { id: 'electrician', name: 'Electrician', icon: 'zap', css: '#0f8b8d', bg: '#e6f7f7', count: 28, desc: 'Wiring, switches, fixtures, short circuits, fans' },
  { id: 'carpenter', name: 'Carpenter', icon: 'hammer', css: '#0f8b8d', bg: '#e6f7f7', count: 16, desc: 'Doors, locks, furniture, shelves, wooden repairs' },
  { id: 'appliance', name: 'Appliance Repair', icon: 'tv', css: '#0f8b8d', bg: '#e6f7f7', count: 19, desc: 'Fridge, washing machine, microwave, oven' },
  { id: 'painter', name: 'Painter', icon: 'paint', css: '#0f8b8d', bg: '#e6f7f7', count: 12, desc: 'Wall painting, touch-ups, waterproofing, texture' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles', css: '#0f8b8d', bg: '#e6f7f7', count: 22, desc: 'Deep clean, sofa clean, kitchen, bathroom, windows' },
  { id: 'other', name: 'Other', icon: 'toolbox', css: '#0f8b8d', bg: '#e6f7f7', count: 35, desc: 'Any other repair or home service you need' }
];

router.get('/', (req, res) => {
  res.json({ services: SERVICES });
});

module.exports = router;
