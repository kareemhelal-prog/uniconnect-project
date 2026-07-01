// Files.jsx
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import '../styles/Files.css';

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");
const ITEMS_PER_PAGE = 8;

const getCurrentUser = () => {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split('.')[1]));
  } catch {
    return null;
  }
};

const SUBJECTS = ['Data Structures', 'Operating Systems', 'Machine Learning',
  'DBMS', 'Computer Networks', 'Discrete Math', 'Software Engineering',
  'Algorithms', 'Theory of Computation', 'Mathematics', 'Physics', 'General'];

const YEARS = ['1', '2', '3', '4'];
const FILE_TYPES = ['All File Types', 'pdf', 'doc', 'ppt', 'docx', 'xlsx'];
const YEAR_LABELS = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };

// Accent colour per extension
const TYPE_COLOR = {
  PDF: '#ef4444', DOC: '#3b82f6', DOCX: '#3b82f6',
  PPT: '#f59e0b', PPTX: '#f59e0b', XLSX: '#10b981', FILE: '#94a3b8',
};

/* ───────── Inline icons (no emoji) ───────── */
const Icon = {
  search: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  upload: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
    </svg>
  ),
  heart: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" {...p}>
      <path d="M12 21s-7.5-4.6-10-9.2C.6 9 1.6 5.6 4.6 4.8 6.6 4.3 8.6 5 12 8c3.4-3 5.4-3.7 7.4-3.2 3 .8 4 4.2 2.6 7C19.5 16.4 12 21 12 21z" />
    </svg>
  ),
  comment: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-4.7A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  ),
  trash: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  ),
  calendar: (p) => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  doc: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8M8 9h2" />
    </svg>
  ),
  star: ({ filled, ...p }) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" {...p}>
      <path d="m12 2 3 6.5 7 .8-5.2 4.8L18.2 21 12 17.3 5.8 21 7.2 14.1 2 9.3l7-.8z" />
    </svg>
  ),
};

/* Floating academic doodles for the background */
const BgDecor = ({ decorRef }) => (
  <div className="bg-decor" aria-hidden="true" ref={decorRef}>
    {/* book */}
    <svg className="doodle d1" viewBox="0 0 64 64" width="70" height="70"><path d="M10 14c8-4 18-4 22 0 4-4 14-4 22 0v40c-8-4-18-4-22 0-4-4-14-4-22 0z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M32 14v40" stroke="currentColor" strokeWidth="2.5"/></svg>
    {/* pencil */}
    <svg className="doodle d2" viewBox="0 0 64 64" width="58" height="58"><path d="M48 8l8 8-32 32-10 2 2-10z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M42 14l8 8" stroke="currentColor" strokeWidth="2.5"/></svg>
    {/* paper / notes */}
    <svg className="doodle d3" viewBox="0 0 64 64" width="60" height="60"><rect x="14" y="8" width="36" height="48" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M22 20h20M22 30h20M22 40h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
    {/* graduation cap */}
    <svg className="doodle d4" viewBox="0 0 64 64" width="72" height="72"><path d="M4 24 32 12l28 12-28 12z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M16 30v12c0 4 32 4 32 0V30" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>
    {/* lightbulb */}
    <svg className="doodle d5" viewBox="0 0 64 64" width="52" height="52"><path d="M24 44a14 14 0 1 1 16 0c-2 2-3 4-3 7H27c0-3-1-5-3-7z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M26 56h12M28 60h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
    {/* ruler */}
    <svg className="doodle d6" viewBox="0 0 64 64" width="60" height="60"><rect x="6" y="20" width="52" height="20" rx="3" transform="rotate(20 32 30)" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>
    {/* open book 2 */}
    <svg className="doodle d7" viewBox="0 0 64 64" width="64" height="64"><rect x="12" y="14" width="40" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M20 24h10M20 32h10M34 24h10M34 32h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
    {/* pen 2 */}
    <svg className="doodle d8" viewBox="0 0 64 64" width="50" height="50"><path d="M16 48l4-12 24-24 8 8-24 24z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg>
  </div>
);

