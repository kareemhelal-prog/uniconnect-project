import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/axios";

import "../styles/CreateGroup.css";

const CreateGroup = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    group_image: "",
    is_private: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      setLoading(true);

      await API.post("/groups", formData);

      alert("Group created successfully");

      navigate("/groups");

    } catch (error) {

      console.error(error);

      alert("Failed to create group");

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
