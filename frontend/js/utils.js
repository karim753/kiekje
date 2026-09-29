// Kiekje — utils.js
// Hulpfuncties: escapen, afbeeldings-URL's, profielfoto's, tijdsnotatie, meldingen (toast), foto's inlezen.

// ---------- hulpfuncties ----------
function esc(s = '') {
	return String(s ?? '').replace(
		/[&<>'"]/g,
		c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]
	);
}
function img(u) {
	return !u ? '' : /^(data:|https?:|blob:)/.test(u) ? u : '../backend/' + u;
}
// standaard profielfoto (grijs silhouet) voor iedereen zonder eigen foto
const DEFAULT_AVATAR =
	'data:image/svg+xml,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#3A342C"/><circle cx="32" cy="25" r="11" fill="#8A8378"/><path d="M11 58c1.5-11.5 10-18 21-18s19.5 6.5 21 18z" fill="#8A8378"/></svg>'
	);
// laatst bekende profielfoto per gebruiker (gevuld vanuit elke API-response), zodat ook plekken zonder avatar-veld de juiste foto tonen
const avatars = {};
function rememberAvatars(v, depth = 0) {
	if (!v || typeof v !== 'object' || depth > 3) return;
	if (Array.isArray(v)) {
		v.forEach(x => rememberAvatars(x, depth + 1));
		return;
	}
	const name = v.user || v.username || v.actor;
	if (typeof name === 'string' && 'avatar' in v) avatars[name] = v.avatar || null;
	Object.values(v).forEach(x => {
		if (x && typeof x === 'object') rememberAvatars(x, depth + 1);
	});
}
// bron van een profielfoto: meegegeven url, anders de laatst bekende, anders de standaardfoto
function avatarSrc(name, url) {
	name = String(name || '');
	const src = url || (name in avatars ? avatars[name] : null);
	return src ? img(src) : DEFAULT_AVATAR;
}
function av(name, size, url) {
	return `<img class="avatar" src="${esc(avatarSrc(name, url))}" alt="" style="width:${size}px;height:${size}px">`;
}
function parseTs(ts) {
	return ts ? new Date(String(ts).replace(' ', 'T')) : null;
}
function relTime(ts) {
	const d = parseTs(ts);
	if (!d || isNaN(d)) return '';
	const s = (Date.now() - d) / 1000;
	if (s < 60) return 'zojuist';
	if (s < 3600) return Math.floor(s / 60) + ' min';
	if (s < 86400) return Math.floor(s / 3600) + ' u';
	if (s < 7 * 86400) return Math.floor(s / 86400) + ' d';
	return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}
function dmTime(ts) {
	const d = parseTs(ts);
	if (!d || isNaN(d)) return '';
	return d.toDateString() === new Date().toDateString()
		? d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
		: d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}
function toast(msg) {
	let t = document.getElementById('toast');
	if (!t) {
		t = document.createElement('div');
		t.id = 'toast';
		t.className = 'toast';
		t.setAttribute('role', 'status');
		document.body.appendChild(t);
	}
	t.textContent = msg;
	t.hidden = false;
	clearTimeout(toast.timer);
	toast.timer = setTimeout(() => (t.hidden = true), 3500);
}
// verkleint een gekozen foto (max. 1080px, JPEG) zodat uploads klein blijven
// square=true: midden vierkant uitsnijden op 400x400 (voor profielfoto's)
function readImage(file, cb, square = false) {
	const r = new FileReader();
	r.onload = () => {
		const im = new Image();
		im.onload = () => {
			const c = document.createElement('canvas'),
				g = c.getContext('2d');
			if (square) {
				const side = Math.min(im.width, im.height);
				c.width = c.height = Math.min(400, side);
				g.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, c.width, c.height);
			} else {
				const scale = Math.min(1, 1080 / Math.max(im.width, im.height));
				c.width = Math.round(im.width * scale);
				c.height = Math.round(im.height * scale);
				g.drawImage(im, 0, 0, c.width, c.height);
			}
			cb(c.toDataURL('image/jpeg', 0.85));
		};
		im.onerror = () => toast('Dit bestand is geen afbeelding die de browser kan lezen.');
		im.src = r.result;
	};
	r.readAsDataURL(file);
}
function pickImage(cb, square = false) {
	const i = document.createElement('input');
	i.type = 'file';
	i.accept = 'image/*';
	i.onchange = e => {
		const f = e.target.files[0];
		if (f) readImage(f, cb, square);
	};
	i.click();
}
// opnieuw tekenen, maar niet terwijl iemand aan het typen is (anders is de tekst weg)
function refreshView() {
	const a = document.activeElement;
	if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.value) return;
	if (['upload', 'editProfile', 'editPost'].includes(modal)) return;
	render();
}
function closeMenus() {
	document.querySelectorAll('.menu-box').forEach(m => (m.hidden = true));
}
