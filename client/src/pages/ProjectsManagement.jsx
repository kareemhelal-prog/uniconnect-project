import React, { useState, useMemo, useEffect, useRef } from "react";
import "../styles/ProjectsManagement.css";
import {
    Search,
    ChevronDown,
    Eye,
    Trash2,
    X,
    GitBranch as Github,
    Link as LinkIcon,
    Users,
    Calendar,
    DollarSign,
    CheckCircle2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Brain,
    Leaf,
    Boxes,
    Bot,
    BookOpen,
    Plane,
    Zap,
    ShoppingCart,
    Camera,
    Heart,
    Wifi,
    Code2,
    Cloud,
    Map,
    Cpu,
    Sparkles,
    Database,
    Watch,
    Mic,
    Music,
    FileText,
    Truck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CREATORS = [
    { name: "Aarav Patel", username: "aarav.patel", color: "#8b5cf6" },
    { name: "Sophia Lee", username: "sophia.lee", color: "#22c55e" },
    { name: "Ethan Wilson", username: "ethan.wilson", color: "#38bdf8" },
    { name: "Olivia Martinez", username: "olivia.martinez", color: "#f472b6" },
    { name: "James Carter", username: "james.carter", color: "#f59e0b" },
    { name: "Isabella Brown", username: "isabella.brown", color: "#a78bfa" },
    { name: "Liam Johnson", username: "liam.johnson", color: "#34d399" },
    { name: "Mia Davis", username: "mia.davis", color: "#fb7185" },
    { name: "Noah Thompson", username: "noah.thompson", color: "#60a5fa" },
    { name: "Ava Robinson", username: "ava.robinson", color: "#fbbf24" },
];

const initials = (name) =>
    name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase();

function buildMembers(creator, count) {
    const pool = CREATORS.filter((c) => c.username !== creator.username);
    const list = [{ ...creator, role: "Creator" }];
    for (let i = 0; i < count - 1; i++) {
        list.push({ ...pool[i % pool.length], role: "Member" });
    }
    return list;
}

const RAW_PROJECTS = [
    {
        name: "AI Study Assistant",
        icon: Brain,
        iconColor: "#38bdf8",
        category: "Software",
        description:
            "An AI-powered platform that helps students with personalized learning, doubt solving, and study recommendations using machine learning algorithms.",
        creator: CREATORS[0],
        membersCount: 6,
        date: "May 20, 2025 · 10:15 AM",
        github: "github.com/aarav-patel/ai-study-assistant",
        demoUrl: "ai-study-assistant.vercel.app",
        requiredAmount: 8500,
        status: "Active",
    },
    {
        name: "Smart Irrigation System",
        icon: Leaf,
        iconColor: "#4ade80",
        category: "Hardware",
        description:
            "IoT-based smart irrigation system that optimizes water usage in agriculture using soil moisture sensors and weather forecasting.",
        creator: CREATORS[1],
        membersCount: 5,
        date: "May 19, 2025 · 2:45 PM",
        github: "github.com/sophia-lee/smart-irrigation",
        demoUrl: "smart-irrigation.io",
        requiredAmount: 12000,
        status: "Active",
    },
    {
        name: "Blockchain Voting System",
        icon: Boxes,
        iconColor: "#a78bfa",
        category: "Software",
        description:
            "A secure and transparent voting system using blockchain technology to eliminate fraud and ensure verifiable election results.",
        creator: CREATORS[2],
        membersCount: 4,
        date: "May 18, 2025 · 11:30 AM",
        github: "github.com/ethan-wilson/blockchain-voting",
        demoUrl: "blockvote-demo.netlify.app",
        requiredAmount: 15000,
        status: "Completed",
    },
    {
        name: "Autonomous Rover",
        icon: Bot,
        iconColor: "#f59e0b",
        category: "Hardware",
        description:
            "A terrain-adaptive rover for exploration and data collection, equipped with LIDAR and computer vision for obstacle avoidance.",
        creator: CREATORS[3],
        membersCount: 8,
        date: "May 17, 2025 · 9:20 AM",
        github: "github.com/olivia-martinez/autonomous-rover",
        demoUrl: "rover-project.dev",
        requiredAmount: 22000,
        status: "Active",
    },
    {
        name: "Smart Library System",
        icon: BookOpen,
        iconColor: "#60a5fa",
        category: "Software",
        description:
            "Digital library management system with a recommendation engine that suggests books based on borrowing history and preferences.",
        creator: CREATORS[4],
        membersCount: 3,
        date: "May 16, 2025 · 4:10 PM",
        github: "github.com/james-carter/smart-library",
        demoUrl: "smart-library.app",
        requiredAmount: 4200,
        status: "Active",
    },
    {
        name: "Drone Delivery System",
        icon: Plane,
        iconColor: "#fbbf24",
        category: "Hardware",
        description:
            "Efficient last-mile delivery using autonomous drones with real-time route optimization and weather-aware flight planning.",
        creator: CREATORS[5],
        membersCount: 7,
        date: "May 15, 2025 · 1:55 PM",
        github: "github.com/isabella-brown/drone-delivery",
        demoUrl: "dronedeliver.tech",
        requiredAmount: 30000,
        status: "Active",
    },
    {
        name: "Smart Home Energy Monitor",
        icon: Zap,
        iconColor: "#facc15",
        category: "Hardware",
        description:
            "A plug-and-play device that tracks household energy consumption in real time and suggests ways to cut electricity bills.",
        creator: CREATORS[6],
        membersCount: 4,
        date: "May 14, 2025 · 3:30 PM",
        github: "github.com/liam-johnson/energy-monitor",
        demoUrl: "energymonitor.io",
        requiredAmount: 9800,
        status: "Active",
    },
    {
        name: "Peer-to-Peer Marketplace",
        icon: ShoppingCart,
        iconColor: "#fb7185",
        category: "Software",
        description:
            "A campus-only marketplace app letting students buy, sell, and trade used items with built-in escrow and chat.",
        creator: CREATORS[7],
        membersCount: 5,
        date: "May 13, 2025 · 10:05 AM",
        github: "github.com/mia-davis/p2p-marketplace",
        demoUrl: "campusmarket.app",
        requiredAmount: 6000,
        status: "Active",
    },
    {
        name: "Wildlife Camera Trap Network",
        icon: Camera,
        iconColor: "#34d399",
        category: "Hardware",
        description:
            "Solar-powered camera traps with on-device species detection, streaming sightings to a conservation dashboard.",
        creator: CREATORS[8],
        membersCount: 6,
        date: "May 12, 2025 · 12:40 PM",
        github: "github.com/noah-thompson/camera-trap-network",
        demoUrl: "wildwatch.org",
        requiredAmount: 17500,
        status: "Active",
    },
    {
        name: "Mental Wellness Companion",
        icon: Heart,
        iconColor: "#f472b6",
        category: "Software",
        description:
            "A mood-tracking and journaling app that offers CBT-based exercises and gently nudges users toward professional support.",
        creator: CREATORS[9],
        membersCount: 4,
        date: "May 11, 2025 · 9:15 AM",
        github: "github.com/ava-robinson/wellness-companion",
        demoUrl: "mindfully.app",
        requiredAmount: 5400,
        status: "Active",
    },
    {
        name: "Indoor Air Quality Sensor",
        icon: Wifi,
        iconColor: "#22d3ee",
        category: "Hardware",
        description:
            "A compact sensor array measuring CO2, VOCs, and particulate matter, with alerts pushed to a companion mobile app.",
        creator: CREATORS[0],
        membersCount: 3,
        date: "May 10, 2025 · 5:50 PM",
        github: "github.com/aarav-patel/air-quality-sensor",
        demoUrl: "clearair-sensor.com",
        requiredAmount: 7300,
        status: "Completed",
    },
    {
        name: "Collaborative Code Review Tool",
        icon: Code2,
        iconColor: "#818cf8",
        category: "Software",
        description:
            "A lightweight code review extension that surfaces team conventions and flags risky diffs before they reach production.",
        creator: CREATORS[1],
        membersCount: 5,
        date: "May 9, 2025 · 8:25 AM",
        github: "github.com/sophia-lee/review-buddy",
        demoUrl: "reviewbuddy.dev",
        requiredAmount: 3900,
        status: "Active",
    },
    {
        name: "Solar-Powered Weather Station",
        icon: Cloud,
        iconColor: "#93c5fd",
        category: "Hardware",
        description:
            "A standalone weather station for remote farms, broadcasting hyperlocal forecasts over a long-range radio link.",
        creator: CREATORS[2],
        membersCount: 6,
        date: "May 8, 2025 · 2:10 PM",
        github: "github.com/ethan-wilson/solar-weather-station",
        demoUrl: "farmweather.io",
        requiredAmount: 11200,
        status: "Active",
    },
    {
        name: "Campus Navigation AR",
        icon: Map,
        iconColor: "#c084fc",
        category: "Software",
        description:
            "An augmented-reality wayfinding app that overlays directions on the camera feed to help new students find classrooms.",
        creator: CREATORS[3],
        membersCount: 4,
        date: "May 7, 2025 · 11:00 AM",
        github: "github.com/olivia-martinez/campus-ar-nav",
        demoUrl: "campusar.app",
        requiredAmount: 6800,
        status: "Active",
    },
    {
        name: "Smart Parking System",
        icon: Cpu,
        iconColor: "#fdba74",
        category: "Hardware",
        description:
            "Ultrasonic sensors and a rooftop camera array guide drivers to free spots and automate gate access for a campus garage.",
        creator: CREATORS[4],
        membersCount: 5,
        date: "May 6, 2025 · 4:45 PM",
        github: "github.com/james-carter/smart-parking",
        demoUrl: "parksmart.tech",
        requiredAmount: 14500,
        status: "Active",
    },
    {
        name: "Recipe Recommendation Engine",
        icon: Sparkles,
        iconColor: "#fcd34d",
        category: "Software",
        description:
            "Suggests recipes from whatever is already in your fridge, learning your taste preferences over time.",
        creator: CREATORS[5],
        membersCount: 3,
        date: "May 5, 2025 · 9:35 AM",
        github: "github.com/isabella-brown/recipe-engine",
        demoUrl: "whatscooking.app",
        requiredAmount: 3100,
        status: "Active",
    },
    {
        name: "Robotic Sorting Arm",
        icon: Bot,
        iconColor: "#fb923c",
        category: "Hardware",
        description:
            "A low-cost robotic arm that sorts recyclables by material type using a trained vision model and a pick-and-place gripper.",
        creator: CREATORS[6],
        membersCount: 7,
        date: "May 4, 2025 · 1:20 PM",
        github: "github.com/liam-johnson/sorting-arm",
        demoUrl: "sortbot.dev",
        requiredAmount: 19800,
        status: "Active",
    },
    {
        name: "Decentralized File Storage",
        icon: Database,
        iconColor: "#a3e635",
        category: "Software",
        description:
            "A peer-to-peer file storage network that splits and encrypts files across volunteer nodes for censorship-resistant backups.",
        creator: CREATORS[7],
        membersCount: 6,
        date: "May 3, 2025 · 3:00 PM",
        github: "github.com/mia-davis/decentral-storage",
        demoUrl: "vaultmesh.net",
        requiredAmount: 13400,
        status: "Active",
    },
    {
        name: "Wearable Fitness Tracker",
        icon: Watch,
        iconColor: "#2dd4bf",
        category: "Hardware",
        description:
            "An open-hardware wrist tracker with heart-rate and sleep monitoring, designed to be repairable and battery-swappable.",
        creator: CREATORS[8],
        membersCount: 5,
        date: "May 2, 2025 · 10:50 AM",
        github: "github.com/noah-thompson/open-fit-tracker",
        demoUrl: "openfit.io",
        requiredAmount: 16700,
        status: "Active",
    },
    {
        name: "Voice-Controlled Smart Mirror",
        icon: Mic,
        iconColor: "#f87171",
        category: "Hardware",
        description:
            "A bathroom mirror with an embedded display showing weather, calendar, and news, controlled entirely by voice commands.",
        creator: CREATORS[9],
        membersCount: 4,
        date: "May 1, 2025 · 8:15 AM",
        github: "github.com/ava-robinson/smart-mirror",
        demoUrl: "mirrorvoice.app",
        requiredAmount: 5200,
        status: "Completed",
    },
    {
        name: "Online Music Collaboration",
        icon: Music,
        iconColor: "#e879f9",
        category: "Software",
        description:
            "Lets musicians record and layer tracks together in real time over the browser, no matter where each player is located.",
        creator: CREATORS[0],
        membersCount: 5,
        date: "Apr 30, 2025 · 6:40 PM",
        github: "github.com/aarav-patel/jam-together",
        demoUrl: "jamtogether.live",
        requiredAmount: 7600,
        status: "Active",
    },
    {
        name: "Greenhouse Climate Controller",
        icon: Leaf,
        iconColor: "#86efac",
        category: "Hardware",
        description:
            "Automates vents, misters, and grow lights based on live humidity and temperature readings to keep seedlings healthy.",
        creator: CREATORS[1],
        membersCount: 3,
        date: "Apr 29, 2025 · 11:25 AM",
        github: "github.com/sophia-lee/greenhouse-control",
        demoUrl: "growright.io",
        requiredAmount: 8900,
        status: "Active",
    },
    {
        name: "AI Resume Builder",
        icon: FileText,
        iconColor: "#7dd3fc",
        category: "Software",
        description:
            "Turns a short interview with the user into a tailored, ATS-friendly resume in minutes, with role-specific phrasing.",
        creator: CREATORS[2],
        membersCount: 4,
        date: "Apr 28, 2025 · 2:05 PM",
        github: "github.com/ethan-wilson/ai-resume-builder",
        demoUrl: "resumeforge.app",
        requiredAmount: 4500,
        status: "Active",
    },
    {
        name: "Autonomous Lawn Mower",
        icon: Truck,
        iconColor: "#bef264",
        category: "Hardware",
        description:
            "A GPS-guided mower that maps a yard once and then maintains it on a schedule, avoiding pets and obstacles automatically.",
        creator: CREATORS[3],
        membersCount: 6,
        date: "Apr 27, 2025 · 9:50 AM",
        github: "github.com/olivia-martinez/auto-mower",
        demoUrl: "mowbot.tech",
        requiredAmount: 21000,
        status: "Active",
    },
];

const PROJECTS = RAW_PROJECTS.map((p, i) => ({
    id: i + 1,
    ...p,
    members: buildMembers(p.creator, p.membersCount),
}));

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Avatar({ name, color, size = 36 }) {
    return (
        <div
            className="pm-avatar"
            style={{
                width: size,
                height: size,
                background: `${color}26`,
                color,
                fontSize: size * 0.38,
            }}
        >
            {initials(name)}
        </div>
    );
}

function CategoryBadge({ category }) {
    const isSoftware = category === "Software";
    return (
        <span className={`pm-badge ${isSoftware ? "pm-badge-software" : "pm-badge-hardware"}`}>
            {category}
        </span>
    );
}

function StatusBadge({ status }) {
    const isActive = status === "Active";
    return (
        <span className={`pm-status ${isActive ? "pm-status-active" : "pm-status-completed"}`}>
            <span className="pm-status-dot" />
            {status}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProjectsManagement() {
    const [projects, setProjects] = useState(PROJECTS);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [viewProject, setViewProject] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toast, setToast] = useState(null);
    const categoryRef = useRef(null);

    useEffect(() => {
        function onClick(e) {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setCategoryOpen(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return projects.filter((p) => {
            const matchesCategory = category === "All" || p.category === category;
            const matchesSearch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.creator.name.toLowerCase().includes(q) ||
                p.creator.username.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [projects, search, category]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setPage(1);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [search, category, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    function showToast(message) {
        setToast(message);
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast(null), 3000);
    }

    function confirmDelete() {
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast("Project deleted successfully");
    }

    function pageNumbers() {
        const out = [];
        const add = (n) => out.push(n);
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) add(i);
            return out;
        }
        add(1);
        if (currentPage > 3) out.push("…");
        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            add(i);
        }
        if (currentPage < totalPages - 2) out.push("…");
        add(totalPages);
        return out;
    }

    return (
        <div className="pm-page">
            {/* Header */}
            <div className="pm-header">
                <div className="pm-header-icon">
                    <Briefcase size={22} />
                </div>
                <div>
                    <h1>Projects Management</h1>
                    <p>View and manage all projects created by users.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="pm-toolbar">
                <div className="pm-search-wrapper">
                    <Search size={17} className="pm-search-icon" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects by name, description or creator…"
                        className="pm-search-input"
                    />
                </div>

                <div className="pm-category-wrapper">
                    <span className="pm-category-label">Category:</span>
                    <div className="pm-dropdown" ref={categoryRef}>
                        <button
                            onClick={() => setCategoryOpen((o) => !o)}
                            className="pm-dropdown-btn"
                        >
                            {category}
                            <ChevronDown size={15} />
                        </button>
                        {categoryOpen && (
                            <div className="pm-dropdown-menu">
                                {["All", "Software", "Hardware"].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setCategory(c);
                                            setCategoryOpen(false);
                                        }}
                                        className={`pm-dropdown-item ${c === category ? "active" : ""}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="pm-table-container">
                <div className="pm-table-scroll">
                    <table className="pm-table">
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Creator</th>
                                <th>Category</th>
                                <th>Members</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map((p) => {
                                const Icon = p.icon;
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="pm-project-cell">
                                                <div
                                                    className="pm-project-icon"
                                                    style={{
                                                        background: `${p.iconColor}1f`,
                                                        color: p.iconColor,
                                                    }}
                                                >
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="pm-project-name">{p.name}</div>
                                                    <div className="pm-project-desc">{p.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="pm-creator-cell">
                                                <Avatar name={p.creator.name} color={p.creator.color} size={32} />
                                                <div>
                                                    <div className="pm-creator-name">{p.creator.name}</div>
                                                    <div className="pm-creator-username">@{p.creator.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <CategoryBadge category={p.category} />
                                        </td>
                                        <td className="pm-members">{p.membersCount}</td>
                                        <td className="pm-date">{p.date}</td>
                                        <td>
                                            <div className="pm-actions">
                                                <button
                                                    onClick={() => setViewProject(p)}
                                                    className="pm-btn-view"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(p)}
                                                    className="pm-btn-delete"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="pm-empty">
                                        No projects match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Pagination */}
            <div className="pm-footer">
                <div className="pm-rows-section">
                    <span className="pm-rows-label">Rows per page:</span>
                    {[10, 25, 50, 100].map((n) => (
                        <button
                            key={n}
                            onClick={() => setRowsPerPage(n)}
                            className={`pm-rows-btn ${rowsPerPage === n ? "active" : ""}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                <div className="pm-pagination">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="pm-page-prev"
                    >
                        <ChevronLeft size={15} /> Previous
                    </button>
                    {pageNumbers().map((n, idx) =>
                        n === "…" ? (
                            <span key={`dots-${idx}`} className="pm-page-dots">
                                …
                            </span>
                        ) : (
                            <button
                                key={n}
                                onClick={() => setPage(n)}
                                className={`pm-page-btn ${n === currentPage ? "active" : ""}`}
                            >
                                {n}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="pm-page-next"
                    >
                        Next <ChevronRight size={15} />
                    </button>
                </div>
            </div>

            {/* View modal */}
            {viewProject && (
                <div className="pm-modal-backdrop">
                    <div className="pm-modal">
                        <div className="pm-modal-header">
                            <div className="pm-modal-title">
                                <Briefcase size={18} />
                                Project Details
                            </div>
                            <button
                                onClick={() => setViewProject(null)}
                                className="pm-modal-close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="pm-modal-body">
                            <div className="pm-modal-project-header">
                                <div
                                    className="pm-modal-project-icon"
                                    style={{
                                        background: `${viewProject.iconColor}1f`,
                                        color: viewProject.iconColor,
                                    }}
                                >
                                    {React.createElement(viewProject.icon, { size: 22 })}
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                        <span className="pm-modal-project-name">
                                            {viewProject.name}
                                        </span>
                                        <CategoryBadge category={viewProject.category} />
                                    </div>
                                    <div className="pm-modal-creator">
                                        <Avatar
                                            name={viewProject.creator.name}
                                            color={viewProject.creator.color}
                                            size={22}
                                        />
                                        Created by{" "}
                                        <span>{viewProject.creator.name}</span>{" "}
                                        (@{viewProject.creator.username})
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="pm-modal-section-label">Description</div>
                                <p className="pm-modal-description">{viewProject.description}</p>
                            </div>

                            <div className="pm-modal-grid">
                                <div>
                                    <div className="pm-modal-grid-item-label">
                                        <Users size={13} /> Members
                                    </div>
                                    <div className="pm-modal-grid-item-value">{viewProject.membersCount}</div>
                                </div>
                                <div>
                                    <div className="pm-modal-grid-item-label">
                                        <Calendar size={13} /> Created On
                                    </div>
                                    <div className="pm-modal-grid-item-value">{viewProject.date}</div>
                                </div>
                                <div>
                                    <div className="pm-modal-grid-item-label">
                                        <Github size={13} /> Repository
                                    </div>
                                    <div className="pm-modal-link">{viewProject.github}</div>
                                </div>
                                <div>
                                    <div className="pm-modal-grid-item-label">
                                        <LinkIcon size={13} /> Demo URL
                                    </div>
                                    <div className="pm-modal-link">{viewProject.demoUrl}</div>
                                </div>
                                <div>
                                    <div className="pm-modal-grid-item-label">
                                        <DollarSign size={13} /> Required Amount
                                    </div>
                                    <div className="pm-modal-grid-item-value">
                                        ${viewProject.requiredAmount.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="pm-modal-grid-item-label">
                                        <CheckCircle2 size={13} /> Status
                                    </div>
                                    <StatusBadge status={viewProject.status} />
                                </div>
                            </div>

                            <div>
                                <div className="pm-modal-members-label">Project Members</div>
                                <div className="pm-modal-members-list">
                                    {viewProject.members.slice(0, 4).map((m, i) => (
                                        <div key={i} className="pm-modal-member-card">
                                            <Avatar name={m.name} color={m.color} size={26} />
                                            <div>
                                                <div className="pm-modal-member-name">{m.name}</div>
                                                <div className="pm-modal-member-role">{m.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {viewProject.members.length > 4 && (
                                        <div className="pm-modal-members-more">
                                            +{viewProject.members.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pm-modal-footer">
                            <button
                                onClick={() => setViewProject(null)}
                                className="pm-modal-close-btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div className="pm-modal-backdrop">
                    <div className="pm-delete-modal">
                        <div className="pm-delete-modal-header">
                            <div className="pm-delete-icon">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="pm-delete-modal-title">Delete project?</h3>
                        </div>
                        <p className="pm-delete-modal-body">
                            This will permanently delete{" "}
                            <strong>"{deleteTarget.name}"</strong>.
                            This action cannot be undone.
                        </p>
                        <div className="pm-delete-modal-actions">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="pm-delete-cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="pm-delete-confirm-btn"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="pm-toast">
                    <div className="pm-toast-inner">
                        <CheckCircle2 size={17} style={{ color: "#4ade80" }} />
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
