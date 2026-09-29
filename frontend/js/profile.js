// Kiekje — profile.js
// Profiel: volgen, profielfoto (met bijsnijdvenster), naam/bio wijzigen + profielweergave.

// ---------- profiel ----------
async function toggleFollow() {
	const u = profileData,
		btn = document.getElementById('follow');
	if (!u) return;
	btn.disabled = true;
	try {
		const r = await api('follows.php', { username: u.username });
		u.followers = r.followers;
		u.i_follow = r.action === 'follow';
		feedPosts = null;
		render();
		loadSuggestions();
	} catch (e) {
		btn.disabled = false;
		toast(e.message);
	}
}
// profielfoto wijzigen/verwijderen; typwerk in het bewerk-venster blijft behouden
function keepEditFields(fn) {
	const n = document.getElementById('editname')?.value,
		b = document.getElementById('editbio')?.value;
	fn();
	if (n !== undefined) {
		document.getElementById('editname').value = n;
		document.getElementById('editbio').value = b;
	}
}
async function setAvatar(body, msg) {
	try {
		const r = await api('auth.php?action=update_avatar', body);
		me.avatar = r.avatar;
		avatars[me.username] = r.avatar;
		if (profileData && profileData.is_me) profileData.avatar = r.avatar;
		[...(feedPosts || []), ...(profilePosts || []), ...(likedPosts || []), ...stories].forEach(x => {
			if (x.user === me.username) x.avatar = r.avatar;
		});
		keepEditFields(render);
		toast(msg);
	} catch (e) {
		toast(e.message);
	}
}
// Bijsnijdvenster voor profielfoto's: zoomen (schuifbalk/scrollwiel), slepen om te verplaatsen, draaien.
// Staat los van de gewone modals, zodat "Profiel bewerken" eronder open blijft. Geeft een 400x400 JPEG of null terug.
function cropImage(src) {
	return new Promise(resolve => {
		const V = Math.min(300, window.innerWidth - 70);
		const ov = document.createElement('div');
		ov.className = 'crop-backdrop';
		ov.innerHTML = `<div class="crop-modal" role="dialog" aria-label="Profielfoto aanpassen"><h3>Profielfoto aanpassen</h3><div class="crop-view" style="width:${V}px;height:${V}px"><img alt=""><div class="crop-mask"></div></div><div class="crop-controls"><span aria-hidden="true">−</span><input type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom"><span aria-hidden="true">+</span><button class="icon-btn crop-rotate" title="Draaien" aria-label="Draaien">⟳</button></div><div class="small crop-hint">Sleep om te verplaatsen · schuif of scroll om te zoomen</div><div class="modal-actions"><button class="btn ghost crop-cancel">Annuleren</button><button class="btn crop-ok">Opslaan</button></div></div>`;
		document.body.appendChild(ov);
		const view = ov.querySelector('.crop-view'),
			el = view.querySelector('img'),
			range = ov.querySelector('input[type=range]');
		let im = new Image(),
			zoom = 1,
			dx = 0,
			dy = 0,
			drag = null; // dx/dy: verschuiving van het fotomidden t.o.v. het midden van het kader
		const scale = () => (V / Math.min(im.width, im.height)) * zoom; // zoom 1 = foto vult precies het kader
		function draw() {
			const s = scale(),
				W = im.width * s,
				H = im.height * s;
			dx = Math.max(-(W - V) / 2, Math.min((W - V) / 2, dx));
			dy = Math.max(-(H - V) / 2, Math.min((H - V) / 2, dy)); // kader altijd gevuld
			Object.assign(el.style, {
				width: W + 'px',
				height: H + 'px',
				left: (V - W) / 2 + dx + 'px',
				top: (V - H) / 2 + dy + 'px'
			});
		}
		function load(url) {
			const next = new Image();
			next.onload = () => {
				im = next;
				el.src = url;
				zoom = 1;
				range.value = 1;
				dx = dy = 0;
				draw();
			};
			next.src = url;
		}
		// zoomen rond een punt (px/py t.o.v. het midden van het kader), zodat dat punt op zijn plek blijft
		function setZoom(z, px = 0, py = 0) {
			z = Math.max(1, Math.min(4, z));
			const f = z / zoom;
			dx = px - (px - dx) * f;
			dy = py - (py - dy) * f;
			zoom = z;
			range.value = z;
			draw();
		}
		range.oninput = () => setZoom(+range.value);
		view.onwheel = e => {
			e.preventDefault();
			const r = view.getBoundingClientRect();
			setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left - V / 2, e.clientY - r.top - V / 2);
		};
		view.onpointerdown = e => {
			drag = { x: e.clientX, y: e.clientY, dx, dy };
			view.setPointerCapture(e.pointerId);
		};
		view.onpointermove = e => {
			if (!drag) return;
			dx = drag.dx + e.clientX - drag.x;
			dy = drag.dy + e.clientY - drag.y;
			draw();
		};
		view.onpointerup = view.onpointercancel = () => (drag = null);
		ov.querySelector('.crop-rotate').onclick = () => {
			const c = document.createElement('canvas');
			c.width = im.height;
			c.height = im.width;
			const g = c.getContext('2d');
			g.translate(c.width, 0);
			g.rotate(Math.PI / 2);
			g.drawImage(im, 0, 0);
			load(c.toDataURL('image/jpeg', 0.92));
		};
		const key = e => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				close(null);
			}
		};
		window.addEventListener('keydown', key, true);
		function close(v) {
			window.removeEventListener('keydown', key, true);
			ov.remove();
			resolve(v);
		}
		ov.querySelector('.crop-cancel').onclick = () => close(null);
		ov.onclick = e => {
			if (e.target === ov) close(null);
		};
		ov.querySelector('.crop-ok').onclick = () => {
			const s = scale(),
				W = im.width * s,
				H = im.height * s,
				c = document.createElement('canvas');
			c.width = c.height = 400;
			// zichtbaar kader omrekenen naar pixels in de originele foto
			c.getContext('2d').drawImage(
				im,
				((W - V) / 2 - dx) / s,
				((H - V) / 2 - dy) / s,
				V / s,
				V / s,
				0,
				0,
				400,
				400
			);
			close(c.toDataURL('image/jpeg', 0.88));
		};
		load(src);
	});
}
function changeAvatar() {
	pickImage(async data => {
		const cropped = await cropImage(data);
		if (!cropped) return;
		toast('Profielfoto uploaden...');
		setAvatar({ image: cropped }, 'Profielfoto bijgewerkt.');
	});
}
function removeAvatar() {
	if (confirm('Profielfoto verwijderen?')) setAvatar({ remove: true }, 'Profielfoto verwijderd.');
}
async function saveProfile() {
	const btn = document.getElementById('saveprofile'),
		name = document.getElementById('editname').value.trim(),
		bio = document.getElementById('editbio').value.trim();
	if (!name) {
		toast('Gebruikersnaam mag niet leeg zijn.');
		return;
	}
	btn.disabled = true;
	try {
		const r = await api('auth.php?action=update_profile', { username: name, bio });
		if (r.username !== me.username && ui.seen[me.username]) {
			ui.seen[r.username] = ui.seen[me.username];
			delete ui.seen[me.username];
		}
		me.username = r.username;
		me.bio = r.bio;
		modal = null;
		feedPosts = null;
		setTab('profile');
		toast('Profiel opgeslagen.');
	} catch (e) {
		btn.disabled = false;
		toast(e.message);
	}
}

