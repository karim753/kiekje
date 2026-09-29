// Kiekje — main.js
// Start van de app: eerste render, sessie controleren, periodiek verversen.

// ---------- start ----------
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
