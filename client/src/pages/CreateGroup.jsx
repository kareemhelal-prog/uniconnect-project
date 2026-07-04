import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "../styles/CreateGroup.css";

// Who the group is visible to. [] = everyone. track omitted = whole year.
const AUDIENCE = [
  { key: "everyone", label: "Everyone — whole college", audience: [] },
  { key: "y1", label: "Year 1 only", audience: [{ academic_year: "1" }] },
  { key: "y2", label: "Year 2 only", audience: [{ academic_year: "2" }] },
  { key: "y1_2", label: "Year 1 & 2 together", audience: [{ academic_year: "1" }, { academic_year: "2" }] },
  { key: "y2_3", label: "Year 2 & 3 together", audience: [{ academic_year: "2" }, { academic_year: "3" }] },
  { key: "y3_4", label: "Year 3 & 4 together", audience: [{ academic_year: "3" }, { academic_year: "4" }] },
  { key: "y3_both", label: "Year 3 — both tracks", audience: [{ academic_year: "3" }] },
  { key: "y3_sw", label: "Year 3 — Software", audience: [{ academic_year: "3", track: "software" }] },
  { key: "y3_net", label: "Year 3 — Networks", audience: [{ academic_year: "3", track: "networks" }] },
  { key: "y4_both", label: "Year 4 — both tracks", audience: [{ academic_year: "4" }] },
  { key: "y4_sw", label: "Year 4 — Software", audience: [{ academic_year: "4", track: "software" }] },
  { key: "y4_net", label: "Year 4 — Networks", audience: [{ academic_year: "4", track: "networks" }] },
];

const CreateGroup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", group_image: "", audience: "everyone" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const preset = AUDIENCE.find((a) => a.key === form.audience) || AUDIENCE[0];
      const { data } = await API.post("/groups", {
        name: form.name.trim(),
        description: form.description.trim(),
        group_image: form.group_image.trim() || null,
        audience: preset.audience,
      });
      if (data.status === "pending") setSubmitted(true);
      else navigate(`/groups/${data.groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="create-group-page">
        <div className="create-group-card cg-review">
          <div className="cg-review-icon">✓</div>
          <h1>Submitted for review</h1>
          <p>Your group was sent to the administration. Once it's approved it will appear to the students you targeted, and they'll be notified.</p>
          <button className="create-btn" onClick={() => navigate("/groups")}>Back to Groups</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-group-page">
      <div className="create-group-card">
        <h1>Create New Group</h1>
        <p>Build a student community to share resources and study together.</p>
        <div className="cg-note">Students can create one group. It needs admin approval before it appears.</div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name</label>
            <input type="text" placeholder="Enter group name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="What is this group about?" value={form.description} onChange={(e) => set("description", e.target.value)} rows="4" required />
          </div>

          <div className="form-group">
            <label>Who can see &amp; join this group?</label>
            <select value={form.audience} onChange={(e) => set("audience", e.target.value)} required>
              {AUDIENCE.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <span className="cg-hint">Only the students you pick will see the group and get notified.</span>
          </div>

          <div className="form-group">
            <label>Group Image URL <span className="cg-opt">(optional)</span></label>
            <input type="text" placeholder="Paste image URL" value={form.group_image} onChange={(e) => set("group_image", e.target.value)} />
          </div>

          <button type="submit" className="create-btn" disabled={loading || !form.name.trim() || !form.description.trim()}>
            {loading ? "Creating..." : "Submit Group"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