function profileView() {
	const u = profileData;
	if (!u) return `<div class="empty">Profiel laden...</div>`;
	if (u.error) return `<div class="empty">${esc(u.error)}</div>`;
	const liked = u.is_me && profileTab === 'liked',
		posts = (liked ? likedPosts : profilePosts) || [],
		loading = liked && !likedPosts,
		tabs = u.is_me
			? `<button type="button" class="profile-tab ${liked ? '' : 'active'}" data-ptab="posts" aria-pressed="${!liked}">${icon('grid', 14)} Posts</button><button type="button" class="profile-tab ${liked ? 'active' : ''}" data-ptab="liked" aria-pressed="${liked}">${icon('heart', 14)} Geliked</button>`
			: `<span class="profile-tab active">${icon('grid', 14)} Posts</span>`,
		empty = loading ? 'Laden...' : liked ? 'Je hebt nog niks geliked.' : 'Nog geen kiekjes.';
	return `<div class="profile-head">${u.is_me ? `<button class="avatar-edit" id="change-avatar" title="Profielfoto wijzigen" aria-label="Profielfoto wijzigen">${av(u.username, 78, u.avatar)}<span class="avatar-edit-badge">+</span></button>` : av(u.username, 78, u.avatar)}<div class="profile-info"><div class="profile-name">${esc(u.username)}</div><div class="profile-stats"><div><b>${u.post_count}</b>kiekjes</div><button type="button" class="stat-button" data-kind="followers"><b>${u.followers.length}</b>volgers</button><button type="button" class="stat-button" data-kind="following"><b>${u.following.length}</b>volgend</button></div></div></div><div class="profile-bio">${esc(u.bio || 'Nog geen bio.')}</div><div class="profile-actions">${u.is_me ? `<button class="btn ghost" id="edit-profile">Profiel bewerken</button><button class="btn ghost" id="logout">Uitloggen</button><button class="btn ghost icon-only" data-nav="settings" title="Instellingen" aria-label="Instellingen">${icon('settings', 18)}</button>` : `<button class="btn ${u.i_follow ? 'ghost' : ''}" id="follow">${u.i_follow ? 'Ontvolgen' : 'Volgen'}</button><button class="btn ghost" id="dm-user" data-dm="${esc(u.username)}">Bericht</button>`}</div><div class="profile-tabs">${tabs}</div><div class="grid">${!loading && posts.length ? posts.map(p => `<div class="grid-item" data-post="${p.id}"><img src="${esc(img(p.img))}" alt="Kiekje" loading="lazy"><div class="grid-over"><span>${icon('heart', 18, true)} ${p.like_count}</span><span>${icon('comment', 18, true)} ${p.comment_count}</span></div></div>`).join('') : `<div class="empty" style="grid-column:1/-1">${empty}</div>`}</div>`;
}
