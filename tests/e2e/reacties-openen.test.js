const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const navshim = require('./nav-helper');
const T = Date.now() % 100000, A = 'cm_a_' + T, B = 'cm_b_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const mk = async n => {
    const p = await (await browser.createBrowserContext()).newPage(); navshim(p);
    await p.setViewport({ width: 420, height: 850 });
    p.on('pageerror', e => errors.push(n + ' pageerror: ' + e.message));
    p.on('dialog', d => { errors.push(n + ' dialog: ' + d.message()); d.dismiss(); });
    const orig = p.click.bind(p);
    p.click = async sel => { for (let i = 0; ; i++) { try { await p.waitForSelector(sel, { timeout: 6000 }); return await orig(sel); } catch (e) { if (i > 4 || !/detached|not clickable/i.test(e.message)) throw e; await sleep(250); } } };
    return navshim(p);
  };
  const pa = await mk('A'), pb = await mk('B');
  const waitText = (p, s) => p.waitForFunction(s => document.body.innerText.includes(s), { timeout: 6000 }, s);
  const register = async (p, name) => {
    await p.goto(URL); await p.click('#show-register');
    await p.type('#reg-username', name); await p.type('#reg-email', name + '@x.nl');
    await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
    await p.click('#register-form button'); await p.waitForSelector('.bottomnav');
  };
  await register(pa, A); await register(pb, B);

  // A plaatst een post
  await pa.click('#newpost'); await pa.type('#caption', 'Reactietest');
  const [fc] = await Promise.all([pa.waitForFileChooser(), pa.click('#drop')]);
  await fc.accept([OUT + '/test.png']); await pa.waitForSelector('#drop img');
  await pa.click('#publish'); await waitText(pa, 'Reactietest');

  // B: 💬 op een post zonder reacties opent het reactievenster met invoerveld actief
  await pb.reload(); await waitText(pb, 'Reactietest'); await sleep(500);
  const card = `.post:has(.post-caption) .comment-focus`;
  await pb.evaluate(c => [...document.querySelectorAll('.post')].find(p => p.innerText.includes('Reactietest')).querySelector('.comment-focus').click(), card);
  await pb.waitForSelector('#viewer .viewer-title'); await waitText(pb, 'Nog geen reacties');
  await pb.waitForFunction(() => document.activeElement?.matches('#viewer .comment-input'));
  step('💬 opent reactievenster, invoerveld is actief');

  // B plaatst 5 reacties in het venster
  for (let i = 1; i <= 5; i++) { await pb.type('#viewer .comment-input', 'Reactie ' + i); await pb.keyboard.press('Enter'); await waitText(pb, 'Reactie ' + i); }
  await waitText(pb, 'Reacties (5)'); step('5 reacties geplaatst in het venster, teller klopt');
  const scrolled = await pb.$eval('#viewer .viewer-comments', l => l.scrollHeight <= l.clientHeight + 2 || l.scrollTop + l.clientHeight >= l.scrollHeight - 2);
  if (!scrolled) errors.push('lijst niet naar laatste reactie gescrold');
  await pb.keyboard.press('Escape'); await pb.waitForFunction(() => !document.getElementById('viewer'));

  // feed: laatste 3 zichtbaar + link "Bekijk alle 5 reacties"
  await waitText(pb, 'Bekijk alle 5 reacties'); step('feed toont "Bekijk alle 5 reacties"');
  await pb.evaluate(() => [...document.querySelectorAll('.open-comments')].find(e => e.innerText.includes('5')).click());
  await pb.waitForSelector('#viewer .viewer-title');
  const n = await pb.$$eval('#viewer .viewer-comments .comment-item', l => l.length);
  if (n !== 5) errors.push('viewer toont ' + n + ' reacties i.p.v. 5');
  step('link opent venster met alle 5 reacties');

  // 💬 in het venster focust het invoerveld
  await pb.evaluate(() => document.activeElement.blur());
  await pb.click('#viewer .comment-focus');
  await pb.waitForFunction(() => document.activeElement?.matches('#viewer .comment-input'));
  step('💬 in venster zet cursor in invoerveld');
  await pb.screenshot({ path: OUT + '/shot_comments.png' });

  // A ziet ze ook (andere browser)
  await pa.reload(); await waitText(pa, 'Bekijk alle 5 reacties'); step('A ziet de reacties in een andere browser');

  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
  require('fs').writeFileSync(OUT + '/cm_users.txt', A + '\n' + B);
})().catch(e => { console.log('TEST MISLUKT:', e.message, errors.join('\n')); process.exit(1); });
