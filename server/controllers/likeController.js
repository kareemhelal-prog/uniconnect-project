const { promisePool } = require("../config/db");
const { notify } = require("../utils/notify");
const { emitToPost } = require("../config/socket");

// The reaction set a Like may carry (Facebook-style). Anything else is coerced
// to the neutral 'like' so the column can never hold junk.
const REACTIONS = ["like", "love", "haha", "wow", "sad", "angry"];

// =======================
// TOGGLE / SET REACTION  (like · love · haha · wow · sad · angry)
// =======================
// Rules: no existing reaction → add it. Same reaction again → remove it
// (toggle off). Different reaction → switch to it (stay reacted).
exports.toggleLike = async (req, res) => {
  const { post_id } = req.body;
  let reaction = String(req.body.reaction || "like").toLowerCase();
  if (!REACTIONS.includes(reaction)) reaction = "like";

  try {
    if (!post_id) {
      return res.status(400).json({ message: "post_id is required" });
    }

    const [existing] = await promisePool.query(
      "SELECT reaction FROM Likes WHERE user_id = ? AND post_id = ?",
      [req.user.id, post_id]
    );

    let liked, myReaction;

    if (existing.length > 0) {
      if (existing[0].reaction === reaction) {
        // Same reaction tapped again → remove. Leave any notification in place
        // so re-reacting later never re-notifies.
        await promisePool.query(
          "DELETE FROM Likes WHERE user_id = ? AND post_id = ?",
          [req.user.id, post_id]
        );
        liked = false; myReaction = null;
      } else {
        // Switch reaction — no new notification.
        await promisePool.query(
          "UPDATE Likes SET reaction = ? WHERE user_id = ? AND post_id = ?",
          [reaction, req.user.id, post_id]
        );
        liked = true; myReaction = reaction;
      }
    } else {
      await promisePool.query(
        "INSERT INTO Likes (user_id, post_id, reaction) VALUES (?, ?, ?)",
        [req.user.id, post_id, reaction]
      );
      liked = true; myReaction = reaction;

      const [[likedPost]] = await promisePool.query(
        "SELECT user_id FROM Posts WHERE id = ?", [post_id]
      );
      if (likedPost && Number(likedPost.user_id) !== Number(req.user.id)) {
        // One notification per (reactor, post) ever — skip if one already exists
        const [existingNotif] = await promisePool.query(
          "SELECT id FROM Notifications WHERE sender_id = ? AND reference_id = ? AND type = 'like' LIMIT 1",
          [req.user.id, post_id]
        );
        if (existingNotif.length === 0) {
          await notify({
            userId: likedPost.user_id,
            senderId: req.user.id,
            type: "like",
            message: "reacted to your post",
            referenceId: post_id,
          });
        }
      }
    }

    // Authoritative state from DB so the frontend + all clients stay in sync:
    // the total count and the distinct reactions present (most-popular first),
    // which drives the little emoji cluster next to the count.
    const [[countRow]] = await promisePool.query(
      "SELECT COUNT(*) AS likes FROM Likes WHERE post_id = ?", [post_id]
    );
    const [breakdown] = await promisePool.query(
      "SELECT reaction, COUNT(*) AS c FROM Likes WHERE post_id = ? GROUP BY reaction ORDER BY c DESC",
      [post_id]
    );
    const reactionTypes = breakdown.map((r) => r.reaction);

    // Real-time: broadcast the authoritative count + breakdown to everyone here.
    emitToPost(post_id, "post_reaction", {
      post_id: Number(post_id),
      likes: countRow.likes,
      reaction_types: reactionTypes,
      actor_id: req.user.id,
      liked,
    });

    res.json({
      message: liked ? "Reacted" : "Removed",
      liked,
      likes: countRow.likes,
      reaction: myReaction,
      reaction_types: reactionTypes,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET LIKES COUNT FOR POST
// =======================
exports.getLikesCount = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "SELECT COUNT(*) AS likesCount FROM Likes WHERE post_id = ?",
      [req.params.postId]
    );

    res.json({
      post_id: req.params.postId,
      likes: result[0].likesCount
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};