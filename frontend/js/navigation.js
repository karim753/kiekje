// Kiekje — navigation.js
// Wisselen tussen tabbladen en de data per tabblad laden (feed, profiel, zoeken).

// ---------- data laden ----------
function loadTab() {
	if (tab === 'feed') loadFeed();
	else if (tab === 'profile') loadProfile();
	else if (tab === 'notifications') loadNotifs();
	else if (tab === 'messages') loadInbox();
}
function closeModals() {
	modal = null;
	viewPostId = null;
	postDetail = null;
	storyIndex = -1;
	dmTarget = null;
	clearInterval(dmPoll);
	dmPoll = null;
}
function setTab(t, user) {
	closeModals();
	tab = t;
	viewUser = t === 'profile' && user && user !== me.username ? user : null;
	if (t === 'profile') {
		profileData = null;
		profilePosts = null;
		profileTab = 'posts';
		likedPosts = null;
	}
	if (t === 'notifications') notifSeenBefore = ui.seen[me.username] || '';
	saveUi();
	render();
	window.scrollTo(0, 0);
	loadTab();
}
function goToProfile(name) {
	if (name) setTab('profile', name);
}
async function loadFeed() {
	try {
		const [p, s] = await Promise.all([api('posts.php'), api('stories.php')]);
		feedPosts = p.posts;
		stories = s.stories;
	} catch (e) {
		feedPosts = feedPosts || [];
		toast(e.message);
	}
	if (tab === 'feed' && modal !== 'story') refreshView();
}
async function loadProfile() {
	const name = viewUser || me.username;
	try {
		const [u, p] = await Promise.all([
			api('users.php?user=' + encodeURIComponent(name)),
			api('posts.php?user=' + encodeURIComponent(name))
		]);
		if ((viewUser || me?.username) !== name) return;
		profileData = u.user;
		profilePosts = p.posts;
	} catch (e) {
		profileData = { error: e.message };
	}
	if (tab === 'profile') refreshView();
}
// tabblad op je eigen profiel wisselen; gelikete posts worden elke keer vers opgehaald
async function setProfileTab(t) {
	if (profileTab === t) return;
	profileTab = t;
	if (t === 'liked') likedPosts = null;
	render();
	if (t !== 'liked') return;
	try {
		const p = await api('posts.php?liked=1');
		if (tab === 'profile' && profileTab === 'liked') likedPosts = p.posts;
	} catch (e) {
		likedPosts = [];
		toast(e.message);
	}
	if (tab === 'profile' && profileTab === 'liked') refreshView();
}
