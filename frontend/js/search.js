// Kiekje — search.js
// Zoekpagina als React-component (React 18 + htm, zonder build-stap).
// htm zet `html\`<div>...</div>\`` om naar React.createElement-aanroepen, zodat het leest als JSX.
// De rest van de app tekent HTML-strings; deze pagina wordt door React in #react-search gezet.

const html = htm.bind(React.createElement);
const { useState, useEffect, useRef } = React;

// Profielfoto als React-element (zelfde bron als av() in utils.js)
function Avatar({ name, url, size }) {
	return html`<img
		className="avatar"
		src=${avatarSrc(name, url)}
		alt=""
		style=${{ width: size, height: size }}
	/>`;
}

function UserRow({ user }) {
	const open = () => goToProfile(user.username);
	return html`
		<div
			className="user-row profile-row"
			data-user=${user.username}
			role="button"
			tabIndex="0"
			onClick=${open}
			onKeyDown=${e => e.key === 'Enter' && open()}
		>
			<${Avatar} name=${user.username} url=${user.avatar} size=${42} />
			<div className="info">
				<b>${user.username}</b>
				<div className="small">${user.follower_count} volgers · ${user.post_count} posts</div>
			</div>
		</div>
	`;
}

function SearchSkeleton() {
	return html`${[0, 1, 2].map(
		i =>
			html`<div className="user-row" key=${i} aria-hidden="true">
				<span className="sk sk-av"></span><span className="sk sk-line"></span>
			</div>`
	)}`;
}

function SearchPage({ initialQuery }) {
	const [query, setQuery] = useState(initialQuery);
	const [results, setResults] = useState(null); // null = nog aan het laden
	const [error, setError] = useState(null);
	const inputRef = useRef(null);

	// Zoeken 250 ms nadat je stopt met typen; een oud antwoord mag een nieuwer niet overschrijven
	useEffect(() => {
		searchTerm = query; // onthouden als de pagina opnieuw getekend wordt
		let actueel = true;
		const timer = setTimeout(async () => {
			try {
				const r = await api('users.php?q=' + encodeURIComponent(query.trim()));
				if (actueel) {
					setResults(r.users);
					setError(null);
				}
			} catch (e) {
				if (actueel) setError(e.message);
			}
		}, 250);
		return () => {
			actueel = false;
			clearTimeout(timer);
		};
	}, [query]);

	// cursor achteraan in het zoekveld bij openen
	useEffect(() => {
		const el = inputRef.current;
		if (el && !modal) {
			el.focus();
			el.setSelectionRange(el.value.length, el.value.length);
		}
	}, []);

	let body;
	if (error) body = html`<div className="empty">${error}</div>`;
	else if (results === null) body = html`<${SearchSkeleton} />`;
	else if (!results.length) body = html`<div className="empty">Geen gebruikers gevonden voor "${query}".</div>`;
	else body = results.map(u => html`<${UserRow} key=${u.username} user=${u} />`);

	return html`
		<div className="search">
			<input
				id="searchInput"
				ref=${inputRef}
				value=${query}
				onChange=${e => setQuery(e.target.value)}
				placeholder="🔍 Zoek gebruikers..."
				autoComplete="off"
				aria-label="Zoek gebruikers"
			/>
		</div>
		<div id="search-results">${body}</div>
	`;
}

// ---------- koppeling met de rest van de app ----------
let searchRoot = null;
function searchView() {
	return '<div id="react-search"></div>';
}
// na elke render(): React-component in #react-search zetten
function mountSearch() {
	const el = document.getElementById('react-search');
	if (!el) return;
	searchRoot = ReactDOM.createRoot(el);
	searchRoot.render(html`<${SearchPage} initialQuery=${searchTerm} />`);
}
// vóór elke render(): oude React-boom netjes opruimen (de HTML wordt dan vervangen)
function unmountSearch() {
	if (searchRoot) {
		searchRoot.unmount();
		searchRoot = null;
	}
}
