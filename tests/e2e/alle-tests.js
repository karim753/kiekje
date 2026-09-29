// Draait alle browsertests achter elkaar in de afgeschermde testomgeving en ruimt daarna op.
//   npm test                        → alle tests
//   node alle-tests.js meldingen    → alleen tests waarvan de naam "meldingen" bevat
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { opzetten, opruimen } = require('./testomgeving');

const filter = process.argv[2] || '';
const tests = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js') && f.includes(filter)).sort();
if (!tests.length) { console.log('Geen tests gevonden voor: ' + filter); process.exit(1); }

const mislukt = [];
try {
	for (const t of tests) {
		console.log(`\n=== ${t}`);
		opzetten(); // elke test begint met een lege database, zodat tests elkaar niet beïnvloeden
		const r = spawnSync(process.execPath, [path.join(__dirname, t)], { stdio: 'inherit' });
		if (r.status !== 0) mislukt.push(t);
	}
} finally {
	opruimen();
}
console.log(mislukt.length ? `\n${mislukt.length} van ${tests.length} tests mislukt: ${mislukt.join(', ')}` : `\nAlle ${tests.length} tests geslaagd.`);
process.exit(mislukt.length ? 1 : 0);
