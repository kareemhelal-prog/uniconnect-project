const { promisePool } = require("../config/db");

// =======================
// CREATE GROUP POST
// =======================
exports.createGroupPost = async (req, res) => {

  const { group_id, content } = req.body;

  try {

    await promisePool.query(
      `
      INSERT INTO Group_Posts
      (group_id, user_id, content)

      VALUES (?, ?, ?)
      `,
      [group_id, req.user.id, content]
    );

    res.json({
      message: "Post created successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET GROUP POSTS
// =======================
exports.getGroupPosts = async (req, res) => {

  const { groupId } = req.params;

  try {

    const [posts] = await promisePool.query(
      `
      SELECT
        Group_Posts.*,
        Users.name,
        Users.profile_picture

      FROM Group_Posts

      INNER JOIN Users
      ON Group_Posts.user_id = Users.id

      WHERE Group_Posts.group_id = ?

      ORDER BY Group_Posts.created_at DESC
      `,
      [groupId]
    );

    res.json({
      message: "Posts fetched successfully",
      data: posts
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
