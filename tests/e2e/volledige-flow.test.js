const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const navshim = require('./nav-helper');
const fs = require('fs');
const T = Date.now() % 100000;
const A = 'e2e_a_' + T, B = 'e2e_b_' + T;
fs.writeFileSync(OUT + '/test.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'));

const errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function step(msg) { console.log('✓', msg); }

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  // twee losse "privévensters" = twee aparte sessies/opslag
  const ctxA = await browser.createBrowserContext();
  const ctxB = await browser.createBrowserContext();
  const pa = navshim(await ctxA.newPage()), pb = navshim(await ctxB.newPage());
  for (const [p, n] of [[pa, 'A'], [pb, 'B']]) {
    await p.setViewport({ width: 470, height: 900 });
    p.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message));
    p.on('response', r => { if (r.status() >= 400 && !(r.status() === 401 && r.url().includes('action=me'))) if(!r.url().includes('favicon'))errors.push(n + ' HTTP ' + r.status() + ' ' + r.url()); });
    p.on('dialog', d => { if (d.type() === 'confirm') d.accept(); else { errors.push(n + ' alert: ' + d.message()); d.dismiss(); } });
  }
  for (const p of [pa, pb]) { const orig = p.click.bind(p); p.click = async (sel, o) => { for (let i = 0; ; i++) { try { await p.waitForSelector(sel, { timeout: 6000 }); return await orig(sel, o); } catch (e) { if (i > 4 || !/detached|not clickable/i.test(e.message)) throw e; await sleep(250); } } }; }
  navshim(pa); navshim(pb);
  // klik (of focus) een element binnen de post met een bepaald bijschrift / de story van een bepaalde naam
  const postOf = (p, caption, sel, how = 'click') => p.evaluate((c, sel, how) => { const post = [...document.querySelectorAll('article.post')].find(x => x.innerText.includes(c)); post.querySelector(sel)[how](); }, caption, sel, how);
  const storyOf = async (p, name) => { await p.waitForFunction(n => [...document.querySelectorAll('.story-item')].some(x => x.innerText.trim() === n), { timeout: 6000 }, name); await p.evaluate(n => [...document.querySelectorAll('.story-item')].find(x => x.innerText.trim() === n).click(), name); };
  const text = p => p.$eval('#root', r => r.innerText);
  const waitText = async (p, s, t = 6000) => { await p.waitForFunction(s => document.body.innerText.includes(s), { timeout: t }, s); };

  async function register(p, name) {
    await p.goto(URL); await p.waitForSelector('#show-register');
    await p.click('#show-register');
    await p.type('#reg-username', name); await p.type('#reg-email', name + '@x.nl');
    await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
    await p.click('#register-form button');
    await p.waitForSelector('.bottomnav');
  }
  async function upload(p, clickSel) {
    await sleep(600); await p.waitForSelector(clickSel);
    const [fc] = await Promise.all([p.waitForFileChooser(), p.click(clickSel)]);
    await fc.accept([OUT + '/test.png']);
  }

  await register(pa, A); step('A geregistreerd');
  await register(pb, B); step('B geregistreerd (apart privévenster)');

  // A plaatst post
  await pa.click('#newpost'); await pa.waitForSelector('#drop');
  await pa.type('#caption', 'Hallo vanaf A');
  await upload(pa, '#drop'); await pa.waitForSelector('#drop img');
  if (await pa.$eval('#caption', e => e.value) !== 'Hallo vanaf A') errors.push('bijschrift weg na foto kiezen');
  await pa.type('#location', 'Amsterdam');
  await pa.click('#publish'); await waitText(pa, 'Hallo vanaf A'); step('A heeft post geplaatst');

  // A plaatst story
  await upload(pa, '#addstory'); await waitText(pa, 'Story geplaatst'); step('A heeft story geplaatst');

  // B zoekt A, volgt, ziet post
  await pb.click('#navsearch'); await pb.waitForSelector('#searchInput');
  await pb.type('#searchInput', A); await pb.waitForSelector(`.profile-row[data-user="${A}"]`);
  await pb.click(`.profile-row[data-user="${A}"]`); await pb.waitForSelector('#follow');
  await waitText(pb, 'Hallo'.slice(0, 0) + '1\nkiekjes');
  await pb.click('#follow'); await pb.waitForFunction(() => document.getElementById('follow')?.innerText === 'Ontvolgen'); step('B volgt A via profiel');
  await pb.click('#navfeed'); await waitText(pb, 'Hallo vanaf A'); step('B ziet de post van A in de feed');
  if (!(await text(pb)).includes('Amsterdam')) errors.push('locatie niet zichtbaar');

  // B liket en reageert
  await sleep(600); await postOf(pb, 'Hallo vanaf A', '.like'); await waitText(pb, '1 vind-ik-leuk'); step('B liket de post');
  await postOf(pb, 'Hallo vanaf A', '.comment-input', 'focus'); await pb.keyboard.type('Mooie foto!'); await pb.keyboard.press('Enter');
  await waitText(pb, 'Mooie foto!'); step('B reageert op de post');

  // B bekijkt story, liket, reageert via DM
  await storyOf(pb, A); await pb.waitForSelector('.story-viewer');
  await pb.click('#storylike'); await pb.waitForFunction(() => document.getElementById('storylike')?.classList.contains('liked'));
  await pb.type('#story-reply', 'Leuke story'); await pb.keyboard.press('Enter');
  await pb.waitForSelector('.dm-modal'); await waitText(pb, 'Reactie op je story: Leuke story'); step('B liket story en reageert via DM');
  await pb.type('#dm-input', 'Nog een bericht'); await pb.keyboard.press('Enter'); await waitText(pb, 'Nog een bericht');
  await pb.keyboard.press('Escape');

  // A: ververs, check post (like+reactie), meldingen, DM
  await pa.reload(); await waitText(pa, 'Mooie foto!'); step('A ziet like + reactie van B na herladen');
  if (!(await text(pa)).includes('1 vind-ik-leuk')) errors.push('A ziet like-aantal niet');
  await pa.click('#navnot'); await waitText(pa, 'volgt je nu'); const nt = await text(pa);
  for (const s of ['vindt je post leuk', 'reageerde', 'vindt je story leuk']) if (!nt.includes(s)) errors.push('melding ontbreekt: ' + s);
  step('A ziet meldingen');
  await pa.click('#opendms'); await pa.waitForSelector(`.dm-row[data-dm-user="${B}"]`);
  await pa.click(`.dm-row[data-dm-user="${B}"]`); await pa.waitForSelector('.dm-modal'); await waitText(pa, 'Nog een bericht');
  if (!(await text(pa)).includes(B)) errors.push('afzender naam niet zichtbaar');
  await pa.type('#dm-input', 'Dank je!'); await pa.keyboard.press('Enter'); await waitText(pa, 'Dank je!'); step('A leest en beantwoordt DM');
  await pa.keyboard.press('Escape');

  // B krijgt antwoord via polling
  await pb.click('#opendms'); await pb.waitForSelector(`.dm-row[data-dm-user="${A}"]`); await pb.click(`.dm-row[data-dm-user="${A}"]`);
  await waitText(pb, 'Dank je!'); await pb.keyboard.press('Escape'); step('B ziet antwoord van A');

  // A: story likers, post bewerken/verwijderen, profiel bewerken
  await pa.click('#navfeed'); await pa.waitForSelector('.story-item'); await storyOf(pa, 'Jij'); await waitText(pa, B); step('A ziet wie story likete');
  await pa.keyboard.press('Escape');
  await pa.click('.menu-toggle'); await pa.click('.edit-post'); await pa.waitForSelector('#editcaption');
  await pa.$eval('#editcaption', e => e.value = ''); await pa.type('#editcaption', 'Bewerkt bijschrift'); await pa.click('#savepost');
  await waitText(pa, 'Bewerkt bijschrift'); step('A bewerkt post');
  await pa.click('#navprofile'); await pa.waitForSelector('#edit-profile'); await pa.click('#edit-profile');
  await pa.$eval('#editname', e => e.value = ''); await pa.type('#editname', A + 'x'); await pa.type('#editbio', 'Mijn bio');
  await pa.click('#saveprofile'); await waitText(pa, 'Mijn bio'); step('A wijzigt naam en bio');
  await pb.reload(); await waitText(pb, A + 'x'); step('B ziet de nieuwe naam van A');
  await pa.screenshot({ path: OUT + '/shot_a_profile.png' });
  await pb.screenshot({ path: OUT + '/shot_b_feed.png', fullPage: false });

  // uitloggen
  await pa.click('#logout'); await pa.waitForSelector('#show-login'); step('A logt uit');

  await browser.close();
  console.log(errors.length ? '\nFOUTEN:\n' + errors.join('\n') : '\nGeen fouten.');
  fs.writeFileSync(OUT + '/e2e_users.txt', [A, A + 'x', B].join('\n'));
})().catch(async e => { console.log('TEST MISLUKT:', e.message); console.log(errors.join('\n')); process.exit(1); });
