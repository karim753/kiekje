// Kiekje — auth.js
// Inlog- en registratiescherm.

function auth() {
	root.innerHTML = `<div class="auth"><div><h1>Kiekje.</h1><p>Vastleggen wat het waard is om nooit te vergeten.</p><div style="display:flex;gap:8px;margin-top:10px;justify-content:center"><button class="btn" id="show-login">Inloggen</button><button class="btn ghost" id="show-register">Registreren</button></div><div id="auth-forms" style="margin-top:12px;max-width:320px;margin-left:auto;margin-right:auto"></div></div></div>`;
	const forms = document.getElementById('auth-forms');
	const submit = async (btn, action, data) => {
		btn.disabled = true;
		try {
			const res = await api('auth.php?action=' + action, data);
			syncUser(res.username || data.username);
			checkSession();
		} catch (e) {
			btn.disabled = false;
			alert(e.message);
		}
	};
	function showLogin() {
		forms.innerHTML = `<form class="auth-form" id="login-form"><input id="login-identifier" placeholder="Gebruikersnaam of e-mail" autocomplete="username"><input id="login-password" type="password" placeholder="Wachtwoord" autocomplete="current-password"><button class="btn" style="width:100%;margin-top:6px">Inloggen</button></form>`;
		document.getElementById('login-form').onsubmit = e => {
			e.preventDefault();
			const id = document.getElementById('login-identifier').value.trim(),
				pw = document.getElementById('login-password').value;
			if (!id || !pw) {
				alert('Vul gebruikersnaam/e-mail en wachtwoord in.');
				return;
			}
			submit(e.target.querySelector('button'), 'login', { identifier: id, password: pw });
		};
	}
	function showRegister() {
		forms.innerHTML = `<form class="auth-form" id="register-form"><input id="reg-username" placeholder="Gebruikersnaam" maxlength="30" autocomplete="username"><input id="reg-email" type="email" placeholder="E-mail" autocomplete="email"><input id="reg-password" type="password" placeholder="Wachtwoord (min 8)" autocomplete="new-password"><input id="reg-password2" type="password" placeholder="Herhaal wachtwoord" autocomplete="new-password"><button class="btn" style="width:100%;margin-top:6px">Registreren</button></form>`;
		document.getElementById('register-form').onsubmit = e => {
			e.preventDefault();
			const u = document.getElementById('reg-username').value.trim(),
				em = document.getElementById('reg-email').value.trim(),
				p = document.getElementById('reg-password').value,
				p2 = document.getElementById('reg-password2').value;
			if (!u || !em || p.length < 8) {
				alert('Controleer ingevoerde gegevens (wachtwoord minimaal 8 tekens).');
				return;
			}
			if (p !== p2) {
				alert('Wachtwoorden komen niet overeen.');
				return;
			}
			submit(e.target.querySelector('button'), 'register', { username: u, email: em, password: p });
		};
	}
	document.getElementById('show-login').onclick = showLogin;
	document.getElementById('show-register').onclick = showRegister;
	showLogin();
}
