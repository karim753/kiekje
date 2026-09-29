// Regressietests voor bugs die gevonden en opgelost zijn (zodat ze niet terugkomen)
const puppeteer = require('puppeteer-core');
const navshim = require('./nav-helper');
const { CHROME, URL } = require('./config');
const T = Date.now() % 100000, A = 'bf_a_' + T, B = 'bf_b_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms)), step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async n => { const p = navshim(await (await browser.createBrowserContext()).newPage()); await p.setViewport({ width: 420, height: 850 }); p.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message)); p.on('dialog', d => d.accept()); return p; };
  const reg = async (p, n) => { await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register'); await p.type('#reg-username', n); await p.type('#reg-email', n + '@x.nl'); await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234'); await p.click('#register-form button'); await p.waitForSelector('.page'); };
  const call = (p, path, body, method) => p.evaluate(async (path, body, method) => {
    const r = await fetch('../backend/api/' + path, { method: method || (body ? 'POST' : 'GET'), credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, cache: r.headers.get('cache-control'), data: await r.json().catch(() => null) };
  }, path, body, method);
  const pic = p => p.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 50; c.getContext('2d').fillRect(0, 0, 50, 50); return c.toDataURL('image/png'); });

  const pa = await mk('A'), pb = await mk('B');
  await reg(pa, A); await reg(pb, B);

  // gebruikersnaam met @ wordt geweigerd
  const r1 = await call(pa, 'auth.php?action=register', { username: 'iemand@x.nl', email: 'z' + T + '@x.nl', password: 'geheim1234' });
  if (r1.status !== 422) errors.push('gebruikersnaam met @ niet geweigerd: ' + r1.status); else step('gebruikersnaam met @ wordt geweigerd (422)');

  // uitloggen via een gewone link (GET) mag niet
  const r2 = await call(pb, 'auth.php?action=logout', null, 'GET');
  const still = await call(pb, 'auth.php?action=me', {});
  if (r2.status !== 405 || !still.data?.success) errors.push('uitloggen via GET: ' + r2.status); else step('uitloggen via GET-link werkt niet (405), gebruiker blijft ingelogd');

  // API-antwoorden worden niet gecachet
  const r3 = await call(pa, 'messages.php?action=unread');
  if (!/no-store/.test(r3.cache || '')) errors.push('geen Cache-Control: no-store'); else step('API-antwoorden hebben Cache-Control: no-store');

  // stories per gebruiker bij elkaar: A, B, A geplaatst -> A, A, B (of B, A, A) — nooit door elkaar
  const img = await pic(pa);
  await call(pa, 'stories.php', { image: img }); await sleep(1100);
  await call(pb, 'stories.php', { image: img }); await sleep(1100);
  await call(pa, 'stories.php', { image: img });
  const order = (await call(pb, 'stories.php')).data.stories.map(s => s.user);
  const grouped = order.every((u, i) => i === 0 || u === order[i - 1] || !order.slice(0, i).includes(u));
  if (!grouped) errors.push('stories niet per gebruiker gegroepeerd: ' + order.join(',')); else step('stories per gebruiker gegroepeerd: ' + order.map(u => u === A ? 'A' : 'B').join(', '));
  if (order[0] !== B) errors.push('eigen stories niet eerst'); else step('eigen stories staan vooraan');

  // snel vaak dubbelklikken: post blijft geliket (tweede verzoek zette de like vroeger weer uit)
  await call(pb, 'posts.php', { image: img, caption: 'Dubbelklik test' });
  await pa.reload(); await pa.waitForFunction(() => document.body.innerText.includes('Dubbelklik test'));
  await sleep(500);
  const wrap = await pa.evaluateHandle(() => [...document.querySelectorAll('article.post')].find(p => p.innerText.includes('Dubbelklik test')).querySelector('.media-wrap'));
  for (let i = 0; i < 3; i++) await wrap.click({ count: 2, delay: 5 });
  await sleep(1500);
  const post = (await call(pa, 'posts.php')).data.posts.find(p => p.caption === 'Dubbelklik test');
  if (!post.liked || post.like_count !== 1) errors.push('na snel dubbelklikken: liked=' + post.liked + ' count=' + post.like_count); else step('3× snel dubbelklikken: post blijft geliket (1 like)');
  // snel twee keer op het hartje: precies één wisseling
  await pa.evaluate(() => { const b = [...document.querySelectorAll('article.post')].find(p => p.innerText.includes('Dubbelklik test')).querySelector('.like'); b.click(); b.click(); });
  await sleep(1200);
  const post2 = (await call(pa, 'posts.php')).data.posts.find(p => p.caption === 'Dubbelklik test');
  if (post2.liked) errors.push('dubbele klik op hartje wisselde twee keer'); else step('2× snel op hartje: één verzoek, like uit');

  // story-reactie waarbij de DM niet opent: geen crash, story sluit netjes
  await pa.evaluate(() => { stories = [{ id: 999999, user: 'bestaat_niet_' + Date.now(), img: '', created_at: '', like_count: 0, liked: false, mine: false, likers: [] }]; openStory(0); });
  await pa.waitForSelector('#story-reply');
  await pa.type('#story-reply', 'hoi'); await pa.keyboard.press('Enter');
  await sleep(1200);
  const state = await pa.evaluate(() => ({ modal, hasViewer: !!document.querySelector('.story-viewer') }));
  step(`story-reactie aan onbekende gebruiker: melding i.p.v. crash (venster: ${state.modal || 'dicht'})`);
  // na de fout moeten knoppen nog werken
  await pa.click('#navprofile'); await pa.waitForSelector('#edit-profile', { timeout: 5000 });
  step('knoppen werken daarna nog (profiel geopend)');

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
