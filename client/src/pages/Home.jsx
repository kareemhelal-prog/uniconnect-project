import React from "react";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import PostCard from "../components/PostCard";
import RightSidebar from "../components/RightSidebar";
import "../styles/Home.css";

const posts = [
  {
    id: 1,
    author: "Kareem Mohamed",
    role: "Frontend Designer",
    time: "2 hours ago",
    title: "New React Project 🚀",
    content:
      "Just finished building the UniConnect homepage using React and CSS. Super excited to share it with everyone on the platform!",
    avatar: "K",
    avatarColor: "linear-gradient(135deg, #a78bfa, #60a5fa)",
  },
  {
    id: 2,
    author: "Group Project",
    role: "Team Update",
    time: "2 months ago",
    title: "Group Project: AI in Medicine",
    content:
      "Join a academic courses meeting with group project. AI in Medicine, and associated with commitment to rms students.",
    avatar: "G",
    avatarColor: "linear-gradient(135deg, #34d399, #059669)",
  },
  {
    id: 3,
    author: "Campus News",
    role: "University",
    time: "4 months ago",
    title: "Campus News: Fall Break",
    content:
      "Fall Break, soon meet to welcome campus Fall Break. Taners the courses of the Gormior Fall Break.",
    avatar: "C",
    avatarColor: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
];

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      <div className="home-layout">
        <LeftSidebar />
        <main className="feed-section">
          <h2 className="feed-title">Academic Social Feed</h2>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
