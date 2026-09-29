// Kiekje — notifications.js
// Meldingen: laden, ongelezen teller, groeperen en weergeven, terugvolgen.

function unseenNotifs() {
	if (!notifs || !me || tab === 'notifications') return 0;
	const seen = ui.seen[me.username] || '';
	return notifs.filter(n => n.created_at > seen).length;
}
function updateNotifBadge() {
	const n = unseenNotifs();
	document.querySelectorAll('.notif-badge').forEach(b => {
		b.textContent = n;
		b.hidden = !n;
	});
}
async function loadNotifs() {
	try {
		const r = await api('notifications.php');
		notifs = r.notifications;
	} catch (e) {
		notifs = notifs || [];
	}
	if (tab === 'notifications') {
		if (notifs[0] && me) {
			ui.seen[me.username] = notifs[0].created_at;
			saveUi();
		}
		refreshView();
	}
	updateNotifBadge();
}

// ---------- meldingen ----------
const NOTIF_ICON = {
	like: ['♥', '#D9667A'],
	comment: ['💬', '#6E9887'],
	follow: ['+', '#8C7BC4'],
	story_like: ['♥', '#E8A33D'],
	comment_like: ['♥', '#D9667A']
};
function notifSection(n) {
	if (n.created_at > notifSeenBefore) return 'Nieuw';
	const d = parseTs(n.created_at),
		now = new Date();
	if (d.toDateString() === now.toDateString()) return 'Vandaag';
	if (now - d < 7 * 864e5) return 'Deze week';
	return 'Eerder';
}
// opeenvolgende likes op dezelfde post samenvoegen: "A, B en 3 anderen vinden je post leuk"
function groupNotifs(list) {
	const out = [];
	for (const n of list) {
		const section = notifSection(n),
			prev = out[out.length - 1];
		if (
			n.type === 'like' &&
			prev &&
			prev.type === 'like' &&
			prev.section === section &&
			prev.post_id === n.post_id
		) {
			if (!prev.actors.includes(n.actor)) prev.actors.push(n.actor);
			continue;
		}
		out.push({ ...n, section, actors: [n.actor] });
	}
	return out;
}
function notifNames(actors) {
	const b = a => `<b class="user-link" data-user="${esc(a)}">${esc(a)}</b>`;
	if (actors.length === 1) return b(actors[0]);
	if (actors.length === 2) return `${b(actors[0])} en ${b(actors[1])}`;
	const rest = actors.length - 2;
	return `${b(actors[0])}, ${b(actors[1])} en ${rest} ${rest === 1 ? 'ander' : 'anderen'}`;
}
function notifText(n) {
	const a = notifNames(n.actors || [n.actor]),
		many = (n.actors || []).length > 1,
		quote = t => `<span class="notif-quote">“${esc(t || '')}”</span>`;
	if (n.type === 'like') return `${a} ${many ? 'vinden' : 'vindt'} je post leuk.`;
	if (n.type === 'comment') return `${a} reageerde: ${quote(n.text)}`;
	if (n.type === 'follow') return `${a} volgt je nu.`;
	if (n.type === 'story_like') return `${a} vindt je story leuk.`;
	if (n.type === 'comment_like') return `${a} vindt je reactie leuk: ${quote(n.text)}`;
	return a;
}
function notifRow(n) {
	const [icon, bg] = NOTIF_ICON[n.type] || ['•', '#8A8378'];
	const right =
		n.type === 'follow'
			? `<button class="btn notif-follow ${n.i_follow ? 'ghost' : ''}" data-actor="${esc(n.actor)}">${n.i_follow ? 'Volgend' : 'Terugvolgen'}</button>`
			: n.image
				? `<img class="notif-thumb" src="${esc(img(n.image))}" alt="" loading="lazy">`
				: '';
	return `<div class="notif-row ${n.section === 'Nieuw' ? 'unread' : ''}" data-actor="${esc(n.actor)}" data-post-id="${n.post_id || ''}"><div class="notif-av">${av(n.actor, 44, n.avatar)}<span class="notif-icon" style="background:${bg}">${icon}</span></div><div class="notif-text">${notifText(n)} <span class="notif-time">${relTime(n.created_at)}</span></div>${right}</div>`;
}
function notificationsView() {
	if (notifs === null) return `<div class="empty">Laden...</div>`;
	if (!notifs.length)
		return `<div class="notif-empty"><div class="notif-empty-icon"><svg class="bell" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div><b>Nog geen meldingen</b><div class="small">Als iemand je post leuk vindt, erop reageert of je gaat volgen, zie je dat hier.</div></div>`;
	let html = '<div class="notif-head">Meldingen</div>',
		section = '';
	for (const n of groupNotifs(notifs)) {
		if (n.section !== section) {
			section = n.section;
			html += `<div class="notif-section">${section}</div>`;
		}
		html += notifRow(n);
	}
	return html;
}
async function followBack(name, btn) {
	btn.disabled = true;
	try {
		const r = await api('follows.php', { username: name });
		const f = r.action === 'follow';
		notifs.forEach(n => {
			if (n.actor === name) n.i_follow = f;
		});
		feedPosts = null;
		render();
	} catch (e) {
		btn.disabled = false;
		toast(e.message);
	}
}
