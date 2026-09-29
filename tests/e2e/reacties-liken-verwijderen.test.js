const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const navshim = require('./nav-helper');
const T = Date.now() % 100000, A = 'cl_a_' + T, B = 'cl_b_' + T, C = 'cl_c_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async n => {
    const p = await (await browser.createBrowserContext()).newPage(); navshim(p);
    await p.setViewport({ width: 420, height: 850 });
    p.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message));
    p.on('dialog', d => { if (d.type() === 'confirm') d.accept(); else { errors.push(n + ' dialog: ' + d.message()); d.dismiss(); } });
    return navshim(p);
  };
  const [pa, pb, pc] = [await mk('A'), await mk('B'), await mk('C')];
  const waitText = (p, s) => p.waitForFunction(s => document.body.innerText.includes(s), { timeout: 6000 }, s);
  const waitNoText = (p, s) => p.waitForFunction(s => !document.body.innerText.includes(s), { timeout: 6000 }, s);
  const register = async (p, name) => {
    await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register');
    await p.type('#reg-username', name); await p.type('#reg-email', name + '@x.nl');
    await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
    await p.click('#register-form button'); await p.waitForSelector('.bottomnav');
  };
  // klik op knop (sel) binnen de reactie met tekst `text`, in het reactievenster
  const clickInComment = (p, text, sel) => p.evaluate((text, sel) => {
    const item = [...document.querySelectorAll('#viewer .comment-item')].find(i => i.querySelector('.comment-body').innerText.includes(text));
    if (!item) throw new Error('reactie niet gevonden: ' + text);
    const btn = item.querySelector(sel); if (!btn) return false; btn.click(); return true;
  }, text, sel);
  const openComments = async (p, caption) => {
    await waitText(p, caption); await sleep(400);
    await p.evaluate(c => [...document.querySelectorAll('.post')].find(x => x.innerText.includes(c)).querySelector('.comment-focus').click(), caption);
    await p.waitForSelector('#viewer .viewer-title');
  };

  await register(pa, A); await register(pb, B); await register(pc, C);
  await pa.click('#newpost'); await pa.waitForSelector('#drop'); await pa.type('#caption', 'Post van A');
  const [fc] = await Promise.all([pa.waitForFileChooser(), pa.click('#drop')]);
  await fc.accept([OUT + '/test.png']); await pa.waitForSelector('#drop img');
  await pa.click('#publish'); await waitText(pa, 'Post van A');

  // B plaatst twee reacties
  await pb.reload(); await openComments(pb, 'Post van A');
  for (const t of ['Eerste van B', 'Tweede van B']) { await pb.type('#viewer .comment-input', t); await pb.keyboard.press('Enter'); await waitText(pb, t); }
  step('B plaatst 2 reacties');

  // B liket eigen reactie
  await clickInComment(pb, 'Eerste van B', '.comment-like');
  await pb.waitForFunction(() => document.querySelector('#viewer .comment-like.liked'));
  await waitText(pb, '1 like'); step('B liket een reactie (♥ + "1 like")');
  await clickInComment(pb, 'Eerste van B', '.comment-like'); await waitNoText(pb, '1 like'); step('B haalt like weer weg');

  // C: ziet geen verwijderknop bij reacties van B, maar kan wel liken
  await pc.reload(); await openComments(pc, 'Post van A');
  const delC = await pc.$$eval('#viewer .comment-delete', l => l.length);
  if (delC !== 0) errors.push('C ziet ' + delC + ' verwijderknoppen bij reacties van een ander');
  await clickInComment(pc, 'Tweede van B', '.comment-like'); await waitText(pc, '1 like');
  step('C kan liken maar niet verwijderen');
  // server weigert verwijderen door C
  const res = await pc.evaluate(async () => {
    const id = +document.querySelector('#viewer .comment-like').dataset.cid;
    const r = await fetch('../backend/api/interactions.php?action=comment_delete', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_id: id }) });
    return r.status;
  });
  if (res !== 403) errors.push('server gaf ' + res + ' i.p.v. 403 bij verwijderen door C'); else step('server weigert verwijderen door buitenstaander (403)');

  // B krijgt melding dat C reactie leuk vindt
  await pb.keyboard.press('Escape'); await pb.click('#navnot'); await waitText(pb, 'vindt je reactie leuk'); step('B krijgt melding "vindt je reactie leuk"');

  // A (eigenaar post) ziet verwijderknoppen en verwijdert reactie van B
  await pa.reload(); await openComments(pa, 'Post van A');
  const delA = await pa.$$eval('#viewer .comment-delete', l => l.length);
  if (delA !== 2) errors.push('A ziet ' + delA + ' verwijderknoppen i.p.v. 2');
  await clickInComment(pa, 'Tweede van B', '.comment-delete'); await waitNoText(pa, 'Tweede van B');
  await waitText(pa, 'Reacties (1)'); step('eigenaar post verwijdert reactie van B');

  // B verwijdert eigen reactie
  await pb.click('#navfeed'); await openComments(pb, 'Post van A');
  if ((await pb.$eval('#viewer', v => v.innerText)).includes('Tweede van B')) errors.push('verwijderde reactie nog zichtbaar bij B');
  await clickInComment(pb, 'Eerste van B', '.comment-delete'); await waitNoText(pb, 'Eerste van B');
  await waitText(pb, 'Nog geen reacties'); step('B verwijdert eigen reactie');
  await pb.keyboard.press('Escape'); await sleep(800);
  const card = await pb.evaluate(() => [...document.querySelectorAll('.post')].find(x => x.innerText.includes('Post van A')).innerText);
  if (card.includes('Bekijk')) errors.push('feed toont nog Bekijk-link bij post zonder reacties'); else step('feed-kaart klopt na verwijderen (geen reacties meer)');
  await pa.screenshot({ path: OUT + '/shot_clikes.png' });

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
