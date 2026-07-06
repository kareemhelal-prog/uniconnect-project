const { promisePool } = require("../config/db");
const { logEvent } = require("../utils/logEvent");
const { getUserCohort } = require("../utils/cohort");

// A group's audience is a set of (year, track) rows. NO rows = everyone.
// track NULL = the whole year (both tracks).
async function insertAudience(groupId, audience) {
  if (!Array.isArray(audience) || audience.length === 0) return; // everyone
  const rows = [];
  for (const a of audience) {
    const y = a && a.academic_year != null ? String(a.academic_year) : null;
    if (!["1", "2", "3", "4"].includes(y)) continue;
    let t = a.track === "software" || a.track === "networks" ? a.track : null;
    if (!["3", "4"].includes(y)) t = null; // track only for years 3 & 4
    rows.push([groupId, y, t]);
  }
  if (rows.length) await promisePool.query("INSERT INTO group_audience (group_id, academic_year, track) VALUES ?", [rows]);
}

// SELECT fragment: a group's audience as "3:software,4:all" (NULL = everyone).
const AUDIENCE_SQL = `(SELECT GROUP_CONCAT(CONCAT(ga.academic_year, ':', COALESCE(ga.track,'all')) SEPARATOR ',')
                       FROM group_audience ga WHERE ga.group_id = g.id)`;

