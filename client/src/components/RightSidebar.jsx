import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CourseIcon, { courseVisual } from "./CourseIcon";
import "./RightSidebar.css";

const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

const todayReal = new Date();
const todayId = `${todayReal.getFullYear()}-${String(
  todayReal.getMonth() + 1
).padStart(2, "0")}-${String(todayReal.getDate()).padStart(2, "0")}`;

const RightSidebar = ({ importantDays = [] }) => {
  const importantSet = new Set(importantDays);
  const navigate = useNavigate();

  const [hovered, setHovered] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Real courses for the "My Courses" shortcut (student's cohort / doctor's assigned).
  useEffect(() => {
    let alive = true;
    api.get("/courses/my")
      .then((r) => { if (alive) setCourses((r.data.data || []).slice(0, 6)); })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingCourses(false); });
    return () => { alive = false; };
  }, []);
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
        <div className="subjects-head">
          <h3 className="section-title">My Courses</h3>
          <button className="subjects-viewall" onClick={() => navigate("/courses")}>
            View all
          </button>
        </div>

        {loadingCourses ? (
          <div className="subjects-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="subject-card subject-card--skeleton" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="subjects-empty">No courses yet</p>
        ) : (
          <div className="subjects-grid">
            {courses.map((c, i) => {
              const vis = courseVisual(c);
              const isActive = hovered === i;
              return (
                <div
                  key={c.id}
                  className={`subject-card ${isActive ? "subject-card--active" : ""}`}
                  style={{
                    "--card-color": vis.c1,
                    borderColor: isActive ? vis.c1 : `${vis.c1}33`,
                    background: isActive ? `${vis.c1}12` : "none",
                    boxShadow: isActive ? `0 0 10px ${vis.c1}33` : "none",
                    color: isActive ? vis.c1 : "var(--text-muted, #888)",
                  }}
                  title={c.title}
                  onClick={() => navigate("/courses")}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="subject-icon" style={{ color: vis.c1 }}>
                    <CourseIcon course={c} size={18} />
                  </span>
                  <span className="subject-name">{c.course_code || c.title}</span>
                </div>
              );
            })}
          </div>
        )}
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
