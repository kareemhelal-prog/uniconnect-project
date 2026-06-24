import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/axios";

import "../styles/CreateGroup.css";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "All Years"];
const TYPE_OPTIONS = ["Subject Groups", "Other Groups"];

const CreateGroup = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    group_image: "",
    is_private: false,
    academic_year: "",
    group_type: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {

      setLoading(true);

      await API.post("/groups", {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      navigate("/groups");

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.message || "Failed to create group. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-page">

      <div className="create-group-card">

        <h1>Create New Group</h1>

        <p>
          Build your own student community and connect with others.
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Group Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter group name"
              value={formData.name}
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label>Description</label>

            <textarea
              name="description"
              placeholder="Enter group description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              required
            />

          </div>

          <div className="form-row">

            <div className="form-group">

              <label>Academic Year</label>

              <select
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                required
              >
                <option value="" disabled>-- Select Year --</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

            </div>

            <div className="form-group">

              <label>Group Type</label>

              <select
                name="group_type"
                value={formData.group_type}
                onChange={handleChange}
                required
              >
                <option value="" disabled>-- Select Type --</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

            </div>

          </div>

          <div className="form-group">

            <label>Group Image URL</label>

            <input
              type="text"
              name="group_image"
              placeholder="Paste image URL"
              value={formData.group_image}
              onChange={handleChange}
            />

          </div>

          <div className="checkbox-group">

            <input
              type="checkbox"
              name="is_private"
              checked={formData.is_private}
              onChange={handleChange}
            />

            <span>Private Group</span>

          </div>

          <button
            type="submit"
            className="create-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>

        </form>

      </div>
    </div>
  );
};

export default CreateGroup;