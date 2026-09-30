import { http, HttpResponse as R } from "msw";
import { db, nextId } from "./db";

const A = "*/api";
const now = () => new Date().toISOString();

// ---------- helpers ----------
const tokenFor = (u) => `demo.${btoa(JSON.stringify({ id: u.id, email: u.email, role: u.role }))}.sig`;
const meId = (req) => {
  try { return JSON.parse(atob((req.headers.get("authorization") || "").split(" ")[1].split(".")[1])).id; }
  catch { return 5; }
};
const user = (id) => db.users.find((u) => u.id === Number(id));
const pub = (u) => u && { id: u.id, name: u.name, username: u.username, role: u.role, profile_picture: "" };
const initials = (n = "") => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const q = (req, k) => new URL(req.url).searchParams.get(k);
const paged = (req, list) => {
  const page = Number(q(req, "page")) || 1, limit = Number(q(req, "limit")) || 10;
  return { items: list.slice((page - 1) * limit, page * limit), pagination: { total: list.length, page, limit } };
};
const membersCount = (gid) => db.groupMembers.filter((m) => m.group_id === gid).length;
const fmtGroup = (g) => ({ ...g, members_count: membersCount(g.id), creator_name: user(g.creator_id)?.name });

const fmtComment = (c) => ({ id: c.id, content: c.content, created_at: c.created_at, parent_id: c.parent_id, user: pub(user(c.user_id)), replies: [] });
const fmtPost = (p, me) => {
  const u = user(p.user_id);
  const all = db.comments.filter((c) => c.post_id === p.id).map(fmtComment);
  const byId = Object.fromEntries(all.map((c) => [c.id, c]));
  const top = [];
  all.forEach((c) => (c.parent_id && byId[c.parent_id] ? byId[c.parent_id].replies.push(c) : !c.parent_id && top.push(c)));
  const likes = db.likes.filter((l) => l.post_id === p.id);
  return { ...p, name: u.name, username: u.username, role: u.role, profile_picture: "", likes: likes.length, comments_count: all.length, liked: likes.some((l) => l.user_id === me), comments: top };
};
const fmtFile = (f) => ({ ...f, file_url: "#", uploader_name: user(f.uploader_id)?.name, uploader_username: user(f.uploader_id)?.username });
const fmtProject = (p) => ({ ...p, creator_name: user(p.creator_id)?.name, creator_username: user(p.creator_id)?.username, members_count: p.member_ids.length });
const fmtNotif = (n) => ({ ...n, sender_name: user(n.sender_id)?.name });
const isFollowing = (a, b) => db.follows.some((f) => f.follower_id === a && f.following_id === b);
const withFollow = (u, me) => ({ ...pub(u), is_following: isFollowing(me, u.id) });
const notify = (to, from, type, message) => to !== from && db.notifications.unshift({ id: nextId(), user_id: to, sender_id: from, type, message, is_read: false, created_at: now() });

