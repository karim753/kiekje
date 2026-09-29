// Kiekje — events.js
// Koppelt knoppen en invoervelden aan functies na elke render + toetsenbord (Esc, pijltjes).

// ---------- events ----------
function bindProfileLinks(scope) {
	scope.querySelectorAll('.user-link[data-user],.post-user[data-user],.profile-row[data-user]').forEach(
		x =>
			(x.onclick = e => {
				e.stopPropagation();
				goToProfile(x.dataset.user);
			})
	);
}
function openUpload() {
	modal = 'upload';
	preview = null;
	render();
}
function events() {
	const on = (id, fn) => {
		const el = document.getElementById(id);
		if (el) el.onclick = fn;
	};
	const all = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
	all(
		'[data-nav]',
		b =>
			(b.onclick = () => {
				const k = b.dataset.nav;
				if (k === 'new') openUpload();
				else if (k === 'logout') logout();
				else if (k === 'settings') {
					modal = 'settings';
					render();
				} else setTab(k);
			})
	);
	all('.rb-follow', b => (b.onclick = () => followSuggestion(b.dataset.follow, b)));
	// dubbelklik (muis) én dubbeltik (telefoon): zelf de tijd tussen twee tikken meten,
	// want op telefoons komt 'dblclick' niet altijd door
	all('.dbl-like', m => {
		let last = 0;
		m.ondblclick = e => e.preventDefault();
		m.onpointerup = e => {
			if (e.button > 0) return; // alleen linkermuisknop / vinger
			if (e.timeStamp - last < 350) {
				last = 0;
				doubleLike(+m.dataset.id, m);
			} else last = e.timeStamp;
		};
	});
	on('addstory', addStory);
	all('.story-item', x => (x.onclick = () => openStory(+x.dataset.index)));
	bindProfileLinks(root);
	all('[data-post]', x => (x.onclick = () => openPost(+x.dataset.post)));
	all('[data-ptab]', b => (b.onclick = () => setProfileTab(b.dataset.ptab)));
	all('.like', b => (b.onclick = () => toggleLike(+b.dataset.id)));
	all(
		'.comment-like',
		b =>
			(b.onclick = e => {
				e.stopPropagation();
				toggleCommentLike(+b.dataset.pid, +b.dataset.cid);
			})
	);
	all(
		'.comment-delete',
		b =>
			(b.onclick = e => {
				e.stopPropagation();
				deleteComment(+b.dataset.pid, +b.dataset.cid);
			})
	);
	all('.comment-submit', b => (b.onclick = () => addComment(+b.dataset.id, b.previousElementSibling)));
	all(
		'.comment-input',
		i =>
			(i.onkeydown = e => {
				if (e.key === 'Enter') addComment(+i.dataset.id, i);
			})
	);
	all(
		'.comment-focus,.open-comments',
		b =>
			(b.onclick = () => {
				if (b.closest('#viewer')) {
					focusViewerComments();
					return;
				}
				openPost(+b.dataset.id, true);
			})
	);
	all('.share', b => (b.onclick = () => sharePost(+b.dataset.id)));
	all(
		'.menu-toggle',
		b =>
			(b.onclick = e => {
				e.stopPropagation();
				const m = document.getElementById('menu-' + b.dataset.id);
				const open = m.hidden;
				closeMenus();
				m.hidden = !open;
			})
	);
	all(
		'.edit-post',
		b =>
			(b.onclick = () => {
				editingPost = +b.dataset.id;
				modal = 'editPost';
				render();
			})
	);
	all('.delete-post', b => (b.onclick = () => deletePost(+b.dataset.id)));
	all(
		'.stat-button',
		b =>
			(b.onclick = () => {
				const u = profileData;
				if (!u) return;
				const f = b.dataset.kind === 'followers';
				peopleListTitle = f ? `Volgers van ${u.username}` : `${u.username} volgt`;
				peopleListUsers = f ? u.followers : u.following;
				modal = 'peopleList';
				render();
			})
	);
	on('follow', toggleFollow);
	on('dm-user', e => openDm(e.currentTarget.dataset.dm));
	on('edit-profile', () => {
		modal = 'editProfile';
		render();
	});
	on('logout', logout);
	all('.dm-row', r => (r.onclick = () => openDm(r.dataset.dmUser)));
	const ib = document.getElementById('inboxSearch');
	if (ib)
		ib.oninput = () => {
			inboxSearch = ib.value;
			render();
			const i = document.getElementById('inboxSearch');
			i.focus();
			i.setSelectionRange(i.value.length, i.value.length);
		};
	all(
		'.notif-row',
		r =>
			(r.onclick = () => {
				if (r.dataset.postId) openPost(+r.dataset.postId);
				else goToProfile(r.dataset.actor);
			})
	);
	all(
		'.notif-follow',
		b =>
			(b.onclick = e => {
				e.stopPropagation();
				followBack(b.dataset.actor, b);
			})
	);
	on('closeviewer', closeViewer);
	if (viewPostId && focusComments && postDetail) focusViewerComments();
	const viewer = document.getElementById('viewer');
	if (viewer)
		viewer.onclick = e => {
			if (e.target === viewer) closeViewer();
		};
	const back = document.getElementById('back');
	if (modal && !back) return; // venster kon niet getekend worden
	if (modal === 'upload') {
		back.onclick = e => {
			if (e.target === back) {
				modal = null;
				render();
			}
		};
		on('drop', () =>
			pickImage(data => {
				const cap = document.getElementById('caption').value,
					loc = document.getElementById('location').value;
				preview = data;
				render();
				document.getElementById('caption').value = cap;
				document.getElementById('location').value = loc;
			})
		);
		on('cancel', () => {
			modal = null;
			preview = null;
			render();
		});
		on('publish', publish);
	}
	if (modal === 'editProfile') {
		on('cancel', () => {
			modal = null;
			render();
		});
		on('saveprofile', saveProfile);
		on('modal-change-avatar', changeAvatar);
		on('remove-avatar', removeAvatar);
	}
	on('change-avatar', changeAvatar);
	if (modal === 'editPost') {
		on('cancel', () => {
			modal = null;
			render();
		});
		on('savepost', savePostCaption);
	}
	if (modal === 'peopleList') {
		back.onclick = e => {
			if (e.target === back) {
				modal = null;
				render();
			}
		};
		on('closepeople', () => {
			modal = null;
			render();
		});
	}
	if (modal === 'dm') {
		back.onclick = e => {
			if (e.target === back) closeDm();
		};
		on('closedm', closeDm);
		const input = document.getElementById('dm-input');
		let sending = false;
		const send = async () => {
			if (sending) return;
			const text = input.value;
			if (!text.trim()) return;
			sending = true;
			input.value = '';
			if (!(await sendDm(text))) input.value = text;
			sending = false;
			input.focus();
		};
		on('dm-send', send);
		input.onkeydown = e => {
			if (e.key === 'Enter') send();
		};
		scrollDmToEnd();
		input.focus();
		// nieuwe berichten ophalen zolang het gesprek open staat
		clearInterval(dmPoll);
		dmPoll = setInterval(refreshThread, 4000);
	}
	if (modal === 'settings') {
		const sluit = () => {
			modal = null;
			render();
		};
		back.onclick = e => {
			if (e.target === back) sluit();
		};
		on('closesettings', sluit);
		all('input[name="theme"]', r => (r.onchange = () => setTheme(r.value)));
		document.querySelector('input[name="theme"]:checked')?.focus({ preventScroll: true });
	}
	if (modal === 'story') {
		back.onclick = e => {
			if (e.target === back) closeStory();
		};
		on('closestory', closeStory);
		on('storyprev', () => storyGo(-1));
		on('storynext', () => storyGo(1));
		// tikken op de foto: linkerkant (eerste derde) = vorige, de rest = volgende
		const photo = document.querySelector('.story-img');
		if (photo)
			photo.onclick = e => {
				const r = photo.getBoundingClientRect();
				storyGo(e.clientX - r.left < r.width / 3 ? -1 : 1);
			};
		on('storylike', toggleStoryLike);
		on('storydelete', deleteStory);
		on('story-reply-send', sendStoryReply);
		const r = document.getElementById('story-reply');
		if (r)
			r.onkeydown = e => {
				if (e.key === 'Enter') sendStoryReply();
			};
	}
}
document.addEventListener('click', closeMenus);
document.addEventListener('keydown', e => {
	if (!me) return;
	if (e.key === 'Escape') {
		if (modal === 'dm') closeDm();
		else if (modal === 'story') closeStory();
		else if (modal) {
			modal = null;
			render();
		} else if (viewPostId) closeViewer();
		return;
	}
	if (modal === 'story' && document.activeElement?.id !== 'story-reply') {
		if (e.key === 'ArrowRight') storyGo(1);
		if (e.key === 'ArrowLeft') storyGo(-1);
	}
});
