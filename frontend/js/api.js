// Kiekje — api.js
// Eén centrale functie voor alle verzoeken naar de PHP-API (foutafhandeling, sessie-controle).

// ---------- API ----------
async function api(path, body) {
	const init = { credentials: 'include' };
	if (body !== undefined) {
		init.method = 'POST';
		init.headers = { 'Content-Type': 'application/json' };
		init.body = JSON.stringify(body);
	}
	let res,
		data = null;
	try {
		res = await fetch(API + path, init);
	} catch (e) {
		throw new Error('Geen verbinding met de server.');
	}
	try {
		data = await res.json();
	} catch (e) {}
	if (res.status === 401 && !path.startsWith('auth.php')) {
		syncUser(null);
		throw new Error('Je bent uitgelogd. Log opnieuw in.');
	}
	if (!res.ok || !data || data.success === false || data.error)
		throw new Error((data && data.error) || `Er ging iets mis (fout ${res.status}).`);
	// de server ziet een ander account (bijv. ingelogd in een ander tabblad): overschakelen
	if (data.me && me && data.me !== me.username) {
		checkSession();
		throw new Error('Je bent nu ingelogd als ' + data.me + '.');
	}
	rememberAvatars(data);
	return data;
}
