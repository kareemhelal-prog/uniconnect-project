import { useState, useEffect, useCallback } from "react";
import "../styles/Files.css";
import api from "../api/axios";

const TYPE_CONFIG = {
  pdf:  { bg: "#fff1f0", color: "#cf1322", dot: "#f5222d" },
  doc:  { bg: "#e6f4ff", color: "#0958d9", dot: "#1677ff" },
  docx: { bg: "#e6f4ff", color: "#0958d9", dot: "#1677ff" },
  ppt:  { bg: "#fff7e6", color: "#d46b08", dot: "#fa8c16" },
  pptx: { bg: "#fff7e6", color: "#d46b08", dot: "#fa8c16" },
};

const years     = ["All Years", "1", "2", "3", "4"];
const fileTypes = ["All Types", "pdf", "doc", "docx", "ppt", "pptx"];
const ITEMS_PER_PAGE = 6;

const SearchIcon = () => <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="9" r="6"/><line x1="13.5" y1="13.5" x2="18" y2="18"/></svg>;
const UploadIcon = () => <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 10 10 4 4 10"/><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="18" x2="16" y2="18"/></svg>;
const DownIcon  = ({ color = "#64748b" }) => <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="3" x2="10" y2="15"/><polyline points="5 10 10 15 15 10"/><line x1="4" y1="18" x2="16" y2="18"/></svg>;

export default function Files() {
  useEffect(() => { document.title = "Files - UniConnect"; }, []);

  const [files,      setFiles]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [year,       setYear]       = useState("All Years");
  const [fileType,   setFileType]   = useState("All Types");
  const [liked,      setLiked]      = useState({});
  const [page,       setPage]       = useState(1);
  const [sortBy,     setSortBy]     = useState("date");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ file: null, subject: "", academic_year: "", description: "" });
  const [uploading,  setUploading]  = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                        params.set("search", search);
      if (year !== "All Years")          params.set("academic_year", year);
      if (fileType !== "All Types")      params.set("file_type", fileType);
      const res = await api.get(`/files?${params}`);
      setFiles(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, [search, year, fileType]);

  useEffect(() => {
    const delay = setTimeout(fetchFiles, 400);
    return () => clearTimeout(delay);
  }, [fetchFiles]);

  const toggleLike = async (fileId) => {
    try {
      if (liked[fileId]) {
        await api.delete(`/files/${fileId}/like`);
      } else {
        await api.post(`/files/${fileId}/like`);
      }
      setLiked((p) => ({ ...p, [fileId]: !p[fileId] }));
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file",          uploadForm.file);
      formData.append("subject",       uploadForm.subject);
      formData.append("academic_year", uploadForm.academic_year);
      formData.append("description",   uploadForm.description);
      await api.post("/files", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setShowUpload(false);
      setUploadForm({ file: null, subject: "", academic_year: "", description: "" });
      fetchFiles();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const sorted = [...files].sort((a, b) => {
    if (sortBy === "likes") return (b.likes_count || 0) - (a.likes_count || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = sorted.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const resetFilters = () => { setSearch(""); setYear("All Years"); setFileType("All Types"); setPage(1); };
  const activeFilters = [year !== "All Years" && year, fileType !== "All Types" && fileType].filter(Boolean);

  return (
    <div className="files-page">
      <div className="files-header">
        <div>
          <h1 className="files-title">Study Resources</h1>
          <p className="files-subtitle">{files.length} file{files.length !== 1 ? "s" : ""} shared by your peers</p>
        </div>
        <button className="upload-btn" onClick={() => setShowUpload(true)}>
          <UploadIcon /> Upload File
        </button>
      </div>

      <div className="search-row">
        <div className="search-wrap">
          <SearchIcon />
          <input className="search-input" placeholder="Search files..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="clear-btn" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="sort-wrap">
          <span className="sort-label">Sort</span>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Latest</option>
            <option value="likes">Most Liked</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="filters-row">
        {[
          { label: "Year",    options: years,     value: year,      set: (v) => { setYear(v);     setPage(1); } },
          { label: "Type",    options: fileTypes,  value: fileType,  set: (v) => { setFileType(v); setPage(1); } },
        ].map(({ label, options, value, set }) => (
          <div key={label} className={`filter-pill ${!value.startsWith("All") ? "filter-pill--active" : ""}`}>
            <span className="filter-label">{label}</span>
            <select className="filter-select" value={value} onChange={(e) => set(e.target.value)}>
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {activeFilters.length > 0 && (
          <button className="clear-all-btn" onClick={resetFilters}>✕ Clear ({activeFilters.length})</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#00e5ff" }}>Loading...</div>
      ) : paged.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p className="empty-title">No files found</p>
          <button className="empty-btn" onClick={resetFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="files-grid">
          {paged.map((file) => {
            const ext = file.file_type?.toLowerCase() || "doc";
            const tc  = TYPE_CONFIG[ext] || TYPE_CONFIG["doc"];
            const isLiked = liked[file.id] || file.is_liked;
            return (
              <div key={file.id} className="file-card">
                <div className="card-top">
                  <span className="type-badge" style={{ background: tc.bg, color: tc.color }}>
                    <span className="type-dot" style={{ background: tc.dot }} />
                    {ext.toUpperCase()}
                  </span>
                  {file.rating > 0 && (
                    <div className="rating-wrap">
                      <span className="stars">{"★".repeat(Math.round(file.rating))}{"☆".repeat(5 - Math.round(file.rating))}</span>
                    </div>
                  )}
                </div>

                <h3 className="file-name">{file.file_name}</h3>

                <div className="tag-row">
                  {file.subject       && <span className="tag">{file.subject}</span>}
                  {file.academic_year && <span className="tag tag--year">Year {file.academic_year}</span>}
                </div>

                <div className="meta-row">
                  <span className="meta-item">{file.uploader_name || "Unknown"}</span>
                  <span className="meta-item">{new Date(file.created_at).toLocaleDateString()}</span>
                </div>

                <div className="stats-row">
                  <button className={`like-btn ${isLiked ? "like-btn--active" : ""}`} onClick={() => toggleLike(file.id)}>
                    {isLiked ? "♥" : "♡"} {(file.likes_count || 0) + (liked[file.id] && !file.is_liked ? 1 : 0)}
                  </button>
                  <span className="stat">💬 {file.comments_count || 0}</span>
                </div>

                <a href={file.file_url} target="_blank" rel="noreferrer">
                  <button className="download-btn">
                    <DownIcon color="#6366f1" /> Download
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} className={`page-btn ${n === safePage ? "page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next →</button>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Upload File</span>
              <button className="modal-close" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="file" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} />
              <input className="modal-input" placeholder="Subject" value={uploadForm.subject} onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })} />
              <select className="modal-input" value={uploadForm.academic_year} onChange={(e) => setUploadForm({ ...uploadForm, academic_year: e.target.value })}>
                <option value="">Select Year</option>
                {["1", "2", "3", "4"].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <textarea className="modal-textarea" placeholder="Description (optional)" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} rows={3} />
            </div>
            <div className="modal-footer-btns">
              <button className="modal-cancel-btn" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="modal-submit-btn" onClick={handleUpload} disabled={uploading || !uploadForm.file}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}