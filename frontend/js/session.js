// Kiekje — session.js
// Inloggen/uitloggen synchroon houden met de PHP-sessie + oude lokale posts overzetten.

// ---------- sessie ----------
// De PHP-sessie is leidend. Wisselt het account, dan wordt alle geladen data weggegooid.
function syncUser(username) {
	if ((me?.username || null) === (username || null)) return;
	me = username ? { username, bio: '', avatar: null } : null;
	modal = null;
	preview = null;
	editingPost = null;
	viewPostId = null;
	postDetail = null;
	storyIndex = -1;
	feedPosts = null;
	stories = [];
	suggestions = null;
	profileData = null;
	profilePosts = null;
	profileTab = 'posts';
	likedPosts = null;
	notifs = null;
	dmTarget = null;
	dmMessages = [];
	conversations = null;
	dmUnread = 0;
	inboxSearch = '';
	clearInterval(dmPoll);
	dmPoll = null;
	if (!username) {
		tab = 'feed';
		viewUser = null;
	}
	saveUi();
	render();
	if (username) {
		if (tab === 'notifications') notifSeenBefore = ui.seen[username] || '';
		loadTab();
		refreshUnread();
		loadNotifs();
		loadSuggestions();
		migrateLocalPosts();
		const m = location.hash.match(/^#post-(\d+)$/);
		if (m) openPost(+m[1]);
	}
}
async function checkSession() {
	try {
		const res = await api('auth.php?action=me', {});
		syncUser(res.username);
		if (me) {
			me.bio = res.bio || '';
			me.avatar = res.avatar || null;
			avatars[me.username] = me.avatar;
		}
	} catch (e) {
		if (!/verbinding/.test(e.message)) syncUser(null);
		else if (!sessionChecked) toast(e.message);
	}
	if (!sessionChecked) {
		sessionChecked = true;
		if (!me) render();
	}
}
function logout() {
	api('auth.php?action=logout', {})
		.catch(() => {})
		.finally(() => syncUser(null));
}

// Posts die vroeger alleen in localStorage stonden één keer naar het account uploaden
let migrating = false;
async function migrateLocalPosts() {
	if (migrating) return;
	let old;
	try {
		old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
	} catch (e) {
		return;
	}
	if (!old || !Array.isArray(old.posts)) return;
	const owner = me.username;
	const mine = old.posts.filter(
		p => p && p.user === owner && typeof p.img === 'string' && p.img.startsWith('data:image/')
	);
	if (!mine.length) return;
	migrating = true;
	let done = 0;
	for (const p of mine.slice().reverse()) {
		// oudste eerst, zodat de volgorde klopt
		if (me?.username !== owner) break;
		try {
			await api('posts.php', { image: p.img, caption: String(p.caption || '').slice(0, 2200) });
			old.posts = old.posts.filter(x => x !== p);
			done++;
		} catch (e) {
			break;
		}
	}
	try {
		if (old.posts.length) localStorage.setItem(OLD_KEY, JSON.stringify(old));
		else localStorage.removeItem(OLD_KEY);
	} catch (e) {}
	migrating = false;
	if (done) {
		toast(`${done} oude post${done > 1 ? 's' : ''} uit deze browser naar je account gezet.`);
		if (tab === 'feed') loadFeed();
		else if (tab === 'profile') loadProfile();
	}
}
