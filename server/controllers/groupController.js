const { promisePool } = require("../config/db");

exports.getAllGroups = async (req, res) => {
  try {
    const [groups] = await promisePool.query(`
      SELECT
        \`Groups\`.*,
        COUNT(Group_Members.user_id) AS members_count
      FROM \`Groups\`
      LEFT JOIN Group_Members ON \`Groups\`.id = Group_Members.group_id
      GROUP BY \`Groups\`.id
      ORDER BY \`Groups\`.created_at DESC
    `);
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

    const [result] = await promisePool.query(
      `INSERT INTO \`Groups\` (creator_id, name, description, group_image, is_private)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, name, description, group_image || null, is_private || false]
    );

    await promisePool.query(
      `INSERT INTO Group_Members (group_id, user_id, role) VALUES (?, ?, 'admin')`,
      [result.insertId, req.user.id]
    );

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