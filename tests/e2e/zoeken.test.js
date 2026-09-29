// Zoekpagina (React-component in frontend/js/search.js)
const puppeteer = require('puppeteer-core');
const navshim = require('./nav-helper');
const { CHROME, URL } = require('./config');
const T = Date.now() % 100000, A = 'zk_anna_' + T, B = 'zk_bram_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms)), step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async n => { const p = navshim(await (await browser.createBrowserContext()).newPage()); await p.setViewport({ width: 420, height: 850 }); p.on('pageerror', e => errors.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/401|404/.test(m.text())) errors.push(n + ' console: ' + m.text()); }); return p; };
  const reg = async (p, n) => { await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register'); await p.type('#reg-username', n); await p.type('#reg-email', n + '@x.nl'); await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234'); await p.click('#register-form button'); await p.waitForSelector('.page'); };
  const pb = await mk('B'); await reg(pb, B);
  const pa = await mk('A'); await reg(pa, A);

  await pa.click('#navsearch');
  await pa.waitForSelector('#react-search #searchInput');
  const isReact = await pa.$eval('#react-search', el => Object.keys(el).some(k => k.startsWith('__reactContainer')) && typeof React === 'object');
  if (!isReact) errors.push('zoekpagina is niet door React getekend'); else step('zoekpagina wordt door React getekend');
  if (!(await pa.evaluate(() => document.activeElement?.id === 'searchInput'))) errors.push('zoekveld heeft geen focus'); else step('zoekveld heeft direct focus');

  // lege zoekterm: andere gebruikers tonen (niet jezelf)
  await pa.waitForSelector(`.profile-row[data-user="${B}"]`);
  if (await pa.$(`.profile-row[data-user="${A}"]`)) errors.push('eigen account staat in resultaten'); else step('toont andere gebruikers, niet jezelf');

  // live zoeken
  await pa.type('#searchInput', 'zk_bram');
  await pa.waitForFunction(B => { const rows = [...document.querySelectorAll('.profile-row')]; return rows.length >= 1 && rows.every(r => r.dataset.user.startsWith('zk_bram')); }, { timeout: 6000 }, B);
  step('resultaten filteren tijdens het typen');
  await pa.type('#searchInput', '_bestaatniet');
  await pa.waitForFunction(() => document.body.innerText.includes('Geen gebruikers gevonden voor'), { timeout: 6000 });
  step('melding bij geen resultaten');

  // terug naar bestaande naam en profiel openen
  await pa.$eval('#searchInput', el => el.select());
  await pa.type('#searchInput', B);
  await pa.waitForSelector(`.profile-row[data-user="${B}"]`);
  await pa.click(`.profile-row[data-user="${B}"]`);
  await pa.waitForFunction(B => document.querySelector('.profile-name')?.innerText === B, { timeout: 6000 }, B);
  step('klik op resultaat opent het profiel');

  // terug naar zoeken: zoekterm is bewaard, React-boom opnieuw opgebouwd zonder fouten
  await pa.click('#navsearch');
  await pa.waitForSelector('#searchInput');
  const q = await pa.$eval('#searchInput', el => el.value);
  if (q !== B) errors.push('zoekterm niet bewaard: ' + q); else step('zoekterm blijft bewaard na terugkomen');
  await pa.click('#navfeed'); await pa.click('#navsearch'); await pa.click('#navfeed'); await sleep(300);

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
