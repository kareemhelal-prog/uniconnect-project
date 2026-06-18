import React, { useState } from "react";

import {
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  UserCog,
  XCircle,
} from "lucide-react";

import "../styles/UserInfo.css";

const usersData = [
  {
    id: 1,
    name: "Ahmed Ali",
    email: "ahmed@uniconnect.edu",
    phone: "+20 100000000",
    role: "Student",
    status: "Active",
    joinDate: "May 12, 2026",
    image: "https://i.pravatar.cc/150?img=1",
  },

  {
    id: 2,
    name: "Sara Mohamed",
    email: "sara@uniconnect.edu",
    phone: "+20 122222222",
    role: "Doctor",
    status: "Inactive",
    joinDate: "Apr 10, 2026",
    image: "https://i.pravatar.cc/150?img=2",
  },

  {
    id: 3,
    name: "Omar Khaled",
    email: "omar@uniconnect.edu",
    phone: "+20 111111111",
    role: "Admin",
    status: "Active",
    joinDate: "Mar 5, 2026",
    image: "https://i.pravatar.cc/150?img=3",
  },
];

const UserInfo = () => {

  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="users-container">

      <h1 className="users-title">
        User Management
      </h1>

      <div className="users-list">

        {usersData.map((user) => (

          <div
            key={user.id}
            className="user-card"
            onClick={() => setSelectedUser(user)}
          >

            <img
              src={user.image}
              alt="user"
              className="user-avatar"
            />

            <div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>

          </div>

        ))}

      </div>

      {selectedUser && (

        <div className="modal-overlay">

          <div className="modal-box">

            <button
              className="close-button"
              onClick={() => setSelectedUser(null)}
            >
              <XCircle size={24} />
            </button>

            {/* HEADER */}

            <div className="modal-header">

              <div className="header-left">

                <img
                  src={selectedUser.image}
                  alt="user"
                  className="modal-image"
                />

                <div>

                  <h2>{selectedUser.name}</h2>

                  <div className="user-status">

                    <span className="role-badge">
                      {selectedUser.role}
                    </span>

                    <span
                      className={
                        selectedUser.status === "Active"
                          ? "status active-status"
                          : "status inactive-status"
                      }
                    >
                      {selectedUser.status}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* BODY */}

            <div className="modal-content">

              {/* LEFT SIDE */}

              <div className="left-side">

                <div className="info-item">

                  <Mail size={18} />

                  <div>
                    <span>Email</span>
                    <p>{selectedUser.email}</p>
                  </div>

                </div>

                <div className="info-item">

                  <Phone size={18} />

                  <div>
                    <span>Phone</span>
                    <p>{selectedUser.phone}</p>
                  </div>

                </div>

                <div className="info-item">

                  <Calendar size={18} />

                  <div>
                    <span>Join Date</span>
                    <p>{selectedUser.joinDate}</p>
                  </div>

                </div>

                <div className="info-item">

                  <ShieldCheck size={18} />

                  <div>

                    <span>Account Status</span>

                    <p
                      className={
                        selectedUser.status === "Active"
                          ? "active"
                          : "inactive"
                      }
                    >
                      {selectedUser.status}
                    </p>

                  </div>

                </div>

              </div>

              {/* RIGHT SIDE */}

              <div className="right-side">

                <div>

                  <h3 className="role-title">

                    <UserCog size={18} />

                    Role Management

                  </h3>

                  <div className="roles-container">

                    <button
                      className={
                        selectedUser.role === "Student"
                          ? "role-btn active-role"
                          : "role-btn"
                      }
                    >
                      Student
                    </button>

                    <button
                      className={
                        selectedUser.role === "Doctor"
                          ? "role-btn active-role"
                          : "role-btn"
                      }
                    >
                      Doctor
                    </button>

                    <button
                      className={
                        selectedUser.role === "Admin"
                          ? "role-btn active-role"
                          : "role-btn"
                      }
                    >
                      Admin
                    </button>

                  </div>

                </div>

                <div className="buttons-section">

                  <button className="reset-password-btn">
                    Reset Password
                  </button>

                  <button
                    className="close-modal-btn"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default UserInfo;
