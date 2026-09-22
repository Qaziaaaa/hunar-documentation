/**
 * HUNAR — Worker Simulation CLI Tool
 * 
 * Use this tool to simulate real worker actions:
 * 1. Worker sends bids / offers to your posted customer job.
 * 2. Worker shares live GPS coordinates across Peshawar (Defence Colony -> SMIT Peshawar).
 * 3. Worker arrives and submits an on-site diagnostic report & itemized bill.
 * 
 * Run with: node simulate-worker.js
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

const PESHAWAR_COORDINATES = [
  { step: 1, name: 'Defence Colony, Peshawar (Starting Point / Origin)', lat: 34.01125, lng: 71.53645, speed: 25 },
  { step: 2, name: 'Khyber Road / GT Road Link (Departing Cantt)', lat: 34.00754, lng: 71.53625, speed: 35 },
  { step: 3, name: 'University Road (Midpoint En Route)', lat: 34.00806, lng: 71.52150, speed: 38 },
  { step: 4, name: 'Abdarra Road (University Town Entry)', lat: 33.99768, lng: 71.50093, speed: 24 },
  { step: 5, name: 'SMIT Peshawar - Saylani Mass IT Training Centre (End Point)', lat: 33.99040, lng: 71.49533, speed: 0 },
];

function printHeader() {
  console.log('\n=============================================================');
  console.log('  🛠️  HUNAR VIRTUAL WORKER SIMULATOR (PESHAWAR DISPATCH)');
  console.log('=============================================================\n');
}

async function sendRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(`${API_BASE}${path}`);
    const data = body ? JSON.stringify(body) : null;

    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
          } catch {
            resolve({ status: res.statusCode, data: responseBody });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (data) req.write(data);
    req.end();
  });
}

async function simulateWorkerOffers(jobId = 'job-1') {
  console.log(`📡 [STEP 1] Worker #1 (Kashif Afridi - Master Plumber) sending offer...`);
  console.log(`   - Job ID: ${jobId}`);
  console.log(`   - Proposed Visit Fee: Rs. 350`);
  console.log(`   - Estimated Arrival: ~20 mins (carrying acoustic pipe leak detector)`);

  const offer1 = await sendRequest(`/jobs/${jobId}/offers`, 'POST', {
    workerId: 'worker-1',
    visitCharge: 350,
    message: 'Assalam o Alaikum! I am available right now with full diagnostic gear.',
  });

  console.log(`   -> Response status: ${offer1.status || 'Simulated OK'}`);

  console.log(`\n📡 [STEP 2] Worker #2 (Tariq Shah - Electrician) sending competitive offer...`);
  console.log(`   - Proposed Visit Fee: Rs. 300`);
  console.log(`   - Estimated Arrival: ~25 mins`);

  const offer2 = await sendRequest(`/jobs/${jobId}/offers`, 'POST', {
    workerId: 'worker-2',
    visitCharge: 300,
    message: 'Can reach University Town in 25 mins. Fully verified pro.',
  });

  console.log(`   -> Response status: ${offer2.status || 'Simulated OK'}`);
  console.log(`\n✅ Offers sent! Check your Customer Offers page: http://localhost:3000/en/customer/offers`);
}

async function simulateLiveGpsRoute(jobId = 'job-1') {
  console.log(`\n🛵 [STEP 3] Simulating Worker Motorcycle live GPS journey across Peshawar...`);

  for (const point of PESHAWAR_COORDINATES) {
    console.log(`   [GPS Pulse ${point.step}/5] 📍 ${point.name} | Lat: ${point.lat}, Lng: ${point.lng} (${point.speed} km/h)`);
    
    await sendRequest('/location/track', 'POST', {
      jobId,
      latitude: point.lat,
      longitude: point.lng,
      speedKmh: point.speed,
    });

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n✅ Worker has arrived at customer doorstep! Safety PIN check activated.`);
  console.log(`   Check the Live Map: http://localhost:3000/en/customer/visits`);
}

async function simulateDiagnosticInvoice(jobId = 'job-1') {
  console.log(`\n📋 [STEP 4] Worker submitting diagnostic report & itemized bill...`);
  console.log(`   - Diagnosis: Replaced damaged 63A breaker, crimped copper lugs & balanced load.`);
  console.log(`   - Labor Cost: Rs. 1,400`);
  console.log(`   - Genuine Parts: Rs. 800 (Schneider DP Breaker)`);
  console.log(`   - Total: Rs. 2,200 (5-Day Craftsmanship Warranty)`);

  await sendRequest(`/visits/${jobId}/estimate`, 'POST', {
    diagnosis: 'Replaced faulty main breaker and tested under full load.',
    laborCost: 1400,
    partsCost: 800,
    totalAmount: 2200,
  });

  console.log(`\n✅ Invoice submitted! Customer can approve at: http://localhost:3000/en/customer/jobs/${jobId}/complete`);
}

async function runFullSimulation() {
  printHeader();
  const jobId = process.argv[2] || 'job-1';
  
  await simulateWorkerOffers(jobId);
  console.log('\n-------------------------------------------------------------');
  await simulateLiveGpsRoute(jobId);
  console.log('\n-------------------------------------------------------------');
  await simulateDiagnosticInvoice(jobId);

  console.log('\n=============================================================');
  console.log('  🎉 COMPLETE WORKER SIMULATION FINISHED!');
  console.log('=============================================================');
  console.log('  Now explore all views on the Customer Portal:');
  console.log('  1. Dashboard:       http://localhost:3000/en/customer/dashboard');
  console.log('  2. Offers Hub:      http://localhost:3000/en/customer/offers');
  console.log('  3. Peshawar Map:    http://localhost:3000/en/customer/visits');
  console.log('  4. Job Completion:  http://localhost:3000/en/customer/jobs/job-1/complete\n');
}

runFullSimulation();
