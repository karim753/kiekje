// Kiekje — posts.js
// Posts: liken, reageren, reacties liken/verwijderen, bewerken, verwijderen, plaatsen, openen, delen.

// ---------- posts ----------
// posts waarvoor een like-verzoek onderweg is (de server wisselt aan/uit, dus nooit twee tegelijk)
const likeBusy = new Set();
function allPostCopies(id) {
	return [...(feedPosts || []), ...(profilePosts || []), ...(postDetail ? [postDetail] : [])].filter(
		p => p.id === id
	);
}
function findPost(id) {
	return allPostCopies(id)[0] || null;
}
async function toggleLike(id) {
	if (likeBusy.has(id)) return;
	likeBusy.add(id);
	try {
		const r = await api('interactions.php?action=like', { post_id: id });
		allPostCopies(id).forEach(p => {
			p.liked = r.liked;
			p.like_count = r.like_count;
		});
		render();
	} catch (e) {
		toast(e.message);
	} finally {
		likeBusy.delete(id);
	}
}
async function addComment(id, input) {
	const t = input?.value.trim();
	if (!t || input.disabled) return;
	input.disabled = true;
	try {
		const r = await api('interactions.php?action=comment', { post_id: id, content: t });
		allPostCopies(id).forEach(p => {
			p.comments = [...(p.comments || []), r.comment];
			p.comment_count++;
		});
		input.value = '';
		if (viewPostId === id) focusComments = true;
		render();
	} catch (e) {
		input.disabled = false;
		toast(e.message);
	}
}
async function toggleCommentLike(pid, cid) {
	try {
		const r = await api('interactions.php?action=comment_like', { comment_id: cid });
		allPostCopies(pid).forEach(p =>
			(p.comments || []).forEach(c => {
				if (c.id === cid) {
					c.liked = r.liked;
					c.like_count = r.like_count;
				}
			})
		);
		render();
	} catch (e) {
		toast(e.message);
	}
}
async function deleteComment(pid, cid) {
	if (!confirm('Deze reactie verwijderen?')) return;
	try {
		await api('interactions.php?action=comment_delete', { comment_id: cid });
		allPostCopies(pid).forEach(p => {
			p.comments = (p.comments || []).filter(c => c.id !== cid);
			p.comment_count = Math.max(0, p.comment_count - 1);
		});
		render();
		toast('Reactie verwijderd.');
		// de feed toont alleen de laatste 3 reacties: opnieuw ophalen zodat er weer 3 staan
		if (tab === 'feed') loadFeed();
		else if (tab === 'profile') loadProfile();
	} catch (e) {
		toast(e.message);
	}
}
async function deletePost(id) {
	if (!confirm('Deze post verwijderen?')) return;
	try {
		await api('posts.php?action=delete', { id });
		const keep = p => p.id !== id;
		if (feedPosts) feedPosts = feedPosts.filter(keep);
		if (profilePosts) profilePosts = profilePosts.filter(keep);
		if (profileData && profileData.is_me) profileData.post_count--;
		if (viewPostId === id) closeViewer();
		else render();
		toast('Post verwijderd.');
	} catch (e) {
		toast(e.message);
	}
}
async function savePostCaption() {
	const caption = document.getElementById('editcaption').value.trim(),
		btn = document.getElementById('savepost');
	btn.disabled = true;
	try {
		await api('posts.php?action=update', { id: editingPost, caption });
		allPostCopies(editingPost).forEach(p => (p.caption = caption));
		modal = null;
		editingPost = null;
		render();
	} catch (e) {
		btn.disabled = false;
		toast(e.message);
	}
}
async function publish() {
	if (!preview) {
		toast('Kies eerst een foto.');
		return;
	}
	const btn = document.getElementById('publish');
	btn.disabled = true;
	btn.textContent = 'Bezig...';
	try {
		const r = await api('posts.php', {
			image: preview,
			caption: document.getElementById('caption').value.trim(),
			location: document.getElementById('location').value.trim()
		});
		modal = null;
		preview = null;
		tab = 'feed';
		viewUser = null;
		saveUi();
		if (feedPosts) feedPosts.unshift(r.post);
		render();
		window.scrollTo(0, 0);
		loadFeed();
	} catch (e) {
		btn.disabled = false;
		btn.textContent = 'Plaatsen';
		toast(e.message);
	}
}
let focusComments = false;
// opent een post; met comments=true direct naar de reacties (lijst onderaan + invoerveld actief)
function openPost(id, comments = false) {
	focusComments = comments;
	viewPostId = id;
	postDetail = findPost(id) ? { ...findPost(id) } : null;
	render();
	api('posts.php?id=' + id)
		.then(r => {
			if (viewPostId === id) {
				postDetail = r.post;
				refreshView();
			}
		})
		.catch(e => {
			if (viewPostId === id) {
				closeViewer();
				toast(e.message);
			}
		});
}
function focusViewerComments() {
	const list = document.querySelector('#viewer .viewer-comments'),
		input = document.querySelector('#viewer .comment-input');
	if (list) list.scrollTop = list.scrollHeight;
	document.querySelector('#viewer .viewer-title')?.scrollIntoView({ block: 'start' });
	input?.focus({ preventScroll: true });
}
function closeViewer() {
	focusComments = false;
	viewPostId = null;
	postDetail = null;
	if (location.hash) history.replaceState(null, '', location.pathname + location.search);
	render();
}
function sharePost(id) {
	const url = location.origin + location.pathname + '#post-' + id;
	(navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
		.then(() => toast('Link naar post gekopieerd.'))
		.catch(() => toast(url));
}
