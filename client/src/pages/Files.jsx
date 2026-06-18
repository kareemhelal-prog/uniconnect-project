import { useState, useEffect } from "react";
import '../styles/Files.css';

const filesData = [
  { id: 1, name: 'Data Structures Summary Notes', type: 'PDF', uploader: 'Priya Sharma', uploadDate: 'May 12, 2024', downloads: 1200, likes: 128, comments: 34, rating: 5, subject: 'Data Structures', year: '2nd Year' },
  { id: 2, name: 'Operating Systems Question Bank', type: 'DOC', uploader: 'Arjun Patel', uploadDate: 'May 10, 2024', downloads: 980, likes: 96, comments: 21, rating: 4, subject: 'Operating Systems', year: '3rd Year' },
  { id: 3, name: 'Machine Learning Lecture Slides', type: 'PPT', uploader: 'Neha Iyer', uploadDate: 'May 8, 2024', downloads: 1500, likes: 142, comments: 42, rating: 5, subject: 'Machine Learning', year: '4th Year' },
  { id: 4, name: 'DBMS Important Formulas', type: 'PDF', uploader: 'Rohan Verma', uploadDate: 'May 6, 2024', downloads: 870, likes: 89, comments: 18, rating: 4, subject: 'DBMS', year: '2nd Year' },
  { id: 5, name: 'Computer Networks Summary', type: 'DOC', uploader: 'Ananya Singh', uploadDate: 'May 4, 2024', downloads: 1100, likes: 113, comments: 27, rating: 5, subject: 'Computer Networks', year: '3rd Year' },
  { id: 6, name: 'Discrete Mathematics Notes', type: 'PDF', uploader: 'Karan Mehta', uploadDate: 'May 2, 2024', downloads: 760, likes: 72, comments: 16, rating: 4, subject: 'Discrete Math', year: '1st Year' },
  { id: 7, name: 'Software Engineering Lecture Slides', type: 'PPT', uploader: 'Sneha Reddy', uploadDate: 'Apr 30, 2024', downloads: 1300, likes: 105, comments: 31, rating: 5, subject: 'Software Engineering', year: '4th Year' },
  { id: 8, name: 'Algorithms Cheat Sheet', type: 'DOC', uploader: 'Aditya Nair', uploadDate: 'Apr 28, 2024', downloads: 1000, likes: 124, comments: 29, rating: 5, subject: 'Algorithms', year: '3rd Year' },
  { id: 9, name: 'Theory of Computation Question Bank', type: 'DOC', uploader: 'Ishita Gupta', uploadDate: 'Apr 26, 2024', downloads: 680, likes: 68, comments: 14, rating: 4, subject: 'Theory of Computation', year: '3rd Year' },
];

const TYPE_CONFIG = {
  PDF: { bg: '#fff1f0', color: '#cf1322', dot: '#f5222d' },
  DOC: { bg: '#e6f4ff', color: '#0958d9', dot: '#1677ff' },
  PPT: { bg: '#fff7e6', color: '#d46b08', dot: '#fa8c16' },
};

const subjects = ['All Subjects', ...new Set(filesData.map(f => f.subject))];
const years = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const fileTypes = ['All Types', 'PDF', 'DOC', 'PPT'];
const ITEMS_PER_PAGE = 6;

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="9" r="6"/><line x1="13.5" y1="13.5" x2="18" y2="18"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 10 10 4 4 10"/><line x1="10" y1="4" x2="10" y2="16"/>
    <line x1="4" y1="18" x2="16" y2="18"/>
  </svg>
);
const AvatarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="10" cy="7" r="3"/><path d="M3 18c0-4 3-6 7-6s7 2 7 6"/>
  </svg>
);
const CalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="4" width="14" height="14" rx="2"/><line x1="3" y1="9" x2="17" y2="9"/>
    <line x1="7" y1="2" x2="7" y2="6"/><line x1="13" y1="2" x2="13" y2="6"/>
  </svg>
);
const DownIcon = ({ color = '#64748b' }) => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="3" x2="10" y2="15"/><polyline points="5 10 10 15 15 10"/>
    <line x1="4" y1="18" x2="16" y2="18"/>
  </svg>
);