const profileOf = (u, me) => ({
  ...u, profile_picture: "",
  followers: db.follows.filter((f) => f.following_id === u.id).length,
  following: db.follows.filter((f) => f.follower_id === u.id).length,
  followers_count: db.follows.filter((f) => f.following_id === u.id).length,
  groups: db.groupMembers.filter((m) => m.user_id === u.id).length,
  uploadedFiles: db.files.filter((f) => f.uploader_id === u.id).length,
  posts: db.posts.filter((p) => p.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((p) => fmtPost(p, me)),
});

const fmtReview = (r, me) => {
  const s = user(r.student_id);
  return { ...r, student_name: r.is_anonymous ? "Anonymous" : s.name, is_mine: r.student_id === me ? 1 : 0 };
};

export const handlers = [
  // ---------- AUTH ----------
  http.post(`${A}/auth/login`, async ({ request }) => {
    const { email } = await request.json();
    const u = db.users.find((x) => x.email === email);
    if (!u) return R.json({ message: "User not found" }, { status: 404 });
    return R.json({ message: "Login successful", token: tokenFor(u), user: { id: u.id, name: u.name, email: u.email, username: u.username, role: u.role } });
  }),
  http.post(`${A}/auth/google`, () => { const u = user(5); return R.json({ token: tokenFor(u), user: pub(u) }); }),
  http.post(`${A}/auth/register`, () => R.json({ message: "User registered successfully" }, { status: 201 })),
  http.get(`${A}/auth/google/status`, () => R.json({ linked: false, google_email: null, has_password: true })),
  http.get(`${A}/auth/profile`, ({ request }) => R.json({ success: true, user: user(meId(request)) })),

  // ---------- USERS ----------
  http.get(`${A}/users/me`, ({ request }) => R.json({ user: user(meId(request)) })),
  http.get(`${A}/users/search`, ({ request }) => {
    const term = (q(request, "q") || "").toLowerCase(), me = meId(request);
    const data = db.users.filter((u) => u.id !== me && (u.name.toLowerCase().includes(term) || u.username.toLowerCase().includes(term))).slice(0, 10).map((u) => withFollow(u, me));
    return R.json({ data });
  }),
  http.get(`${A}/users/:id/followers`, ({ request, params }) => {
    const me = meId(request);
    return R.json({ data: db.follows.filter((f) => f.following_id === Number(params.id)).map((f) => withFollow(user(f.follower_id), me)) });
  }),
  http.get(`${A}/users/:id/following`, ({ request, params }) => {
    const me = meId(request);
    return R.json({ data: db.follows.filter((f) => f.follower_id === Number(params.id)).map((f) => withFollow(user(f.following_id), me)) });
  }),
  http.get(`${A}/users`, () => R.json({ data: db.users.map(pub) })),
  http.put(`${A}/users/:id/profile`, async ({ request, params }) => {
    const b = await request.json(), u = user(params.id);
    Object.assign(u, { name: b.name || u.name, bio: b.bio ?? u.bio, faculty: b.faculty || u.faculty, academic_year: b.academic_year || u.academic_year });
    return R.json({ message: "Profile updated successfully" });
  }),

  // ---------- PROFILE ----------
  http.get(`${A}/profile`, ({ request }) => { const me = meId(request); return R.json(profileOf(user(me), me)); }),
  http.get(`${A}/profile/:id`, ({ request, params }) => {
    const u = user(params.id);
    return u ? R.json(profileOf(u, meId(request))) : R.json({ message: "User not found" }, { status: 404 });
  }),

  // ---------- POSTS ----------
  http.get(`${A}/posts`, ({ request }) => {
    const me = meId(request);
    return R.json({ data: [...db.posts].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((p) => fmtPost(p, me)) });
  }),
  http.post(`${A}/posts`, async ({ request }) => {
    const me = meId(request), b = await request.json();
    const p = { id: nextId(), user_id: me, title: b.title, content: b.content, created_at: now() };
    db.posts.unshift(p);
    return R.json({ message: "Post created successfully", data: fmtPost(p, me) }, { status: 201 });
  }),
  http.put(`${A}/posts/:id`, async ({ request, params }) => {
    const b = await request.json(), p = db.posts.find((x) => x.id === Number(params.id));
    if (p) Object.assign(p, { title: b.title, content: b.content });
    return R.json({ message: "Post updated successfully" });
  }),
  http.delete(`${A}/posts/:id`, ({ params }) => {
    db.posts = db.posts.filter((p) => p.id !== Number(params.id));
    return R.json({ message: "Post deleted successfully" });
  }),

  // ---------- LIKES / COMMENTS ----------
  http.post(`${A}/likes`, async ({ request }) => {
    const me = meId(request), { post_id } = await request.json();
    const i = db.likes.findIndex((l) => l.post_id === post_id && l.user_id === me);
    if (i >= 0) db.likes.splice(i, 1);
    else { db.likes.push({ post_id, user_id: me }); notify(db.posts.find((p) => p.id === post_id)?.user_id, me, "like", "liked your post"); }
    return R.json({ liked: i < 0, likes: db.likes.filter((l) => l.post_id === post_id).length });
  }),
  http.post(`${A}/comments`, async ({ request }) => {
    const me = meId(request), b = await request.json();
    const c = { id: nextId(), post_id: b.post_id, user_id: me, content: b.content, parent_id: b.parent_id || null, created_at: now() };
    db.comments.push(c);
    if (!c.parent_id) notify(db.posts.find((p) => p.id === c.post_id)?.user_id, me, "comment", "commented on your post");
    return R.json(fmtComment(c), { status: 201 });
  }),
  http.put(`${A}/comments/:id`, async ({ request, params }) => {
    const { content } = await request.json(), c = db.comments.find((x) => x.id === Number(params.id));
    if (c) c.content = content;
    return R.json({ message: "Comment updated", content });
  }),
  http.delete(`${A}/comments/:id`, ({ params }) => {
    db.comments = db.comments.filter((c) => c.id !== Number(params.id) && c.parent_id !== Number(params.id));
    return R.json({ message: "Comment deleted" });
  }),

  // ---------- FOLLOW ----------
  http.post(`${A}/follow`, async ({ request }) => {
    const me = meId(request), { following_id } = await request.json(), id = Number(following_id);
    const i = db.follows.findIndex((f) => f.follower_id === me && f.following_id === id);
    if (i >= 0) db.follows.splice(i, 1);
    else { db.follows.push({ follower_id: me, following_id: id }); notify(id, me, "follow", "started following you"); }
    return R.json({ message: i >= 0 ? "Unfollowed" : "Followed" });
  }),
  http.get(`${A}/follow/is-following/:id`, ({ request, params }) => R.json({ isFollowing: isFollowing(meId(request), Number(params.id)) })),

  // ---------- NOTIFICATIONS ----------
  http.get(`${A}/notifications`, ({ request }) => {
    const me = meId(request);
    return R.json({ data: db.notifications.filter((n) => n.user_id === me).map(fmtNotif) });
  }),
  http.patch(`${A}/notifications/read-all`, ({ request }) => {
    const me = meId(request);
    db.notifications.forEach((n) => n.user_id === me && (n.is_read = true));
    return R.json({ message: "All notifications marked as read" });
  }),
  http.patch(`${A}/notifications/:id/read`, ({ params }) => {
    const n = db.notifications.find((x) => x.id === Number(params.id));
    if (n) n.is_read = true;
    return R.json({ message: "Notification marked as read" });
  }),

  // ---------- FILES ----------
  http.get(`${A}/files/my`, ({ request }) => R.json({ data: db.files.filter((f) => f.uploader_id === meId(request)).map(fmtFile) })),
  http.get(`${A}/files`, ({ request }) => {
    const me = meId(request), s = q(request, "subject"), y = q(request, "year"), t = q(request, "file_type"), owner = q(request, "user");
    let list = db.files;
    if (s) list = list.filter((f) => f.subject === s);
    if (y) list = list.filter((f) => f.academic_year === y);
    if (t) list = list.filter((f) => f.file_type === t);
    if (owner) list = list.filter((f) => f.uploader_id === (owner === "me" ? me : Number(owner)));
    return R.json({ data: list.map(fmtFile) });
  }),
  http.post(`${A}/files/:id/like`, () => R.json({ message: "File liked" }, { status: 201 })),
  http.delete(`${A}/files/:id/like`, () => R.json({ message: "File unliked" })),

  // ---------- GROUPS ----------
  http.get(`${A}/groups/my-groups`, ({ request }) => {
    const me = meId(request);
    return R.json({ data: db.groups.filter((g) => db.groupMembers.some((m) => m.group_id === g.id && m.user_id === me)).map(fmtGroup) });
  }),
  http.get(`${A}/groups`, () => R.json({ data: db.groups.map(fmtGroup) })),
  http.post(`${A}/groups/join`, async ({ request }) => {
    const me = meId(request), { group_id } = await request.json(), gid = Number(group_id);
    if (!db.groupMembers.some((m) => m.group_id === gid && m.user_id === me)) db.groupMembers.push({ group_id: gid, user_id: me, role: "member" });
    return R.json({ message: "Joined group successfully" });
  }),
  http.delete(`${A}/groups/leave`, async ({ request }) => {
    const me = meId(request), { group_id } = await request.json(), gid = Number(group_id);
    db.groupMembers = db.groupMembers.filter((m) => !(m.group_id === gid && m.user_id === me));
    return R.json({ message: "Left group successfully" });
  }),
  http.post(`${A}/groups`, async ({ request }) => {
    const me = meId(request), b = await request.json();
    const g = { id: nextId(), creator_id: me, name: b.name, description: b.description, is_private: !!b.is_private, group_type: b.group_type || "other", academic_year: b.academic_year || "", created_at: now() };
    db.groups.unshift(g);
    db.groupMembers.push({ group_id: g.id, user_id: me, role: "admin" });
    return R.json({ message: "Group created successfully", groupId: g.id }, { status: 201 });
  }),
  http.get(`${A}/groups/:id/members`, ({ params }) =>
    R.json({ data: db.groupMembers.filter((m) => m.group_id === Number(params.id)).map((m) => ({ ...pub(user(m.user_id)), role: m.role })) })),
  http.get(`${A}/groups/:id/files`, () => R.json({ data: db.files.slice(0, 2).map(fmtFile) })),
  http.get(`${A}/groups/:id/posts`, ({ params }) =>
    R.json({ data: db.groupPosts.filter((p) => p.group_id === Number(params.id)).map((p) => ({ ...p, author_name: user(p.user_id)?.name, likes_count: p.likes.length, is_liked: false })) })),
  http.post(`${A}/groups/:id/posts`, async ({ request, params }) => {
    const me = meId(request), { content } = await request.json();
    const p = { id: nextId(), group_id: Number(params.id), user_id: me, content, created_at: now(), likes: [] };
    db.groupPosts.unshift(p);
    return R.json({ data: { ...p, author_name: user(me).name, likes_count: 0, is_liked: false } });
  }),
  http.post(`${A}/groups/posts/:id/like`, () => R.json({ ok: true })),
  http.delete(`${A}/groups/posts/:id/like`, () => R.json({ ok: true })),
  http.get(`${A}/groups/:id`, ({ request, params }) => {
    const g = db.groups.find((x) => x.id === Number(params.id)), me = meId(request);
    if (!g) return R.json({ message: "Group not found" }, { status: 404 });
    return R.json({ data: { ...fmtGroup(g), is_member: db.groupMembers.some((m) => m.group_id === g.id && m.user_id === me) } });
  }),
  http.delete(`${A}/groups/:id`, ({ params }) => { db.groups = db.groups.filter((g) => g.id !== Number(params.id)); return R.json({ message: "Group deleted successfully" }); }),

  // ---------- COURSES ----------
  http.get(`${A}/courses/my`, ({ request }) => {
    const me = user(meId(request));
    const list = me.role === "doctor" ? db.courses.filter((c) => c.doctor_id === me.id) : db.courses;
    return R.json({ data: list.map((c) => ({ ...c, doctor_name: user(c.doctor_id)?.name })) });
  }),
  http.get(`${A}/courses`, ({ request }) => {
    const d = q(request, "doctor_id");
    return R.json({ data: db.courses.filter((c) => !d || c.doctor_id === Number(d)) });
  }),

  // ---------- PROJECTS ----------
  http.get(`${A}/projects`, ({ request }) => {
    const c = q(request, "category"), s = q(request, "status");
    return R.json(db.projects.filter((p) => (!c || p.category === c) && (!s || p.status === s)).map(fmtProject));
  }),
  http.get(`${A}/projects/:id`, ({ params }) => {
    const p = db.projects.find((x) => x.id === Number(params.id));
    if (!p) return R.json({ message: "Project not found" }, { status: 404 });
    return R.json({ ...fmtProject(p), members: p.member_ids.map((id) => ({ id, name: user(id).name })) });
  }),
  http.post(`${A}/projects`, async ({ request }) => {
    const me = meId(request), b = await request.json();
    const p = { id: nextId(), creator_id: me, title: b.title, description: b.description || "", category: b.category || "IT", status: b.status || "idea", required_funding: Number(b.required_funding) || 0, github_link: b.github_link || "", demo_url: b.demo_url || "", created_at: now(), member_ids: [me], interest_count: 0 };
    db.projects.unshift(p);
    return R.json({ message: "Project created successfully", project_id: p.id }, { status: 201 });
  }),
  http.put(`${A}/projects/:id`, async ({ request, params }) => {
    const b = await request.json(), p = db.projects.find((x) => x.id === Number(params.id));
    if (p) Object.assign(p, { title: b.title, description: b.description, category: b.category, status: b.status, required_funding: Number(b.required_funding) || 0, github_link: b.github_link, demo_url: b.demo_url });
    return R.json({ message: "Project updated" });
  }),
  http.delete(`${A}/projects/:id`, ({ params }) => { db.projects = db.projects.filter((p) => p.id !== Number(params.id)); return R.json({ message: "Project deleted successfully" }); }),
  http.post(`${A}/projects/:id/interest`, () => R.json({ message: "Interest expressed successfully" })),

  // ---------- REVIEWS ----------
  http.get(`${A}/reviews/admin/all`, () =>
    R.json({ data: db.reviews.map((r) => {
      const d = user(r.doctor_id), s = user(r.student_id), all = db.reviews.filter((x) => x.doctor_id === r.doctor_id);
      return { ...r, doctor_name: d.name, doctor_specialty: d.specialization, doctor_avatar: null, student_name: s.name, student_avatar: null, student_year: s.academic_year,
        doctor_avg_rating: (all.reduce((a, x) => a + x.rating, 0) / all.length).toFixed(1), doctor_review_count: all.length };
    }) })),
  http.get(`${A}/reviews/doctor/:id`, ({ request, params }) => {
    const me = meId(request);
    return R.json({ data: db.reviews.filter((r) => r.doctor_id === Number(params.id)).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((r) => fmtReview(r, me)) });
  }),
  http.post(`${A}/reviews`, async ({ request }) => {
    const me = meId(request), b = await request.json();
    if (db.reviews.some((r) => r.doctor_id === b.doctor_id && r.student_id === me)) return R.json({ message: "You already reviewed this doctor" }, { status: 400 });
    db.reviews.push({ id: nextId(), doctor_id: b.doctor_id, student_id: me, rating: b.rating, comment: b.comment, is_anonymous: !!b.is_anonymous, created_at: now() });
    return R.json({ message: "Review created successfully" }, { status: 201 });
  }),
  http.put(`${A}/reviews/:id`, async ({ request, params }) => {
    const b = await request.json(), r = db.reviews.find((x) => x.id === Number(params.id));
    if (r) Object.assign(r, { rating: b.rating, comment: b.comment });
    return R.json({ message: "Review updated" });
  }),
  http.delete(`${A}/reviews/:id`, ({ params }) => { db.reviews = db.reviews.filter((r) => r.id !== Number(params.id)); return R.json({ message: "Review deleted successfully" }); }),

  // ---------- REPORTS (admin) ----------
  http.get(`${A}/reports/admin/all`, () =>
    R.json({ data: db.reports.map((r) => {
      const rep = user(r.reporter_id);
      return { id: r.id, type: r.type, content: r.content, contentBody: r.contentBody, contentPreview: r.contentBody.slice(0, 80), reason: r.reason, status: r.status,
        reportedBy: rep.name, username: `@${rep.username}`, avatarInitials: initials(rep.name), date: r.created_at };
    }) })),
  http.patch(`${A}/reports/:id/status`, async ({ request, params }) => {
    const { status } = await request.json(), r = db.reports.find((x) => x.id === Number(params.id));
    if (r) r.status = status;
    return R.json({ message: `Report ${status.toLowerCase()} successfully` });
  }),
  http.delete(`${A}/reports/:id/content`, ({ params }) => {
    const r = db.reports.find((x) => x.id === Number(params.id));
    if (r) r.status = "Resolved";
    return R.json({ message: "Content deleted and report resolved" });
  }),
  http.post(`${A}/reports/:id/warning`, () => R.json({ message: "Warning logged successfully" })),

  // ---------- ADMIN ----------
  http.get(`${A}/admin/stats`, () =>
    R.json({ success: true, stats: { users: db.users.length, posts: db.posts.length, groups: db.groups.length, projects: db.projects.length, pendingReports: db.reports.filter((r) => r.status === "Pending").length } })),
  http.get(`${A}/admin/users`, ({ request }) => {
    const s = (q(request, "search") || "").toLowerCase(), role = q(request, "role");
    const list = db.users.filter((u) => (!role || u.role === role) && (!s || `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(s)));
    const { items, pagination } = paged(request, list);
    return R.json({ success: true, users: items, pagination });
  }),
  http.put(`${A}/admin/users/:id/activate`, ({ params }) => { user(params.id).is_active = true; return R.json({ success: true }); }),
  http.put(`${A}/admin/users/:id/deactivate`, ({ params }) => { user(params.id).is_active = false; return R.json({ success: true }); }),
  http.put(`${A}/admin/users/:id/role`, async ({ request, params }) => { user(params.id).role = (await request.json()).role; return R.json({ success: true }); }),
  http.post(`${A}/admin/users/:id/reset-password`, () => R.json({ success: true, newPassword: "demo1234" })),
  http.delete(`${A}/admin/users/:id`, ({ params }) => { db.users = db.users.filter((u) => u.id !== Number(params.id)); return R.json({ success: true }); }),

  http.get(`${A}/admin/posts`, ({ request }) => {
    const s = (q(request, "search") || "").toLowerCase();
    const list = db.posts.filter((p) => !s || `${p.title} ${user(p.user_id).name}`.toLowerCase().includes(s)).map((p) => ({ id: p.id, title: p.title, author: user(p.user_id).name, type: "post", created_at: p.created_at }));
    const { items, pagination } = paged(request, list);
    return R.json({ posts: items, pagination });
  }),
  http.delete(`${A}/admin/posts/:id/comments`, ({ params }) => { db.comments = db.comments.filter((c) => c.post_id !== Number(params.id)); return R.json({ success: true }); }),
  http.delete(`${A}/admin/posts/:id`, ({ params }) => { db.posts = db.posts.filter((p) => p.id !== Number(params.id)); return R.json({ success: true }); }),

  http.get(`${A}/admin/groups`, ({ request }) => {
    const s = (q(request, "search") || "").toLowerCase(), gt = q(request, "group_type"), y = q(request, "academic_year");
    const list = db.groups.filter((g) => (!gt || g.group_type === gt) && (!y || g.academic_year === y) && (!s || g.name.toLowerCase().includes(s))).map(fmtGroup);
    const { items, pagination } = paged(request, list);
    return R.json({ groups: items, pagination });
  }),
  http.delete(`${A}/admin/groups/:id`, ({ params }) => { db.groups = db.groups.filter((g) => g.id !== Number(params.id)); return R.json({ success: true }); }),

  http.get(`${A}/admin/projects`, ({ request }) => {
    const s = (q(request, "search") || "").toLowerCase(), c = q(request, "category");
    const list = db.projects.map((p) => ({ ...fmtProject(p), category: p.category === "IT" ? "software" : "hardware" }))
      .filter((p) => (!c || p.category === c) && (!s || `${p.title} ${p.creator_name}`.toLowerCase().includes(s)));
    const { items, pagination } = paged(request, list);
    return R.json({ projects: items, pagination });
  }),
  http.delete(`${A}/admin/projects/:id`, ({ params }) => { db.projects = db.projects.filter((p) => p.id !== Number(params.id)); return R.json({ success: true }); }),

  http.get(`${A}/admin/announcements`, () => R.json({ success: true, announcements: db.announcements })),
  http.post(`${A}/admin/announcements`, async ({ request }) => {
    const b = await request.json();
    db.announcements.unshift({ id: nextId(), type: "notice", created_at: now(), ...b });
    return R.json({ success: true }, { status: 201 });
  }),
  http.delete(`${A}/admin/announcements/:id`, ({ params }) => { db.announcements = db.announcements.filter((a) => a.id !== Number(params.id)); return R.json({ success: true }); }),

  http.get(`${A}/admin/emails/recipients-count`, () =>
    R.json({ data: { students: db.users.filter((u) => u.role === "student").length, doctors: db.users.filter((u) => u.role === "doctor").length, everyone: db.users.length } })),
  http.get(`${A}/admin/emails/search-users`, ({ request }) => {
    const s = (q(request, "q") || "").toLowerCase();
    return R.json({ data: db.users.filter((u) => u.name.toLowerCase().includes(s) || u.email.includes(s)).slice(0, 10) });
  }),
  http.get(`${A}/admin/emails/history`, () => R.json({ data: db.emails })),
  http.post(`${A}/admin/emails/send`, async ({ request }) => {
    const b = await request.json(), u = b.recipient_id ? user(b.recipient_id) : null;
    db.emails.unshift({ id: nextId(), recipient_type: b.recipient_type, recipient_count: 5, recipient_user_name: u?.name, recipient_user_email: u?.email, subject: b.subject, message: b.message, message_type: b.message_type, created_at: now(), sender_name: "Admin UniConnect" });
    return R.json({ message: "Email sent successfully" }, { status: 201 });
  }),
  http.get(`${A}/admin/activity-logs`, () =>
    R.json({ success: true, data: db.logs.map((l) => ({ ...l, admin_name: "Admin UniConnect", admin_role: "admin", admin_avatar: null })) })),
];
