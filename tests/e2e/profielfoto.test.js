const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const navshim = require('./nav-helper');
const fs = require('fs');
const T = Date.now() % 100000, A = 'av_a_' + T, B = 'av_b_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const step = m => console.log('✓', m);
const UPLOADS = require('path').join(require('./config').HTDOCS, 'kiekje_testrun', 'backend') + '/';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async n => {
    const p = await (await browser.createBrowserContext()).newPage(); navshim(p);
    await p.setViewport({ width: 420, height: 800, deviceScaleFactor: 1 });
    p.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message));
    p.on('dialog', d => { if (d.type() === 'confirm') d.accept(); else { errors.push(n + ' dialog: ' + d.message()); d.dismiss(); } });
    p.on('response', r => { if (r.status() >= 400 && !r.url().includes('favicon') && !(r.status() === 401 && r.url().includes('action=me'))) errors.push(n + ' HTTP ' + r.status() + ' ' + r.url()); });
    return navshim(p);
  };
  const waitText = (p, s) => p.waitForFunction(s => document.body.innerText.includes(s), { timeout: 6000 }, s);
  const register = async (p, name) => {
    await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register');
    await p.type('#reg-username', name); await p.type('#reg-email', name + '@x.nl');
    await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
    await p.click('#register-form button'); await p.waitForSelector('.bottomnav');
  };
  // niet-vierkante testfoto (600x300) om het bijsnijden te testen
  const pa = await mk('A'), pb = await mk('B');
  await register(pa, A); await register(pb, B);
  const png = await pa.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#6E9887'; g.fillRect(0, 0, 600, 300); g.fillStyle = '#E8A33D'; g.beginPath(); g.arc(300, 150, 110, 0, 7); g.fill(); return c.toDataURL('image/png').split(',')[1]; });
  fs.writeFileSync(OUT + '/avatar.png', Buffer.from(png, 'base64'));

  // standaardfoto
  await pa.click('#navprofile'); await pa.waitForSelector('#change-avatar');
  const src0 = await pa.$eval('#change-avatar img', i => i.getAttribute('src'));
  if (!src0.startsWith('data:image/svg')) errors.push('geen standaardfoto: ' + src0.slice(0, 40)); else step('nieuw account heeft standaard profielfoto');
  await pa.screenshot({ path: OUT + '/shot_av_default.png', clip: { x: 0, y: 60, width: 420, height: 240 } });

  // wijzigen via klik op eigen foto
  const [fc] = await Promise.all([pa.waitForFileChooser(), pa.click('#change-avatar')]);
  await fc.accept([OUT + '/avatar.png']);
  await pa.waitForSelector('.crop-view img[src]'); await sleep(300); await pa.click('.crop-ok');
  await waitText(pa, 'Profielfoto bijgewerkt');
  const src1 = await pa.$eval('#change-avatar img', i => i.getAttribute('src'));
  if (!/\/uploads\/[a-f0-9]{32}\.jpg$/.test(src1)) errors.push('profielfoto niet uit uploads: ' + src1);
  const dims = await pa.$eval('#change-avatar img', i => i.complete ? [i.naturalWidth, i.naturalHeight] : null);
  if (!dims || dims[0] !== dims[1]) errors.push('foto niet vierkant: ' + dims); else step(`profielfoto gewijzigd (vierkant ${dims[0]}x${dims[1]})`);
  await pa.screenshot({ path: OUT + '/shot_av_set.png', clip: { x: 0, y: 60, width: 420, height: 240 } });

  // A plaatst post; B ziet A's foto in feed en zoekresultaten
  await pa.evaluate(async png => { await fetch('../backend/api/posts.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: 'data:image/png;base64,' + png, caption: 'Met pfp' }) }); }, png);
  await pb.reload(); await waitText(pb, 'Met pfp'); await sleep(400);
  const feedSrc = await pb.evaluate(() => [...document.querySelectorAll('.post')].find(p => p.innerText.includes('Met pfp')).querySelector('.post-head .avatar').getAttribute('src'));
  if (feedSrc !== src1) errors.push('B ziet andere foto in feed: ' + feedSrc); else step('B ziet de nieuwe profielfoto bij de post');
  await pb.click('#navsearch'); await pb.type('#searchInput', A); await pb.waitForSelector(`.profile-row[data-user="${A}"]`);
  if ((await pb.$eval(`.profile-row[data-user="${A}"] .avatar`, i => i.getAttribute('src'))) !== src1) errors.push('zoekresultaat zonder nieuwe foto'); else step('ook in zoekresultaten');
  const bOwn = await pb.evaluate(B => { [...document.querySelectorAll('[data-nav="profile"]')].find(e => e.offsetParent).click(); return true; }, B);
  await pb.waitForSelector('#change-avatar img');
  if (!(await pb.$eval('#change-avatar img', i => i.getAttribute('src'))).startsWith('data:image/svg')) errors.push('B heeft geen standaardfoto'); else step('B (zonder eigen foto) houdt de standaardfoto');

  // via Profiel bewerken verwijderen
  const file = UPLOADS + src1.replace('../backend/', '');
  if (!fs.existsSync(file)) errors.push('uploadbestand bestaat niet: ' + file);
  await pa.click('#edit-profile'); await pa.waitForSelector('#remove-avatar');
  await pa.screenshot({ path: OUT + '/shot_av_modal.png', clip: { x: 0, y: 150, width: 420, height: 360 } });
  await pa.click('#remove-avatar'); await waitText(pa, 'Profielfoto verwijderd');
  if (!(await pa.$eval('.edit-avatar img', i => i.getAttribute('src'))).startsWith('data:image/svg')) errors.push('na verwijderen geen standaardfoto');
  if (fs.existsSync(file)) errors.push('oud bestand niet verwijderd'); else step('profielfoto verwijderd, standaardfoto terug, bestand opgeruimd');

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
