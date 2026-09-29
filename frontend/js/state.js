// Kiekje — state.js
// Globale toestand van de app (wie is ingelogd, open tabblad, geladen data) + UI-voorkeuren in localStorage.

// Alle gegevens (posts, stories, reacties, likes, volgers, berichten) komen uit de database via de API.
// localStorage bewaart alleen UI-voorkeuren (laatste tabblad, gelezen meldingen).
const API = '../backend/api/';
const OLD_KEY = 'kiekje_state_v2'; // oude lokale opslag, alleen nog gebruikt om oude posts over te zetten
const UI_KEY = 'kiekje_ui_v3';
const root = document.getElementById('root');

let ui = {};
try {
	ui = JSON.parse(localStorage.getItem(UI_KEY) || '{}') || {};
} catch (e) {}
ui.seen = ui.seen || {};
ui.theme = ['light', 'dark'].includes(ui.theme) ? ui.theme : 'auto'; // weergave: auto (volgt apparaat), light, dark
let me = null,
	sessionChecked = false;
let tab = ui.tab || 'feed',
	viewUser = ui.viewUser || null;
let modal = null,
	preview = null,
	editingPost = null,
	viewPostId = null,
	postDetail = null;
let feedPosts = null,
	stories = [],
	profileData = null,
	profilePosts = null,
	searchTerm = ''; // laatste zoekterm (de zoekpagina zelf is een React-component, zie search.js)
let notifs = null,
	notifSeenBefore = '';
let peopleListTitle = '',
	peopleListUsers = [];
let storyIndex = -1;
let dmTarget = null,
	dmMessages = [],
	conversations = null,
	dmUnread = 0,
	dmPoll = null,
	inboxSearch = '';

function saveUi() {
	try {
		localStorage.setItem(UI_KEY, JSON.stringify({ tab, viewUser, seen: ui.seen, theme: ui.theme }));
	} catch (e) {}
}
