import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AcademicBackground from "../components/AcademicBackground";
import "../styles/CoursesPage.css";

const getCurrentUser = () => {
  try {
    const t = localStorage.getItem("token");
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
};

const Icon = {
  book: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  cap: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
};

const CoursesPage = () => {
  const me = getCurrentUser();
  const isDoctor = me?.role === "doctor";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [joining, setJoining] = useState(null);
  const [toast, setToast]     = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    document.title = "My Courses | UniConnect";
    fetchCourses();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Doctor sees the courses they teach; everyone else browses all courses
      const url = isDoctor ? "/courses/my" : "/courses";
      const res = await API.get(url);
      setCourses(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const enroll = async (e, course) => {
    e.stopPropagation();
    setJoining(course.id);
    try {
      await API.post(`/courses/${course.id}/join`);
      setCourses(prev => prev.map(c =>
        c.id === course.id
          ? { ...c, is_enrolled: 1, students_count: Number(c.students_count || 0) + 1 }
          : c
      ));
      showToast(`Enrolled in "${course.title}"`);
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setJoining(null);
    }
  };

  const createCourse = async () => {
    if (!form.title.trim()) { showToast("Course title is required", "error"); return; }
    setCreating(true);
    try {
      await API.post("/courses", { title: form.title.trim(), description: form.description.trim() || null });
      showToast(`Course "${form.title.trim()}" created`);
      setShowCreate(false);
      setForm({ title: "", description: "" });
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not create course", "error");
    } finally {
      setCreating(false);
    }
  };

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return (c.title || "").toLowerCase().includes(q) ||
           (c.description || "").toLowerCase().includes(q) ||
           (c.doctor_name || "").toLowerCase().includes(q);
  });

  return (
    <div className="courses-page">
      <div className="courses-navbar-wrap"><Navbar /></div>
      <AcademicBackground />

      {toast && <div className={`courses-toast courses-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="courses-content">
        <div className="courses-header">
          <div className="courses-head-icon"><Icon.cap width="30" height="30" /></div>
          <h1 className="courses-title">My Courses</h1>
          <p className="courses-subtitle">
            {isDoctor
              ? "The academic courses you teach. Create a course and share materials with your students."
              : "Official academic courses by your professors. Enroll to follow lectures, summaries, and materials."}
          </p>

          <div className="courses-toolbar">
            <div className="courses-search">
              <span className="courses-search-icon"><Icon.search /></span>
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isDoctor && (
              <button className="create-course-btn" onClick={() => setShowCreate(true)}>
                <Icon.plus /> New Course
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="courses-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="course-card course-skeleton">
                <div className="cs-line cs-line-lg" />
                <div className="cs-line" />
                <div className="cs-line cs-line-sm" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="courses-empty">
            {search
              ? `No courses match "${search}"`
              : isDoctor
                ? "You haven't created any courses yet. Click “New Course” to start."
                : "No courses available yet."}
          </div>
        ) : (
          <div className="courses-grid">
            {filtered.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-icon"><Icon.book /></div>
                <h2 className="course-title">{course.title}</h2>
                {course.description && <p className="course-desc">{course.description}</p>}

                <div className="course-meta">
                  {!isDoctor && course.doctor_name && (
                    <span className="course-doctor">
                      <Icon.cap /> {course.doctor_name}
                    </span>
                  )}
                  {typeof course.students_count !== "undefined" && (
                    <span className="course-students">
                      <Icon.users /> {Number(course.students_count || 0)} enrolled
                    </span>
                  )}
                </div>

                {isDoctor ? (
                  <div className="course-tag course-tag-teaching">Teaching</div>
                ) : course.is_enrolled ? (
                  <div className="course-tag course-tag-enrolled"><Icon.check /> Enrolled</div>
                ) : (
                  <button
                    className="enroll-btn"
                    onClick={(e) => enroll(e, course)}
                    disabled={joining === course.id}
                  >
                    {joining === course.id ? "Enrolling..." : "Enroll"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal (doctor) */}
      {showCreate && (
        <div className="courses-modal-overlay" onClick={() => !creating && setShowCreate(false)}>
          <div className="courses-modal" onClick={(e) => e.stopPropagation()}>
            <div className="courses-modal-head">
              <h2>New Course</h2>
              <button className="courses-modal-close" onClick={() => !creating && setShowCreate(false)}>✕</button>
            </div>

            <label className="courses-field-label">Course Title</label>
            <input
              className="courses-field"
              type="text"
              placeholder="e.g. Data Structures COMP-201"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />

            <label className="courses-field-label">Description</label>
            <textarea
              className="courses-field"
              rows={3}
              placeholder="What does this course cover?"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />

            <div className="courses-modal-actions">
              <button className="courses-btn-secondary" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
              <button className="courses-btn-primary" onClick={createCourse} disabled={creating}>
                {creating ? "Creating..." : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
