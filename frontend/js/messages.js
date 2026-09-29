// Kiekje — messages.js
// Berichten (DM's): gesprekken, ongelezen teller, versturen/ophalen + inbox-weergave.

// ---------- berichten ----------
function dmThreadHtml() {
	const thread = (dmMessages || []).filter(Boolean);
	if (!thread.length) return `<div class="dm-empty">Nog geen berichten. Zeg hallo! 👋</div>`;
	const lastMine = thread.map(m => m.mine).lastIndexOf(true);
	// opeenvolgende berichten van dezelfde afzender vormen één groep met naam (en avatar bij de ander)
	return thread
		.map((m, i) => {
			const first = i === 0 || thread[i - 1].sender !== m.sender;
			const last = i === thread.length - 1 || thread[i + 1].sender !== m.sender;
			const name = m.mine ? 'Jij' : m.sender;
			return `<div class="dm-msg ${m.mine ? 'me' : 'them'} ${first ? 'first' : ''}">${first ? `<div class="dm-sender">${esc(name)}</div>` : ''}<div class="dm-line">${!m.mine ? (last ? av(m.sender, 26) : '<span class="dm-av-gap"></span>') : ''}<div class="dm-bubble ${m.mine ? 'me' : 'them'}" title="${esc(name)} · ${esc(m.created_at || '')}">${esc(m.text)}<span class="dm-time">${dmTime(m.created_at)}</span></div></div>${i === lastMine ? `<div class="dm-seen">${m.read ? 'Gezien' : 'Verzonden'}</div>` : ''}</div>`;
		})
		.join('');
}
function scrollDmToEnd() {
	const t = document.querySelector('.dm-thread');
	if (t) t.scrollTop = t.scrollHeight;
}
async function refreshUnread() {
	if (!me) return;
	try {
		const r = await api('messages.php?action=unread');
		dmUnread = r.unread;
		document.querySelectorAll('.dm-badge').forEach(b => {
			b.textContent = dmUnread;
			b.hidden = !dmUnread;
		});
	} catch (e) {}
}
async function loadInbox() {
	try {
		const r = await api('messages.php?action=conversations');
		conversations = r.conversations;
		dmUnread = conversations.reduce((n, c) => n + c.unread, 0);
	} catch (e) {
		conversations = conversations || [];
	}
	if (tab === 'messages' && !modal) {
		const typing = document.activeElement?.id === 'inboxSearch';
		render();
		if (typing) {
			const i = document.getElementById('inboxSearch');
			i.focus();
			i.setSelectionRange(i.value.length, i.value.length);
		}
	}
}
async function refreshThread() {
	if (modal !== 'dm' || !dmTarget) return;
	try {
		const r = await api('messages.php?action=list&user=' + encodeURIComponent(dmTarget));
		if (modal !== 'dm') return;
		const sig = a => a.map(m => m.id + (m.read ? 'r' : '')).join();
		const changed = sig(r.messages) !== sig(dmMessages);
		dmMessages = r.messages;
		const t = document.querySelector('.dm-thread');
		if (changed && t) {
			t.innerHTML = dmThreadHtml();
			scrollDmToEnd();
		}
	} catch (e) {}
}
async function openDm(user) {
	if (!user) return;
	if (user === me.username) {
		toast('Dit is je eigen account. Je kunt geen bericht naar jezelf sturen.');
		return;
	}
	try {
		const r = await api('messages.php?action=list&user=' + encodeURIComponent(user));
		closeModals();
		dmTarget = user;
		dmMessages = r.messages;
		modal = 'dm';
		render();
		refreshUnread();
	} catch (e) {
		toast(e.message);
	}
}
function closeDm() {
	modal = null;
	dmTarget = null;
	dmMessages = [];
	clearInterval(dmPoll);
	dmPoll = null;
	if (tab === 'messages') loadInbox();
	else render();
}
async function sendDm(text) {
	text = (text || '').trim();
	if (!text || !dmTarget) return false;
	try {
		await api('messages.php?action=send', { recipient: dmTarget, text });
		await refreshThread();
		return true;
	} catch (e) {
		toast(e.message);
		return false;
	}
}

function inbox() {
	const list = conversations;
	if (list === null) return `<div class="empty">Berichten laden...</div>`;
	const q = inboxSearch.trim().toLowerCase();
	const shown = list.filter(c => c.username.toLowerCase().includes(q));
	return `<div class="section-title" style="border-top:0">Berichten</div><div class="search"><input id="inboxSearch" value="${esc(inboxSearch)}" placeholder="🔍 Zoek of start een gesprek (gebruikersnaam)..." autocomplete="off"></div>${shown.map(c => `<div class="user-row dm-row" data-dm-user="${esc(c.username)}">${av(c.username, 46, c.avatar)}<div class="info"><b>${esc(c.username)}</b><div class="small dm-preview ${c.unread ? 'unread' : ''}">${c.last_mine ? 'Jij: ' : ''}${esc(c.last_text)} · ${dmTime(c.created_at)}</div></div>${c.unread ? `<span class="dm-count">${c.unread}</span>` : ''}</div>`).join('')}${q && !list.some(c => c.username.toLowerCase() === q) ? `<div class="user-row dm-row" data-dm-user="${esc(inboxSearch.trim())}"><div class="info"><b>Stuur bericht naar "${esc(inboxSearch.trim())}"</b></div></div>` : ''}${!list.length && !q ? `<div class="empty">Nog geen berichten.<br>Typ hierboven een gebruikersnaam of stuur iemand een bericht via hun profiel of story.</div>` : ''}`;
}
