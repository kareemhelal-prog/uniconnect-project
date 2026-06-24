import React, { useState } from "react";
import "./RightSidebar.css";

const subjects = [
  { id: 1, name: "اكتب هنا 1", icon: "🤖", color: "#a78bfa" },
  { id: 2, name: "اكتب هنا 2", icon: "🏛️", color: "#60a5fa" },
  { id: 3, name: "اكتب هنا 3", icon: "⚗️", color: "#34d399" },
  { id: 4, name: "اكتب هنا 4", icon: "📊", color: "#fbbf24" },
  { id: 5, name: "اكتب هنا 5", icon: "📐", color: "#f87171" },
  { id: 6, name: "اكتب هنا 6", icon: "⚡", color: "#38bdf8" },
];

const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

const todayReal = new Date();
const todayId = `${todayReal.getFullYear()}-${String(
  todayReal.getMonth() + 1
).padStart(2, "0")}-${String(todayReal.getDate()).padStart(2, "0")}`;

const RightSidebar = ({ importantDays = [] }) => {
  const importantSet = new Set(importantDays);

  const [hovered, setHovered] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayState, setSelectedDayState] = useState({
    id: todayId,
    year: todayReal.getFullYear(),
    month: todayReal.getMonth(),
    day: todayReal.getDate(),
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const getCalendarDays = () => {
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    const currentMonthLastDate = new Date(year, month + 1, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pMonth = month === 0 ? 11 : month - 1;
      const pYear = month === 0 ? year - 1 : year;
      const dValue = prevMonthLastDate - i;
      const dayId = `${pYear}-${String(pMonth + 1).padStart(2, "0")}-${String(
        dValue
      ).padStart(2, "0")}`;
      days.push({ id: dayId, d: dValue, muted: true });
    }

    for (let i = 1; i <= currentMonthLastDate; i++) {
      const dayId = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      days.push({ id: dayId, d: i, muted: false });
    }

    const totalSlots = 42;
    const nextMonthDaysNeeded = totalSlots - days.length;
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      const nMonth = month === 11 ? 0 : month + 1;
      const nYear = month === 11 ? year + 1 : year;
      const dayId = `${nYear}-${String(nMonth + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      days.push({ id: dayId, d: i, muted: true });
    }

    return days;
  };

  const calDays = getCalendarDays();

  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  return (
    <aside className="right-sidebar">
      <div className="subjects-section">
        <h3 className="section-title">Subject Groups</h3>
        <div className="subjects-grid">
          {subjects.map((s, i) => {
            const isActive = hovered === i;
            return (
              <div
                key={s.id}
                className={`subject-card ${
                  isActive ? "subject-card--active" : ""
                }`}
                style={{
                  "--card-color": s.color,
                  borderColor: isActive ? s.color : `${s.color}33`,
                  background: isActive ? `${s.color}12` : "none",
                  boxShadow: isActive ? `0 0 10px ${s.color}33` : "none",
                  color: isActive ? s.color : "#888",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="subject-icon">{s.icon}</span>
                <span className="subject-name">{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-section">
        <div className="calendar-header">
          <h3 className="section-title" style={{ margin: 0 }}>
            {monthName} {year}
          </h3>
          <div style={{ display: "flex", gap: "4px" }}>
            <button className="cal-arrow" onClick={handlePrevMonth}>
              ‹
            </button>
            <button className="cal-arrow" onClick={handleNextMonth}>
              ›
            </button>
          </div>
        </div>

        <div className="cal-day-names">
          {dayNames.map((d, i) => (
            <div key={i} className="cal-dname">
              {d}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {calDays.map((item) => {
            const isSelected = selectedDayState.id === item.id && !item.muted;
            const isToday = item.id === todayId && !item.muted;
            const isImportant = importantSet.has(item.id) && !item.muted;

            let className = "cal-day";
            if (item.muted) className += " muted";
            if (isToday) className += " today";
            if (isImportant && !isSelected) className += " important";
            if (isSelected) className += " selected";

            return (
              <div
                key={item.id}
                data-day-id={item.id}
                className={className}
                onClick={() =>
                  !item.muted &&
                  setSelectedDayState({
                    id: item.id,
                    year,
                    month,
                    day: item.d,
                  })
                }
              >
                {item.d}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
