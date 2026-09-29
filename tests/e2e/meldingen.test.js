const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const navshim = require('./nav-helper');
const T = Date.now() % 100000;
const [A, B, C, D] = ['a', 'b', 'c', 'd'].map(x => `nt_${x}_${T}`);
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async n => {
    const p = await (await browser.createBrowserContext()).newPage(); navshim(p);
    await p.setViewport({ width: 420, height: 900, deviceScaleFactor: 1 });
    p.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message));
    p.on('dialog', d => { errors.push(n + ' dialog: ' + d.message()); d.dismiss(); });
    return navshim(p);
  };
  const waitText = (p, s) => p.waitForFunction(s => document.body.innerText.includes(s), { timeout: 6000 }, s);
  const register = async (p, name) => {
    await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register');
    await p.type('#reg-username', name); await p.type('#reg-email', name + '@x.nl');
    await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
    await p.click('#register-form button'); await p.waitForSelector('.bottomnav');
  };
  // API-aanroep vanuit de sessie van die pagina
  const call = (p, path, body) => p.evaluate(async (path, body) => {
    const r = await fetch('../backend/api/' + path, { method: body ? 'POST' : 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return r.json();
  }, path, body);

  const pages = {};
  for (const n of [A, B, C, D]) { pages[n] = await mk(n); await register(pages[n], n); }
  const pa = pages[A];

  // A: post (met een gekleurde foto) + een reactie + story
  const pic = await pa.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 300; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 300, 300); gr.addColorStop(0, '#E8A33D'); gr.addColorStop(1, '#6E9887'); g.fillStyle = gr; g.fillRect(0, 0, 300, 300); return c.toDataURL('image/jpeg', .9); });
  const post = (await call(pa, 'posts.php', { image: pic, caption: 'Zonsondergang' })).post;
  await call(pa, 'stories.php', { image: pic });
  const story = (await call(pa, 'stories.php')).stories[0];
  const own = (await call(pa, 'interactions.php?action=comment', { post_id: post.id, content: 'Wat een avond!' })).comment;

  // activiteit van B, C, D
  for (const n of [B, C, D]) await call(pages[n], 'interactions.php?action=like', { post_id: post.id });
  await call(pages[B], 'interactions.php?action=comment', { post_id: post.id, content: 'Prachtig licht 😍' });
  await call(pages[C], 'follows.php', { username: A });
  await call(pages[D], 'stories.php?action=like', { id: story.id });
  await call(pages[B], 'interactions.php?action=comment_like', { comment_id: own.id });
  step('activiteit aangemaakt');

  await pa.reload(); await pa.waitForSelector('.bottomnav'); await sleep(800);
  const badge = await pa.evaluate(() => { const b = [...document.querySelectorAll('.notif-badge')].find(e => e.offsetParent || !e.hidden); return !b || b.hidden ? 0 : +b.textContent; });
  if (badge < 5) errors.push('badge toont ' + badge); else step('badge toont ' + badge + ' nieuwe meldingen');
  await pa.click('#navnot'); await waitText(pa, 'Nieuw');
  const t = await pa.$eval('#root', r => r.innerText);
  for (const s of ['vinden je post leuk', 'reageerde', 'Prachtig licht', 'volgt je nu', 'vindt je story leuk', 'vindt je reactie leuk', 'Terugvolgen'])
    if (!t.includes(s)) errors.push('ontbreekt: ' + s);
  if (!/en 1 ander/.test(t)) errors.push('likes niet samengevoegd: ' + t.slice(0, 300));
  const thumbs = await pa.$$eval('.notif-thumb', l => l.length);
  step(`meldingen zichtbaar, ${thumbs} miniaturen, likes samengevoegd`);
  await pa.screenshot({ path: OUT + '/shot_notifs.png' });

  // terugvolgen
  await pa.click('.notif-follow'); await pa.waitForFunction(() => document.querySelector('.notif-follow')?.innerText === 'Volgend');
  step('Terugvolgen → Volgend');
  // klik op melding met post opent de post
  await pa.evaluate(() => [...document.querySelectorAll('.notif-row')].find(r => r.dataset.postId).click());
  await pa.waitForSelector('#viewer .viewer-title'); step('klik op melding opent de post');
  await pa.keyboard.press('Escape');
  // opnieuw openen: niets meer "Nieuw"
  await pa.click('#navfeed'); await pa.click('#navnot'); await sleep(700);
  if ((await pa.$eval('#root', r => r.innerText)).includes('Nieuw')) errors.push('"Nieuw" nog zichtbaar na bekijken'); else step('na bekijken staat niets meer onder "Nieuw"');
  await pa.screenshot({ path: OUT + '/shot_notifs2.png' });

  // lege staat
  await pages[D].click('#navnot'); await waitText(pages[D], 'Nog geen meldingen');
  await pages[D].screenshot({ path: OUT + '/shot_notifs_empty.png' }); step('lege staat');

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
