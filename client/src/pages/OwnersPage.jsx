import React, { useState, useEffect } from "react";

import "../styles/OwnersPage.css";

const API_URL = "https://your-api.com/api/owners";

const TEST_DATA = [
  {
    id: 2420934,
    firstName: "Kirols",
    lastName: "",
    email: "kirols@example.com",
    phone: "01000000000",
    date: "09/05/2026",
    verified: false,
  },
];

const IconUsers = () => (
  
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconRefresh = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

export default function OwnersPage() {
  useEffect(() => {
    document.title = "Users | UniConnect";
}, []);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [sortField, setSortField] = useState("id");
  const [sortDir, setSortDir] = useState("desc");

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped = (data.data ?? data).map((item) => ({
        id: item.id,
        firstName: item.first_name ?? item.firstName ?? "",
        lastName: item.last_name ?? item.lastName ?? "",
        email: item.email ?? "",
        phone: item.phone ?? "",
        date: item.created_at ?? item.date ?? "",
        verified: item.verified ?? false,
      }));
      setOwners(mapped);
    } catch {
      setOwners(TEST_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  // ─── Actions ─────────────────────────────────────────────────
  const handleAccept = (id) => {
    // TODO: اربط بالـ API  →  PATCH /api/owners/:id/accept
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, verified: true } : o))
    );
  };

  const handleReject = (id) => {
    setOwners((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, verified: false, rejected: true } : o
      )
    );
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this owner?")) {
      setOwners((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const totalOwners = owners.length;
  const pendingOwners = owners.filter((o) => !o.verified && !o.rejected).length;
  const verifiedOwners = owners.filter((o) => o.verified).length;

  const filtered = owners.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.firstName.toLowerCase().includes(q) ||
      o.lastName.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.phone.includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortField],
      vb = b[sortField];
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) => (
    <span className="sort-icon">
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(0,229,255,0.2)",
            borderTop: "3px solid #00e5ff",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            color: "var(--text-muted)",
            fontFamily: "'Rajdhani',sans-serif",
            letterSpacing: 2,
          }}
        >
          LOADING OWNERS...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <main className="owners-page">
      <div className="page-header">
        <h1 className="page-title">
          <IconUsers /> Owners
        </h1>
        <p className="page-subtitle">
          <span className="pending-badge">● PENDING</span>
          Manage all registered property owners
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalOwners}</div>
          <div className="stat-label">Total Owners</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingOwners}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{verifiedOwners}</div>
          <div className="stat-label">Verified</div>
        </div>
      </div>

      <div className="owners-card">
        <div className="card-header">
          <span className="card-title">List of All Owners</span>
          <button
            className="card-collapse-btn"
            onClick={fetchOwners}
            title="Refresh"
          >
            <IconRefresh />
          </button>
        </div>

        <div className="table-controls">
          <div className="show-entries">
            <span>Show</span>
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="table-actions">
            <button className="export-btn">Copy</button>
            <button className="export-btn">CSV</button>
            <button className="export-btn primary">Excel</button>
            <button className="export-btn">PDF</button>
            <button className="export-btn">Print</button>
            <div className="search-wrapper">
              <span className="search-label">Search:</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search owners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="entries-info">
          Showing {Math.min(1, sorted.length)} to{" "}
          {Math.min(entries, sorted.length)} of {sorted.length} entries
          {search && ` (filtered from ${owners.length} total entries)`}
        </div>

        <div className="owners-table-wrapper">
          <table className="owners-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>
                  #<SortIcon field="id" />
                </th>
                <th onClick={() => handleSort("firstName")}>
                  First Name
                  <SortIcon field="firstName" />
                </th>
                <th onClick={() => handleSort("lastName")}>
                  Last Name
                  <SortIcon field="lastName" />
                </th>
                <th onClick={() => handleSort("email")}>
                  Email
                  <SortIcon field="email" />
                </th>
                <th onClick={() => handleSort("phone")}>
                  Phone
                  <SortIcon field="phone" />
                </th>
                <th onClick={() => handleSort("date")}>
                  Date
                  <SortIcon field="date" />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, entries).map((owner) => (
                <tr key={owner.id}>
                  <td>{owner.id}</td>
                  <td className="owner-name">{owner.firstName}</td>
                  <td className="owner-name">{owner.lastName}</td>
                  <td className="owner-email">{owner.email}</td>
                  <td className="owner-phone">{owner.phone}</td>
                  <td className="owner-date">{owner.date}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="action-btn accept-btn"
                        onClick={() => handleAccept(owner.id)}
                        title="Accept"
                      >
                        <IconCheck /> Accept
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => handleReject(owner.id)}
                        title="No Accept"
                      >
                        <IconX /> No Accept
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(owner.id)}
                        title="Delete"
                      >
                        <IconTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    No owners found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
