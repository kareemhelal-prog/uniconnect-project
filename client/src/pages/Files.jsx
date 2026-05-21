// Files.jsx
import React, { useState } from 'react';
import '../styles/Files.css';
import { useEffect } from "react";

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

const subjects = ['All Subjects', ...new Set(filesData.map(file => file.subject))];
const years = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const fileTypes = ['All File Types', 'PDF', 'DOC', 'PPT'];

const Files = () => {
  useEffect(() => {
    document.title = "Files - UniConnect";
  },
  []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedFileType, setSelectedFileType] = useState('All File Types');
  const [likedFiles, setLikedFiles] = useState({});

  const handleLike = (fileId) => {
    setLikedFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const filteredFiles = filesData.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.uploader.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All Subjects' || file.subject === selectedSubject;
    const matchesYear = selectedYear === 'All Years' || file.year === selectedYear;
    const matchesFileType = selectedFileType === 'All File Types' || file.type === selectedFileType;
    return matchesSearch && matchesSubject && matchesYear && matchesFileType;
  });

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const handleUpload = () => {
    alert('Upload functionality would open file picker here');
  };

  return (
    <div className="files-container">
      <div className="files-header">
        <div className="search-section">
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search for people, subjects, or posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="upload-btn" onClick={handleUpload}>
            📤 Upload File
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">Subject</label>
          <select className="filter-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Year</label>
          <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">File Type</label>
          <select className="filter-select" value={selectedFileType} onChange={(e) => setSelectedFileType(e.target.value)}>
            {fileTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>

      <div className="files-grid">
        {filteredFiles.map(file => (
          <div key={file.id} className="file-card">
            <div className="file-type-icon">
              {file.type === 'PDF' && 'PDF'}
              {file.type === 'DOC' && 'DOC'}
              {file.type === 'PPT' && 'PPT'}
            </div>
            <h3 className="file-name">{file.name}</h3>
            <div className="file-meta">
              <span className="uploader">👤 {file.uploader}</span>
              <span className="upload-date">📅 {file.uploadDate}</span>
            </div>
            <div className="file-stats">
              <span className="downloads">⬇️ {file.downloads.toLocaleString()}</span>
              <button
                className={`like-btn ${likedFiles[file.id] ? 'liked' : ''}`}
                onClick={() => handleLike(file.id)}
              >
                ❤️ {likedFiles[file.id] ? file.likes + 1 : file.likes}
              </button>
              <span className="comments">💬 {file.comments}</span>
            </div>
            <div className="rating">
              <span className="stars">{renderStars(file.rating)}</span>
              <span className="rating-value">({file.rating}.0)</span>
            </div>
            <button className="download-btn">⬇️ Download</button>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn next">Next →</button>
      </div>
    </div>
  );
};

export default Files;