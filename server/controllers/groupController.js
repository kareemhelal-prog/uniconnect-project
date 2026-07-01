const { promisePool } = require("../config/db");
const { logEvent } = require("../utils/logEvent");
const { getUserCohort, buildCohortFilter, canViewCohort } = require("../utils/cohort");

exports.getAllGroups = async (req, res) => {
  try {
    // Cohort segregation: students only see their own cohort's groups (+ global).
    const cohort = await getUserCohort(req.user);
    const filter = buildCohortFilter("`Groups`", cohort);
    const whereSql = filter ? `WHERE ${filter.clause}` : "";
    const filterParams = filter ? filter.params : [];

    const [groups] = await promisePool.query(`
      SELECT
        \`Groups\`.*,
        COUNT(Group_Members.user_id) AS members_count,
        EXISTS(
          SELECT 1 FROM Group_Members gm
          WHERE gm.group_id = \`Groups\`.id AND gm.user_id = ?
        ) AS is_member
      FROM \`Groups\`
      LEFT JOIN Group_Members ON \`Groups\`.id = Group_Members.group_id
      ${whereSql}
      GROUP BY \`Groups\`.id
      ORDER BY \`Groups\`.created_at DESC
    `, [req.user.id, ...filterParams]);
    res.json({ message: "Groups fetched successfully", data: groups });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createGroup = async (req, res) => {
  const { name, description, group_image, is_private } = req.body;
  try {
    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    // Tag the group with its cohort (student → own cohort; others → global).
    let gYear = null, gTrack = null;
    if (req.user.role === "student") {
      const cohort = await getUserCohort(req.user);
      if (cohort) { gYear = cohort.year; gTrack = cohort.track; }
    }

    const [result] = await promisePool.query(
      `INSERT INTO \`Groups\` (creator_id, name, description, group_image, is_private, academic_year, track)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, description, group_image || null, is_private || false, gYear, gTrack]
    );

    await promisePool.query(
      `INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'admin')`,
      [result.insertId, req.user.id]
    );

    logEvent({ actorId: req.user.id, type: "group_create", targetType: "group", targetId: result.insertId, summary: `Created group "${name}"` });

    res.status(201).json({ message: "Group created successfully", groupId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.joinGroup = async (req, res) => {
  const { group_id } = req.body;
  try {
    if (!group_id) {
      return res.status(400).json({ message: "group_id is required" });
    }

    const [existing] = await promisePool.query(
      `SELECT * FROM Group_Members WHERE group_id = ? AND user_id = ?`,
      [group_id, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Already joined this group" });
    }

    await promisePool.query(
      `INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'member')`,
      [group_id, req.user.id]
    );

    logEvent({ actorId: req.user.id, type: "group_join", targetType: "group", targetId: group_id, summary: "Joined a group" });

    res.json({ message: "Joined group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const [groups] = await promisePool.query(`
      SELECT
        \`Groups\`.*,
        COUNT(Group_Members.user_id) AS members_count
      FROM \`Groups\`
      INNER JOIN Group_Members ON \`Groups\`.id = Group_Members.group_id
      WHERE \`Groups\`.id IN (
        SELECT group_id FROM Group_Members WHERE user_id = ?
      )
      GROUP BY \`Groups\`.id
      ORDER BY \`Groups\`.created_at DESC
    `, [req.user.id]);

    res.json({ message: "My groups fetched successfully", data: groups });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.leaveGroup = async (req, res) => {
  const { group_id } = req.body;
  try {
    if (!group_id) {
      return res.status(400).json({ message: "group_id is required" });
    }

    const [member] = await promisePool.query(
      `SELECT * FROM Group_Members WHERE group_id = ? AND user_id = ?`,
      [group_id, req.user.id]
    );

    if (member.length === 0) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    await promisePool.query(
      `DELETE FROM Group_Members WHERE group_id = ? AND user_id = ?`,
      [group_id, req.user.id]
    );

    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const [groups] = await promisePool.query(`
      SELECT
        \`Groups\`.*,
        COUNT(Group_Members.user_id) AS members_count,
        u.name AS creator_name,
        u.username AS creator_username,
        u.profile_picture AS creator_avatar
      FROM \`Groups\`
      LEFT JOIN Group_Members ON \`Groups\`.id = Group_Members.group_id
      JOIN Users u ON \`Groups\`.creator_id = u.id
      WHERE \`Groups\`.id = ?
      GROUP BY \`Groups\`.id
    `, [req.params.id]);

    if (groups.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Cohort guard: a student can't open another cohort's group by id.
    const cohort = await getUserCohort(req.user);
    if (!canViewCohort(cohort, groups[0])) {
      return res.status(403).json({ message: "This group belongs to a different cohort" });
    }

    res.json({ message: "Group fetched", data: groups[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const [groups] = await promisePool.query(
      "SELECT * FROM `Groups` WHERE id = ?", [req.params.id]
    );

    if (groups.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (groups[0].creator_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await promisePool.query("DELETE FROM `Groups` WHERE id = ?", [req.params.id]);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGroupMembers = async (req, res) => {
  try {
    const [members] = await promisePool.query(`
      SELECT
        u.id, u.username, u.name, u.profile_picture,
        gm.role, gm.joined_at
      FROM Group_Members gm
      JOIN Users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.role DESC, gm.joined_at ASC
    `, [req.params.groupId]);

    res.json({ message: "Group members fetched successfully", data: members });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};