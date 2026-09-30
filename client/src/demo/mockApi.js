// UniConnect DEMO backend: serves /api/* from demo-data.json inside the browser.
// Used only when VITE_DEMO=true (see axios.js). Writes persist in localStorage.
import { AxiosError } from 'axios'
import seed from './demo-data.json'

// The ONE account that can log in. Change here if you want a different one.
export const DEMO_USER = { username: '2420924', password: 'demo1234' }
const KEY = 'uc_demo_db_v1'
let db
function load() {
  try { const s = localStorage.getItem(KEY); if (s) { db = JSON.parse(s); return } } catch { /* ignore */ }
  db = JSON.parse(JSON.stringify(seed))
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* quota */ } }
load()

export function resetDemo() {
  try { localStorage.removeItem(KEY); localStorage.removeItem('token'); localStorage.removeItem('user') } catch { /* */ }
  location.reload()
}

// ───────── helpers ─────────
const now = () => new Date().toISOString()
const nextId = (t) => Math.max(0, ...db[t].map((r) => r.id || 0)) + 1
const byId = (t, id) => db[t].find((r) => String(r.id) === String(id))
const GHOST = { name: 'Deleted user', username: 'deleted', role: 'student', profile_picture: '' }
const usr = (id) => byId('users', id) || GHOST
const pic = (u) => (u && u.profile_picture) || ''
const studies = (uid) => db.profile_studies.find((p) => String(p.user_id) === String(uid)) || {}
const round1 = (n) => Math.round(n * 10) / 10
const paginate = (rows, q) => {
  const page = Math.max(parseInt(q.page) || 1, 1), limit = Math.max(parseInt(q.limit) || 10, 1)
  return { rows: rows.slice((page - 1) * limit, page * limit), pagination: { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) } }
}
const desc = (a, b) => String(b.created_at).localeCompare(String(a.created_at))
const asc = (a, b) => String(a.created_at).localeCompare(String(b.created_at))
class HttpError { constructor(status, data) { this.status = status; this.data = data } }
const fail = (status, message, extra = {}) => { throw new HttpError(status, { message, ...extra }) }

const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
const makeToken = (u) => `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: u.id, email: u.email, role: u.role, exp: Math.floor(Date.now() / 1000) + 7 * 86400 })}.demo`
function tokenUserId(auth) {
  try {
    let t = auth ? String(auth).replace(/^Bearer\s+/i, '') : null
    if (!t || t === 'null' || t === 'undefined') t = localStorage.getItem('token')
    if (!t) return null
    const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return p.id
  } catch { return null }
}
const authUser = (u) => ({ id: u.id, name: u.name, email: u.email, username: u.username, role: u.role, is_onboarded: u.is_onboarded })
const brief = (u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, profile_picture: pic(u) })

// ───────── formatters ─────────
function commentTree(postId) {
  const rows = db.comments.filter((c) => c.post_id == postId).sort(asc)
  const map = {}, top = []
  for (const r of rows) {
    const u = usr(r.user_id)
    map[r.id] = { id: r.id, content: r.content, created_at: r.created_at, parent_id: r.parent_id,
      user: { id: u.id, name: u.name, username: u.username, role: u.role, profile_picture: pic(u) }, replies: [] }
  }
  for (const id in map) { const c = map[id]; if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(c); else if (!c.parent_id) top.push(c) }
  return top
}
function fmtPost(p, uid) {
  const u = usr(p.user_id), ps = studies(p.user_id)
  const likes = db.likes.filter((l) => l.post_id == p.id), mine = likes.find((l) => l.user_id == uid)
  const cnt = {}; likes.forEach((l) => { cnt[l.reaction] = (cnt[l.reaction] || 0) + 1 })
  return { ...p, username: u.username, name: u.name, role: u.role, profile_picture: pic(u),
    author_year: ps.academic_year, author_track: ps.track, likes: likes.length,
    comments_count: db.comments.filter((c) => c.post_id == p.id).length, liked: !!mine,
    comments: commentTree(p.id), my_reaction: mine ? mine.reaction : null,
    reaction_types: Object.entries(cnt).sort((a, b) => b[1] - a[1]).map((e) => e[0]) }
}
const fmtGroup = (g, uid, me) => {
  const c = usr(g.creator_id), mem = db.group_members.find((m) => m.group_id == g.id && m.user_id == uid)
  return { ...g, audience: null, members_count: db.group_members.filter((m) => m.group_id == g.id).length,
    is_member: !!mem, my_role: mem ? mem.role : null, creator_name: c.name, creator_username: c.username,
    is_group_admin: !!(mem && mem.role === 'admin') || (me && me.role === 'admin') }
}
const fmtFile = (f, uid) => {
  const u = usr(f.uploader_id)
  const likes = db.file_likes.filter((l) => l.file_id == f.id), rs = db.file_ratings.filter((r) => r.file_id == f.id)
  return { ...f, uploader_username: u.username, uploader_name: u.name, likes_count: likes.length,
    comments_count: db.file_comments.filter((c) => c.file_id == f.id).length,
    avg_rating: rs.length ? round1(rs.reduce((s, r) => s + r.rating, 0) / rs.length) : null,
    liked_by_me: likes.some((l) => l.user_id == uid) }
}
const fmtCourse = (c) => {
  const d = usr(c.doctor_id)
  return { id: c.id, course_code: c.course_code, title: c.title, description: c.description, academic_year: c.academic_year,
    track: c.track, semester: c.semester, doctor_id: c.doctor_id, created_at: c.created_at, doctor_name: d.name || null,
    doctor_username: d.username || null, doctor_picture: pic(d), materials_count: db.files.filter((f) => f.course_id == c.id).length }
}
const fmtProject = (p) => {
  const u = usr(p.creator_id), d = usr(p.supervisor_id)
  return { ...p, creator_name: u.name, profile_picture: pic(u), supervisor_name: d.name || null,
    members_count: db.project_members.filter((m) => m.project_id == p.id).length,
    interest_count: db.project_interests.filter((i) => i.project_id == p.id).length }
}
const fmtNotif = (n) => {
  const s = usr(n.sender_id)
  return { ...n, sender_username: s.username || null, sender_name: s.name || null, sender_role: s.role || null, sender_avatar: s.profile_picture || null }
}
function profileOf(uid, viewer) {
  const u = byId('users', uid); if (!u) fail(404, 'User not found')
  const ps = studies(uid)
  return { id: u.id, name: u.name, username: u.username, role: u.role, bio: u.bio || '', profile_picture: pic(u),
    faculty: ps.faculty || null, major: ps.major || null, academic_year: ps.academic_year || null,
    followers: db.followers.filter((f) => f.following_id == uid).length,
    following: db.followers.filter((f) => f.follower_id == uid).length,
    groups: db.group_members.filter((m) => m.user_id == uid).length,
    uploadedFiles: db.files.filter((f) => f.uploader_id == uid).length,
    posts: db.posts.filter((p) => p.user_id == uid).sort(desc).map((p) => ({ ...fmtPost(p, viewer.id), comments: [] })) }
}
const notify = (userId, senderId, type, refId, message) => {
  if (!userId || userId == senderId) return
  db.notifications.push({ id: nextId('notifications'), user_id: userId, sender_id: senderId, type, reference_id: refId, message, is_read: 0, created_at: now(), reference_comment_id: null })
}

