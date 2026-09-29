// Kiekje — feed.js
// Feed-weergave: postkaarten, reacties, reactievenster, dubbelklik-like, laad-placeholders.

// dubbelklik/-tik op een foto: liken met hartjes-animatie (nooit un-liken, zoals Instagram)
async function doubleLike(id, wrap) {
	const pop = document.createElement('span');
	pop.className = 'heart-pop';
	pop.innerHTML = icon('heart', 96, true);
	wrap.appendChild(pop);
	const done = new Promise(r => setTimeout(r, 800));
	const p = findPost(id);
	if (p && !p.liked && !likeBusy.has(id)) {
		likeBusy.add(id);
		try {
			const r = await api('interactions.php?action=like', { post_id: id });
			allPostCopies(id).forEach(x => {
				x.liked = r.liked;
				x.like_count = r.like_count;
			});
		} catch (e) {
			toast(e.message);
		} finally {
			likeBusy.delete(id);
		}
	}
	await done;
	pop.remove();
	render();
}
const SKELETON = `<div class="post skeleton" aria-hidden="true"><div class="post-head"><span class="sk sk-av"></span><span class="sk sk-line"></span></div><div class="sk sk-media"></div><div class="sk sk-line" style="margin:14px;width:45%"></div><div class="sk sk-line" style="margin:0 14px;width:70%"></div></div>`;

function feed() {
	if (feedPosts === null) return storyBar() + SKELETON.repeat(2);
	return (
		storyBar() +
		(feedPosts.length
			? feedPosts.map(postCard).join('')
			: `<div class="empty">Nog geen kiekjes geplaatst.<br>Druk op Maken om de eerste te plaatsen.</div>`)
	);
}
function postActions(p) {
	return `<div class="post-actions"><button class="like ${p.liked ? 'liked' : ''}" data-id="${p.id}" aria-label="${p.liked ? 'Niet meer leuk vinden' : 'Vind ik leuk'}">${icon('heart', 24, p.liked)}</button><button class="comment-focus" data-id="${p.id}" aria-label="Reacties bekijken">${icon('comment')}</button><button class="share" data-id="${p.id}" aria-label="Delen">${icon('share')}</button></div><div class="post-likes">${p.like_count === 1 ? '1 vind-ik-leuk' : `${p.like_count} vind-ik-leuks`}</div>`;
}
// reactie met like-knop; verwijderen mag bij je eigen reactie of onder je eigen post
function commentHtml(c, p) {
	const canDel = c.user === me.username || p.user === me.username;
	return `<div class="comment-item"><div class="comment-body"><b class="user-link" data-user="${esc(c.user)}">${esc(c.user)}</b>${esc(c.text)}${c.like_count ? `<span class="comment-meta">${c.like_count} ${c.like_count === 1 ? 'like' : 'likes'}</span>` : ''}</div><div class="comment-tools">${canDel ? `<button class="comment-delete" data-cid="${c.id}" data-pid="${p.id}" title="Reactie verwijderen" aria-label="Reactie verwijderen">${icon('trash', 14)}</button>` : ''}<button class="comment-like ${c.liked ? 'liked' : ''}" data-cid="${c.id}" data-pid="${p.id}" title="Vind ik leuk" aria-label="Reactie leuk vinden">${icon('heart', 14, c.liked)}</button></div></div>`;
}
function commentBox(id) {
	return `<div class="comment-box"><input class="comment-input" data-id="${id}" placeholder="Voeg een reactie toe..." maxlength="500"><button class="comment-submit" data-id="${id}">Plaats</button></div>`;
}
function postCard(p) {
	const mine = p.user === me.username,
		shown = (p.comments || []).slice(-3);
	return `<article class="post"><div class="post-head">${av(p.user, 36, p.avatar)}<div class="post-meta"><div><span class="post-user" data-user="${esc(p.user)}">${esc(p.user)}</span><span class="post-when"> • ${relTime(p.created_at)}</span></div>${p.loc ? `<div class="post-loc">${esc(p.loc)}</div>` : ''}</div>${mine ? `<div class="menu"><button class="icon-btn menu-toggle" data-id="${p.id}" aria-label="Opties">${icon('more', 22)}</button><div class="menu-box" id="menu-${p.id}" hidden><button class="edit-post" data-id="${p.id}">Bewerken</button><button class="delete-post danger" data-id="${p.id}">Verwijderen</button></div></div>` : ''}</div><div class="media-wrap dbl-like" data-id="${p.id}" title="Dubbelklik om te liken"><img class="post-media" src="${esc(img(p.img))}" alt="Kiekje van ${esc(p.user)}" loading="lazy" draggable="false"></div>${postActions(p)}${p.caption ? `<div class="post-caption"><b>${esc(p.user)}</b>${esc(p.caption)}</div>` : ''}${p.comment_count ? `<div class="post-more open-comments" data-id="${p.id}">${p.comment_count === 1 ? 'Bekijk 1 reactie' : `Bekijk alle ${p.comment_count} reacties`}</div>` : ''}${shown.map(c => commentHtml(c, p)).join('')}${commentBox(p.id)}</article>`;
}
function postViewer() {
	const p = postDetail;
	const close = `<button class="icon-btn" id="closeviewer" aria-label="Sluiten">✕</button>`;
	if (!p)
		return `<div class="modal-backdrop" id="viewer"><div class="modal"><div style="display:flex;justify-content:flex-end">${close}</div><div class="empty">Laden...</div></div></div>`;
	return `<div class="modal-backdrop" id="viewer"><div class="modal"><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:10px">${av(p.user, 30, p.avatar)}<b class="user-link" data-user="${esc(p.user)}">${esc(p.user)}</b></div>${close}</div><img src="${esc(img(p.img))}" style="width:100%;margin-top:10px" alt="Kiekje van ${esc(p.user)}">${postActions(p)}${p.caption ? `<div class="post-caption"><b>${esc(p.user)}</b>${esc(p.caption)}</div>` : ''}<div class="section-title viewer-title">Reacties${p.comment_count ? ` (${p.comment_count})` : ''}</div><div class="viewer-comments">${(p.comments || []).length ? p.comments.map(c => commentHtml(c, p)).join('') : `<div class="small">Nog geen reacties. Wees de eerste!</div>`}</div><div class="post-time" style="padding:4px 0">${relTime(p.created_at)}</div>${commentBox(p.id)}</div></div>`;
}
