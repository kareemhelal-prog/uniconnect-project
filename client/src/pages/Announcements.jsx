import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Calendar,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Volume2,
  CalendarDays,
  Info,
  GraduationCap,
  Landmark,
  Star,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import api from '../api/axios.js';
import '../styles/Announcements.css';

const TYPE_META = {
  exam: { icon: Volume2, color: '#5fa3f8', bg: 'rgba(59,130,246,0.16)' },
  workshop: { icon: CalendarDays, color: '#2dd4a7', bg: 'rgba(45,212,167,0.16)' },
  notice: { icon: Info, color: '#5fa3f8', bg: 'rgba(59,130,246,0.16)' },
  scholarship: { icon: GraduationCap, color: '#f7b955', bg: 'rgba(247,185,85,0.16)' },
  curriculum: { icon: Landmark, color: '#b389fb', bg: 'rgba(168,110,247,0.16)' },
  recognition: { icon: Star, color: '#f2cb4e', bg: 'rgba(242,203,78,0.16)' },
  instructions: { icon: FileText, color: '#f08fd1', bg: 'rgba(240,143,209,0.16)' },
};

const TARGETS = ['Students', 'Doctors', 'Everyone'];
const ROWS_OPTIONS = [10, 25, 50, 100];

function truncate(text, max = 80) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '…';
}

