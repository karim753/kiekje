// Gedeelde instellingen voor de browsertests.
const path = require('path');
const fs = require('fs');

// Map met de echte app (deze repository) en de XAMPP-installatie
const PROJECT = path.resolve(__dirname, '..', '..');
const HTDOCS = process.env.HTDOCS || 'C:/xampp/htdocs';
const MYSQL_BIN = process.env.MYSQL_BIN || 'C:/xampp/mysql/bin';

// De tests draaien NOOIT op de echte app: een losse kopie met een eigen database (zie testomgeving.js)
const TEST_DIR_NAME = 'kiekje_testrun';
const TEST_DB = 'kiekje_test';
const URL = `http://localhost/${TEST_DIR_NAME}/frontend/index.html`;

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Screenshots en tijdelijke testplaatjes
const OUT = path.join(__dirname, 'output');
fs.mkdirSync(OUT, { recursive: true });
// klein testplaatje dat meerdere tests uploaden (1x1 rode PNG); altijd aanwezig, ongeacht welke test eerst draait
fs.writeFileSync(path.join(OUT, 'test.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'));

module.exports = { PROJECT, HTDOCS, MYSQL_BIN, TEST_DIR_NAME, TEST_DB, URL, CHROME, OUT };