// ───────── routes ─────────
const routes = []
const R = (method, prefixes, pattern, fn, pub = false) => {
  for (const pre of [].concat(prefixes)) {
    const keys = []
    const re = new RegExp('^' + (pre + pattern).replace(/:([A-Za-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '/?$')
    routes.push({ method, re, keys, fn, pub })
  }
}
const okMsg = (message) => ({ message })

// AUTH
const A = '/auth'
R('POST', A, '/login', ({ b }) => {
  const id = String(b.identifier || b.email || '').trim().toLowerCase()
  if (!id || !b.password) fail(400, 'Academic ID / email and password are required')
  const u = db.users.find((x) => x.username === DEMO_USER.username)
  const isDemo = id === DEMO_USER.username.toLowerCase() || id === String(u.email).toLowerCase()
  if (!u || !isDemo || b.password !== DEMO_USER.password) fail(401, `Demo mode: log in with username ${DEMO_USER.username} and password ${DEMO_USER.password}`, { code: 'invalid_credentials' })
  return { message: 'Login successful', token: makeToken(u), user: authUser(u) }
}, true)
R('POST', A, '/register', () => fail(403, `Registration is disabled in the demo. Log in with username ${DEMO_USER.username} and password ${DEMO_USER.password}`), true)
R('POST', A, '/complete-registration', ({ me, b }) => { Object.assign(me, { is_onboarded: me.is_onboarded }); save(); return { status: 'approved', token: makeToken(me), user: authUser(me) } })
R('POST', A, '/onboarding-complete', ({ me }) => { me.is_onboarded = 1; save(); return { success: true } })
R('POST', A, '/google', () => fail(400, 'Google sign-in is disabled in the demo. Use a demo account.'), true)
for (const p of ['/google/reset', '/google/link', '/google/unlink']) R('POST', A, p, () => fail(400, 'Google sign-in is disabled in the demo.'), true)
R('GET', A, '/google/status', () => ({ linked: false }))
for (const p of ['/forgot-password', '/verify-otp', '/reset-password']) R('POST', A, p, () => ({ success: true, message: 'Demo mode: password reset is disabled.' }), true)
R('GET', A, '/profile', ({ me }) => {
  const ps = studies(me.id)
  return { success: true, user: { id: me.id, name: me.name, username: me.username, email: me.email, profile_picture: me.profile_picture, bio: me.bio, phone_number: me.phone_number,
    role: me.role, is_active: me.is_active, created_at: me.created_at, faculty: ps.faculty, major: ps.major, academic_year: ps.academic_year,
    phone: me.phone_number, year: ps.academic_year, skills: db.user_skills.filter((s) => s.user_id == me.id).map((s) => (byId('skills', s.skill_id) || {}).name).filter(Boolean) } }
})
R('PUT', A, '/profile', ({ me, b }) => { for (const k of ['name', 'bio', 'profile_picture']) if (b[k] !== undefined) me[k] = b[k]; if (b.phone !== undefined) me.phone_number = b.phone; save(); return { success: true, message: 'Profile updated successfully' } })
R('PUT', A, '/profile/change-password', ({ me, b }) => { if (b.currentPassword && b.currentPassword !== me.password) fail(400, 'Current password is incorrect'); if (b.newPassword) me.password = b.newPassword; save(); return { success: true, message: 'Password changed successfully' } })

// USERS
const U = '/users'
R('GET', U, '/me', ({ me }) => { const ps = studies(me.id), dp = db.doctor_profiles.find((d) => d.user_id == me.id) || {}
  return { user: { id: me.id, name: me.name, username: me.username, email: me.email, role: me.role, phone_number: me.phone_number, profile_picture: me.profile_picture, bio: me.bio,
    faculty: ps.faculty, major: ps.major, academic_year: ps.academic_year, track: ps.track, academic_id: ps.academic_id, doctor_specialization: dp.specialization, doctor_faculty: dp.faculty } } })
R('GET', U, '/search', ({ q, me }) => {
  const t = String(q.q || '').trim().toLowerCase(); if (!t) return { data: [] }
  return { data: db.users.filter((u) => u.id !== me.id && (String(u.name).toLowerCase().includes(t) || String(u.username).toLowerCase().includes(t)))
    .map((u) => ({ ...brief(u), is_following: db.followers.some((f) => f.follower_id == me.id && f.following_id == u.id) })) }
})
const followList = (which) => ({ p, me }) => ({ data: db.followers.filter((f) => which === 'followers' ? f.following_id == p.id : f.follower_id == p.id)
  .map((f) => byId('users', which === 'followers' ? f.follower_id : f.following_id)).filter(Boolean)
  .map((u) => ({ ...brief(u), is_following: db.followers.some((f) => f.follower_id == me.id && f.following_id == u.id) })) })
R('GET', U, '/:id/followers', followList('followers'))
R('GET', U, '/:id/following', followList('following'))
R('GET', U, '', () => ({ message: 'Users fetched successfully', data: db.users.map(({ id, username, name, email, role }) => ({ id, username, name, email, role })) }))
R('GET', U, '/:id', ({ p }) => { const u = byId('users', p.id); if (!u) fail(404, 'User not found'); return { message: 'User found', data: { id: u.id, username: u.username, name: u.name, email: u.email, role: u.role } } })
R('PUT', U, '/:id/profile', ({ me, b }) => { for (const k of ['name', 'bio', 'profile_picture']) if (b[k] !== undefined) me[k] = b[k]; save(); return okMsg('Profile updated successfully') })
R('PUT', U, '/:id', ({ me, b }) => { for (const k of ['name', 'bio', 'profile_picture']) if (b[k] !== undefined) me[k] = b[k]; save(); return okMsg('User updated successfully') })
R('GET', ['/profile'], '', ({ me }) => profileOf(me.id, me))
R('GET', ['/profile'], '/:id', ({ p, me }) => { const u = db.users.find((x) => String(x.id) === p.id || x.username === p.id); if (!u) fail(404, 'User not found'); return profileOf(u.id, me) })

// POSTS / COMMENTS / LIKES
const P = '/posts'
R('GET', P, '/user/:userId', ({ p, me }) => ({ message: 'Posts fetched', data: db.posts.filter((x) => x.user_id == p.userId).sort(desc).map((x) => fmtPost(x, me.id)) }))
R('GET', P, '', ({ me }) => ({ message: 'Posts fetched successfully', data: [...db.posts].sort(desc).map((x) => fmtPost(x, me.id)) }))
R('GET', P, '/:id', ({ p, me }) => { const x = byId('posts', p.id); if (!x) fail(404, 'Post not found'); return { data: fmtPost(x, me.id) } })
R('POST', P, '', ({ me, b }) => {
  const x = { id: nextId('posts'), user_id: me.id, title: b.title || '', content: b.content || '', image_url: b.image_url || null, post_type: b.post_type || 'general', created_at: now(), updated_at: now(), academic_year: null, track: null }
  db.posts.push(x); save(); return [201, { message: 'Post created successfully', data: fmtPost(x, me.id) }]
})
R('PUT', P, '/:id', ({ p, b }) => { const x = byId('posts', p.id); if (x) { Object.assign(x, { title: b.title ?? x.title, content: b.content ?? x.content, updated_at: now() }); save() } return okMsg('Post updated successfully') })
R('DELETE', P, '/:id', ({ p }) => { db.posts = db.posts.filter((x) => x.id != p.id); db.comments = db.comments.filter((c) => c.post_id != p.id); db.likes = db.likes.filter((l) => l.post_id != p.id); save(); return okMsg('Post deleted successfully') })
const C = '/comments'
R('GET', C, '/:postId', ({ p }) => ({ message: 'Comments fetched', data: commentTree(p.postId) }))
R('POST', C, '', ({ me, b }) => {
  const post_id = b.post_id ?? b.postId
  const c = { id: nextId('comments'), user_id: me.id, post_id: Number(post_id), content: String(b.content || '').trim(), parent_id: b.parent_id || null, created_at: now() }
  if (!c.content) fail(400, 'Content is required')
  db.comments.push(c); const post = byId('posts', post_id); if (post) notify(post.user_id, me.id, 'comment', post.id, `${me.name} commented on your post`); save()
  return [201, { id: c.id, post_id: c.post_id, content: c.content, created_at: c.created_at, parent_id: c.parent_id, replies: [], user: brief(me) }]
})
R('PUT', C, '/:id', ({ p, b }) => { const c = byId('comments', p.id); if (c) { c.content = String(b.content || '').trim(); save() } return { message: 'Comment updated', content: String(b.content || '').trim() } })
R('DELETE', C, '/:id', ({ p }) => { db.comments = db.comments.filter((c) => c.id != p.id && c.parent_id != p.id); save(); return okMsg('Comment deleted') })
const L = ['/likes', '/like']
R('POST', L, '', ({ me, b }) => {
  const post_id = Number(b.post_id ?? b.postId), reaction = b.reaction || 'like'
  const ex = db.likes.find((l) => l.post_id === post_id && l.user_id == me.id)
  let liked = true, myReaction = reaction
  if (ex && ex.reaction === reaction) { db.likes = db.likes.filter((l) => l !== ex); liked = false; myReaction = null }
  else if (ex) ex.reaction = reaction
  else { db.likes.push({ id: nextId('likes'), user_id: me.id, post_id, created_at: now(), reaction }); const post = byId('posts', post_id); if (post) notify(post.user_id, me.id, 'like', post_id, `${me.name} reacted to your post`) }
  save()
  const f = fmtPost(byId('posts', post_id) || { id: post_id, user_id: me.id }, me.id)
  return { message: liked ? 'Reacted' : 'Removed', liked, likes: f.likes, reaction: myReaction, reaction_types: f.reaction_types }
})
R('GET', L, '/:postId', ({ p }) => ({ post_id: p.postId, likes: db.likes.filter((l) => l.post_id == p.postId).length }))

// FOLLOW
const F = ['/follow', '/followers', '/follows']
R('POST', F, '', ({ me, b }) => {
  const target = Number(b.following_id ?? b.user_id ?? b.userId)
  const ex = db.followers.find((f) => f.follower_id == me.id && f.following_id === target)
  if (ex) { db.followers = db.followers.filter((f) => f !== ex); save(); return okMsg('Unfollowed') }
  db.followers.push({ id: nextId('followers'), follower_id: me.id, following_id: target, created_at: now() }); notify(target, me.id, 'follow', me.id, `${me.name} started following you`); save(); return okMsg('Followed')
})
R('GET', F, '/is-following/:userId', ({ p, me }) => ({ isFollowing: db.followers.some((f) => f.follower_id == me.id && f.following_id == p.userId) }))
R('GET', F, '/followers/:userId', ({ p }) => ({ user_id: p.userId, followers: db.followers.filter((f) => f.following_id == p.userId).length }))
R('GET', F, '/following/:userId', ({ p }) => ({ user_id: p.userId, following: db.followers.filter((f) => f.follower_id == p.userId).length }))

// NOTIFICATIONS
const N = '/notifications'
R('GET', N, '/unread', ({ me }) => ({ message: 'Unread notifications fetched', data: db.notifications.filter((n) => n.user_id == me.id && !n.is_read).sort(desc).map(fmtNotif) }))
R('GET', N, '', ({ me }) => ({ message: 'Notifications fetched', data: db.notifications.filter((n) => n.user_id == me.id).sort(desc).map(fmtNotif) }))
R('PATCH', N, '/read-all', ({ me }) => { db.notifications.forEach((n) => { if (n.user_id == me.id) n.is_read = 1 }); save(); return okMsg('All notifications marked as read') })
R('PATCH', N, '/:id/read', ({ p }) => { const n = byId('notifications', p.id); if (n) { n.is_read = 1; save() } return okMsg('Notification marked as read') })
R('DELETE', N, '/:id', ({ p }) => { db.notifications = db.notifications.filter((n) => n.id != p.id); save(); return okMsg('Notification deleted') })

// GROUPS
const G = '/groups'
R('GET', G, '/admin/pending', () => ({ data: db.groups.filter((g) => g.status === 'pending').map((g) => ({ ...g, audience: null, creator_name: (usr(g.creator_id)).name, creator_username: (usr(g.creator_id)).username })) }))
R('POST', G, '/admin/:id/approve', ({ p }) => { const g = byId('groups', p.id); if (g) { g.status = 'approved'; save() } return okMsg('Group approved') })
R('POST', G, '/admin/:id/reject', ({ p }) => { db.groups = db.groups.filter((g) => g.id != p.id); save(); return okMsg('Group rejected') })
R('GET', G, '/my-groups', ({ me }) => ({ message: 'My groups fetched', data: db.groups.filter((g) => db.group_members.some((m) => m.group_id == g.id && m.user_id == me.id)).sort(desc).map((g) => ({ ...g, members_count: db.group_members.filter((m) => m.group_id == g.id).length })) }))
R('GET', G, '', ({ me, uid }) => ({ message: 'Groups fetched', data: db.groups.filter((g) => g.status === 'approved').sort(desc).map((g) => fmtGroup(g, uid, me)) }))
R('POST', G, '', ({ me, b }) => {
  if (!b.name || !b.description) fail(400, 'Name and description are required')
  const status = me.role === 'student' ? 'pending' : 'approved'
  const g = { id: nextId('groups'), creator_id: me.id, name: b.name, description: b.description, group_image: b.group_image || null, is_private: 0, created_at: now(), academic_year: null, track: null, status }
  db.groups.push(g); db.group_members.push({ group_id: g.id, user_id: me.id, role: 'admin', joined_at: now() }); save()
  return [201, { message: status === 'pending' ? 'submitted_for_review' : 'created', status, groupId: g.id }]
})
const join = ({ p, b, me }) => {
  const gid = Number(b.group_id || p.id); if (!gid) fail(400, 'group_id is required')
  if (db.group_members.some((m) => m.group_id == gid && m.user_id == me.id)) fail(400, 'Already joined this group')
  db.group_members.push({ group_id: gid, user_id: me.id, role: 'member', joined_at: now() }); save(); return okMsg('Joined group successfully')
}
const leave = ({ p, b, me }) => {
  const gid = Number(b.group_id || p.id)
  if (!db.group_members.some((m) => m.group_id == gid && m.user_id == me.id)) fail(400, 'You are not a member of this group')
  db.group_members = db.group_members.filter((m) => !(m.group_id == gid && m.user_id == me.id)); save(); return okMsg('Left group successfully')
}
R('POST', G, '/join', join); R('DELETE', G, '/leave', leave)
R('POST', G, '/:id/join', join); R('DELETE', G, '/:id/leave', leave)
R('GET', G, '/:id/members', ({ p }) => ({ message: 'Group members fetched', data: db.group_members.filter((m) => m.group_id == p.id).sort((a, b) => (b.role > a.role ? 1 : -1) || asc({ created_at: a.joined_at }, { created_at: b.joined_at }))
  .map((m) => { const u = usr(m.user_id); return { id: u.id, username: u.username, name: u.name, profile_picture: u.profile_picture, role: m.role, joined_at: m.joined_at } }) }))
R('GET', G, '/:id/posts', ({ p, uid }) => ({ data: db.group_posts.filter((x) => x.group_id == p.id).sort((a, b) => (b.is_pinned - a.is_pinned) || desc(a, b)).map((x) => { const u = usr(x.user_id); return { id: x.id, content: x.content, post_type: x.post_type, is_pinned: x.is_pinned, is_edited: x.is_edited, created_at: x.created_at, user_id: x.user_id, name: u.name, username: u.username, profile_picture: pic(u), role: u.role, likes: db.group_post_likes.filter((l) => l.post_id == x.id).length, liked: db.group_post_likes.some((l) => l.post_id == x.id && l.user_id == uid) } }) }))
R('POST', G, '/:id/posts', ({ p, me, b }) => { const x = { id: nextId('group_posts'), group_id: Number(p.id), user_id: me.id, content: b.content || '', image: null, created_at: now(), updated_at: now(), is_pinned: 0, post_type: b.post_type || 'discussion', is_edited: 0 }; db.group_posts.push(x); save(); return [201, { message: 'Posted', data: x }] })
R('GET', G, '/:id/files', ({ p, uid }) => ({ data: db.files.filter((f) => f.group_id == p.id).sort(desc).map((f) => fmtFile(f, uid)) }))
R('GET', G, '/:id/questions', ({ p }) => ({ data: db.group_questions.filter((q) => q.group_id == p.id).sort(desc).map((q) => ({ id: q.id, title: q.title, body: q.body, is_edited: q.is_edited, created_at: q.created_at, asker_id: q.asker_id, asker_name: (usr(q.asker_id)).name, answer_count: db.group_answers.filter((a) => a.question_id == q.id).length, solved: db.group_answers.some((a) => a.question_id == q.id && a.is_best) })) }))
R('POST', G, '/:id/questions', ({ p, me, b }) => { const q = { id: nextId('group_questions'), group_id: Number(p.id), asker_id: me.id, title: b.title || '', body: b.body || '', is_edited: 0, created_at: now() }; db.group_questions.push(q); save(); return [201, { message: 'Question posted', data: q }] })
R('GET', G, '/questions/:qid/answers', ({ p }) => ({ data: db.group_answers.filter((a) => a.question_id == p.qid).sort(asc).map((a) => { const u = usr(a.user_id); return { ...a, is_best: !!a.is_best, user_name: u.name, name: u.name, username: u.username, profile_picture: pic(u) } }) }))
R('POST', G, '/questions/:qid/answers', ({ p, me, b }) => { const a = { id: nextId('group_answers'), question_id: Number(p.qid), user_id: me.id, content: b.content || '', is_best: 0, is_edited: 0, created_at: now() }; db.group_answers.push(a); save(); return [201, { message: 'Answer posted', data: a }] })
R('GET', G, '/:id/polls', ({ p, uid }) => ({ data: db.group_polls.filter((x) => x.group_id == p.id).sort(desc).map((x) => ({ ...x, options: db.group_poll_options.filter((o) => o.poll_id == x.id).map((o) => ({ ...o, votes: db.group_poll_votes.filter((v) => v.option_id == o.id).length })), my_vote: (db.group_poll_votes.find((v) => v.poll_id == x.id && v.user_id == uid) || {}).option_id || null, total_votes: db.group_poll_votes.filter((v) => v.poll_id == x.id).length })) }))
R('POST', G, '/polls/:pid/vote', ({ p, me, b }) => { db.group_poll_votes = db.group_poll_votes.filter((v) => !(v.poll_id == p.pid && v.user_id == me.id)); db.group_poll_votes.push({ id: nextId('group_poll_votes'), poll_id: Number(p.pid), option_id: Number(b.option_id), user_id: me.id }); save(); return okMsg('Vote recorded') })
R('GET', G, '/:id/leaderboard', ({ p }) => ({ data: db.group_points.filter((x) => x.group_id == p.id && x.points > 0).sort((a, b) => b.points - a.points).map((x) => { const u = usr(x.user_id); return { user_id: x.user_id, points: x.points, name: u.name, username: u.username, profile_picture: pic(u) } }) }))
for (const t of ['flashcards', 'wiki', 'sessions', 'tasks']) R('GET', G, `/:id/${t}`, () => ({ data: [] }))
R('GET', G, '/:id', ({ p, me, uid }) => { const g = byId('groups', p.id); if (!g) fail(404, 'Group not found'); return { message: 'Group fetched', data: fmtGroup(g, uid, me) } })
R('PUT', G, '/:id', ({ p, b }) => { const g = byId('groups', p.id); if (g) { Object.assign(g, { name: b.name ?? g.name, description: b.description ?? g.description }); save() } return okMsg('Group updated') })
R('DELETE', G, '/:id', ({ p }) => { db.groups = db.groups.filter((g) => g.id != p.id); db.group_members = db.group_members.filter((m) => m.group_id != p.id); save(); return okMsg('Group deleted successfully') })
R('POST', ['/group-posts', '/groupposts', '/group-post'], '', ({ me, b }) => { const x = { id: nextId('group_posts'), group_id: Number(b.group_id), user_id: me.id, content: b.content || '', image: null, created_at: now(), updated_at: now(), is_pinned: 0, post_type: 'discussion', is_edited: 0 }; db.group_posts.push(x); save(); return [201, { message: 'Posted', data: x }] })
R('GET', ['/group-posts', '/groupposts', '/group-post'], '/:groupId', ({ p }) => ({ data: db.group_posts.filter((x) => x.group_id == p.groupId).sort(desc).map((x) => { const u = usr(x.user_id); return { ...x, name: u.name, username: u.username, profile_picture: pic(u) } }) }))

// FILES
const FL = '/files'
R('GET', FL, '', ({ q, uid }) => ({ message: 'Files fetched', data: db.files.filter((f) => (!q.subject || f.subject === q.subject) && (!q.year || String(f.academic_year) === String(q.year)) && (!q.file_type || f.file_type === q.file_type)).sort(desc).map((f) => fmtFile(f, uid)) }))
R('POST', FL, '/upload', ({ me, b }) => { const f = { id: nextId('files'), uploader_id: me.id, file_name: b.file?.name || b.file_name || 'file', file_url: '#', file_type: b.file_type || 'application/pdf', file_size: b.file?.size || 0, created_at: now(), subject: b.subject || null, academic_year: b.academic_year || null, description: b.description || null, download_count: 0, track: null, course_id: b.course_id || null, project_id: null, group_id: null, is_edited: 0 }; db.files.push(f); save(); return [201, { message: 'File uploaded', data: fmtFile(f, me.id) }] })
R('GET', FL, '/:id/comments', ({ p }) => ({ message: 'Comments fetched', data: db.file_comments.filter((c) => c.file_id == p.id).sort(desc).map((c) => { const u = usr(c.user_id); return { ...c, username: u.username, name: u.name, profile_picture: u.profile_picture } }) }))
R('POST', FL, '/:id/comments', ({ p, me, b }) => { const c = { id: nextId('file_comments'), file_id: Number(p.id), user_id: me.id, content: b.content || '', created_at: now() }; db.file_comments.push(c); save(); return [201, { message: 'Comment added', data: { ...c, username: me.username, name: me.name, profile_picture: me.profile_picture } }] })
R('GET', FL, '/:id/rate', ({ p }) => { const rs = db.file_ratings.filter((r) => r.file_id == p.id); return { message: 'Rating fetched', data: { avg_rating: rs.length ? round1(rs.reduce((s, r) => s + r.rating, 0) / rs.length) : 0, total_ratings: rs.length } } })
R('POST', FL, '/:id/rate', ({ p, me, b }) => { db.file_ratings = db.file_ratings.filter((r) => !(r.file_id == p.id && r.user_id == me.id)); db.file_ratings.push({ id: nextId('file_ratings'), file_id: Number(p.id), user_id: me.id, rating: Number(b.rating) }); save(); return okMsg('File rated successfully') })
R('POST', FL, '/:id/like', ({ p, me }) => { if (!db.file_likes.some((l) => l.file_id == p.id && l.user_id == me.id)) db.file_likes.push({ id: nextId('file_likes'), file_id: Number(p.id), user_id: me.id }); save(); return okMsg('File liked') })
R('DELETE', FL, '/:id/like', ({ p, me }) => { db.file_likes = db.file_likes.filter((l) => !(l.file_id == p.id && l.user_id == me.id)); save(); return okMsg('File unliked') })
R('GET', FL, '/:id/download', () => fail(404, 'Demo mode: file downloads are not available'))
R('GET', FL, '/:id', ({ p, uid }) => { const f = byId('files', p.id); if (!f) fail(404, 'File not found'); return { message: 'File fetched', data: fmtFile(f, uid) } })
R('DELETE', FL, '/:id', ({ p }) => { db.files = db.files.filter((f) => f.id != p.id); save(); return okMsg('File deleted') })

// COURSES
const CO = '/courses'
const studentCourses = (me) => { const ps = studies(me.id); return db.courses.filter((c) => String(c.academic_year) === String(ps.academic_year) && (!c.track || !ps.track || c.track === ps.track)) }
R('GET', CO, '/admin/doctors', () => ({ data: db.users.filter((u) => u.role === 'doctor').map((u) => ({ id: u.id, name: u.name, username: u.username })) }))
R('GET', CO, '/admin', () => ({ data: db.courses.map(fmtCourse) }))
R('POST', CO, '/admin', ({ b }) => { const c = { id: nextId('courses'), created_at: now(), ...b }; db.courses.push(c); save(); return [201, { message: 'Course created', id: c.id }] })
R('PUT', CO, '/admin/:id', ({ p, b }) => { const c = byId('courses', p.id); if (c) Object.assign(c, b); save(); return okMsg('Course updated') })
R('DELETE', CO, '/admin/:id', ({ p }) => { db.courses = db.courses.filter((c) => c.id != p.id); save(); return okMsg('Course deleted') })
R('GET', CO, '/my', ({ me }) => ({ data: (me.role === 'doctor' ? db.courses.filter((c) => c.doctor_id == me.id) : me.role === 'student' ? studentCourses(me) : []).map(fmtCourse) }))
R('GET', CO, '/:id', ({ p }) => { const c = byId('courses', p.id); if (!c) fail(404, 'Course not found'); return { data: { ...fmtCourse(c), materials: db.files.filter((f) => f.course_id == c.id).sort(desc) } } })

// PROJECTS
const PR = '/projects'
R('GET', PR, '/doctors', () => db.users.filter((u) => u.role === 'doctor').map((u) => ({ id: u.id, name: u.name, username: u.username, profile_picture: pic(u) })))
R('GET', PR, '/leaderboard', () => db.projects.map(fmtProject).sort((a, b) => b.interest_count - a.interest_count).slice(0, 10))
R('GET', PR, '/marketplace', ({ q, uid }) => db.projects.filter((p) => p.open_to_investors && p.approval_status === 'approved' && (!q.project_type || p.project_type === q.project_type) && (!q.status || p.status === q.status) && (!q.q || (p.title + ' ' + p.description).toLowerCase().includes(String(q.q).toLowerCase())))
  .map((p) => ({ ...fmtProject(p), rating: null, funding_raised: 0, my_interested: db.project_interests.some((i) => i.project_id == p.id && i.investor_id == uid), my_bookmarked: false, my_offer: false, my_offer_amount: null, my_offer_status: null })))
R('GET', PR, '/bookmarks', () => [])
R('GET', PR, '/supervised', ({ me }) => db.projects.filter((p) => p.supervisor_id == me.id).map(fmtProject))
R('GET', PR, '/investor-profile', ({ me }) => db.investor_profiles.find((i) => i.user_id == me.id) || {})
R('PUT', PR, '/investor-profile', ({ me, b }) => { let ip = db.investor_profiles.find((i) => i.user_id == me.id); if (!ip) { ip = { id: nextId('investor_profiles'), user_id: me.id, verified: 0, created_at: now() }; db.investor_profiles.push(ip) } Object.assign(ip, { company_name: b.company_name, investment_field: b.investment_field }); save(); return okMsg('Profile updated') })
R('GET', PR, '', ({ me, q }) => {
  if (me.role !== 'admin' && me.role !== 'student' && me.role !== 'doctor') return []
  return db.projects.filter((p) => (me.role === 'student' ? p.creator_id == me.id : me.role === 'doctor' ? p.supervisor_id == me.id : true) && (!q.project_type || p.project_type === q.project_type) && (!q.status || p.status === q.status)).sort(desc).map(fmtProject)
})
R('POST', PR, '', ({ me, b }) => { const p = { id: nextId('projects'), creator_id: me.id, title: b.title, description: b.description, category: b.category || null, status: b.status || 'idea', required_funding: b.required_funding || null, github_link: b.github_link || null, demo_url: b.demo_url || null, created_at: now(), academic_year: null, track: null, open_to_investors: 0, image_url: b.image_url || null, looking_for: b.looking_for || null, project_type: b.project_type || 'startup', supervisor_id: b.supervisor_id || null, approval_status: 'pending', supervisor_feedback: null, video_url: null, featured: 0, pitch_deck_url: null }; db.projects.push(p); db.project_members.push({ project_id: p.id, user_id: me.id }); save(); return [201, { message: 'Project created', id: p.id }] })
R('POST', PR, '/upload', ({ b }) => ({ url: '', name: b.file?.name || 'file', size: b.file?.size || 0, type: b.file?.type || '' }))
R('POST', PR, '/:id/interest', ({ p, me, b }) => { if (!db.project_interests.some((i) => i.project_id == p.id && i.investor_id == me.id)) db.project_interests.push({ id: nextId('project_interests'), project_id: Number(p.id), investor_id: me.id, note: b.note || null, created_at: now() }); save(); return { message: 'Interest expressed', creator_contact: null } })
R('DELETE', PR, '/:id/interest', ({ p, me }) => { db.project_interests = db.project_interests.filter((i) => !(i.project_id == p.id && i.investor_id == me.id)); save(); return okMsg('Withdrawn') })
R('GET', PR, '/:id', ({ p, me }) => {
  const pr = byId('projects', p.id); if (!pr) fail(404, 'Project not found')
  const f = fmtProject(pr), d = usr(pr.supervisor_id)
  const extra = { supervisor_picture: pic(d), rating: null, funding_raised: 0,
    members: db.project_members.filter((m) => m.project_id == pr.id).map((m) => { const u = usr(m.user_id); return { id: u.id, name: u.name, profile_picture: pic(u) } }),
    files: db.files.filter((x) => x.project_id == pr.id), endorsements: [], updates: [], questions: [] }
  if (me.role === 'admin' || pr.creator_id == me.id) Object.assign(extra, { offers: [], meetings: [], interested_investors: db.project_interests.filter((i) => i.project_id == pr.id).map((i) => { const u = usr(i.investor_id), ip = db.investor_profiles.find((x) => x.user_id == u.id) || {}; return { investor_id: u.id, note: i.note, created_at: i.created_at, investor_name: u.name, email: u.email, phone_number: null, company_name: ip.company_name, investment_field: ip.investment_field, verified: ip.verified } }) })
  if (me.role === 'investor') Object.assign(extra, { my_interested: db.project_interests.some((i) => i.project_id == pr.id && i.investor_id == me.id), my_bookmarked: false, my_offer: null })
  return { ...f, ...extra, can_review: pr.supervisor_id == me.id || me.role === 'admin' }
})
R('DELETE', PR, '/:id', ({ p }) => { db.projects = db.projects.filter((x) => x.id != p.id); save(); return okMsg('Project deleted') })
R('PUT', PR, '/:id', ({ p, b }) => { const x = byId('projects', p.id); if (x) Object.assign(x, b); save(); return okMsg('Project updated') })

// REVIEWS
const RV = '/reviews'
const rvFmt = (r, uid) => ({ id: r.id, rating: r.rating, comment: r.comment, is_anonymous: r.is_anonymous, created_at: r.created_at, student_id: r.student_id, is_mine: r.student_id == uid, student_name: r.is_anonymous ? 'Anonymous' : (usr(r.student_id)).name })
R('GET', RV, '/admin/all', ({ uid }) => ({ message: 'Reviews fetched successfully', data: db.academic_reviews.sort(desc).map((r) => ({ ...rvFmt(r, uid), student_name: (usr(r.student_id)).name, doctor_id: r.doctor_id, doctor_name: (usr(r.doctor_id)).name })) }))
R('GET', RV, '/doctor/:doctorId', ({ p, me, uid }) => ({ message: 'Reviews fetched successfully', data: db.academic_reviews.filter((r) => r.doctor_id == p.doctorId && (me.role !== 'student' || r.student_id == me.id)).sort(desc).map((r) => rvFmt(r, uid)) }))
R('POST', RV, '', ({ me, b }) => { const r = { id: nextId('academic_reviews'), doctor_id: Number(b.doctor_id), student_id: me.id, rating: Number(b.rating), comment: b.comment || '', is_anonymous: b.is_anonymous ? 1 : 0, created_at: now() }; db.academic_reviews.push(r); save(); return [201, { message: 'Review created successfully', reviewId: r.id }] })
R('DELETE', RV, '/:id', ({ p }) => { db.academic_reviews = db.academic_reviews.filter((r) => r.id != p.id); save(); return okMsg('Review deleted successfully') })

// ADMIN
const AD = '/admin'
const adm = (me) => { if (me.role !== 'admin') fail(403, 'Admins only', { success: false }) }
R('GET', AD, '/stats', ({ me }) => { adm(me); return { success: true, stats: { users: db.users.length, posts: db.posts.length, groups: db.groups.length, projects: db.projects.length, pendingReports: 0, pendingAccounts: 0 } } })
R('GET', AD, '/users', ({ me, q }) => {
  adm(me); const s = String(q.search || '').toLowerCase()
  const rows = db.users.filter((u) => (!s || [u.name, u.username, u.email].some((v) => String(v).toLowerCase().includes(s))) && (!q.role || q.role === 'all' || u.role === q.role)).sort(desc)
  const { rows: users, pagination } = paginate(rows, q)
  return { success: true, users: users.map(({ id, name, email, username, role, is_active, profile_picture, created_at }) => ({ id, name, email, username, role, is_active, profile_picture, created_at })), pagination }
})
R('PUT', AD, '/users/:id/deactivate', ({ p, me }) => { adm(me); const u = byId('users', p.id); if (u) { u.is_active = 0; save() } return { success: true } })
R('PUT', AD, '/users/:id/activate', ({ p, me }) => { adm(me); const u = byId('users', p.id); if (u) { u.is_active = 1; save() } return { success: true } })
R('PUT', AD, '/users/:id/role', ({ p, me, b }) => { adm(me); const u = byId('users', p.id); if (u && b.role) { u.role = b.role; save() } return { success: true } })
R('DELETE', AD, '/users/:id', ({ p, me }) => { adm(me); db.users = db.users.filter((u) => u.id != p.id); save(); return { success: true } })
R('GET', AD, '/pending', ({ me }) => { adm(me); return { success: true, users: [] } })
R('GET', AD, '/posts', ({ me, q, uid }) => { adm(me); const { rows, pagination } = paginate([...db.posts].sort(desc), q); return { success: true, posts: rows.map((x) => fmtPost(x, uid)), pagination } })
R('DELETE', AD, '/posts/:id', ({ p, me }) => { adm(me); db.posts = db.posts.filter((x) => x.id != p.id); save(); return { success: true } })
R('GET', AD, '/groups', ({ me, q, uid }) => { adm(me); const { rows, pagination } = paginate([...db.groups].sort(desc), q); return { success: true, groups: rows.map((g) => fmtGroup(g, uid, me)), pagination } })
R('DELETE', AD, '/groups/:id', ({ p, me }) => { adm(me); db.groups = db.groups.filter((g) => g.id != p.id); save(); return { success: true } })
R('GET', AD, '/projects', ({ me, q }) => { adm(me); const { rows, pagination } = paginate([...db.projects].sort(desc).map(fmtProject), q); return { success: true, projects: rows, pagination } })
R('GET', AD, '/reports', ({ me, q }) => { adm(me); return { success: true, reports: [], pagination: paginate([], q).pagination } })
R('GET', AD, '/announcements', () => ({ success: true, announcements: [] }))
R('GET', AD, '/activity-logs', ({ me }) => { adm(me); return { success: true, logs: db.activity_logs, data: db.activity_logs } })
R('GET', '/reports', '/admin/all', () => ({ data: [] }))

// ───────── adapter ─────────
function toBody(data) {
  if (!data) return {}
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return {} } }
  if (typeof FormData !== 'undefined' && data instanceof FormData) return Object.fromEntries(data.entries())
  return data
}

export async function handle(config) {
  await new Promise((r) => setTimeout(r, 60))
  const method = String(config.method || 'get').toUpperCase()
  const u = new URL(config.url, 'http://demo.local')
  let path = u.pathname.replace(/^\/api(?=\/|$)/, '')
  if (config.baseURL) { try { const bp = new URL(config.baseURL, 'http://demo.local').pathname.replace(/\/$/, '').replace(/^\/api$/, ''); if (bp && path.startsWith(bp)) path = path.slice(bp.length) } catch { /* */ } }
  path = path.replace(/\/+$/, '') || '/'
  const q = { ...Object.fromEntries(u.searchParams.entries()), ...(config.params || {}) }
  const b = toBody(config.data)
  const h = config.headers || {}
  const auth = h.Authorization || h.authorization || (typeof h.get === 'function' ? h.get('Authorization') : null)
  const uid = tokenUserId(auth)
  const respond = (status, data) => {
    const response = { data, status, statusText: String(status), headers: {}, config, request: {} }
    if (status >= 400) throw new AxiosError(data?.message || `Request failed with status code ${status}`, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response)
    return response
  }
  try {
    for (const r of routes) {
      if (r.method !== method) continue
      const m = path.match(r.re); if (!m) continue
      const p = {}; r.keys.forEach((k, i) => { p[k] = decodeURIComponent(m[i + 1]) })
      const me = uid ? byId('users', uid) : null
      if (!r.pub && !me) fail(401, 'Access denied. No token provided.')
      if (me) me.last_seen = now()
      let out = r.fn({ p, q, b, uid, me })
      let status = 200
      if (Array.isArray(out) && out.length === 2 && typeof out[0] === 'number') [status, out] = out
      return respond(status, JSON.parse(JSON.stringify(out ?? {})))
    }
    console.warn('[demo] unhandled', method, path)
    return respond(200, method === 'GET' ? { data: [] } : { message: 'Saved (demo mode)' })
  } catch (e) {
    if (e instanceof HttpError) return respond(e.status, e.data)
    if (e instanceof AxiosError) throw e
    console.error('[demo] handler error', method, path, e)
    return respond(500, { message: 'Demo handler error' })
  }
}

// ───────── fetch() support ─────────
// Pages that call fetch('/api/...') directly (not axios) are answered here too.
export async function fetchApi(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url
  const method = init.method || (typeof input !== 'string' && input.method) || 'GET'
  const headers = {}
  const src = init.headers || (typeof input !== 'string' && input.headers) || {}
  if (typeof src.forEach === 'function' && !Array.isArray(src)) src.forEach((v, k) => { headers[k] = v })
  else Object.assign(headers, Array.isArray(src) ? Object.fromEntries(src) : src)
  let body = init.body
  if (body === undefined && typeof input !== 'string' && typeof input.text === 'function' && !['GET', 'HEAD'].includes(String(method).toUpperCase())) body = await input.clone().text()
  const cfg = { method, url, headers, data: body }
  const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
  try {
    const r = await handle(cfg)
    return json(r.status, r.data)
  } catch (e) {
    if (e && e.response) return json(e.response.status, e.response.data)
    return json(500, { message: 'Demo error' })
  }
}
