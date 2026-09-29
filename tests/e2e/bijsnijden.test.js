const puppeteer = require('puppeteer-core');
const { OUT, CHROME, URL } = require('./config');
const navshim = require('./nav-helper');
const fs = require('fs');
const T = Date.now() % 100000, A = 'cr_a_' + T;
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const step = m => console.log('✓', m);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const p = await (await browser.createBrowserContext()).newPage(); navshim(p);
  await p.setViewport({ width: 420, height: 800 });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('dialog', d => { errors.push('dialog: ' + d.message()); d.dismiss(); });
  const waitText = s => p.waitForFunction(s => document.body.innerText.includes(s), { timeout: 6000 }, s);

  await p.goto(URL); await p.waitForSelector('#show-register'); await p.click('#show-register');
  await p.type('#reg-username', A); await p.type('#reg-email', A + '@x.nl');
  await p.type('#reg-password', 'geheim1234'); await p.type('#reg-password2', 'geheim1234');
  await p.click('#register-form button'); await p.waitForSelector('.bottomnav');

  // testfoto 600x300: links rood, rechts blauw
  const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#ff0000'; g.fillRect(0, 0, 300, 300); g.fillStyle = '#0000ff'; g.fillRect(300, 0, 300, 300); return c.toDataURL('image/png').split(',')[1]; });
  fs.writeFileSync(OUT + '/redblue.png', Buffer.from(png, 'base64'));
  const pick = async sel => { const [fc] = await Promise.all([p.waitForFileChooser(), p.click(sel)]); await fc.accept([OUT + '/redblue.png']); await p.waitForSelector('.crop-view img[src]'); await sleep(300); };

  // 1) annuleren met Esc vanuit "Profiel bewerken": bewerkvenster blijft open, niets geüpload
  await p.click('#navprofile'); await p.waitForSelector('#edit-profile'); await sleep(300); await p.click('#edit-profile'); await p.waitForSelector('#modal-change-avatar');
  await p.type('#editbio', 'concept-bio');
  await pick('#modal-change-avatar'); step('bijsnijdvenster opent na kiezen foto');
  await p.screenshot({ path: OUT + '/shot_crop.png' });
  await p.keyboard.press('Escape'); await sleep(300);
  if (await p.$('.crop-backdrop')) errors.push('cropper niet gesloten met Esc');
  if (!(await p.$('#editbio'))) errors.push('bewerkvenster ook gesloten door Esc');
  else if ((await p.$eval('#editbio', e => e.value)) !== 'concept-bio') errors.push('ingevulde bio kwijt');
  else step('Esc sluit alleen het bijsnijdvenster; bewerkvenster + ingevulde tekst blijven');

  // 2) inzoomen + naar links slepen → rood
  await pick('#modal-change-avatar');
  await p.$eval('.crop-controls input', r => { r.value = 2; r.dispatchEvent(new Event('input')); });
  const box = await (await p.$('.crop-view')).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2 + 400, box.y + box.height / 2, { steps: 8 }); await p.mouse.up();
  await p.screenshot({ path: OUT + '/shot_crop_zoom.png' });
  await p.click('.crop-ok'); await waitText('Profielfoto bijgewerkt');
  await p.waitForFunction(() => document.querySelector('.edit-avatar img')?.src.includes('/uploads/'));
  const color = await p.$eval('.edit-avatar img', async i => { if (!i.complete) await new Promise(r => i.onload = r); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let r = 0, b = 0; for (let k = 0; k < d.length; k += 4) { if (d[k] > 200 && d[k + 2] < 60) r++; if (d[k + 2] > 200 && d[k] < 60) b++; } return { w: c.width, h: c.height, red: r / (d.length / 4), blue: b / (d.length / 4) }; });
  if (color.w !== 400 || color.h !== 400) errors.push('formaat ' + color.w + 'x' + color.h);
  if (color.red < 0.95) errors.push('verwacht (bijna) volledig rood, kreeg ' + JSON.stringify(color)); else step(`ingezoomd + naar links gesleept → opgeslagen foto is ${Math.round(color.red * 100)}% rood (400x400)`);

  // 3) draaien werkt zonder fouten en opslaan lukt
  await pick('#modal-change-avatar');
  await p.click('.crop-rotate'); await sleep(400);
  const dims = await p.$eval('.crop-view img', i => [i.naturalWidth, i.naturalHeight]);
  if (dims[0] !== 300 || dims[1] !== 600) errors.push('draaien: afmetingen ' + dims); else step('draaien draait de foto een kwartslag');
  await p.click('.crop-ok'); await waitText('Profielfoto bijgewerkt');

  const avatarPath = await p.evaluate(() => document.querySelector('.edit-avatar img').getAttribute('src').replace('../backend/', ''));
  fs.writeFileSync(OUT + '/cr_user.txt', A + '\n' + avatarPath);
  await browser.close();
  console.log(errors.length ? 'FOUTEN:\n' + errors.join('\n') : 'Geen fouten.');
})().catch(e => { console.log('TEST MISLUKT:', e.message, '\n' + errors.join('\n')); process.exit(1); });
