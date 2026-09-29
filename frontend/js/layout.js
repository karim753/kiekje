// Kiekje — layout.js
// Lay-out: zijbalk, bovenbalk, onderbalk, rechterkolom met voorstellen + de hoofd-render().

// [tabblad, icoon, label] — gebruikt door zijbalk (groot scherm) en onderbalk (telefoon)
const NAV = [
	['feed', 'home', 'Home'],
	['search', 'search', 'Zoeken'],
	['messages', 'send', 'Berichten'],
	['notifications', 'bell', 'Meldingen'],
	['new', 'plus', 'Maken'],
	['profile', null, 'Profiel']
];
function navActive(k) {
	return k === 'profile' ? tab === 'profile' && !viewUser : tab === k;
}
function navBadge(k) {
	if (k === 'notifications') {
		const n = unseenNotifs();
		return `<span class="nav-badge notif-badge" ${n ? '' : 'hidden'}>${n}</span>`;
	}
	if (k === 'messages')
		return `<span class="nav-badge dm-badge" ${dmUnread ? '' : 'hidden'}>${dmUnread}</span>`;
	return '';
}
function navIcon(k, ic) {
	return k === 'profile'
		? `<span class="nav-avatar">${av(me.username, 24, me.avatar)}</span>`
		: icon(ic, 24, navActive(k) && (ic === 'home' || ic === 'bell'));
}
function sidenav() {
	return `<nav class="sidenav" aria-label="Hoofdmenu"><div class="brand side-brand"><span class="dot"></span>Kiekje</div>${NAV.map(([k, ic, label]) => `<button class="side-item ${navActive(k) ? 'active' : ''}" data-nav="${k}"><span class="side-ic">${navIcon(k, ic)}${navBadge(k)}</span><span>${label}</span></button>`).join('')}<button class="side-item side-logout" data-nav="logout"><span class="side-ic">${icon('logout')}</span><span>Uitloggen</span></button></nav>`;
}
function topbar() {
	return `<header class="topbar"><div class="topbar-row"><div class="brand"><span class="dot"></span>Kiekje</div><div class="topbar-actions"><button class="icon-btn" data-nav="new" aria-label="Nieuw kiekje">${icon('plus')}</button><button class="icon-btn ${tab === 'messages' ? 'active' : ''}" data-nav="messages" aria-label="Berichten">${icon('send')}${navBadge('messages')}</button></div></div><div class="film-strip">${'<span></span>'.repeat(26)}</div></header>`;
}
// rechterkolom (alleen brede schermen): jij + voorgestelde accounts
function rightbar() {
	const list = suggestions || [];
	return `<aside class="rightbar"><div class="rb-me">${av(me.username, 48, me.avatar)}<div class="info"><b class="user-link" data-user="${esc(me.username)}">${esc(me.username)}</b><div class="small">${esc(me.bio || 'Welkom op Kiekje')}</div></div></div>${list.length ? `<div class="rb-title">Voorgesteld voor jou</div>${list.map(u => `<div class="rb-user">${av(u.username, 36, u.avatar)}<div class="info"><b class="user-link" data-user="${esc(u.username)}">${esc(u.username)}</b><div class="small">${u.follows_me ? 'Volgt jou' : u.follower_count + (u.follower_count === 1 ? ' volger' : ' volgers')}</div></div><button class="text-btn rb-follow ${u.followed ? 'done' : ''}" data-follow="${esc(u.username)}">${u.followed ? 'Volgend' : u.follows_me ? 'Terugvolgen' : 'Volgen'}</button></div>`).join('')}` : ''}<div class="rb-foot">© 2026 Kiekje · Vastleggen wat het waard is</div></aside>`;
}
let suggestions = null;
async function loadSuggestions() {
	try {
		suggestions = (await api('users.php?suggest=1')).users;
	} catch (e) {
		suggestions = [];
	}
	renderRightbar();
}
// alleen de rechterkolom vervangen (niet de hele pagina), zodat een klik of typwerk elders niet verloren gaat
function renderRightbar() {
	const rb = document.querySelector('.rightbar');
	if (!rb || !me) return;
	const tmp = document.createElement('div');
	tmp.innerHTML = rightbar();
	const next = tmp.firstElementChild;
	rb.replaceWith(next);
	bindProfileLinks(next);
	next.querySelectorAll('.rb-follow').forEach(b => (b.onclick = () => followSuggestion(b.dataset.follow, b)));
}
async function followSuggestion(name, btn) {
	btn.disabled = true;
	try {
		const r = await api('follows.php', { username: name });
		const u = (suggestions || []).find(x => x.username === name);
		if (u) u.followed = r.action === 'follow';
		renderRightbar();
	} catch (e) {
		btn.disabled = false;
		toast(e.message);
	}
}

function render() {
	unmountSearch(); // React-zoekpagina opruimen vóór de HTML vervangen wordt
	if (!me) {
		if (!sessionChecked) {
			root.innerHTML = '<div class="empty" style="padding-top:40vh">Kiekje laden...</div>';
			return;
		}
		return auth();
	}
	// venster "story" zonder (nog bestaande) story: niets tonen i.p.v. een half venster
	if (modal === 'story' && !stories[storyIndex]) {
		modal = null;
		storyIndex = -1;
	}
	let html = topbar();
	if (tab === 'feed') html += feed();
	else if (tab === 'profile') html += profileView();
	else if (tab === 'search') html += searchView();
	else if (tab === 'notifications') html += notificationsView();
	else if (tab === 'messages') html += inbox();
	root.innerHTML = `${sidenav()}<div class="page"><main class="main ${tab === 'profile' ? 'wide' : ''}">${html}</main>${tab === 'feed' ? rightbar() : ''}</div>${nav()}${modal ? modalHtml() : ''}${viewPostId ? postViewer() : ''}`;
	events();
	if (tab === 'search') mountSearch(); // React-component (search.js)
}

const BOTTOM_NAV = ['feed', 'search', 'new', 'notifications', 'profile'];
function nav() {
	return `<nav class="bottomnav" aria-label="Menu">${BOTTOM_NAV.map(k => NAV.find(n => n[0] === k))
		.map(
			([k, ic, label]) =>
				`<button class="${navActive(k) ? 'active' : ''}" data-nav="${k}" aria-label="${label}">${navIcon(k, ic)}${navBadge(k)}</button>`
		)
		.join('')}</nav>`;
}
