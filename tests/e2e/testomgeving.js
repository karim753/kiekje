// Zet een afgeschermde testomgeving op, of ruimt die weer op.
//   node testomgeving.js opzetten   → lege database kiekje_test + kopie van de app op /kiekje_testrun/
//   node testomgeving.js opruimen   → beide weer verwijderen
// Zo komen testaccounts en testfoto's nooit in de echte app of database terecht.
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const { PROJECT, HTDOCS, MYSQL_BIN, TEST_DIR_NAME, TEST_DB } = require('./config');

const DST = path.join(HTDOCS, TEST_DIR_NAME);
const mysql = (args, input) => execFileSync(path.join(MYSQL_BIN, 'mysql.exe'), ['-u', 'root', ...args], { input });

function opzetten() {
	// lege database met exact dezelfde tabellen als de echte
	mysql(['-e', `DROP DATABASE IF EXISTS ${TEST_DB}; CREATE DATABASE ${TEST_DB} CHARACTER SET utf8mb4;`]);
	const schema = execFileSync(path.join(MYSQL_BIN, 'mysqldump.exe'), ['-u', 'root', '--no-data', 'kiekje']);
	mysql([TEST_DB], schema);

	// kopie van frontend + backend (zonder geüploade foto's)
	fs.rmSync(DST, { recursive: true, force: true });
	fs.cpSync(path.join(PROJECT, 'frontend'), path.join(DST, 'frontend'), { recursive: true });
	for (const dir of ['api', 'config', 'src']) fs.cpSync(path.join(PROJECT, 'backend', dir), path.join(DST, 'backend', dir), { recursive: true });
	fs.copyFileSync(path.join(PROJECT, 'backend', 'bootstrap.php'), path.join(DST, 'backend', 'bootstrap.php'));
	fs.mkdirSync(path.join(DST, 'backend', 'uploads'), { recursive: true });
	fs.copyFileSync(path.join(PROJECT, 'backend', 'uploads', '.htaccess'), path.join(DST, 'backend', 'uploads', '.htaccess'));
	// laat de gekopieerde backend de testdatabase gebruiken (config/database.php leest DB_NAME via getenv)
	fs.writeFileSync(path.join(DST, 'backend', '.htaccess'), `SetEnv DB_NAME ${TEST_DB}\n`);
	console.log(`testomgeving klaar: database ${TEST_DB}, app op /${TEST_DIR_NAME}/`);
}

function opruimen() {
	fs.rmSync(DST, { recursive: true, force: true });
	mysql(['-e', `DROP DATABASE IF EXISTS ${TEST_DB};`]);
	console.log('testomgeving opgeruimd');
}

if (require.main === module) {
	const cmd = process.argv[2];
	if (cmd === 'opzetten') opzetten();
	else if (cmd === 'opruimen') opruimen();
	else { console.log('Gebruik: node testomgeving.js opzetten|opruimen'); process.exit(1); }
}
module.exports = { opzetten, opruimen };
