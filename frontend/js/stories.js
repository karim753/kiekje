// Kiekje — stories.js
// Stories: plaatsen, bekijken, liken, verwijderen, reageren via DM + de stories-balk.

// ---------- stories ----------
function addStory() {
	pickImage(async data => {
		toast('Story uploaden...');
		try {
			await api('stories.php', { image: data });
			stories = (await api('stories.php')).stories;
			toast('Story geplaatst!');
			if (tab === 'feed') refreshView();
		} catch (e) {
			toast(e.message);
		}
	});
}
// alle stories van dezelfde gebruiker als stories[i] (de server levert ze per gebruiker bij elkaar aan)
function storiesOfUser(i) {
	const user = stories[i]?.user;
	let start = i;
	while (start > 0 && stories[start - 1].user === user) start--;
	let end = i;
	while (end < stories.length - 1 && stories[end + 1].user === user) end++;
	return { start, end, list: stories.slice(start, end + 1) };
}
function openStory(i) {
	if (!stories[i]) return;
	storyIndex = i;
	modal = 'story';
	render();
}
function closeStory() {
	modal = null;
	storyIndex = -1;
	render();
}
function storyGo(d) {
	const n = storyIndex + d;
	if (n < 0 || n >= stories.length) closeStory();
	else {
		storyIndex = n;
		render();
	}
}
async function toggleStoryLike() {
	const s = stories[storyIndex];
	if (!s) return;
	try {
		const r = await api('stories.php?action=like', { id: s.id });
		s.liked = r.liked;
		s.like_count = r.like_count;
		render();
	} catch (e) {
		toast(e.message);
	}
}
async function deleteStory() {
	const s = stories[storyIndex];
	if (!s || !confirm('Deze story verwijderen?')) return;
	try {
		await api('stories.php?action=delete', { id: s.id });
		stories.splice(storyIndex, 1);
		if (storyIndex >= stories.length) closeStory();
		else render();
		toast('Story verwijderd.');
	} catch (e) {
		toast(e.message);
	}
}
let replying = false;
async function sendStoryReply() {
	const s = stories[storyIndex],
		input = document.getElementById('story-reply');
	const text = input?.value.trim();
	if (!s || !text || replying) return;
	replying = true;
	try {
		await api('messages.php?action=send', { recipient: s.user, text: `📷 Reactie op je story: ${text}` });
		await openDm(s.user);
	} catch (e) {
		toast(e.message);
	} finally {
		replying = false;
	}
}

function storyBar() {
	const groups = [];
	stories.forEach((s, i) => {
		if (!groups.some(g => g.user === s.user))
			groups.push({ user: s.user, first: i, img: s.img, mine: s.mine });
	});
	return `<div class="stories"><div class="story" id="addstory"><div class="story-add">+</div><div class="story-name">Jouw verhaal</div></div>${groups.map(g => `<div class="story story-item" data-index="${g.first}"><div class="story-ring"><img src="${esc(img(g.img))}" alt=""></div><div class="story-name">${g.mine ? 'Jij' : esc(g.user)}</div></div>`).join('')}</div>`;
}
