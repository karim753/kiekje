// Weergave-instelling: licht / donker / automatisch
const puppeteer = require('puppeteer-core');
const navshim = require('./nav-helper');
const { CHROME, URL, OUT } = require('./config');
const T = Date.now() % 100000, A = 'th_a_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms)), step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const p = navshim(await (await browser.createBrowserContext()).newPage());
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.setViewport({ width: 420, height: 850 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const thema = () => p.evaluate(() => document.documentElement.dataset.theme || 'auto');

  await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register');
  await p.type('#reg-username', A); await p.type('#reg-email', A + '@x.nl');
  await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
  await p.click('#register-form button'); await p.waitForSelector('.page');

  if ((await bg()) !== 'rgb(20, 18, 15)') errors.push('standaard niet donker: ' + (await bg())); else step('standaard: donker (apparaat staat op donker)');

  // telefoon: instellingen via het profiel
  await p.click('#navprofile'); await p.waitForSelector('.profile-actions [data-nav="settings"]');
  await p.click('.profile-actions [data-nav="settings"]'); await p.waitForSelector('.theme-options');
  step('instellingen openen via het tandwiel op je profiel');
  await p.click('.theme-opt:has(input[value="light"])'); await sleep(300);
  if ((await thema()) !== 'light' || (await bg()) !== 'rgb(250, 247, 242)') errors.push('licht niet toegepast: ' + (await thema()) + ' ' + (await bg()));
  else step('"Licht" kiezen: achtergrond wordt meteen licht');
  if (!(await p.$('.theme-opt.on input[value="light"]'))) errors.push('keuze niet gemarkeerd'); else step('gekozen optie is gemarkeerd');
  await p.screenshot({ path: OUT + '/thema_instellingen.png' });
  await p.keyboard.press('Escape'); await sleep(200);
  await p.click('#navfeed'); await sleep(800);
  await p.screenshot({ path: OUT + '/thema_licht_feed.png' });

  // blijft bewaard na herladen, zonder eerst donker op te lichten
  await p.reload({ waitUntil: 'domcontentloaded' });
  const direct = await p.evaluate(() => document.documentElement.dataset.theme);
  if (direct !== 'light') errors.push('na herladen niet direct licht: ' + direct); else step('na herladen meteen licht (geen donkere flits)');

  // automatisch volgt het apparaat
  await p.waitForSelector('.page');
  await p.evaluate(() => { modal = 'settings'; render(); });
  await p.click('.theme-opt:has(input[value="auto"])'); await sleep(200);
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]); await sleep(300);
  const autoLicht = await bg();
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]); await sleep(300);
  const autoDonker = await bg();
  if (autoLicht !== 'rgb(250, 247, 242)' || autoDonker !== 'rgb(20, 18, 15)') errors.push(`automatisch: ${autoLicht} / ${autoDonker}`);
  else step('"Automatisch" wisselt mee met het apparaat (licht ↔ donker)');
  const avatarDonker = await p.evaluate(() => avatarSrc('niemand_' + Date.now()));
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]); await sleep(200);
  const avatarLicht = await p.evaluate(() => avatarSrc('niemand_' + Date.now()));
  if (avatarDonker === avatarLicht) errors.push('standaard profielfoto past zich niet aan'); else step('standaard profielfoto past zich aan het thema aan');

  // groot scherm: instellingen in de zijbalk
  await p.keyboard.press('Escape');
  await p.setViewport({ width: 1400, height: 900 }); await sleep(300);
  await p.click('#navfeed'); await sleep(300);
  const zij = await p.$('.sidenav [data-nav="settings"]');
  if (!zij || !(await zij.isVisible())) errors.push('geen instellingen in de zijbalk');
  else { await zij.click(); await p.waitForSelector('.theme-options'); step('groot scherm: "Instellingen" in de zijbalk'); }
  await p.click('.theme-opt:has(input[value="dark"])'); await sleep(200);
  if ((await thema()) !== 'dark') errors.push('donker niet gekozen'); else step('"Donker" kiezen werkt');
  await p.click('.theme-opt:has(input[value="light"])'); await p.keyboard.press('Escape'); await sleep(900);
  await p.screenshot({ path: OUT + '/thema_licht_desktop.png' });

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