// =======================
// LIST GROUPS (role-aware)
//  student → approved groups targeted at their cohort (or everyone)
//  doctor/admin/investor → all approved groups (frontend segments them)
// =======================
exports.getAllGroups = async (req, res) => {
  try {
    const cohort = await getUserCohort(req.user);
    const where = ["g.status = 'approved'"];
    const params = [req.user.id];

    if (cohort) {
      // Visible if the group has no audience (everyone) OR matches the cohort.
      where.push(`(
        NOT EXISTS (SELECT 1 FROM group_audience ga WHERE ga.group_id = g.id)
        OR EXISTS (SELECT 1 FROM group_audience ga
                   WHERE ga.group_id = g.id AND ga.academic_year = ?
                     AND (ga.track IS NULL OR ga.track = ?))
      )`);
      params.push(cohort.year, cohort.track);
    }

    const [groups] = await promisePool.query(`
      SELECT g.*, ${AUDIENCE_SQL} AS audience,
        (SELECT COUNT(*) FROM Group_Members gm WHERE gm.group_id = g.id) AS members_count,
        EXISTS(SELECT 1 FROM Group_Members gm WHERE gm.group_id = g.id AND gm.user_id = ?) AS is_member
      FROM \`Groups\` g
      WHERE ${where.join(" AND ")}
      ORDER BY g.created_at DESC
    `, params);
    res.json({ message: "Groups fetched", data: groups.map(g => ({ ...g, is_member: !!g.is_member })) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// CREATE GROUP
//  students: 1 active group at a time, starts 'pending' (admin approves)
//  doctor/admin: created 'approved' immediately
// =======================
exports.createGroup = async (req, res) => {
  const { name, description, group_image, audience } = req.body;
  try {
    if (!name || !description) return res.status(400).json({ message: "Name and description are required" });

    if (req.user.role === "student") {
      const [[existing]] = await promisePool.query(
        "SELECT id FROM `Groups` WHERE creator_id = ? AND status IN ('pending','approved') LIMIT 1", [req.user.id]);
      if (existing) return res.status(409).json({ message: "You already have a group. Delete it before creating a new one." });
    }

    const status = req.user.role === "student" ? "pending" : "approved";
    const [result] = await promisePool.query(
      `INSERT INTO \`Groups\` (creator_id, name, description, group_image, is_private, status)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [req.user.id, name, description, group_image || null, status]);
    const groupId = result.insertId;

    await promisePool.query("INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'admin')", [groupId, req.user.id]);
    await insertAudience(groupId, audience);

    logEvent({ actorId: req.user.id, type: "group_create", targetType: "group", targetId: groupId, summary: `Created group "${name}"` });
    res.status(201).json({
      message: status === "pending" ? "submitted_for_review" : "created",
      status, groupId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.joinGroup = async (req, res) => {
  const group_id = req.body.group_id || req.params.id;
  try {
    if (!group_id) return res.status(400).json({ message: "group_id is required" });
    const [existing] = await promisePool.query("SELECT * FROM Group_Members WHERE group_id = ? AND user_id = ?", [group_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ message: "Already joined this group" });
    await promisePool.query("INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'member')", [group_id, req.user.id]);
    logEvent({ actorId: req.user.id, type: "group_join", targetType: "group", targetId: group_id, summary: "Joined a group" });
    res.json({ message: "Joined group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const [groups] = await promisePool.query(`
      SELECT g.*, (SELECT COUNT(*) FROM Group_Members gm2 WHERE gm2.group_id = g.id) AS members_count
      FROM \`Groups\` g
      WHERE g.id IN (SELECT group_id FROM Group_Members WHERE user_id = ?)
      ORDER BY g.created_at DESC
    `, [req.user.id]);
    res.json({ message: "My groups fetched", data: groups });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.leaveGroup = async (req, res) => {
  const group_id = req.body.group_id || req.params.id;
  try {
    if (!group_id) return res.status(400).json({ message: "group_id is required" });
    const [member] = await promisePool.query("SELECT * FROM Group_Members WHERE group_id = ? AND user_id = ?", [group_id, req.user.id]);
    if (member.length === 0) return res.status(400).json({ message: "You are not a member of this group" });
    await promisePool.query("DELETE FROM Group_Members WHERE group_id = ? AND user_id = ?", [group_id, req.user.id]);
    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const [groups] = await promisePool.query(`
      SELECT g.*, ${AUDIENCE_SQL} AS audience,
        (SELECT COUNT(*) FROM Group_Members gm WHERE gm.group_id = g.id) AS members_count,
        u.name AS creator_name, u.username AS creator_username
      FROM \`Groups\` g JOIN Users u ON g.creator_id = u.id
      WHERE g.id = ?
    `, [req.params.id]);
    if (groups.length === 0) return res.status(404).json({ message: "Group not found" });
    const group = groups[0];

    const [[mem]] = await promisePool.query(
      "SELECT role FROM Group_Members WHERE group_id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
    const isCreator = group.creator_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    // A pending/rejected group is only visible to its creator or an admin.
    if (group.status !== "approved" && !isCreator && !isAdmin) {
      return res.status(403).json({ message: "This group is not available" });
    }
    // Approved groups: students can only open ones targeted at their cohort.
    if (group.status === "approved" && req.user.role === "student" && !mem) {
      const cohort = await getUserCohort(req.user);
      if (cohort) {
        const [[vis]] = await promisePool.query(`
          SELECT (NOT EXISTS (SELECT 1 FROM group_audience ga WHERE ga.group_id = ?)
                  OR EXISTS (SELECT 1 FROM group_audience ga WHERE ga.group_id = ?
                             AND ga.academic_year = ? AND (ga.track IS NULL OR ga.track = ?))) AS ok`,
          [req.params.id, req.params.id, cohort.year, cohort.track]);
        if (!vis.ok) return res.status(403).json({ message: "This group is for a different cohort" });
      }
    }

    res.json({
      message: "Group fetched",
      data: { ...group, is_member: !!mem, my_role: mem ? mem.role : null, is_group_admin: (mem && mem.role === "admin") || isAdmin },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const [groups] = await promisePool.query("SELECT * FROM `Groups` WHERE id = ?", [req.params.id]);
    if (groups.length === 0) return res.status(404).json({ message: "Group not found" });
    if (groups[0].creator_id !== req.user.id && req.user.role !== "admin") return res.status(403).json({ message: "Not authorized" });
    await promisePool.query("DELETE FROM `Groups` WHERE id = ?", [req.params.id]);
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGroupMembers = async (req, res) => {
  try {
    const [members] = await promisePool.query(`
      SELECT u.id, u.username, u.name, u.profile_picture, gm.role, gm.joined_at
      FROM Group_Members gm JOIN Users u ON gm.user_id = u.id
      WHERE gm.group_id = ? ORDER BY gm.role DESC, gm.joined_at ASC
    `, [req.params.groupId]);
    res.json({ message: "Group members fetched", data: members });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// ADMIN — group approval
// =======================
exports.getPendingGroups = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only" });
    const [rows] = await promisePool.query(`
      SELECT g.*, ${AUDIENCE_SQL} AS audience, u.name AS creator_name, u.username AS creator_username
      FROM \`Groups\` g JOIN Users u ON g.creator_id = u.id
      WHERE g.status = 'pending' ORDER BY g.created_at ASC
    `);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectGroup = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only" });
    // Rejecting deletes the group so the student can create another.
    await promisePool.query("DELETE FROM `Groups` WHERE id = ? AND status = 'pending'", [req.params.id]);
    res.json({ message: "Group rejected" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveGroup = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only" });
    const gid = req.params.id;
    const [[group]] = await promisePool.query("SELECT g.*, u.name AS creator_name FROM `Groups` g JOIN Users u ON g.creator_id = u.id WHERE g.id = ?", [gid]);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await promisePool.query("UPDATE `Groups` SET status = 'approved' WHERE id = ?", [gid]);

    // Notify every student in the targeted cohort (or all students if the
    // group is open to everyone), except the creator.
    const [aud] = await promisePool.query("SELECT academic_year, track FROM group_audience WHERE group_id = ?", [gid]);
    let userSql, userParams;
    if (aud.length === 0) {
      userSql = "SELECT user_id FROM Profile_Studies WHERE academic_year IS NOT NULL";
      userParams = [];
    } else {
      const ors = aud.map(a => a.track ? "(academic_year = ? AND track = ?)" : "(academic_year = ?)");
      userParams = aud.flatMap(a => a.track ? [a.academic_year, a.track] : [a.academic_year]);
      userSql = `SELECT user_id FROM Profile_Studies WHERE ${ors.join(" OR ")}`;
    }
    const [targets] = await promisePool.query(userSql, userParams);
    const recipients = targets.map(t => t.user_id).filter(uid => uid !== group.creator_id);

    if (recipients.length) {
      const msg = `${group.creator_name} created a new group "${group.name}" — join if you're interested`;
      const values = recipients.map(uid => [uid, group.creator_id, "group", gid, msg]);
      await promisePool.query(
        "INSERT INTO Notifications (user_id, sender_id, type, reference_id, message) VALUES ?", [values]);
    }
    logEvent({ actorId: req.user.id, type: "group_create", targetType: "group", targetId: Number(gid), summary: `Approved group "${group.name}"` });
    res.json({ message: "Group approved", notified: recipients.length });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
