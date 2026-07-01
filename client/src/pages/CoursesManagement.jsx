import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Search, Plus, Pencil, Trash2, X,
  GraduationCap, FileText, AlertTriangle,
} from "lucide-react";
import api from "../api/axios";
import CourseIcon, { courseVisual } from "../components/CourseIcon";
import "../styles/CoursesManagement.css";

const YEARS = ["1", "2", "3", "4"];
const TRACKS = ["software", "networks"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const TRACK_LABEL = { software: "Software", networks: "Networks" };

// Which semesters belong to each year (for the modal's helper).
const YEAR_SEMS = { "1": [1, 2], "2": [3, 4], "3": [5, 6], "4": [7, 8] };

const emptyForm = {
  id: null, course_code: "", title: "", description: "",
  academic_year: "1", track: "", semester: "", doctor_id: "",
};

export default function CoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fYear, setFYear] = useState("");
  const [fTrack, setFTrack] = useState("");
  const [fSem, setFSem] = useState("");

  const [modal, setModal] = useState(null);        // form object or null
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fYear) params.append("year", fYear);
      if (fTrack) params.append("track", fTrack);
      if (fSem) params.append("semester", fSem);
      if (search) params.append("q", search);
      const res = await api.get(`/courses/admin?${params}`);
      setCourses(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  }, [fYear, fTrack, fSem, search]);

  useEffect(() => {
    document.title = "Courses - UniConnect Admin";
    api.get("/courses/admin/doctors").then((r) => setDoctors(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchCourses, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchCourses, search]);

  const openCreate = () => { setFormError(""); setModal({ ...emptyForm }); };
  const openEdit = (c) => {
    setFormError("");
    setModal({
      id: c.id,
      course_code: c.course_code || "",
      title: c.title || "",
      description: c.description || "",
      academic_year: String(c.academic_year || "1"),
      track: c.track || "",
      semester: c.semester != null ? String(c.semester) : "",
      doctor_id: c.doctor_id != null ? String(c.doctor_id) : "",
    });
  };

  const trackApplies = modal && ["3", "4"].includes(modal.academic_year);

  const save = async () => {
    if (!modal.title.trim()) { setFormError("Course title is required"); return; }
    setSaving(true);
    setFormError("");
    const payload = {
      course_code: modal.course_code.trim() || null,
      title: modal.title.trim(),
      description: modal.description.trim() || null,
      academic_year: modal.academic_year,
      track: trackApplies ? (modal.track || null) : null,
      semester: modal.semester || null,
      doctor_id: modal.doctor_id || null,
    };
    try {
      if (modal.id) await api.put(`/courses/admin/${modal.id}`, payload);
      else await api.post("/courses/admin", payload);
      setModal(null);
      showToast(modal.id ? "Course updated" : "Course created");
      fetchCourses();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save the course");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/courses/admin/${deleteTarget.id}`);
      setDeleteTarget(null);
      showToast("Course deleted");
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete course", "error");
    }
  };

  const clearFilters = () => { setSearch(""); setFYear(""); setFTrack(""); setFSem(""); };
  const hasFilters = search || fYear || fTrack || fSem;

  return (
    <div className="cm">
      {toast && <div className={`cm-toast cm-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="cm-head">
        <div className="cm-head-title">
          <span className="cm-head-icon"><BookOpen size={22} /></span>
          <div>
            <h1>Courses Management</h1>
            <p>Create the curriculum, assign one doctor per course, and control which cohort sees it.</p>
          </div>
        </div>
        <button className="cm-btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Filters */}
      <div className="cm-filters">
        <div className="cm-search">
          <Search size={15} className="cm-search-icon" />
          <input placeholder="Search by title or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={fYear} onChange={(e) => setFYear(e.target.value)}>
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select value={fTrack} onChange={(e) => setFTrack(e.target.value)}>
          <option value="">All tracks</option>
          {TRACKS.map((t) => <option key={t} value={t}>{TRACK_LABEL[t]}</option>)}
        </select>
        <select value={fSem} onChange={(e) => setFSem(e.target.value)}>
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        {hasFilters && <button className="cm-clear" onClick={clearFilters}>Clear</button>}
        <span className="cm-count">{courses.length} course{courses.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="cm-table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              <th>Course</th><th>Year</th><th>Track</th><th>Sem</th>
              <th>Assigned Doctor</th><th>Materials</th><th className="cm-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="cm-state"><div className="cm-spinner" /></td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={7} className="cm-state">No courses found.</td></tr>
            ) : (
              courses.map((c) => {
                const vis = courseVisual(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="cm-course-cell">
                        <span className="cm-course-glyph" style={{ background: `linear-gradient(135deg, ${vis.c1}, ${vis.c2})` }}>
                          <CourseIcon course={c} size={18} />
                        </span>
                        <div className="cm-course-text">
                          <span className="cm-course-title">{c.title}</span>
                          {c.course_code && <span className="cm-course-code">{c.course_code}</span>}
                        </div>
                      </div>
                    </td>
                    <td>Year {c.academic_year}</td>
                    <td>{c.track ? <span className="cm-badge">{TRACK_LABEL[c.track]}</span> : <span className="cm-muted">— shared —</span>}</td>
                    <td>{c.semester ?? "—"}</td>
                    <td>
                      {c.doctor_name ? (
                        <span className="cm-doc"><GraduationCap size={14} /> {c.doctor_name}</span>
                      ) : (
                        <span className="cm-unassigned">Unassigned</span>
                      )}
                    </td>
                    <td><span className="cm-mats"><FileText size={13} /> {Number(c.materials_count || 0)}</span></td>
                    <td className="cm-actions">
                      <button className="cm-icon-btn" onClick={() => openEdit(c)} title="Edit"><Pencil size={15} /></button>
                      <button className="cm-icon-btn cm-danger" onClick={() => setDeleteTarget(c)} title="Delete"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div className="cm-modal-overlay" onClick={() => !saving && setModal(null)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-head">
              <h2>{modal.id ? "Edit Course" : "New Course"}</h2>
              <button className="cm-modal-close" onClick={() => !saving && setModal(null)}><X size={18} /></button>
            </div>

            <div className="cm-form-grid">
              <div className="cm-field cm-col-2">
                <label>Course Title *</label>
                <input value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="e.g. Data Structures" />
              </div>
              <div className="cm-field">
                <label>Course Code</label>
                <input value={modal.course_code} onChange={(e) => setModal({ ...modal, course_code: e.target.value })} placeholder="e.g. IT404" />
              </div>
              <div className="cm-field">
                <label>Academic Year *</label>
                <select
                  value={modal.academic_year}
                  onChange={(e) => {
                    const y = e.target.value;
                    setModal((m) => ({
                      ...m,
                      academic_year: y,
                      track: ["3", "4"].includes(y) ? m.track : "",
                    }));
                  }}
                >
                  {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="cm-field">
                <label>Track {trackApplies ? "" : "(years 3 & 4 only)"}</label>
                <select value={modal.track} onChange={(e) => setModal({ ...modal, track: e.target.value })} disabled={!trackApplies}>
                  <option value="">{trackApplies ? "Both tracks (shared)" : "— n/a —"}</option>
                  {TRACKS.map((t) => <option key={t} value={t}>{TRACK_LABEL[t]}</option>)}
                </select>
              </div>
              <div className="cm-field">
                <label>Semester</label>
                <select value={modal.semester} onChange={(e) => setModal({ ...modal, semester: e.target.value })}>
                  <option value="">—</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}{YEAR_SEMS[modal.academic_year]?.includes(s) ? "" : " ⚠"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cm-field cm-col-2">
                <label>Assigned Doctor</label>
                <select value={modal.doctor_id} onChange={(e) => setModal({ ...modal, doctor_id: e.target.value })}>
                  <option value="">— Unassigned —</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.username})</option>)}
                </select>
              </div>
              <div className="cm-field cm-col-2">
                <label>Description</label>
                <textarea rows={3} value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} placeholder="What does this course cover?" />
              </div>
            </div>

            {formError && <p className="cm-form-error">{formError}</p>}

            <div className="cm-modal-actions">
              <button className="cm-btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="cm-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : modal.id ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="cm-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="cm-modal cm-confirm" onClick={(e) => e.stopPropagation()}>
            <span className="cm-confirm-icon"><AlertTriangle size={26} /></span>
            <h2>Delete course?</h2>
            <p>“{deleteTarget.title}” will be removed. Its uploaded materials will stay in the Files library but detached from this course.</p>
            <div className="cm-modal-actions">
              <button className="cm-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="cm-btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
