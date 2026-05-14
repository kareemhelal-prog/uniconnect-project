import React from "react";
import "./RightSidebar.css";

const subjects = [
  { name: "Advanced Robotics",  icon: "🤖", bg: "linear-gradient(135deg, #4c1d95, #6d28d9)" },
  { name: "Modern History",     icon: "🏛️", bg: "linear-gradient(135deg, #1e3a8a, #1d4ed8)" },
  { name: "Organic Chemistry",  icon: "⚗️", bg: "linear-gradient(135deg, #064e3b, #059669)" },
  { name: "Data Science",       icon: "📊", bg: "linear-gradient(135deg, #78350f, #d97706)" },
];

const calDays   = [30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1];
const dayNames  = ["S","M","T","W","T","F","S"];
const today     = 3;

const RightSidebar = () => {
  return (
    <aside className="right-sidebar">

      {/* Subject Groups */}
      <div className="subjects-section">
        <h3 className="section-title">Subject Groups</h3>
        <div className="subjects-grid">
          {subjects.map((s, i) => (
            <div key={i} className="subject-card" style={{ background: s.bg }}>
              <span className="subject-icon">{s.icon}</span>
              <span className="subject-name">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-section">
        <div className="calendar-header">
          <h3 className="section-title" style={{ margin: 0 }}>Upcoming Events</h3>
          <button className="cal-arrow">›</button>
        </div>
        <div className="cal-day-names">
          {dayNames.map((d, i) => (
            <div key={i} className="cal-dname">{d}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {calDays.map((d, i) => {
            const isMuted  = i < 2 || i > 31;
            const isToday  = d === today && !isMuted;
            return (
              <div
                key={i}
                className={`cal-day ${isToday ? "today" : ""} ${isMuted ? "muted" : ""}`}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
};

export default RightSidebar;
