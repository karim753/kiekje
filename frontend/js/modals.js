// Kiekje — modals.js
// Vensters: nieuwe post, profiel bewerken, post bewerken, volgerslijst, DM-gesprek, story-viewer.

function modalHtml() {
	if (modal === 'upload')
		return `<div class="modal-backdrop" id="back"><div class="modal"><h3>Nieuw kiekje</h3><div class="drop" id="drop">${preview ? `<img src="${preview}" alt="Voorbeeld">` : 'Klik om een foto te kiezen'}</div><textarea id="caption" placeholder="Schrijf een bijschrift..." maxlength="2200"></textarea><input id="location" placeholder="Locatie (optioneel)" maxlength="100"><div class="modal-actions"><button class="btn ghost" id="cancel">Annuleren</button><button class="btn" id="publish">Plaatsen</button></div></div></div>`;
	if (modal === 'editProfile')
		return `<div class="modal-backdrop" id="back"><div class="modal"><h3>Profiel bewerken</h3><div class="edit-avatar">${av(me.username, 64, me.avatar)}<div><button class="btn ghost" id="modal-change-avatar">Profielfoto wijzigen</button>${me.avatar ? `<button class="text-btn danger" id="remove-avatar">Verwijderen</button>` : ''}</div></div><input id="editname" maxlength="30" value="${esc(me.username)}" placeholder="Gebruikersnaam"><textarea id="editbio" maxlength="160" placeholder="Bio">${esc(me.bio || '')}</textarea><div class="modal-actions"><button class="btn ghost" id="cancel">Annuleren</button><button class="btn" id="saveprofile">Opslaan</button></div></div></div>`;
	if (modal === 'editPost') {
		const p = findPost(editingPost);
		return `<div class="modal-backdrop" id="back"><div class="modal"><h3>Post bewerken</h3><textarea id="editcaption" maxlength="2200">${esc(p?.caption || '')}</textarea><div class="modal-actions"><button class="btn ghost" id="cancel">Annuleren</button><button class="btn" id="savepost">Opslaan</button></div></div></div>`;
	}
	if (modal === 'peopleList') {
		const names = peopleListUsers || [];
		return `<div class="modal-backdrop" id="back"><div class="modal"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${esc(peopleListTitle)}</h3><button class="icon-btn" id="closepeople" aria-label="Sluiten">✕</button></div>${names.length ? names.map(n => `<div class="user-row profile-row" data-user="${esc(n)}">${av(n, 34)}<div class="info"><b>${esc(n)}</b></div></div>`).join('') : `<div class="empty" style="padding:20px 0">Geen gebruikers in deze lijst.</div>`}</div></div>`;
	}
	if (modal === 'dm')
		return `<div class="modal-backdrop" id="back"><div class="modal dm-modal"><div class="dm-head">${av(dmTarget, 34)}<b class="dm-name user-link" data-user="${esc(dmTarget)}">${esc(dmTarget)}</b><button class="icon-btn" id="closedm" style="margin-left:auto" aria-label="Sluiten">✕</button></div><div class="dm-thread">${dmThreadHtml()}</div><div class="dm-compose"><input id="dm-input" placeholder="Typ je bericht..." autocomplete="off" maxlength="2000"><button class="btn" id="dm-send">Verstuur</button></div></div></div>`;
	if (modal === 'settings') {
		const opties = [
			['auto', 'Automatisch', 'Volgt je apparaat'],
			['light', 'Licht', ''],
			['dark', 'Donker', '']
		];
		return `<div class="modal-backdrop" id="back"><div class="modal" role="dialog" aria-label="Instellingen"><div class="modal-head"><h3>Instellingen</h3><button class="icon-btn" id="closesettings" aria-label="Sluiten">✕</button></div><div class="set-label">Weergave</div><div class="theme-options" role="radiogroup" aria-label="Weergave">${opties.map(([v, label, uitleg]) => `<label class="theme-opt ${ui.theme === v ? 'on' : ''}"><input type="radio" name="theme" value="${v}" ${ui.theme === v ? 'checked' : ''}><span class="theme-prev theme-prev-${v}"><i></i><i></i><i></i></span><b>${label}</b><small>${uitleg}</small></label>`).join('')}</div><div class="set-hint">Je keuze wordt in deze browser onthouden.</div></div></div>`;
	}
	if (modal === 'story') {
		const s = stories[storyIndex],
			g = storiesOfUser(storyIndex);
		if (!s) return '';
		return `<div class="story-viewer" id="back"><div class="story-frame"><div class="story-bars">${g.list.map((x, i) => `<span class="${g.start + i <= storyIndex ? 'done' : ''}"></span>`).join('')}</div><div class="story-top">${av(s.user, 32, s.avatar)}<b class="story-owner user-link" data-user="${esc(s.user)}">${esc(s.user)}</b><span class="small">${relTime(s.created_at)}</span><button class="icon-btn" id="closestory" style="margin-left:auto" aria-label="Sluiten">✕</button></div><img class="story-img" src="${esc(img(s.img))}" alt="Story van ${esc(s.user)}"><button class="story-nav prev" id="storyprev" ${storyIndex > 0 ? '' : 'hidden'} aria-label="Vorige">‹</button><button class="story-nav next" id="storynext" ${storyIndex < stories.length - 1 ? '' : 'hidden'} aria-label="Volgende">›</button><div class="story-bottom">${s.mine ? `<div class="story-stats">♥ ${s.like_count} vind-ik-leuks${s.likers.length ? `<div class="small">${s.likers.map(esc).join(', ')}</div>` : ''}</div><button class="icon-btn danger" id="storydelete" title="Verwijderen">🗑</button>` : `<input id="story-reply" placeholder="Reageer op ${esc(s.user)}..." autocomplete="off" maxlength="1900"><button class="icon-btn" id="story-reply-send" title="Verstuur als DM">➤</button><button class="icon-btn story-like ${s.liked ? 'liked' : ''}" id="storylike" title="Vind ik leuk">${s.liked ? '♥' : '♡'}</button>`}</div></div></div>`;
	}
	return '';
}
