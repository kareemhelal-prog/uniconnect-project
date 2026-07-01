import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AcademicBackground from "../components/AcademicBackground";
import CourseIcon, { courseVisual } from "../components/CourseIcon";
import "../styles/CoursesPage.css";

const getToken = () => localStorage.getItem("token");
const getCurrentUser = () => {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
};

const SEMESTER_LABEL = (s) => (s ? `Semester ${s}` : "General");
const TRACK_LABEL = { software: "Software", networks: "Networks" };

const Icon = {
  search: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  cap: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  file: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  ),
  back: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  trash: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  doc: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" />
    </svg>
  ),
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtSize = (b) => {
  if (!b) return "";
  const kb = b / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

/* ═══════════════════════ Course card ═══════════════════════ */
function CourseCard({ course, onOpen }) {
  const vis = courseVisual(course);
  return (
    <button className="crs-card" style={{ "--c1": vis.c1, "--c2": vis.c2 }} onClick={() => onOpen(course)}>
      <div className="crs-card-banner">
        <span className="crs-card-glyph"><CourseIcon course={course} size={30} /></span>
        {course.course_code && <span className="crs-card-code">{course.course_code}</span>}
      </div>
      <div className="crs-card-body">
        <h3 className="crs-card-title">{course.title}</h3>
        <div className="crs-card-tags">
          {course.semester != null && <span className="crs-chip">{SEMESTER_LABEL(course.semester)}</span>}
          {course.track && <span className="crs-chip crs-chip-track">{TRACK_LABEL[course.track]}</span>}
        </div>
        <div className="crs-card-foot">
          <span className="crs-card-doc">
            <Icon.cap /> {course.doctor_name || "Unassigned"}
          </span>
          <span className="crs-card-mats">
            <Icon.file /> {Number(course.materials_count || 0)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════ Upload material modal (doctor) ═══════════════════════ */
function UploadMaterialModal({ course, onClose, onUploaded }) {
  const [pickedFile, setPickedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const submit = async () => {
    if (!pickedFile) { setError("Please choose a file first"); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", pickedFile);
      fd.append("course_id", course.id);
      if (title.trim()) fd.append("title", title.trim());
      if (description.trim()) fd.append("description", description.trim());
      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      onUploaded();
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="crs-modal-overlay" onClick={() => !uploading && onClose()}>
      <div className="crs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crs-modal-head">
          <h2>Add Material — {course.title}</h2>
          <button className="crs-modal-close" onClick={() => !uploading && onClose()}><Icon.close /></button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.zip,.rar,.txt"
          style={{ display: "none" }}
          onChange={(e) => setPickedFile(e.target.files[0] || null)}
        />
        <div className={`crs-dropzone ${pickedFile ? "has-file" : ""}`} onClick={() => inputRef.current?.click()}>
          <span className="crs-dz-icon"><Icon.doc width="28" height="28" /></span>
          <span className="crs-dz-name">{pickedFile ? pickedFile.name : "Click to choose a file"}</span>
          <span className="crs-dz-hint">{pickedFile ? "Click to change" : "PDF, DOC, PPT, XLSX, ZIP — up to 50MB"}</span>
        </div>

        <label className="crs-field-label">Title (optional)</label>
        <input
          className="crs-field"
          placeholder="e.g. Lecture 1 — Introduction"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="crs-field-label">What is this for? (description)</label>
        <textarea
          className="crs-field"
          rows={3}
          placeholder="e.g. Summary of chapter 1, exam revision, lab sheet..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="crs-modal-error">{error}</p>}

        <div className="crs-modal-actions">
          <button className="crs-btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="crs-btn-primary" onClick={submit} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Material"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Course detail (materials) ═══════════════════════ */
function CourseDetail({ courseId, me, onBack, onToast }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/courses/${courseId}`);
      setCourse(res.data.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this course");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [courseId]);

  const isOwnerDoctor = course && me?.role === "doctor" && course.doctor_id === me.id;
  const canManage = course && (me?.role === "admin" || isOwnerDoctor);

  const download = async (mat) => {
    try {
      const res = await fetch(`/api/files/${mat.id}/download`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = mat.file_name || "download";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      onToast("Could not download the file", "error");
    }
  };

  const removeMaterial = async (mat) => {
    if (!window.confirm(`Delete "${mat.file_name}"?`)) return;
    try {
      const res = await fetch(`/api/files/${mat.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      setCourse((c) => ({ ...c, materials: c.materials.filter((m) => m.id !== mat.id) }));
      onToast("Material deleted");
    } catch {
      onToast("Could not delete material", "error");
    }
  };

  const vis = course ? courseVisual(course) : { c1: "#64748b", c2: "#475569" };

  return (
    <div className="crs-detail">
      <button className="crs-back" onClick={onBack}><Icon.back /> All courses</button>

      {loading ? (
        <div className="crs-detail-loading"><div className="crs-spinner" /></div>
      ) : error ? (
        <div className="crs-empty">{error}</div>
      ) : (
        <>
          <div className="crs-detail-hero" style={{ "--c1": vis.c1, "--c2": vis.c2 }}>
            <span className="crs-detail-glyph"><CourseIcon course={course} size={40} /></span>
            <div className="crs-detail-hero-info">
              {course.course_code && <span className="crs-detail-code">{course.course_code}</span>}
              <h1 className="crs-detail-title">{course.title}</h1>
              <div className="crs-detail-meta">
                <span>{SEMESTER_LABEL(course.semester)}</span>
                <span className="crs-dot">·</span>
                <span>Year {course.academic_year}{course.track ? ` · ${TRACK_LABEL[course.track]}` : ""}</span>
                <span className="crs-dot">·</span>
                <span><Icon.cap /> {course.doctor_name || "Unassigned"}</span>
              </div>
            </div>
            {canManage && (
              <button className="crs-add-mat" onClick={() => setShowUpload(true)}>
                <Icon.plus /> Add Material
              </button>
            )}
          </div>

          {course.description && <p className="crs-detail-desc">{course.description}</p>}

          <div className="crs-mat-head">
            <h2>Materials & Summaries</h2>
            <span className="crs-mat-count">{course.materials.length}</span>
          </div>

          {course.materials.length === 0 ? (
            <div className="crs-empty">
              {canManage ? "No materials yet — click “Add Material” to upload the first one." : "No materials have been uploaded for this course yet."}
            </div>
          ) : (
            <div className="crs-mat-list">
              {course.materials.map((m) => (
                <div key={m.id} className="crs-mat-item">
                  <span className="crs-mat-icon"><Icon.doc /></span>
                  <div className="crs-mat-info">
                    <div className="crs-mat-name" title={m.file_name}>{m.file_name}</div>
                    {m.description && <div className="crs-mat-desc">{m.description}</div>}
                    <div className="crs-mat-sub">
                      {m.uploader_name || "—"} <span className="crs-dot">·</span> {fmtDate(m.created_at)}
                      {m.file_size ? <> <span className="crs-dot">·</span> {fmtSize(m.file_size)}</> : null}
                    </div>
                  </div>
                  <div className="crs-mat-actions">
                    <button className="crs-mat-dl" onClick={() => download(m)} title="Download"><Icon.download /></button>
                    {canManage && (
                      <button className="crs-mat-del" onClick={() => removeMaterial(m)} title="Delete"><Icon.trash /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showUpload && (
        <UploadMaterialModal
          course={course}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { onToast("Material uploaded"); load(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════ Page ═══════════════════════ */
const CoursesPage = () => {
  const me = getCurrentUser();
  const isDoctor = me?.role === "doctor";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = "My Courses | UniConnect";
    (async () => {
      setLoading(true);
      try {
        const res = await API.get("/courses/my");
        setCourses(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.course_code || "").toLowerCase().includes(q) ||
      (c.doctor_name || "").toLowerCase().includes(q)
    );
  });

  // Group by semester (ascending). Students see their two semesters; doctors
  // may span several years/semesters.
  const groups = {};
  for (const c of filtered) {
    const key = c.semester || 0;
    (groups[key] = groups[key] || []).push(c);
  }
  const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return (
    <div className="courses-page">
      <div className="courses-navbar-wrap"><Navbar /></div>
      <AcademicBackground />

      {toast && <div className={`courses-toast courses-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="courses-content">
        {openId ? (
          <CourseDetail
            courseId={openId}
            me={me}
            onBack={() => setOpenId(null)}
            onToast={showToast}
          />
        ) : (
          <>
            <div className="courses-header">
              <div className="courses-head-icon"><Icon.cap width="30" height="30" /></div>
              <h1 className="courses-title">My Courses</h1>
              <p className="courses-subtitle">
                {isDoctor
                  ? "The courses assigned to you. Open a course to upload materials and summaries for your students."
                  : "Your curriculum courses this year. Open a course to view its materials and summaries."}
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
              </div>
            </div>

            {loading ? (
              <div className="courses-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="crs-card crs-skeleton">
                    <div className="crs-sk-banner" />
                    <div className="crs-sk-line" />
                    <div className="crs-sk-line crs-sk-sm" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="courses-empty">
                {search
                  ? `No courses match "${search}"`
                  : isDoctor
                    ? "No courses have been assigned to you yet. Ask the admin to assign your courses."
                    : "No courses found for your cohort yet."}
              </div>
            ) : (
              groupKeys.map((sem) => (
                <section key={sem} className="crs-group">
                  <div className="crs-group-head">
                    <h2>{SEMESTER_LABEL(sem)}</h2>
                    <span className="crs-group-count">{groups[sem].length} courses</span>
                  </div>
                  <div className="courses-grid">
                    {groups[sem].map((course) => (
                      <CourseCard key={course.id} course={course} onOpen={(c) => setOpenId(c.id)} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
