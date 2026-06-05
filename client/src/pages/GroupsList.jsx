import { useEffect, useState } from "react";
import API from "../api/axios";

import "../styles/GroupsList.css";

const GroupsList = () => {

  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  // =======================
  // FETCH GROUPS
  // =======================
  const fetchGroups = async () => {

    try {

      const response = await API.get("/groups");

      setGroups(response.data.data);

    } catch (error) {

      console.error(error);
    }
  };

  // =======================
  // JOIN GROUP
  // =======================
  const joinGroup = async (groupId) => {

    try {

      await API.post("/groups/join", {
        group_id: groupId
      });

      alert("Joined successfully");

      // refresh groups
      fetchGroups();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        "Something went wrong"
      );
    }
  };

  return (

    <div className="groups-page">

      <div className="groups-header">

        <h1 className="groups-title">
          Student Groups
        </h1>

        <p className="groups-subtitle">
          Explore communities, collaborate with students,
          and join groups that match your interests.
        </p>

      </div>

      <div className="groups-container">

        {groups.map((group) => (

          <div
            className="group-card"
            key={group.id}
          >

            <img
              src={
                group.group_image ||
                "https://via.placeholder.com/400x200"
              }
              alt={group.name}
              className="group-image"
            />

            <div className="group-content">

              <h2>
                {group.name}
              </h2>

              <p>
                {group.description}
              </p>

              <span>
                👥 {group.members_count || 0} Members
              </span>

              <button
                className="join-btn"
                onClick={() => joinGroup(group.id)}
              >
                Join Group
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default GroupsList;