export default function Files() {
  useEffect(() => { document.title = "Files - UniConnect"; }, []);

  const [search, setSearch]       = useState('');
  const [subject, setSubject]     = useState('All Subjects');
  const [year, setYear]           = useState('All Years');
  const [fileType, setFileType]   = useState('All Types');
  const [liked, setLiked]         = useState({});
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState('date');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredDl, setHoveredDl]     = useState(null);

  const toggleLike = (id) => setLiked(p => ({ ...p, [id]: !p[id] }));

  const filtered = filesData
    .filter(f => {
      const q = search.toLowerCase();
      return (
        (f.name.toLowerCase().includes(q) || f.uploader.toLowerCase().includes(q)) &&
        (subject === 'All Subjects' || f.subject === subject) &&
        (year === 'All Years'       || f.year    === year)    &&
        (fileType === 'All Types'   || f.type    === fileType)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      if (sortBy === 'likes')     return b.likes     - a.likes;
      if (sortBy === 'rating')    return b.rating    - a.rating;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearch(''); setSubject('All Subjects');
    setYear('All Years'); setFileType('All Types'); setPage(1);
  };

  const activeFilters = [
    subject  !== 'All Subjects' && subject,
    year     !== 'All Years'    && year,
    fileType !== 'All Types'    && fileType,
  ].filter(Boolean);

  return (
    <div className="files-page">

      {/* ── Header ── */}
      <div className="files-header">
        <div>
          <h1 className="files-title">Study Resources</h1>
          <p className="files-subtitle">{filtered.length} file{filtered.length !== 1 ? 's' : ''} shared by your peers</p>
        </div>
        <button className="upload-btn" onClick={() => alert('Upload functionality would open file picker here')}>
          <UploadIcon /> Upload File
        </button>
      </div>

      {/* ── Search + Sort ── */}
      <div className="search-row">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            placeholder="Search files or uploaders..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="sort-wrap">
          <span className="sort-label">Sort</span>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Latest</option>
            <option value="downloads">Most Downloaded</option>
            <option value="likes">Most Liked</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="filters-row">
        {[
          { label: 'Subject', options: subjects,   value: subject,   set: v => { setSubject(v);  setPage(1); } },
          { label: 'Year',    options: years,       value: year,      set: v => { setYear(v);     setPage(1); } },
          { label: 'Type',    options: fileTypes,   value: fileType,  set: v => { setFileType(v); setPage(1); } },
        ].map(({ label, options, value, set }) => (
          <div key={label} className={`filter-pill ${!value.startsWith('All') ? 'filter-pill--active' : ''}`}>
            <span className="filter-label">{label}</span>
            <select className="filter-select" value={value} onChange={e => set(e.target.value)}>
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {activeFilters.length > 0 && (
          <button className="clear-all-btn" onClick={resetFilters}>
            ✕ Clear ({activeFilters.length})
          </button>
        )}
      </div>

      {/* ── Active chips ── */}
      {activeFilters.length > 0 && (
        <div className="chip-row">
          {activeFilters.map(f => <span key={f} className="chip">{f}</span>)}
        </div>
      )}

      {/* ── Grid ── */}
      {paged.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p className="empty-title">No files match your filters</p>
          <p className="empty-hint">Try adjusting your search or clearing filters</p>
          <button className="empty-btn" onClick={resetFilters}>Clear all filters</button>
        </div>
      ) : (
        <div className="files-grid">
          {paged.map(file => {
            const tc       = TYPE_CONFIG[file.type];
            const isLiked  = liked[file.id];
            const isHovered = hoveredCard === file.id;
            const isDlHovered = hoveredDl === file.id;
            return (
              <div
                key={file.id}
                className={`file-card ${isHovered ? 'file-card--hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(file.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* نوع الملف + تقييم */}
                <div className="card-top">
                  <span className="type-badge" style={{ background: tc.bg, color: tc.color }}>
                    <span className="type-dot" style={{ background: tc.dot }} />
                    {file.type}
                  </span>
                  <div className="rating-wrap">
                    <span className="stars">{'★'.repeat(file.rating)}{'☆'.repeat(5 - file.rating)}</span>
                    <span className="rating-num">{file.rating}.0</span>
                  </div>
                </div>

                <h3 className="file-name">{file.name}</h3>

                <div className="tag-row">
                  <span className="tag">{file.subject}</span>
                  <span className="tag tag--year">{file.year}</span>
                </div>

                <div className="meta-row">
                  <span className="meta-item"><AvatarIcon /> {file.uploader}</span>
                  <span className="meta-item"><CalIcon /> {file.uploadDate}</span>
                </div>

                <div className="stats-row">
                  <span className="stat"><DownIcon /> {file.downloads.toLocaleString()}</span>
                  <button
                    className={`like-btn ${isLiked ? 'like-btn--active' : ''}`}
                    onClick={() => toggleLike(file.id)}
                  >
                    {isLiked ? '♥' : '♡'} {isLiked ? file.likes + 1 : file.likes}
                  </button>
                  <span className="stat">💬 {file.comments}</span>
                </div>

                <button
                  className={`download-btn ${isDlHovered ? 'download-btn--hovered' : ''}`}
                  onMouseEnter={() => setHoveredDl(file.id)}
                  onMouseLeave={() => setHoveredDl(null)}
                  onClick={() => alert(`Downloading: ${file.name}`)}
                >
                  <DownIcon color={isDlHovered ? '#fff' : '#6366f1'} />
                  Download
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className={`page-btn ${safePage === 1 ? 'page-btn--disabled' : ''}`}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >← Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`page-btn ${n === safePage ? 'page-btn--active' : ''}`}
              onClick={() => setPage(n)}
            >{n}</button>
          ))}

          <button
            className={`page-btn ${safePage === totalPages ? 'page-btn--disabled' : ''}`}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
