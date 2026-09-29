const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const T = Date.now() % 100000, A = 'ly_a_' + T, B = 'ly_b_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms)), step = m => console.log('✓', m);
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async (n, w) => { const p = await (await browser.createBrowserContext()).newPage(); await p.setViewport({ width: w, height: 900 }); p.on('pageerror', e => errors.push(n + ': ' + e.message)); p.on('dialog', d => { errors.push('dialog ' + d.message()); d.dismiss() }); return p; };
  const reg = async (p, n) => { await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register'); await p.type('#reg-username', n); await p.type('#reg-email', n + '@x.nl'); await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234'); await p.click('#register-form button'); await p.waitForSelector('.page'); };
  const pa = await mk('A', 1440), pb = await mk('B', 420);
  await reg(pb, B); await reg(pa, A);
  // B plaatst een post (via API)
  await pb.evaluate(async () => { const c = document.createElement('canvas'); c.width = c.height = 200; const g = c.getContext('2d'); g.fillStyle = '#6E9887'; g.fillRect(0, 0, 200, 200); await fetch('../backend/api/posts.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: c.toDataURL('image/png'), caption: 'Dubbelklik mij' }) }); });

  // groot scherm: zijbalk + rechterkolom met voorstel
  await pa.reload(); await pa.waitForSelector('.post-media');
  const vis = await pa.evaluate(() => ({ side: !!document.querySelector('.sidenav').offsetParent || getComputedStyle(document.querySelector('.sidenav')).display !== 'none', bottom: getComputedStyle(document.querySelector('.bottomnav')).display, top: getComputedStyle(document.querySelector('.topbar')).display }));
  if (!vis.side || vis.bottom !== 'none' || vis.top !== 'none') errors.push('lay-out groot scherm klopt niet: ' + JSON.stringify(vis)); else step('groot scherm: zijbalk zichtbaar, boven-/onderbalk verborgen');
  await pa.waitForSelector(`.rb-follow[data-follow="${B}"]`, { timeout: 6000 }); step('rechterkolom stelt B voor');
  await pa.click(`.rb-follow[data-follow="${B}"]`); await pa.waitForFunction(B => document.querySelector(`.rb-follow[data-follow="${B}"]`)?.innerText === 'Volgend', { timeout: 6000 }, B); step('volgen vanuit rechterkolom → "Volgend"');

  // dubbelklik = like met animatie
  const wrap = await pa.$('.media-wrap');
  await wrap.click({ count: 2 });
  await pa.waitForSelector('.heart-pop', { timeout: 2000 }); step('dubbelklik toont hartjes-animatie');
  await pa.waitForFunction(() => document.querySelector('.post .like')?.classList.contains('liked'), { timeout: 4000 });
  await pa.waitForFunction(() => document.body.innerText.includes('1 vind-ik-leuk'), { timeout: 4000 }); step('dubbelklik liket de post (1 vind-ik-leuk)');
  await (await pa.$('.media-wrap')).click({ count: 2 }); await sleep(1200);
  if (!(await pa.$eval('.post .like', b => b.classList.contains('liked')))) errors.push('tweede dubbelklik haalde like weg'); else step('nog een dubbelklik haalt de like niet weg');

  // telefoon: onderbalk met Maken in het midden, zijbalk verborgen
  await pb.reload(); await pb.waitForSelector('.bottomnav');
  const order = await pb.$$eval('.bottomnav [data-nav]', l => l.map(b => b.dataset.nav).join(','));
  if (order !== 'feed,search,new,notifications,profile') errors.push('volgorde onderbalk: ' + order); else step('telefoon: onderbalk ' + order);
  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
