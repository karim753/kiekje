// Genereert alle diagrammen in deze map als SVG, in de Kiekje-huisstijl.
//   node diagrams/genereer-diagrammen.js
// Pas de gegevens hieronder aan als de app verandert, en draai het script opnieuw.
const fs = require('fs');
const path = require('path');

// ---------- huisstijl ----------
const C = { bg: '#14120F', surface: '#1F1C18', accent: '#E8A33D', accent2: '#D9667A', green: '#6E9887', purple: '#8C7BC4', text: '#F5F1EA', muted: '#8A8378', line: '#4A433A' };
const FONT = 'Helvetica,Arial,sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const textW = (s, size) => String(s).length * size * 0.56;

function svg(w, h, title, body, subtitle = '') {
	return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT}">
<title>${esc(title)}</title>
<defs>
  <marker id="pijl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.muted}"/></marker>
  <marker id="pijl-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.accent}"/></marker>
  <marker id="erft" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L12,6 L0,12 z" fill="${C.bg}" stroke="${C.muted}" stroke-width="1.2"/></marker>
  <marker id="ruit" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M0,6 L6,1 L12,6 L6,11 z" fill="${C.surface}" stroke="${C.muted}"/></marker>
</defs>
<rect width="${w}" height="${h}" fill="${C.bg}"/>
<text x="30" y="40" fill="${C.text}" font-size="22" font-weight="700" font-family="Georgia,serif">${esc(title)}</text>
${subtitle ? `<text x="30" y="62" fill="${C.muted}" font-size="12.5">${esc(subtitle)}</text>` : ''}
${body}
</svg>
`;
}
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.fill || C.text}" font-size="${o.size || 12}"${o.bold ? ' font-weight="700"' : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.italic ? ' font-style="italic"' : ''}${o.family ? ` font-family="${o.family}"` : ''}>${esc(s)}</text>`;
const R = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 8}" fill="${o.fill || C.surface}" stroke="${o.stroke || C.accent}" stroke-width="${o.sw || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const Lijn = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || C.muted}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.end ? ` marker-end="url(#${o.end})"` : ''}${o.start ? ` marker-start="url(#${o.start})"` : ''}/>`;
const Pad = (d, o = {}) => `<path d="${d}" fill="none" stroke="${o.stroke || C.muted}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.end ? ` marker-end="url(#${o.end})"` : ''}/>`;
// label met achtergrond (leesbaar boven lijnen)
function Label(x, y, s, o = {}) {
	const size = o.size || 11, w = textW(s, size) + 10;
	return `<rect x="${x - w / 2}" y="${y - size + 1}" width="${w}" height="${size + 6}" rx="4" fill="${C.bg}"/>${T(x, y + 2, s, { ...o, size, anchor: 'middle', fill: o.fill || C.muted })}`;
}
// lijn tussen twee rechthoeken, afgesneden op de randen
function verbind(a, b, o = {}) {
	const ca = [a.x + a.w / 2, a.y + a.h / 2], cb = [b.x + b.w / 2, b.y + b.h / 2];
	const klip = (r, from, to) => {
		const dx = to[0] - from[0], dy = to[1] - from[1];
		const t = Math.min(Math.abs(r.w / 2 / (dx || 1e-9)), Math.abs(r.h / 2 / (dy || 1e-9)));
		return [from[0] + dx * t, from[1] + dy * t];
	};
	const p1 = klip(a, ca, cb), p2 = klip(b, cb, ca);
	let out = Lijn(p1[0], p1[1], p2[0], p2[1], o);
	if (o.label) out += Label((p1[0] + p2[0]) / 2 + (o.lx || 0), (p1[1] + p2[1]) / 2 + (o.ly || 0), o.label, { size: 10.5 });
	return out;
}

// ---------- 1. ERD ----------
function erd() {
	const W = 230, ROW = 17;
	const tabellen = {
		comments: { x: 40, y: 95, velden: [['PK', 'id'], ['FK', 'post_id → posts'], ['FK', 'user_id → users'], ['', 'content  VARCHAR(500)'], ['', 'created_at']] },
		posts: { x: 385, y: 95, velden: [['PK', 'id'], ['FK', 'user_id → users'], ['', 'image_url  TEXT'], ['', 'caption  VARCHAR(2200)'], ['', 'location  VARCHAR(100)'], ['', 'created_at']] },
		likes: { x: 730, y: 95, velden: [['PK', 'id'], ['FK', 'post_id → posts'], ['FK', 'user_id → users'], ['', 'created_at'], ['UQ', '(post_id, user_id)']] },
		comment_likes: { x: 40, y: 345, velden: [['PK', 'id'], ['FK', 'comment_id → comments'], ['FK', 'user_id → users'], ['', 'created_at'], ['UQ', '(comment_id, user_id)']] },
		users: { x: 385, y: 345, velden: [['PK', 'id'], ['UQ', 'username  VARCHAR(30)'], ['UQ', 'email  VARCHAR(150)'], ['', 'password_hash  (bcrypt)'], ['', 'bio  VARCHAR(160)'], ['', 'avatar_url'], ['', 'created_at']], hoofd: true },
		follows: { x: 730, y: 345, velden: [['PK', 'id'], ['FK', 'follower_id → users'], ['FK', 'following_id → users'], ['', 'created_at'], ['UQ', '(follower_id, following_id)']] },
		messages: { x: 40, y: 600, velden: [['PK', 'id'], ['FK', 'sender_id → users'], ['FK', 'recipient_id → users'], ['', 'text  VARCHAR(2000)'], ['', 'created_at'], ['', 'read_at  (NULL = ongelezen)']] },
		stories: { x: 385, y: 600, velden: [['PK', 'id'], ['FK', 'user_id → users'], ['', 'image_url'], ['', 'created_at  (24 uur zichtbaar)']] },
		story_likes: { x: 730, y: 600, velden: [['PK', 'id'], ['FK', 'story_id → stories'], ['FK', 'user_id → users'], ['', 'created_at'], ['UQ', '(story_id, user_id)']] },
	};
	let body = '';
	for (const [naam, t] of Object.entries(tabellen)) { t.w = W; t.h = 30 + t.velden.length * ROW + 10; }
	const rel = (a, b, label, o = {}) => (body += verbind(tabellen[a], tabellen[b], { label, ...o }));
	rel('users', 'posts', '1 : N');
	rel('posts', 'comments', '1 : N');
	rel('posts', 'likes', '1 : N');
	rel('comments', 'comment_likes', '1 : N');
	rel('users', 'stories', '1 : N');
	rel('stories', 'story_likes', '1 : N');
	rel('users', 'follows', '1 : N (2×)');
	rel('users', 'messages', '1 : N (2×)');
	for (const t of ['comments', 'likes', 'comment_likes', 'story_likes']) rel('users', t, '', { dash: '4 4', stroke: C.line });
	for (const [naam, t] of Object.entries(tabellen)) {
		const kleur = t.hoofd ? C.accent2 : C.accent;
		body += R(t.x, t.y, t.w, t.h, { stroke: kleur, rx: 6 });
		body += `<path d="M${t.x} ${t.y + 6} a6 6 0 0 1 6 -6 h${t.w - 12} a6 6 0 0 1 6 6 v20 h-${t.w} z" fill="${kleur}"/>`;
		body += T(t.x + 12, t.y + 18, naam, { fill: C.bg, bold: true, size: 13 });
		t.velden.forEach(([k, v], i) => {
			const y = t.y + 44 + i * ROW;
			if (k) body += T(t.x + 12, y, k, { fill: k === 'PK' ? C.accent : k === 'FK' ? C.green : C.purple, bold: true, size: 10.5 });
			body += T(t.x + 40, y, v, { size: 11.5, fill: k === 'PK' ? C.accent : C.text });
		});
	}
	body += T(40, 815, 'PK = primaire sleutel   FK = verwijzing (ON DELETE CASCADE)   UQ = uniek (bv. één like per gebruiker per post)', { fill: C.muted, size: 11.5 });
	body += T(40, 833, 'Stippellijnen: user_id-verwijzingen naar users. Meldingen hebben geen eigen tabel; ze worden afgeleid uit likes, comments, follows, story_likes en comment_likes.', { fill: C.muted, size: 11.5 });
	return svg(1000, 850, 'ERD — Kiekje database', body, 'Database kiekje, 9 tabellen (zie database/schema.sql)');
}

// ---------- 2b. domeinmodel (conceptueel) ----------
function domeinmodel() {
	let body = '';
	const klasse = (x, y, w, naam, attrs, ops, o = {}) => {
		const h = 28 + attrs.length * 16 + 10 + ops.length * 16 + 8;
		const kleur = o.kleur || C.accent2;
		body += R(x, y, w, h, { stroke: kleur, rx: 4 });
		body += `<rect x="${x}" y="${y}" width="${w}" height="26" rx="4" fill="${kleur}"/>`;
		if (o.stereo) body += T(x + w / 2, y - 6, `«${o.stereo}»`, { fill: C.muted, size: 10.5, anchor: 'middle' });
		body += T(x + w / 2, y + 18, naam, { fill: C.bg, bold: true, size: 13, anchor: 'middle' });
		attrs.forEach((a, i) => (body += T(x + 10, y + 44 + i * 16, a, { size: 11 })));
		const sy = y + 32 + attrs.length * 16;
		body += Lijn(x, sy, x + w, sy, { stroke: C.line, sw: 1 });
		ops.forEach((a, i) => (body += T(x + 10, sy + 18 + i * 16, a, { size: 11, fill: C.accent })));
		return { x, y, w, h };
	};
	const user = klasse(385, 95, 230, 'User', ['- id: int', '- username: string', '- email: string', '- passwordHash: string', '- bio: string', '- avatarUrl: string'],
		['+ register(): bool', '+ login(identifier, pw): bool', '+ logout()', '+ updateProfile(naam, bio)', '+ updateAvatar(foto)', '+ follow(user: User)']);
	const post = klasse(30, 95, 235, 'Post', ['- id: int', '- imageUrl: string', '- caption: string', '- location: string', '- createdAt: datetime'],
		['+ create(foto, caption)', '+ updateCaption(tekst)', '+ delete()', '+ toggleLike(user): bool', '+ addComment(user, tekst)']);
	const comment = klasse(30, 440, 235, 'Comment', ['- id: int', '- content: string', '- createdAt: datetime'], ['+ toggleLike(user): bool', '+ delete(door: User)']);
	const story = klasse(735, 95, 225, 'Story', ['- id: int', '- imageUrl: string', '- createdAt: datetime'], ['+ create(foto)', '+ isActief(): bool  (< 24 uur)', '+ toggleLike(user): bool', '+ delete()']);
	const msg = klasse(735, 380, 225, 'Message', ['- id: int', '- text: string', '- createdAt: datetime', '- readAt: datetime?'], ['+ send(van, naar, tekst)', '+ markeerGelezen()']);
	const notif = klasse(385, 475, 230, 'Melding', ['- type: like | comment | follow |', '        story_like | comment_like', '- actor: User', '- createdAt: datetime'], ['+ lijstVoor(user): Melding[]'], { kleur: C.purple, stereo: 'afgeleid, geen tabel' });
	const lijn = (a, b, label, o = {}) => (body += verbind(a, b, { label, ...o }));
	lijn(user, post, 'plaatst  1 .. *', { ly: -10 });
	lijn(post, comment, 'heeft  1 .. *');
	lijn(user, comment, 'schrijft  1 .. *', { ly: 6 });
	lijn(user, story, 'plaatst  1 .. *', { ly: -10 });
	lijn(user, msg, 'stuurt/ontvangt  1 .. *');
	lijn(user, notif, 'krijgt', { dash: '5 4' });
	// zelf-associatie volgen
	body += Pad(`M${user.x + 60} ${user.y} v-28 h130 v28`, { end: 'pijl' });
	body += Label(user.x + 125, user.y - 28, 'volgt  * .. *');
	body += T(40, 690, 'Likes (Post, Comment, Story) zijn koppeltabellen tussen User en het item: één like per gebruiker per item.', { fill: C.muted, size: 11.5 });
	body += T(40, 708, 'Conceptueel model. De echte PHP-klassen staan in klassendiagram.svg (bv. Post.toggleLike → InteractionController::likePost() + LikeTable::toggle()).', { fill: C.muted, size: 11.5 });
	return svg(990, 730, 'Domeinmodel — Kiekje', body, 'Conceptueel: de begrippen van de app, hun gegevens, handelingen en relaties');
}

// ---------- 2. klassendiagram (echte klassen in backend/src/) ----------
function klassendiagram() {
	let body = '';
	const W = 1400;
	// klasse: titel, optioneel «stereotype», regels (attributen/methodes); '---' = scheidingslijn
	const klasse = (x, y, w, naam, regels, o = {}) => {
		const kleur = o.kleur || C.accent2;
		const h = 28 + regels.filter(r => r !== '---').length * 15 + regels.filter(r => r === '---').length * 8 + 8;
		body += R(x, y, w, h, { stroke: kleur, rx: 4 });
		body += `<rect x="${x}" y="${y}" width="${w}" height="24" rx="4" fill="${kleur}"/>`;
		body += T(x + w / 2, y + 17, naam, { fill: C.bg, bold: true, size: 12.5, anchor: 'middle', italic: !!o.abstract });
		if (o.stereo) body += T(x + w / 2, y - 5, `«${o.stereo}»`, { fill: C.muted, size: 10, anchor: 'middle' });
		if (o.bestand) body += T(x + w - 6, y + h - 6, o.bestand, { fill: C.muted, size: 9.5, anchor: 'end' });
		let ry = y + 40;
		for (const r of regels) {
			if (r === '---') { body += Lijn(x, ry - 8, x + w, ry - 8, { stroke: C.line, sw: 1 }); ry += 8; continue; }
			const isMethode = /^[+#-] ?\w+\(|\(\)|\w+\(/.test(r);
			body += T(x + 9, ry, r, { size: 10.8, fill: isMethode ? C.accent : C.text, italic: /\{abstract\}/.test(r) });
			ry += 15;
		}
		return { x, y, w, h, cx: x + w / 2 };
	};

	// Core
	body += T(30, 92, 'Core  (backend/src/Core/)', { bold: true, size: 13, fill: C.green });
	const core = [
		['Request', ['+ method(): string', '+ action(): string', '+ query(key)', '+ input(key)', '+ text(key)']],
		['Response', ['+ json(data, status) «static»', '+ error(msg, status) «static»']],
		['Session', ['+ userId(): ?int', '+ login(id)', '+ logout()']],
		['Database', ['- pdo: PDO «static»', '+ connection(): PDO «static»']],
		['ImageStorage', ['- dir: string', '+ save(dataUrl): string', '+ delete(path)']],
		['Validator', ['+ username(naam) «static»', '+ email(adres) «static»', '+ maxLength(...) «static»']],
		['HttpException', ['- status: int', '+ getStatus(): int', 'extends RuntimeException']],
	];
	const coreBox = {};
	core.forEach(([n, r], i) => (coreBox[n] = klasse(30 + i * 194, 104, 182, n, r, { kleur: C.green })));

	// abstracte basisklassen
	const ctrl = klasse(60, 300, 400, 'Controller', ['# request: Request', '# session: Session', '- user: ?array', '---', '+ run()', '# handle() {abstract}', '# currentUser(): array', '# dispatch(routes, action)', '# ok(data)', '# db(): PDO   # images(): ImageStorage'], { abstract: true, stereo: 'abstract', bestand: 'src/Controllers/Controller.php' });
	const repo = klasse(820, 300, 380, 'Repository', ['# pdo: PDO', '---', '# run(sql, params): PDOStatement', '# one()   # all()   # value()   # column()', '# lastId(): int'], { abstract: true, stereo: 'abstract', bestand: 'src/Repositories/Repository.php' });

	// subklassen
	const ctrls = [
		['AuthController', '# register()  # login()  # me()  # updateProfile()  # updateAvatar()  # logout()', 'auth.php'],
		['PostController', '# show()  # create()  # update()  # delete()  # ownPost()', 'posts.php'],
		['InteractionController', '# likePost()  # comment()  # likeComment()  # deleteComment()', 'interactions.php'],
		['StoryController', '# create()  # like()  # delete()', 'stories.php'],
		['FollowController', '# handle(): volgen / ontvolgen', 'follows.php'],
		['UserController', '# search()  # profile()  # suggestions()', 'users.php'],
		['MessageController', '# conversations()  # thread()  # send()  # unread()', 'messages.php'],
		['NotificationController', '# handle(): meldingen', 'notifications.php'],
	];
	const repos = [
		['UserRepository', '+ findById()  + findForLogin()  + create()  + profile()  + search()  + suggestions()'],
		['PostRepository', '+ feed()  + byUser()  + find()  + create()  + updateCaption()  + delete()'],
		['CommentRepository', '+ create()  + forPosts()  + findWithPostOwner()  + delete()'],
		['StoryRepository', '+ active()  + create()  + findActive()  + delete()'],
		['FollowRepository', '+ isFollowing()  + toggle(): string'],
		['MessageRepository', '+ conversations()  + thread()  + markRead()  + send()'],
		['NotificationRepository', '+ forUser(): array'],
		['LikeTable', '- table   + toggle(item, user)   + count(item)'],
	];
	const Y0 = 560, DY = 66, CW = 470;
	const erf = (parent, busX, kinderen) => {
		const laatste = kinderen[kinderen.length - 1];
		body += Pad(`M${busX} ${laatste.y + 21} V${parent.y + parent.h + 18} H${parent.cx} V${parent.y + parent.h + 1}`, { end: 'erft' });
		for (const k of kinderen) body += Lijn(busX, k.y + 21, k.x, k.y + 21);
	};
	const ctrlKids = ctrls.map(([n, m, f], i) => klasse(120, Y0 + i * DY, CW, n, [m], { bestand: 'api/' + f }));
	const repoKids = repos.map(([n, m], i) => klasse(880, Y0 + i * DY, CW, n, [m], { kleur: C.purple }));
	erf(ctrl, 90, ctrlKids);
	erf(repo, 850, repoKids);

	// gebruikt-relaties
	const gebruikt = (van, naar, label) => {
		body += Lijn(van[0], van[1], naar[0], naar[1], { dash: '5 4', end: 'pijl' });
		if (label) body += Label((van[0] + naar[0]) / 2, (van[1] + naar[1]) / 2, label, { size: 10 });
	};
	// startpunten over de bovenkant van Controller verdeeld (niet over het label «abstract»)
	['Request', 'Response', 'Session', 'ImageStorage'].forEach((n, i) => gebruikt([ctrl.x + [40, 150, 320, 380][i], ctrl.y], [coreBox[n].cx, coreBox[n].y + coreBox[n].h]));
	gebruikt([repo.x + 60, repo.y], [coreBox.Database.cx, coreBox.Database.y + coreBox.Database.h], 'PDO');
	gebruikt([ctrlKids[1].x + CW, ctrlKids[1].y + 21], [repoKids[1].x, repoKids[1].y + 21], 'gebruikt');
	gebruikt([ctrlKids[2].x + CW, ctrlKids[2].y + 21], [repoKids[7].x, repoKids[7].y + 21]);
	body += T(620, 540, 'Controllers gebruiken repositories (bv. PostController → PostRepository, InteractionController → LikeTable)', { size: 10.5, fill: C.muted, anchor: 'middle' });

	// legenda
	const ly = Y0 + 8 * DY + 20;
	body += `<path d="M30 ${ly} h28" stroke="${C.muted}" stroke-width="1.4" marker-end="url(#erft)"/>` + T(66, ly + 4, 'erft van (extends)', { size: 11, fill: C.muted });
	body += `<path d="M220 ${ly} h28" stroke="${C.muted}" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#pijl)"/>` + T(256, ly + 4, 'gebruikt', { size: 11, fill: C.muted });
	body += T(340, ly + 4, '+ public   # protected   - private   cursief = abstract   «static» = klassemethode', { size: 11, fill: C.muted });
	body += T(30, ly + 26, 'Elk bestand in backend/api/ start alleen zijn controller: (new PostController())->run(). Klassen worden automatisch geladen via backend/bootstrap.php (namespace Kiekje\\).', { size: 11, fill: C.muted });
	return svg(W, ly + 46, 'Klassendiagram — Kiekje backend', body, 'De echte PHP-klassen in backend/src/: overerving (Controller, Repository), encapsulatie en hergebruik (LikeTable)');
}

// ---------- 3. use case ----------
function usecase() {
	let body = '';
	const actor = (x, y, naam) => {
		body += `<g stroke="${C.text}" stroke-width="1.6" fill="none"><circle cx="${x}" cy="${y}" r="11"/><line x1="${x}" y1="${y + 11}" x2="${x}" y2="${y + 42}"/><line x1="${x - 18}" y1="${y + 22}" x2="${x + 18}" y2="${y + 22}"/><line x1="${x}" y1="${y + 42}" x2="${x - 14}" y2="${y + 64}"/><line x1="${x}" y1="${y + 42}" x2="${x + 14}" y2="${y + 64}"/></g>`;
		body += T(x, y + 84, naam, { anchor: 'middle', size: 13, bold: true });
		return { x: x - 20, y: y - 12, w: 40, h: 100 };
	};
	body += R(200, 85, 780, 690, { fill: 'none', stroke: C.muted, dash: '6 4', rx: 10 });
	body += T(215, 108, 'Kiekje', { fill: C.muted, bold: true, size: 13 });
	const groepen = [
		['Account', 230, 125, ['Registreren', 'Inloggen', 'Uitloggen', 'Profiel bewerken', 'Profielfoto wijzigen']],
		['Kiekjes', 600, 125, ['Kiekje plaatsen', 'Post bewerken / verwijderen', 'Liken (ook dubbelklik)', 'Reageren', 'Reactie liken / verwijderen', 'Post delen (link)']],
		['Stories', 230, 450, ['Story plaatsen', 'Story bekijken', 'Story liken', 'Reageren op story (DM)']],
		['Sociaal', 600, 450, ['Gebruiker zoeken', 'Volgen / ontvolgen', 'DM sturen en lezen', 'Meldingen bekijken']],
	];
	const vakken = {};
	for (const [naam, x, y, cases] of groepen) {
		const h = 40 + cases.length * 44;
		body += R(x, y, 350, h, { fill: '#1A1714', stroke: C.line, rx: 10 });
		body += T(x + 14, y + 22, naam, { fill: C.accent, bold: true, size: 13 });
		cases.forEach((c, i) => {
			const cy = y + 52 + i * 44;
			body += `<ellipse cx="${x + 175}" cy="${cy}" rx="150" ry="17" fill="${C.surface}" stroke="${C.accent}" stroke-width="1.4"/>`;
			body += T(x + 175, cy + 4, c, { anchor: 'middle', size: 12 });
		});
		vakken[naam] = { x, y, w: 350, h };
	}
	const bezoeker = actor(90, 150, 'Bezoeker');
	const gebruiker = actor(90, 470, 'Gebruiker');
	body += verbind(bezoeker, { x: 230, y: 160, w: 1, h: 1 });
	body += verbind(bezoeker, { x: 230, y: 206, w: 1, h: 1 });
	// lijnen via de open ruimte tussen de groepen (niet door de vakken heen)
	const busY = 440, mid = v => v.y + v.h / 2;
	body += Pad(`M112 505 H150 V${busY} H590`);
	body += Pad(`M215 ${busY} V${mid(vakken.Account)} H228`, { end: 'pijl' });
	body += Pad(`M215 ${busY} V${mid(vakken.Stories)} H228`, { end: 'pijl' });
	body += Pad(`M590 ${busY} V${mid(vakken.Kiekjes)} H598`, { end: 'pijl' });
	body += Pad(`M590 ${busY} V${mid(vakken.Sociaal)} H598`, { end: 'pijl' });
	body += Pad('M90 250 V 450', { end: 'pijl', dash: '5 4' });
	body += Label(90, 355, 'na inloggen', { size: 10.5 });
	body += T(200, 800, 'Bezoeker: registreren en inloggen. Gebruiker (ingelogd): alle andere use cases; die vereisen «include» Inloggen (de server controleert de sessie).', { fill: C.muted, size: 11.5 });
	return svg(1000, 820, 'Use Case Diagram — Kiekje', body, 'Wat een bezoeker en een ingelogde gebruiker kunnen doen');
}

// ---------- 4. activity: kiekje plaatsen (met swimlanes) ----------
function activity() {
	let body = '';
	const lanes = [['Gebruiker', 30], ['Browser (frontend/js)', 280], ['Server (PostController)', 530], ['Opslag', 780]];
	const LW = 250, TOP = 80, H = 900;
	lanes.forEach(([n, x], i) => {
		body += `<rect x="${x}" y="${TOP}" width="${LW}" height="${H}" fill="${i % 2 ? '#181511' : '#16130F'}" stroke="${C.line}"/>`;
		body += T(x + LW / 2, TOP + 24, n, { anchor: 'middle', bold: true, size: 13, fill: C.accent });
	});
	const cx = i => lanes[i][1] + LW / 2;
	const act = (lane, y, s, o = {}) => {
		const w = 200, h = o.h || 40;
		body += R(cx(lane) - w / 2, y, w, h, { rx: 18, stroke: o.kleur || C.accent });
		String(s).split('\n').forEach((r, i, a) => (body += T(cx(lane), y + h / 2 + 4 - (a.length - 1) * 7 + i * 14, r, { anchor: 'middle', size: 11.5 })));
		return { x: cx(lane) - w / 2, y, w, h, cx: cx(lane) };
	};
	const beslis = (lane, y, s) => {
		const x = cx(lane);
		body += `<path d="M${x} ${y} l70 26 l-70 26 l-70 -26 z" fill="${C.surface}" stroke="${C.accent2}" stroke-width="1.5"/>`;
		body += T(x, y + 30, s, { anchor: 'middle', size: 11 });
		return { x: x - 70, y, w: 140, h: 52, cx: x };
	};
	const pijl = (a, b, label, o = {}) => {
		const x1 = a.cx, y1 = a.y + a.h, x2 = b.cx, y2 = b.y;
		const d = x1 === x2 ? `M${x1} ${y1} V${y2}` : `M${x1} ${y1} V${(y1 + y2) / 2} H${x2} V${y2}`;
		body += Pad(d, { end: 'pijl' });
		if (label) body += Label(o.lx ?? (x1 === x2 ? x1 + 22 : (x1 + x2) / 2), o.ly ?? (y1 + y2) / 2 - 2, label, { size: 10.5 });
	};
	body += `<circle cx="${cx(0)}" cy="${TOP + 55}" r="10" fill="${C.text}"/>`;
	const start = { cx: cx(0), y: TOP + 45, h: 20 };
	const a1 = act(0, 160, 'Klikt op "Maken" (＋)');
	const a2 = act(1, 225, 'Opent venster\n"Nieuw kiekje"', { h: 44 });
	const a3 = act(0, 300, 'Kiest een foto');
	const a4 = act(1, 365, 'Foto verkleinen (max. 1080px)\n+ voorbeeld tonen', { h: 44 });
	const a5 = act(0, 440, 'Typt bijschrift + locatie,\nklikt "Plaatsen"', { h: 44 });
	const a6 = act(1, 515, 'POST posts.php\n{ image, caption, location }', { h: 44 });
	const d1 = beslis(2, 590, 'Ingelogd?');
	const d2 = beslis(2, 680, 'Echte afbeelding?');
	const a7 = act(3, 770, 'Foto opslaan in\nbackend/uploads/', { h: 44 });
	const a8 = act(3, 840, 'INSERT INTO posts\n(prepared statement)', { h: 44 });
	const a9 = act(1, 840, 'Post bovenaan feed\ntonen', { h: 44 });
	const f1 = act(1, 620, 'Melding "Je bent\nuitgelogd" → inlogscherm', { h: 44, kleur: C.accent2 });
	const f2 = act(1, 700, 'Melding "Bestand is geen\ngeldige afbeelding"', { h: 44, kleur: C.accent2 });
	pijl(start, a1); pijl(a1, a2); pijl(a2, a3); pijl(a3, a4); pijl(a4, a5); pijl(a5, a6); pijl(a6, d1);
	pijl(d1, d2, 'ja');
	body += Pad(`M${d1.x} ${d1.y + 26} H${f1.x + f1.w} `, { end: 'pijl' }); body += Label(d1.x - 22, d1.y + 18, 'nee (401)', { size: 10.5 });
	body += Pad(`M${d2.x} ${d2.y + 26} H${f2.x + f2.w}`, { end: 'pijl' }); body += Label(d2.x - 22, d2.y + 18, 'nee (422)', { size: 10.5 });
	pijl(d2, a7, 'ja', { lx: 720, ly: 755 });
	pijl(a7, a8);
	body += Pad(`M${a8.x} ${a8.y + 22} H${a9.x + a9.w}`, { end: 'pijl' }); body += Label((a8.x + a9.x + a9.w) / 2, a8.y + 16, 'JSON met post', { size: 10.5 });
	body += Pad(`M${a9.cx} ${a9.y + a9.h} V${a9.y + a9.h + 22}`, { end: 'pijl' });
	body += `<circle cx="${a9.cx}" cy="${a9.y + a9.h + 34}" r="11" fill="none" stroke="${C.text}" stroke-width="2"/><circle cx="${a9.cx}" cy="${a9.y + a9.h + 34}" r="6" fill="${C.text}"/>`;
	return svg(1060, 1000, 'Activity Diagram — Kiekje plaatsen', body, 'Van klik tot post in de feed, per onderdeel (swimlanes)');
}

// ---------- 5. sequentiediagram: DM sturen ----------
function sequentie() {
	let body = '';
	const deel = [['Gebruiker A', 110], ['Browser A\n(messages.js)', 330], ['MessageController\n(api/messages.php)', 560], ['MySQL', 770], ['Browser B', 950]];
	const TOP = 90, END = 960;
	for (const [n, x] of deel) {
		body += R(x - 80, TOP, 160, 46, { rx: 8 });
		n.split('\n').forEach((r, i, a) => (body += T(x, TOP + 27 - (a.length - 1) * 7 + i * 14, r, { anchor: 'middle', bold: i === 0, size: i ? 11 : 12.5 })));
		body += Lijn(x, TOP + 46, x, END, { dash: '5 5', stroke: C.line });
	}
	const X = i => deel[i][1];
	let y = TOP + 80;
	const msg = (van, naar, s, o = {}) => {
		const x1 = X(van), x2 = X(naar);
		body += Lijn(x1, y, x2 + (x2 > x1 ? -3 : 3), y, { end: o.terug ? 'pijl' : 'pijl-accent', stroke: o.terug ? C.muted : C.accent, dash: o.terug ? '5 4' : '' });
		body += T((x1 + x2) / 2, y - 7, s, { anchor: 'middle', size: 11.5, fill: o.terug ? C.muted : C.text });
		y += o.gap || 44;
	};
	const notitie = s => { body += R(X(2) - 40, y - 18, 330, 28, { fill: '#1A1714', stroke: C.purple, rx: 4 }); body += T(X(2) - 30, y + 1, s, { size: 11, fill: C.text }); y += 42; };
	msg(0, 1, 'opent gesprek met B');
	msg(1, 2, 'GET ?action=list&user=B  (sessiecookie)');
	msg(2, 3, 'UPDATE read_at (berichten van B → A gelezen)');
	msg(2, 3, 'SELECT berichten A ↔ B');
	msg(3, 2, 'rijen', { terug: true });
	msg(2, 1, 'JSON { messages, me }', { terug: true });
	msg(1, 0, 'gesprek met namen, tijden, "Gezien"', { terug: true, gap: 56 });
	msg(0, 1, 'typt bericht + Enter');
	msg(1, 2, 'POST ?action=send { recipient: B, text }');
	notitie('controle: ingelogd, ontvanger bestaat, niet jezelf, ≤ 2000 tekens');
	msg(2, 3, 'INSERT INTO messages (prepared statement)');
	msg(2, 1, '{ success: true }', { terug: true });
	msg(1, 2, 'GET ?action=list  (gesprek verversen)', { gap: 56 });
	body += R(X(3) + 20, y - 18, 250, 42, { fill: '#1A1714', stroke: C.green, rx: 4 });
	body += T(X(3) + 30, y - 1, 'Browser B ververst automatisch:', { size: 11, fill: C.green });
	body += T(X(3) + 30, y + 15, 'badge elke 15 s, open gesprek elke 4 s', { size: 11, fill: C.green });
	y += 52;
	msg(4, 2, 'GET ?action=unread → badge "1"', { gap: 30 });
	msg(4, 2, 'GET ?action=list → read_at gezet', { gap: 50 });
	msg(1, 2, 'volgende verversing (elke 4 s)');
	msg(2, 1, 'bericht staat op "Gezien"', { terug: true });
	return svg(1060, 980, 'Sequentiediagram — Een DM sturen', body, 'Wat er gebeurt tussen browser, API en database als gebruiker A een bericht naar B stuurt');
}

// ---------- 6. architectuur ----------
function architectuur() {
	let body = '';
	const blok = (x, y, w, h, titel, regels, o = {}) => {
		body += R(x, y, w, h, { stroke: o.kleur || C.accent, dash: o.dash, rx: 10 });
		body += T(x + 16, y + 26, titel, { bold: true, size: 14, fill: o.kleur || C.accent });
		regels.forEach((r, i) => (body += T(x + 16, y + 50 + i * 18, r, { size: 11.5, fill: r.startsWith('  ') ? C.muted : C.text })));
		return { x, y, w, h };
	};
	const browser = blok(40, 90, 340, 420, 'Browser  (frontend/)', ['index.html  laadt stijl + scripts', 'css/style.css', 'js/  18 scripts, één per onderdeel:', '  state, api, utils, session, navigation,', '  posts, feed, stories, profile,', '  messages, notifications, layout,', '  modals, events, auth, icons, main', 'js/search.js  →  React-component', '  (SearchPage, UserRow, Avatar)', 'vendor/  React 18, ReactDOM, htm', '', 'localStorage: alleen UI-voorkeuren', '  (laatste tabblad, gelezen meldingen)']);
	const server = blok(470, 90, 320, 300, 'Server  (backend/, PHP OOP)', ['api/*.php   ingangen: starten één controller', '', 'src/Controllers/   één klasse per onderdeel', '  Auth, Post, Interaction, Story, Follow,', '  User, Message, Notification', '  (erven van abstract Controller)', 'src/Repositories/  alle SQL (erven van', '  abstract Repository) + LikeTable', 'src/Core/   Request, Response, Session,', '  Database, ImageStorage, Validator'], { kleur: C.accent2 });
	const db = blok(880, 90, 250, 190, 'MySQL  (database kiekje)', ['users, posts, comments,', 'likes, comment_likes,', 'follows, messages,', 'stories, story_likes', '', '  schema: database/schema.sql'], { kleur: C.green });
	const up = blok(880, 320, 250, 150, 'Bestanden', ['backend/uploads/', '  foto\'s van posts, stories', '  en profielfoto\'s', '  .htaccess: geen scripts'], { kleur: C.green });
	const test = blok(470, 450, 320, 170, 'Tests', ['tests/e2e/  9 browsertests (Puppeteer)', '  kopie app: /kiekje_testrun/', '  database: kiekje_test, daarna verwijderd', 'backend/tests/  23 unit tests (PHPUnit)', '  Validator, ImageStorage, Controller, ...'], { kleur: C.purple, dash: '6 4' });
	body += Pad(`M${browser.x + browser.w} 170 H${server.x}`, { end: 'pijl-accent', stroke: C.accent });
	body += Label((browser.x + browser.w + server.x) / 2, 160, 'fetch → JSON', { size: 10.5 });
	body += Pad(`M${server.x} 240 H${browser.x + browser.w}`, { end: 'pijl', dash: '5 4' });
	body += Label((browser.x + browser.w + server.x) / 2, 232, 'JSON-antwoord', { size: 10.5 });
	body += Label((browser.x + browser.w + server.x) / 2, 200, 'sessiecookie', { size: 10.5 });
	body += Pad(`M${server.x + server.w} 170 H${db.x}`, { end: 'pijl-accent', stroke: C.accent });
	body += Label((server.x + server.w + db.x) / 2, 160, 'PDO prepared', { size: 10.5 });
	body += Pad(`M${server.x + server.w} 360 H${up.x}`, { end: 'pijl-accent', stroke: C.accent });
	body += Label((server.x + server.w + up.x) / 2, 350, 'ImageStorage', { size: 10.5 });
	body += Pad(`M${browser.x + browser.w} 440 C 420 440, 420 ${up.y + 120}, ${up.x} ${up.y + 120}`, { end: 'pijl', dash: '5 4' });
	body += Label(640, 425, '<img src="../backend/uploads/…">', { size: 10.5 });
	body += T(40, 650, 'De frontend is één pagina (geen herladen): render() tekent het scherm opnieuw uit de toestand in state.js. Alle gegevens komen via de API uit MySQL;', { fill: C.muted, size: 11.5 });
	body += T(40, 668, 'de server controleert bij elk verzoek de PHP-sessie, zodat je alleen je eigen posts, stories en reacties kunt wijzigen.', { fill: C.muted, size: 11.5 });
	return svg(1170, 690, 'Architectuur — Kiekje', body, 'Hoe frontend, API, database en bestandsopslag samenwerken');
}

// ---------- 7. sitemap / schermoverzicht ----------
function sitemap() {
	let body = '';
	const knoop = (x, y, s, o = {}) => {
		const w = o.w || Math.max(130, textW(s, 12) + 26), h = 36;
		body += R(x - w / 2, y, w, h, { fill: o.fill || C.surface, stroke: o.kleur || C.accent, rx: 8 });
		body += T(x, y + 23, s, { anchor: 'middle', size: 12, bold: !!o.bold, fill: o.tfill || C.text });
		return { x: x - w / 2, y, w, h, cx: x };
	};
	const tak = (a, b) => (body += Pad(`M${a.cx} ${a.y + a.h} V${(a.y + a.h + b.y) / 2} H${b.cx} V${b.y}`));
	const root = knoop(560, 90, 'frontend/index.html', { fill: C.accent, tfill: C.bg, bold: true, w: 200 });
	const auth = knoop(180, 180, 'Niet ingelogd');
	const app = knoop(700, 180, 'Ingelogd (app)', { kleur: C.accent2 });
	tak(root, auth); tak(root, app);
	const login = knoop(110, 245, 'Inloggen'); const reg = knoop(260, 245, 'Registreren');
	tak(auth, login); tak(auth, reg);
	const tabs = [['Home (feed)', ['Stories-balk', 'Story bekijken', 'Postkaarten', 'Reactievenster', 'Post-venster (#post-id)']], ['Zoeken', ['React-zoekpagina', 'Profiel openen']], ['Berichten', ['Inbox', 'Gesprek (DM)']], ['Meldingen', ['Nieuw / Vandaag /', 'Deze week / Eerder', 'Terugvolgen']], ['Maken', ['Venster', '"Nieuw kiekje"']], ['Profiel', ['Eigen: bewerken,', 'profielfoto (bijsnijden)', 'Ander: volgen, bericht', 'Volgers / volgend']]];
	const x0 = 150, dx = 175;
	tabs.forEach(([naam, kids], i) => {
		const t = knoop(x0 + i * dx, 385, naam, { w: 150 });
		tak(app, t);
		kids.forEach((k, j) => {
			const y = 440 + j * 30;
			body += T(t.cx - 66, y + 14, '· ' + k, { size: 11.5, fill: C.muted });
		});
	});
	body += T(40, 640, 'Kiekje is een single-page app: er zijn geen losse pagina-adressen. Schermen wisselen via de menuknoppen (zijbalk op groot scherm, onderbalk op telefoon);', { fill: C.muted, size: 11.5 });
	body += T(40, 658, 'alleen een gedeelde post heeft een eigen link (index.html#post-12). Vensters (post, reacties, story, DM, bewerken) openen boven het huidige scherm.', { fill: C.muted, size: 11.5 });
	return svg(1120, 680, 'Sitemap — Kiekje', body, 'Schermen en vensters van de app');
}

// ---------- 8. wireframes ----------
function wireframe() {
	let body = '';
	const box = (x, y, w, h, s, o = {}) => {
		body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 4}" fill="none" stroke="${o.stroke || C.muted}" stroke-width="1" stroke-dasharray="${o.solid ? '' : '3 3'}"/>`;
		if (s) body += T(x + (o.center ? w / 2 : 8), y + (o.ty || h / 2 + 4), s, { size: o.size || 10.5, fill: C.muted, anchor: o.center ? 'middle' : undefined });
	};
	const cirkel = (x, y, r) => (body += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.muted}" stroke-dasharray="3 3"/>`);
	// telefoon
	const px = 40, py = 95, pw = 300, ph = 620;
	body += T(px, py - 12, 'Telefoon — feed', { bold: true, size: 13, fill: C.accent });
	body += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="22" fill="none" stroke="${C.text}" stroke-width="1.5"/>`;
	box(px + 12, py + 14, pw - 24, 34, 'Kiekje');
	body += T(px + pw - 24, py + 35, '[＋]   [✈]', { size: 10.5, fill: C.muted, anchor: 'end' });
	for (let i = 0; i < 5; i++) cirkel(px + 40 + i * 55, py + 82, 20);
	body += T(px + 16, py + 120, 'stories-balk (horizontaal scrollen)', { size: 10, fill: C.muted });
	box(px + 12, py + 132, pw - 24, 30, '(o) gebruikersnaam • 2 u                  ⋯');
	box(px + 12, py + 168, pw - 24, 220, '[ foto — dubbelklik = like ]', { center: true });
	box(px + 12, py + 394, pw - 24, 24, '♡   💬   ↗');
	box(px + 12, py + 424, pw - 24, 64, '12 vind-ik-leuks · bijschrift ·', { ty: 20 });
	body += T(px + 20, py + 462, 'Bekijk alle 5 reacties · 2 reacties', { size: 10.5, fill: C.muted });
	box(px + 12, py + 494, pw - 24, 26, 'Voeg een reactie toe...          Plaats');
	box(px + 12, py + 530, pw - 24, 30, '[ volgende post ]', { center: true });
	box(px + 12, py + ph - 58, pw - 24, 44, '', { rx: 8 });
	['⌂', '⌕', '＋', '🔔', '(o)'].forEach((s, i) => (body += T(px + 12 + (pw - 24) * (i + 0.5) / 5, py + ph - 30, s, { size: 13, fill: C.muted, anchor: 'middle' })));
	// groot scherm
	const dx = 400, dy = 95, dw = 740, dh = 620;
	body += T(dx, dy - 12, 'Groot scherm (≥ 1000 px) — feed', { bold: true, size: 13, fill: C.accent });
	body += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="10" fill="none" stroke="${C.text}" stroke-width="1.5"/>`;
	box(dx + 12, dy + 12, 150, dh - 24, '', {});
	body += T(dx + 26, dy + 42, 'Kiekje', { size: 16, fill: C.muted, family: 'Georgia,serif', bold: true });
	['⌂  Home', '⌕  Zoeken', '✈  Berichten', '🔔  Meldingen', '＋  Maken', '(o) Profiel'].forEach((s, i) => body += T(dx + 26, dy + 90 + i * 38, s, { size: 11.5, fill: C.muted }));
	body += T(dx + 26, dy + dh - 30, '⇥  Uitloggen', { size: 11.5, fill: C.muted });
	box(dx + 190, dy + 20, 330, 70, '', { rx: 10 });
	for (let i = 0; i < 4; i++) cirkel(dx + 230 + i * 70, dy + 55, 22);
	box(dx + 190, dy + 104, 330, 500, '', { rx: 10 });
	box(dx + 202, dy + 116, 306, 28, '(o) gebruikersnaam • 1 u');
	box(dx + 202, dy + 150, 306, 280, '[ foto ]', { center: true });
	box(dx + 202, dy + 438, 306, 24, '♡   💬   ↗');
	box(dx + 202, dy + 468, 306, 80, 'likes · bijschrift · reacties', { ty: 22 });
	box(dx + 202, dy + 556, 306, 30, 'Voeg een reactie toe...');
	box(dx + 545, dy + 20, 180, 60, '(o) jij + bio', { ty: 34 });
	body += T(dx + 545, dy + 108, 'Voorgesteld voor jou', { size: 11, fill: C.muted, bold: true });
	for (let i = 0; i < 5; i++) box(dx + 545, dy + 120 + i * 40, 180, 32, '(o) naam       Volgen');
	body += T(40, 748, 'Telefoon: bovenbalk met ＋ en berichten, onderbalk met 5 knoppen (Maken in het midden). Groot scherm: zijbalk links, feed in het midden (kaarten),', { fill: C.muted, size: 11.5 });
	body += T(40, 766, 'rechts voorgestelde accounts vanaf 1260 px. Profiel: grote kop + fotoraster (3 kolommen) met likes/reacties bij hover.', { fill: C.muted, size: 11.5 });
	return svg(1180, 790, 'Wireframes — Kiekje', body, 'Opbouw van het feed-scherm op telefoon en groot scherm');
}

const DIAGRAMMEN = {
	'erd.svg': erd, 'klassendiagram.svg': klassendiagram, 'domeinmodel.svg': domeinmodel, 'usecase-diagram.svg': usecase, 'activity-diagram.svg': activity,
	'sequentiediagram-dm.svg': sequentie, 'architectuur.svg': architectuur, 'sitemap.svg': sitemap, 'wireframe.svg': wireframe,
};
for (const [bestand, maak] of Object.entries(DIAGRAMMEN)) {
	fs.writeFileSync(path.join(__dirname, bestand), maak());
	console.log('✓', bestand);
}
