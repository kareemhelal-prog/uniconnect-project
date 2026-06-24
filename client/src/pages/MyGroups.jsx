import { useEffect, useState } from "react";

import API from "../api/axios";

import "../styles/MyGroups.css";

const MyGroups = () => {

  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  // =======================
  // FETCH MY GROUPS
  // =======================
  const fetchMyGroups = async () => {

    try {

      const response = await API.get("/groups/my-groups");

      setGroups(response.data.data);

    } catch (error) {

      console.error(error);
    }
  };

  // =======================
  // LEAVE GROUP
  // =======================
  const leaveGroup = async (groupId) => {

    try {

      await API.delete("/groups/leave", {
        data: {
          group_id: groupId
        }
      });

      alert("Left group successfully");

      // refresh page data
      fetchMyGroups();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Something went wrong"
      );
    }
  };

  return (

    <div className="mygroups-page">

      {/* =======================
          PAGE HEADER
      ======================== */}
      <div className="mygroups-header">

        <h1 className="mygroups-title">
          My Groups
        </h1>

        <p className="mygroups-subtitle">
          Groups you joined and communities you follow.
        </p>

      </div>

      {/* =======================
          GROUPS CONTAINER
      ======================== */}
      <div className="mygroups-container">

        {groups.length > 0 ? (

          groups.map((group) => (

            <div
              className="mygroup-card"
              key={group.id}
            >

              {/* GROUP IMAGE */}
              <img
                src={
                  group.group_image ||
                  "https://via.placeholder.com/400x200"
                }
                alt={group.name}
                className="mygroup-image"
              />

              {/* GROUP CONTENT */}
              <div className="mygroup-content">

                <h2>
                  {group.name}
                </h2>

                <p>
                  {group.description}
                </p>

                <span>
                  👥 {group.members_count || 0} Members
                </span>

                {/* LEAVE BUTTON */}
                <button
                  className="view-group-btn"
                  onClick={() => leaveGroup(group.id)}
                >
                  Leave Group
                </button>

              </div>

            </div>

          ))

        ) : (

          // EMPTY STATE
          <div className="empty-groups">

            <h2>
              No Groups Joined Yet
            </h2>

            <p>
              Join groups to see them here.
            </p>

          </div>

        )}

      </div>

    </div>
  );
};

export default MyGroups;