function formatDateTime(isoString) {
  if (!isoString) return { date: '', time: '' };
  const d = new Date(isoString);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function TypeIcon({ type, size = 38, iconSize = 18 }) {
  const meta = TYPE_META[type] || TYPE_META.notice;
  const Icon = meta.icon;
  return (
    <span
      className="type-icon"
      style={{ width: size, height: size, background: meta.bg, color: meta.color }}
    >
      <Icon size={iconSize} strokeWidth={2.2} />
    </span>
  );
}

function Modal({ onClose, children, wide }) {
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${wide ? 'modal-wide' : ''}`} ref={ref}>
        {children}
      </div>
    </div>
  );
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowsMenuOpen, setRowsMenuOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const [toasts, setToasts] = useState([]);

  const rowsMenuRef = useRef(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function onDocClick(e) {
      if (rowsMenuRef.current && !rowsMenuRef.current.contains(e.target)) {
        setRowsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pushToast(message, variant = 'success') {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 3200);
  }

  /* ---------------- filtering + pagination ---------------- */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(
      (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  }, [announcements, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  function pageNumbers() {
    const nums = [];
    const add = (n) => nums.push(n);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i);
      return nums;
    }
    add(1);
    if (page > 3) add('ellipsis-start');
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i++) add(i);
    if (page < totalPages - 2) add('ellipsis-end');
    add(totalPages);
    return nums;
  }

  /* ---------------- handlers ---------------- */

  async function handleDeleteConfirmed() {
    try {
      await api.delete(`/admin/announcements/${deleteItem.id}`);
      setAnnouncements((list) => list.filter((a) => a.id !== deleteItem.id));
      pushToast('Announcement deleted successfully', 'danger');
    } catch (err) {
      pushToast('Failed to delete announcement', 'danger');
    } finally {
      setDeleteItem(null);
    }
  }

  async function handlePublish(form) {
    try {
      const res = await api.post('/admin/announcements', {
        title: form.title.trim(),
        content: form.content.trim(),
        target: form.target,
      });

      if (res.data.success) {
        await fetchAnnouncements();
        setNewModalOpen(false);
        setPage(1);
        pushToast('Announcement published successfully', 'success');
      }
    } catch (err) {
      pushToast('Failed to publish announcement', 'danger');
    }
  }

  if (loading) {
    return (
      <div className="ann-admin">
        <div className="ann-admin__inner">
          <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ann-admin">
      <div className="ann-admin__inner">
        <div className="ann-admin__header">
          <div>
            <h1 className="ann-admin__title">Announcements</h1>
            <p className="ann-admin__subtitle">Manage and publish announcements for the platform.</p>
          </div>

          <div className="ann-admin__header-actions">
            <button className="btn btn-primary" onClick={() => setNewModalOpen(true)}>
              <Plus size={17} strokeWidth={2.4} />
              New Announcement
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="table-card">
          <table className="ann-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Content Preview</th>
                <th>Target</th>
                <th>Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a) => {
                const { date, time } = formatDateTime(a.created_at);
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="col-title">
                        <TypeIcon type={a.type} />
                        <strong dir="auto">{a.title}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="col-content" dir="auto">{truncate(a.content, 80)}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${a.target}`}>{a.target}</span>
                    </td>
                    <td>
                      <div className="col-date">
                        <div className="date-row">
                          <Calendar size={14} />
                          {date}
                        </div>
                        <div className="time-row">{time}</div>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-sm btn-view" onClick={() => setViewItem(a)}>
                          <Eye size={15} />
                          View
                        </button>
                        <button className="btn btn-sm btn-delete" onClick={() => setDeleteItem(a)}>
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Inbox size={36} />
                      <p>No announcements match your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="rows-per-page">
            <span className="rows-per-page__label">Rows per page:</span>
            <div className="rows-select" ref={rowsMenuRef}>
              <button className="rows-select__btn" onClick={() => setRowsMenuOpen((o) => !o)}>
                {rowsPerPage}
                <ChevronDown size={15} />
              </button>
              {rowsMenuOpen && (
                <div className="rows-select__menu">
                  {ROWS_OPTIONS.map((n) => (
                    <div
                      key={n}
                      className={`rows-select__option ${n === rowsPerPage ? 'active' : ''}`}
                      onClick={() => {
                        setRowsPerPage(n);
                        setPage(1);
                        setRowsMenuOpen(false);
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            {pageNumbers().map((n, idx) =>
              typeof n === 'number' ? (
                <button
                  key={n}
                  className={`page-num ${n === page ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ) : (
                <span key={n + idx} className="page-ellipsis">
                  …
                </span>
              )
            )}

            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {newModalOpen && (
        <NewAnnouncementModal onClose={() => setNewModalOpen(false)} onPublish={handlePublish} />
      )}

      {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}

      {deleteItem && (
        <Modal onClose={() => setDeleteItem(null)}>
          <div className="confirm-modal">
            <div className="confirm-icon">
              <AlertTriangle size={26} />
            </div>
            <h3>Delete Announcement</h3>
            <p>
              Are you sure you want to delete <strong>"{deleteItem.title}"</strong>? This action cannot be
              undone.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteItem(null)}>
                Cancel
              </button>
              <button className="btn btn-danger-solid" onClick={handleDeleteConfirmed}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant === 'danger' ? 'toast-danger' : ''}`}>
            {t.variant === 'danger' ? <Trash2 size={17} /> : <CheckCircle2 size={17} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewAnnouncementModal({ onClose, onPublish }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState('Everyone');

  const canPublish = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Modal onClose={onClose}>
      <div className="modal-head">
        <h2>New Announcement</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="modal-body">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          dir="auto"
          type="text"
          placeholder="Announcement title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="form-label" style={{ marginTop: 16 }}>Content</label>
        <textarea
          className="form-textarea"
          dir="auto"
          placeholder="Write the announcement content..."
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label className="form-label" style={{ marginTop: 16 }}>Target Audience</label>
        <div className="target-options">
          {TARGETS.map((t) => (
            <button
              key={t}
              className={`target-btn ${target === t ? 'active' : ''}`}
              onClick={() => setTarget(t)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!canPublish}
          onClick={() => onPublish({ title, content, target })}
        >
          <Send size={15} />
          Publish
        </button>
      </div>
    </Modal>
  );
}

function ViewModal({ item, onClose }) {
  const { date, time } = formatDateTime(item.created_at);
  return (
    <Modal onClose={onClose} wide>
      <div className="modal-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TypeIcon type={item.type} size={40} iconSize={20} />
          <h2 style={{ margin: 0 }} dir="auto">{item.title}</h2>
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="modal-body">
        <div className="view-meta">
          <span className={`badge badge-${item.target}`}>{item.target}</span>
          <span className="view-date">
            <Calendar size={14} />
            {date} · {time}
          </span>
        </div>
        <p className="view-content" dir="auto">{item.content}</p>
      </div>

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}