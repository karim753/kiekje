// Kiekje — main.js
// Start van de app: eerste render, sessie controleren, periodiek verversen.

// ---------- start ----------
applyTheme();
// staat het thema op "Automatisch" en verandert het apparaat van licht naar donker (of andersom): meteen meeveranderen
window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
	if (ui.theme === 'auto') {
		applyTheme();
		render();
	}
});
render();
checkSession();
window.addEventListener('focus', () => {
	if (sessionChecked) checkSession();
});
setInterval(() => {
	if (!me) return;
	refreshUnread();
	if (tab === 'messages' && !modal) loadInbox();
}, 15000);
setInterval(() => {
	if (me) loadNotifs();
}, 30000);
