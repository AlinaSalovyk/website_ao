import http from 'http';

const TARGET_URL = 'http://localhost:4321/';
const CONCURRENCY_LEVELS = [1, 5, 10, 20, 50];
const REQUESTS_PER_LEVEL = 100;

async function makeRequest() {
  return new Promise((resolve) => {
    const start = performance.now();
    http.get(TARGET_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: performance.now() - start
        });
      });
    }).on('error', (err) => {
      resolve({ status: 500, time: performance.now() - start, error: err.message });
    });
  });
}

async function runLevel(concurrency) {
  console.log(`\nStarting load test with concurrency ${concurrency}...`);
  let completed = 0;
  const times = [];
  let errors = 0;

  const startTotal = performance.now();

  const workers = Array(concurrency).fill(0).map(async () => {
    while (completed < REQUESTS_PER_LEVEL) {
      completed++;
      const result = await makeRequest();
      times.push(result.time);
      if (result.status !== 200) {
        errors++;
      }
    }
  });

  await Promise.all(workers);
  const totalTime = performance.now() - startTotal;

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const rps = (REQUESTS_PER_LEVEL / (totalTime / 1000)).toFixed(2);

  console.log(`Concurrency: ${concurrency}`);
  console.log(`RPS: ${rps}`);
  console.log(`p50: ${p50.toFixed(2)}ms`);
  console.log(`p95: ${p95.toFixed(2)}ms`);
  console.log(`p99: ${p99.toFixed(2)}ms`);
  console.log(`Errors: ${errors}`);
  
  return { concurrency, rps, p50, p95, p99, errors };
}

async function main() {
  console.log('--- API Benchmark ---');
  for (const c of CONCURRENCY_LEVELS) {
    await runLevel(c);
  }
}

main().catch(console.error);