const Files = () => {
  const me = getCurrentUser();
  const isStaff = me && (me.role === 'doctor' || me.role === 'admin');

  const [files, setFiles] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [uploadCourse, setUploadCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedFileType, setSelectedFileType] = useState('All File Types');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ subject: '', year: '', description: '' });
  const [pickedFile, setPickedFile] = useState(null);
  const fileInputRef = useRef(null);
  const decorRef = useRef(null);

  // Parallax: nudge the background doodles with the mouse
  const handlePageMove = (e) => {
    if (!decorRef.current) return;
    const dx = (e.clientX / window.innerWidth - 0.5) * -28;
    const dy = (e.clientY / window.innerHeight - 0.5) * -28;
    decorRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  // Spotlight glow + subtle 3D tilt following the cursor inside a card
  const handleCardMove = (e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    card.style.setProperty('--ry', `${((x / r.width) - 0.5) * 7}deg`);
    card.style.setProperty('--rx', `${((y / r.height) - 0.5) * -7}deg`);
  };

  const handleCardLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  useEffect(() => {
    document.title = "Files - UniConnect";
    fetchFiles();
  }, [selectedSubject, selectedYear, selectedFileType]);

  // A doctor/admin can attach an upload to one of their assigned courses; the
  // course encodes the batch (year/track), so the file lands in that cohort.
  useEffect(() => {
    if (!isStaff) return;
    fetch(`${API_BASE}/courses/my`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setMyCourses(d.data || []))
      .catch(() => {});
  }, [isStaff]);

  useEffect(() => setCurrentPage(1), [searchTerm, selectedSubject, selectedYear, selectedFileType]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== 'All Subjects') params.append('subject', selectedSubject);
      if (selectedYear !== 'All Years') params.append('year', selectedYear);
      if (selectedFileType !== 'All File Types') params.append('file_type', selectedFileType);

      const res = await fetch(`${API_BASE}/files?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      const list = (data.data || []).map(f => ({
        ...f,
        liked_by_me: !!f.liked_by_me,
        likes_count: Number(f.likes_count || 0),
      }));
      setFiles(list);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (file) => {
    const wasLiked = file.liked_by_me;
    setFiles(prev => prev.map(f =>
      f.id === file.id
        ? { ...f, liked_by_me: !wasLiked, likes_count: f.likes_count + (wasLiked ? -1 : 1) }
        : f
    ));
    try {
      const res = await fetch(`${API_BASE}/files/${file.id}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok && res.status !== 409 && res.status !== 404) throw new Error();
    } catch {
      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? { ...f, liked_by_me: wasLiked, likes_count: f.likes_count + (wasLiked ? 1 : -1) }
          : f
      ));
    }
  };

  const handleDownload = async (file) => {
    try {
      // Fetch with the auth header (window.open can't send it), then save the
      // blob locally — the same approach used by production apps for protected files.
      const res = await fetch(`${API_BASE}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, download_count: Number(f.download_count || 0) + 1 } : f
      ));
      showToast(`Downloaded "${file.file_name}"`);
    } catch {
      showToast('Could not download the file', 'error');
    }
  };

  const canDelete = (file) =>
    me && (Number(file.uploader_id) === Number(me.id) || me.role === 'admin');

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.file_name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/files/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error();
      setFiles(prev => prev.filter(f => f.id !== file.id));
      showToast('File deleted');
    } catch {
      showToast('Could not delete the file', 'error');
    }
  };

  const openUpload = () => {
    setUploadForm({
      subject: selectedSubject !== 'All Subjects' ? selectedSubject : '',
      year:    selectedYear !== 'All Years' ? selectedYear : '',
      description: '',
    });
    setUploadCourse('');
    setPickedFile(null);
    setShowUpload(true);
  };

  const submitUpload = async () => {
    if (!pickedFile) { showToast('Please choose a file first', 'error'); return; }

    const formData = new FormData();
    formData.append('file', pickedFile);
    // When a course is chosen, the backend derives the cohort from it, so the
    // year/subject fields are optional context.
    if (uploadCourse)           formData.append('course_id', uploadCourse);
    if (uploadForm.subject)     formData.append('subject', uploadForm.subject);
    if (uploadForm.year)        formData.append('academic_year', uploadForm.year);
    if (uploadForm.description) formData.append('description', uploadForm.description);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      showToast(`"${pickedFile.name}" uploaded successfully`);
      setShowUpload(false);
      fetchFiles();
    } catch {
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const name = file.file_name || '';
    const uploader = file.uploader_name || file.uploader_username || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uploader.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedFiles = filteredFiles.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fileExt = (name) => {
    const m = (name || '').match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toUpperCase() : 'FILE';
  };
  const typeColor = (name) => TYPE_COLOR[fileExt(name)] || TYPE_COLOR.FILE;

  const Stars = ({ value }) => {
    const r = Math.round(value || 0);
    return (
      <span className="stars">
        {[1, 2, 3, 4, 5].map(i => <Icon.star key={i} filled={i <= r} />)}
      </span>
    );
  };

  return (
    <div className="files-page" onMouseMove={handlePageMove}>
      <div className="files-navbar-wrap"><Navbar /></div>
      <BgDecor decorRef={decorRef} />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="files-content">
        {/* Header */}
        <div className="files-top">
          <div>
            <h1 className="files-title">Study Files</h1>
            <p className="files-sub">Share and discover academic resources</p>
          </div>
          <button className="upload-btn" onClick={openUpload}>
            <Icon.upload /> Upload File
          </button>
        </div>

        {/* Controls */}
        <div className="controls-bar">
          <div className="search-wrap">
            <span className="search-icon"><Icon.search /></span>
            <input
              type="text"
              className="search-input"
              placeholder="Search files or uploaders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="All Subjects">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="All Years">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
          </select>
          <select className="filter-select" value={selectedFileType} onChange={(e) => setSelectedFileType(e.target.value)}>
            {FILE_TYPES.map(t => <option key={t} value={t}>{t === 'All File Types' ? t : t.toUpperCase()}</option>)}
          </select>
        </div>

        {!loading && (
          <div className="results-count">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="empty-state"><div className="spinner" /><p>Loading files...</p></div>
        ) : pagedFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-doc"><Icon.doc width="40" height="40" /></div>
            <p>No files match your search</p>
          </div>
        ) : (
          <div className="files-grid">
            {pagedFiles.map(file => {
              const color = typeColor(file.file_name);
              return (
                <div
                  key={file.id}
                  className="file-card"
                  style={{ '--accent': color }}
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                >
                  <div className="card-head">
                    <span className="type-icon" style={{ color }}>
                      <Icon.doc />
                      <span className="type-label">{fileExt(file.file_name)}</span>
                    </span>
                    {canDelete(file) && (
                      <button className="delete-btn" onClick={() => handleDelete(file)} title="Delete file">
                        <Icon.trash />
                      </button>
                    )}
                  </div>

                  <h3 className="file-name" title={file.file_name}>{file.file_name}</h3>

                  <div className="meta-row">
                    <span className="meta"><Icon.user /> {file.uploader_name || file.uploader_username || 'Unknown'}</span>
                    <span className="meta"><Icon.calendar /> {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {(file.subject || file.academic_year) && (
                    <div className="tag-row">
                      {file.subject && <span className="tag">{file.subject}</span>}
                      {file.academic_year && <span className="tag tag-year">Year {file.academic_year}</span>}
                    </div>
                  )}

                  {file.description && <p className="file-desc">{file.description}</p>}

                  <div className="rating-row">
                    <Stars value={file.avg_rating} />
                    <span className="rating-num">{(file.avg_rating || 0).toFixed(1)}</span>
                  </div>

                  <div className="stats-row">
                    <span className="stat"><Icon.download width="14" height="14" /> {Number(file.download_count || 0).toLocaleString()}</span>
                    <button
                      className={`stat like ${file.liked_by_me ? 'liked' : ''}`}
                      onClick={() => handleLike(file)}
                      title={file.liked_by_me ? 'Unlike' : 'Like'}
                    >
                      <Icon.heart fill={file.liked_by_me ? '#f43f5e' : 'none'} stroke={file.liked_by_me ? '#f43f5e' : 'currentColor'} strokeWidth="2" />
                      {file.likes_count}
                    </button>
                    <span className="stat"><Icon.comment /> {file.comments_count || 0}</span>
                  </div>

                  <button className="download-btn" onClick={() => handleDownload(file)}>
                    <Icon.download /> Download
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${page === safePage ? 'active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button className="page-btn" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}>Next</button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Upload File</h2>
              <button className="modal-close" onClick={() => !uploading && setShowUpload(false)}><Icon.close /></button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx"
              style={{ display: 'none' }}
              onChange={(e) => setPickedFile(e.target.files[0] || null)}
            />

            <div
              className={`dropzone ${pickedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="dz-icon" style={pickedFile ? { color: typeColor(pickedFile.name) } : undefined}>
                {pickedFile ? <Icon.doc width="30" height="30" /> : <Icon.upload width="28" height="28" />}
              </span>
              <span className="dz-name">{pickedFile ? pickedFile.name : 'Click to choose a file'}</span>
              <span className="dz-hint">{pickedFile ? 'Click to choose a different file' : 'PDF, DOC, PPT, XLSX — up to 50MB'}</span>
            </div>

            {isStaff && myCourses.length > 0 && (
              <>
                <label className="field-label">Course &amp; Batch (optional)</label>
                <select
                  className="field-input"
                  value={uploadCourse}
                  onChange={(e) => setUploadCourse(e.target.value)}
                >
                  <option value="">— Not tied to a course —</option>
                  {myCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {(c.course_code ? c.course_code + ' — ' : '') + c.title}
                      {c.academic_year ? ` (Year ${c.academic_year}${c.track ? ' · ' + c.track : ''})` : ''}
                    </option>
                  ))}
                </select>
                <p className="field-hint">Attaching a course files this into that course's materials for its batch.</p>
              </>
            )}

            <label className="field-label">Subject</label>
            <select className="field-input" value={uploadForm.subject} onChange={(e) => setUploadForm(f => ({ ...f, subject: e.target.value }))}>
              <option value="">— Select subject (optional) —</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="field-label">Academic Year</label>
            <select className="field-input" value={uploadForm.year} onChange={(e) => setUploadForm(f => ({ ...f, year: e.target.value }))}>
              <option value="">— Select year (optional) —</option>
              {YEARS.map(y => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
            </select>

            <label className="field-label">Description</label>
            <textarea
              className="field-input"
              rows={3}
              placeholder="Short description (optional)"
              value={uploadForm.description}
              onChange={(e) => setUploadForm(f => ({ ...f, description: e.target.value }))}
            />

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
              <button className="btn-primary" onClick={submitUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
