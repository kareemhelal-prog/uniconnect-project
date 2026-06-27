// Files.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Files.css';

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");

const SUBJECTS = ['All Subjects', 'Data Structures', 'Operating Systems', 'Machine Learning',
  'DBMS', 'Computer Networks', 'Discrete Math', 'Software Engineering',
  'Algorithms', 'Theory of Computation', 'Mathematics', 'Physics'];

const YEARS = ['All Years', '1', '2', '3', '4'];
const FILE_TYPES = ['All File Types', 'pdf', 'doc', 'ppt', 'docx', 'xlsx'];

const YEAR_LABELS = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };

const Files = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedFileType, setSelectedFileType] = useState('All File Types');
  const [likedFiles, setLikedFiles] = useState({});

  useEffect(() => {
    document.title = "Files - UniConnect";
    fetchFiles();
  }, [selectedSubject, selectedYear, selectedFileType]);

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
      setFiles(data.data || []);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (fileId) => {
    const alreadyLiked = likedFiles[fileId];
    setLikedFiles(prev => ({ ...prev, [fileId]: !alreadyLiked }));
    try {
      if (alreadyLiked) {
        await fetch(`${API_BASE}/files/${fileId}/like`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      } else {
        await fetch(`${API_BASE}/files/${fileId}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }
    } catch (err) {
      setLikedFiles(prev => ({ ...prev, [fileId]: alreadyLiked }));
    }
  };

  const handleDownload = async (file) => {
    if (file.file_url) {
      window.open(`${API_BASE}/files/${file.id}/download`, '_blank');
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

  const renderStars = (rating) => {
    const r = Math.round(rating || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  const formatType = (t) => (t || 'FILE').toUpperCase().slice(0, 3);

  return (
    <div className="files-container">
      <div className="files-header">
        <div className="search-section">
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search for files or uploaders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">Subject</label>
          <select className="filter-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Year</label>
          <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y === 'All Years' ? y : YEAR_LABELS[y]}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">File Type</label>
          <select className="filter-select" value={selectedFileType} onChange={(e) => setSelectedFileType(e.target.value)}>
            {FILE_TYPES.map(t => <option key={t} value={t}>{t === 'All File Types' ? t : t.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
          Loading files...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: '3rem' }}>📂</div>
          <p>No files found</p>
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-type-icon">{formatType(file.file_type)}</div>
              <h3 className="file-name">{file.file_name}</h3>
              <div className="file-meta">
                <span className="uploader">👤 {file.uploader_name || file.uploader_username || 'Unknown'}</span>
                <span className="upload-date">📅 {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {file.subject && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                  📚 {file.subject} {file.academic_year ? `· Year ${file.academic_year}` : ''}
                </div>
              )}
              <div className="file-stats">
                <button
                  className={`like-btn ${likedFiles[file.id] ? 'liked' : ''}`}
                  onClick={() => handleLike(file.id)}
                >
                  ❤️ {likedFiles[file.id] ? (file.likes_count || 0) + 1 : (file.likes_count || 0)}
                </button>
                <span className="comments">💬 {file.comments_count || 0}</span>
              </div>
              <div className="rating">
                <span className="stars">{renderStars(file.avg_rating)}</span>
                <span className="rating-value">({(file.avg_rating || 0).toFixed(1)})</span>
              </div>
              <button className="download-btn" onClick={() => handleDownload(file)}>⬇️ Download</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Files;
