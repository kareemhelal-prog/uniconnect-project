/**
 * UniConnect — Comprehensive Seed Script
 * Run: node server/database/seed.js
 * Password for all test users: UniConnect123
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const mysql  = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "uniconnect",
  port:     process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit: 5,
});

const PASS = "UniConnect123";

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const hash = await bcrypt.hash(PASS, 10);
    console.log("✅ Password hashed");

    // ─── CLEAR existing seed data (safe: order matters for FK) ──────────────
    const tables = [
      "notifications","reports","file_ratings","file_comments","file_likes","files",
      "academic_reviews","project_interests","project_members","projects",
      "group_post_comments","group_post_likes","group_posts","group_members","groups",
      "shares","likes","comments","posts","user_skills","skills",
      "investor_profiles","doctor_profiles","profile_studies","users"
    ];
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const t of tables) await conn.query(`TRUNCATE TABLE \`${t}\``);
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Tables cleared");

    // ─── USERS ──────────────────────────────────────────────────────────────
    const users = [
      // admin
      { username:"admin",          name:"Admin UniConnect",    email:"admin@uniconnect.com",         role:"admin" },
      // doctors
      { username:"dr_ahmed",       name:"Dr. Ahmed Hassan",    email:"ahmed.hassan@uni.edu",         role:"doctor" },
      { username:"dr_sara",        name:"Dr. Sara Khalil",     email:"sara.khalil@uni.edu",          role:"doctor" },
      { username:"dr_omar",        name:"Dr. Omar Nasser",     email:"omar.nasser@uni.edu",          role:"doctor" },
      { username:"dr_layla",       name:"Dr. Layla Ibrahim",   email:"layla.ibrahim@uni.edu",        role:"doctor" },
      { username:"dr_youssef",     name:"Dr. Youssef Ali",     email:"youssef.ali@uni.edu",          role:"doctor" },
      // students
      { username:"kareem_m",       name:"Kareem Mohamed",      email:"kareem@student.edu",           role:"student" },
      { username:"nour_ali",       name:"Nour Ali",            email:"nour@student.edu",             role:"student" },
      { username:"adam_t",         name:"Adam Tarek",          email:"adam@student.edu",             role:"student" },
      { username:"hana_s",         name:"Hana Salem",          email:"hana@student.edu",             role:"student" },
      { username:"ziad_k",         name:"Ziad Karim",          email:"ziad@student.edu",             role:"student" },
      { username:"lina_f",         name:"Lina Fawzi",          email:"lina@student.edu",             role:"student" },
      { username:"omar_b",         name:"Omar Bassem",         email:"omar.b@student.edu",           role:"student" },
      { username:"rania_h",        name:"Rania Hassan",        email:"rania@student.edu",            role:"student" },
      { username:"mina_g",         name:"Mina George",         email:"mina@student.edu",             role:"student" },
      { username:"salma_y",        name:"Salma Younis",        email:"salma@student.edu",            role:"student" },
      // investors
      { username:"invest_tarek",   name:"Tarek Mansour",       email:"tarek@ventures.com",           role:"investor" },
      { username:"invest_dina",    name:"Dina Sherif",         email:"dina@techfund.com",            role:"investor" },
      { username:"invest_ali",     name:"Ali Abdel Rahman",    email:"ali@growth.io",                role:"investor" },
    ];

    const userIds = {};
    for (const u of users) {
      const [r] = await conn.query(
        `INSERT INTO Users (username,name,email,password,role,bio,is_active) VALUES (?,?,?,?,?,?,1)`,
        [u.username, u.name, u.email, hash, u.role,
          `${u.name} — ${u.role} at UniConnect University`]
      );
      userIds[u.username] = r.insertId;
    }
    console.log("✅ Users inserted:", Object.keys(userIds).length);

    // ─── PROFILES ───────────────────────────────────────────────────────────
    const studentProfiles = [
      { u:"kareem_m", faculty:"Faculty of Computing",   major:"Computer Science",        year:"3", grad:2026 },
      { u:"nour_ali", faculty:"Faculty of Engineering", major:"Software Engineering",    year:"2", grad:2027 },
      { u:"adam_t",   faculty:"Faculty of Computing",   major:"Information Technology",  year:"4", grad:2025 },
      { u:"hana_s",   faculty:"Faculty of Arts",        major:"Psychology",              year:"1", grad:2028 },
      { u:"ziad_k",   faculty:"Faculty of Engineering", major:"Electrical Engineering",  year:"3", grad:2026 },
      { u:"lina_f",   faculty:"Faculty of Computing",   major:"Computer Science",        year:"2", grad:2027 },
      { u:"omar_b",   faculty:"Faculty of Engineering", major:"Civil Engineering",       year:"4", grad:2025 },
      { u:"rania_h",  faculty:"Faculty of Medicine",    major:"General Medicine",        year:"3", grad:2026 },
      { u:"mina_g",   faculty:"Faculty of Computing",   major:"Cybersecurity",           year:"1", grad:2028 },
      { u:"salma_y",  faculty:"Faculty of Business",    major:"Business Administration", year:"2", grad:2027 },
    ];
    for (const p of studentProfiles) {
      await conn.query(
        `INSERT INTO Profile_Studies (user_id,faculty,major,academic_year,graduation_year) VALUES (?,?,?,?,?)`,
        [userIds[p.u], p.faculty, p.major, p.year, p.grad]
      );
    }

    const doctorProfiles = [
      { u:"dr_ahmed",   faculty:"Faculty of Computing",   spec:"Artificial Intelligence",    office:"B-201" },
      { u:"dr_sara",    faculty:"Faculty of Engineering",  spec:"Software Engineering",       office:"A-305" },
      { u:"dr_omar",    faculty:"Faculty of Computing",   spec:"Database Systems",            office:"B-110" },
      { u:"dr_layla",   faculty:"Faculty of Medicine",    spec:"Medical Informatics",         office:"C-402" },
      { u:"dr_youssef", faculty:"Faculty of Engineering",  spec:"Electrical Engineering",     office:"A-215" },
    ];
    for (const d of doctorProfiles) {
      await conn.query(
        `INSERT INTO Doctor_Profiles (user_id,faculty,specialization,office_location) VALUES (?,?,?,?)`,
        [userIds[d.u], d.faculty, d.spec, d.office]
      );
    }

    for (const u of ["invest_tarek","invest_dina","invest_ali"]) {
      const companies = { invest_tarek:"Mansour Ventures", invest_dina:"TechFund Egypt", invest_ali:"Growth.io MENA" };
      await conn.query(
        `INSERT INTO Investor_Profiles (user_id,company_name,investment_field) VALUES (?,?,?)`,
        [userIds[u], companies[u], "Technology & Education"]
      );
    }
    console.log("✅ Profiles inserted");

    // ─── SKILLS ─────────────────────────────────────────────────────────────
    const skills = ["Python","JavaScript","React","Node.js","MySQL","Machine Learning",
      "AI","Cybersecurity","UI/UX","Data Analysis","C++","Java","PHP","Cloud Computing","DevOps"];
    const skillIds = {};
    for (const s of skills) {
      const [r] = await conn.query(`INSERT INTO Skills (name) VALUES (?)`, [s]);
      skillIds[s] = r.insertId;
    }

    const userSkills = {
      kareem_m: ["Python","JavaScript","React","Machine Learning"],
      nour_ali:  ["React","Node.js","UI/UX"],
      adam_t:    ["Python","AI","Data Analysis","MySQL"],
      ziad_k:    ["C++","Java","Cloud Computing"],
      lina_f:    ["JavaScript","React","Node.js"],
      mina_g:    ["Cybersecurity","Python","C++"],
      omar_b:    ["Java","MySQL","DevOps"],
    };
    for (const [u, sk] of Object.entries(userSkills)) {
      for (const s of sk) {
        await conn.query(`INSERT IGNORE INTO User_Skills (user_id,skill_id) VALUES (?,?)`,
          [userIds[u], skillIds[s]]);
      }
    }
    console.log("✅ Skills inserted");

    // ─── POSTS ──────────────────────────────────────────────────────────────
    const posts = [
      { u:"kareem_m",   title:"My Experience with Machine Learning",         content:"After 6 months of studying ML, I finally built my first neural network! Started with basic linear regression, moved to CNNs. The journey was tough but rewarding. Happy to share resources with anyone interested 🚀",           type:"academic" },
      { u:"dr_ahmed",   title:"New AI Course Material Available",            content:"I've uploaded the complete lecture slides for COMP-401 Artificial Intelligence. Includes neural networks, natural language processing, and computer vision modules. Check the Files section!",                                      type:"academic" },
      { u:"nour_ali",   title:"Looking for Team Members for Hackathon",      content:"Our university hackathon is in 3 weeks! I'm forming a team of 4 — looking for someone with backend skills (Node.js/Python) and a UI designer. We have a killer idea for a mental health app. DM me 💡",                        type:"opportunity" },
      { u:"adam_t",     title:"Final Year Project Presentation Done!",       content:"Just finished presenting my graduation project — an AI-powered plagiarism detection system. Got an A grade! Huge thanks to Dr. Ahmed for the guidance and to my team. Can't believe university is almost over 🎓",             type:"general" },
      { u:"dr_sara",    title:"Software Engineering Best Practices",          content:"Key takeaways from today's lecture: 1) Write clean, readable code. 2) Test early and often. 3) Document your APIs. 4) Use version control religiously. 5) Refactor continuously. These habits will define your career.",        type:"academic" },
      { u:"hana_s",     title:"Interesting Psychology Study Findings",       content:"Our research group just completed a study on social media's impact on student academic performance. Surprising finding: students who limit social media to 30min/day score 15% higher on average. Details in my next post!",    type:"academic" },
      { u:"ziad_k",     title:"IoT Project Update — Week 3",                 content:"Making great progress on the smart campus navigation system. Using ESP32 microcontrollers + BLE beacons + custom Android app. Battery life is now 48 hours (up from 12). Will post a demo video soon!",                          type:"academic" },
      { u:"lina_f",     title:"Study Group for Data Structures Exam",        content:"Anyone in Year 2 CS want to form a study group for the Data Structures final? I've organized all the lecture notes and past papers. Planning to meet Saturday 10am in the library. Comment below!",                              type:"general" },
      { u:"invest_tarek",title:"Funding Opportunity for Student Startups",   content:"My fund is actively looking for university student projects to invest in. Particularly interested in EdTech, HealthTech, and AI solutions. No equity required for the first round — pure grant up to $10,000. Apply now!",       type:"opportunity" },
      { u:"dr_omar",    title:"Database Design Workshop — Registration Open", content:"I'm running a 3-day intensive workshop on advanced database design. Topics: indexing strategies, query optimization, NoSQL vs SQL, and distributed databases. Limited to 20 students. Free for enrolled students!",            type:"academic" },
      { u:"mina_g",     title:"CTF Competition Results — We Won!",           content:"Our team 'ByteBreakers' won the regional Capture The Flag competition! Solved 23/25 challenges including a particularly tricky buffer overflow exploit. So proud of the team. Security is our passion! 🔐",                    type:"general" },
      { u:"omar_b",     title:"Civil Engineering Internship Tips",            content:"Just finished my summer internship at a top construction firm. Key advice: 1) Learn AutoCAD deeply. 2) Site visits are more valuable than lectures. 3) Network actively. 4) Get your safety certifications early. Ask me anything!", type:"general" },
      { u:"rania_h",    title:"Medical Students — Free USMLE Resources",     content:"Compiled a list of free online resources for USMLE Step 1 prep: Anki decks, Pathoma PDF (first aid), Amboss free questions, and YouTube lectures. Sharing the full Google Drive folder in the comments!",                      type:"academic" },
      { u:"salma_y",    title:"Business Plan Competition — Join Our Team",   content:"Looking for co-founders for the National Business Plan Competition. Have a solid idea for a subscription-based tutoring platform. Need someone with finance/accounting background and a tech co-founder. Prize: $50,000 💰",      type:"opportunity" },
      { u:"dr_layla",   title:"Health Informatics: The Future of Medicine",  content:"Excited to share that our faculty just received a $2M grant to develop an AI-assisted diagnosis system. We're looking for final-year CS and Medicine students to join the research team as paid research assistants!",            type:"opportunity" },
    ];

    const postIds = [];
    for (const p of posts) {
      const [r] = await conn.query(
        `INSERT INTO Posts (user_id,title,content,post_type) VALUES (?,?,?,?)`,
        [userIds[p.u], p.title, p.content, p.type]
      );
      postIds.push(r.insertId);
    }
    console.log("✅ Posts inserted:", postIds.length);

    // ─── LIKES ──────────────────────────────────────────────────────────────
    const likers = ["kareem_m","nour_ali","adam_t","hana_s","ziad_k","lina_f","omar_b","rania_h","mina_g","salma_y","dr_ahmed","dr_sara"];
    for (let i = 0; i < postIds.length; i++) {
      const numLikes = Math.floor(Math.random() * 8) + 2;
      const shuffled = [...likers].sort(() => 0.5 - Math.random()).slice(0, numLikes);
      for (const l of shuffled) {
        await conn.query(`INSERT IGNORE INTO Likes (user_id,post_id) VALUES (?,?)`,
          [userIds[l], postIds[i]]);
      }
    }
    console.log("✅ Likes inserted");

    // ─── COMMENTS ───────────────────────────────────────────────────────────
    const commentSets = [
      ["Great post! Really helpful 👍", "kareem_m"],
      ["Thanks for sharing this!", "nour_ali"],
      ["This is exactly what I needed 🙏", "adam_t"],
      ["Amazing work, keep it up!", "hana_s"],
      ["Can you share more details?", "ziad_k"],
      ["I had the same experience!", "lina_f"],
      ["Very insightful post 💡", "omar_b"],
      ["This helped me a lot, thanks!", "rania_h"],
      ["Looking forward to more posts like this", "mina_g"],
      ["Excellent content! Highly recommend", "salma_y"],
      ["Could you elaborate on point 3?", "kareem_m"],
      ["Just joined the study group!", "nour_ali"],
    ];
    for (let i = 0; i < postIds.length; i++) {
      const numComments = Math.floor(Math.random() * 3) + 1;
      const selected = [...commentSets].sort(() => 0.5 - Math.random()).slice(0, numComments);
      for (const [text, u] of selected) {
        await conn.query(`INSERT INTO Comments (user_id,post_id,content) VALUES (?,?,?)`,
          [userIds[u], postIds[i], text]);
      }
    }
    console.log("✅ Comments inserted");

    // ─── FOLLOWS ─────────────────────────────────────────────────────────────
    const followPairs = [
      ["kareem_m","nour_ali"],["kareem_m","adam_t"],["kareem_m","dr_ahmed"],
      ["nour_ali","kareem_m"],["nour_ali","lina_f"],["nour_ali","dr_sara"],
      ["adam_t","kareem_m"],["adam_t","ziad_k"],["adam_t","invest_tarek"],
      ["hana_s","rania_h"],["hana_s","salma_y"],["ziad_k","adam_t"],
      ["lina_f","nour_ali"],["lina_f","kareem_m"],["omar_b","adam_t"],
      ["rania_h","dr_layla"],["mina_g","omar_b"],["salma_y","invest_dina"],
    ];
    for (const [follower, following] of followPairs) {
      await conn.query(
        `INSERT IGNORE INTO Followers (follower_id,following_id) VALUES (?,?)`,
        [userIds[follower], userIds[following]]
      );
    }
    console.log("✅ Follows inserted");

    // ─── GROUPS ─────────────────────────────────────────────────────────────
    const groups = [
      { u:"kareem_m",  name:"CS Study Group",               desc:"Computer Science students sharing resources, notes, and study tips for all CS courses.",       priv:false },
      { u:"dr_ahmed",  name:"AI Research Lab",              desc:"Research group focused on AI, machine learning, and deep learning projects and publications.",  priv:false },
      { u:"nour_ali",  name:"Web Dev Community",            desc:"Frontend and backend developers building real-world projects and learning together.",           priv:false },
      { u:"ziad_k",    name:"IoT & Embedded Systems",       desc:"Engineers working with microcontrollers, sensors, and smart devices. Weekly project showcases.",priv:false },
      { u:"hana_s",    name:"Psychology & Wellbeing Club",  desc:"Supporting student mental health, sharing research, and organizing wellbeing workshops.",       priv:false },
      { u:"invest_tarek","name":"Startup Founders Network", desc:"Connect student entrepreneurs with mentors and investors. Pitch sessions every month.",        priv:false },
      { u:"mina_g",    name:"Cybersecurity CTF Team",       desc:"Competitive hacking team preparing for CTF competitions. All skill levels welcome!",           priv:false },
      { u:"salma_y",   name:"Business & Entrepreneurship",  desc:"For business students and aspiring entrepreneurs. Case studies, competitions, networking.",    priv:false },
    ];
    const groupIds = [];
    for (const g of groups) {
      const [r] = await conn.query(
        `INSERT INTO \`Groups\` (creator_id,name,description,is_private) VALUES (?,?,?,?)`,
        [userIds[g.u], g.name, g.desc, g.priv]
      );
      groupIds.push(r.insertId);
      await conn.query(
        `INSERT INTO Group_Members (group_id,user_id,role) VALUES (?,?,'admin')`,
        [r.insertId, userIds[g.u]]
      );
    }
    console.log("✅ Groups inserted:", groupIds.length);

    // ─── GROUP MEMBERS ───────────────────────────────────────────────────────
    const groupMemberships = [
      [0, ["nour_ali","adam_t","lina_f","mina_g","ziad_k"]],
      [1, ["kareem_m","adam_t","mina_g","lina_f"]],
      [2, ["kareem_m","nour_ali","lina_f","salma_y"]],
      [3, ["adam_t","omar_b","kareem_m"]],
      [4, ["rania_h","salma_y","hana_s"]],
      [5, ["kareem_m","nour_ali","adam_t","salma_y","invest_dina"]],
      [6, ["kareem_m","adam_t","omar_b","ziad_k"]],
      [7, ["nour_ali","rania_h","invest_ali"]],
    ];
    for (const [gi, members] of groupMemberships) {
      for (const m of members) {
        await conn.query(
          `INSERT IGNORE INTO Group_Members (group_id,user_id,role) VALUES (?,?,'member')`,
          [groupIds[gi], userIds[m]]
        );
      }
    }
    console.log("✅ Group members inserted");

    // ─── GROUP POSTS ─────────────────────────────────────────────────────────
    const groupPosts = [
      { gi:0, u:"kareem_m", content:"Sharing my complete Data Structures notes — trees, graphs, heaps, and sorting algorithms. 120 pages of organized notes. Download in Files section!" },
      { gi:0, u:"nour_ali",  content:"The Operating Systems exam is next Tuesday. Anyone want to do a last-minute review session on Friday afternoon?" },
      { gi:1, u:"dr_ahmed",  content:"New research paper published! 'Adaptive Learning Systems using Reinforcement Learning' — link in my profile. Co-authored with kareem_m." },
      { gi:1, u:"adam_t",    content:"Working on implementing a Transformer model from scratch. Getting ~91% accuracy on the CIFAR-10 dataset. Happy to share the code!" },
      { gi:2, u:"nour_ali",  content:"Just deployed my first full-stack app to production! React + Node.js + MySQL. Learned so much from this group. Thanks everyone 🙏" },
      { gi:5, u:"invest_tarek", content:"Applications are now open for the Spring 2025 Startup Grant — up to $10,000 no-equity funding. Deadline: March 31. Apply at the link in my profile!" },
      { gi:6, u:"mina_g",    content:"We placed 2nd in the national CTF! Great performance from everyone. Next competition is in 6 weeks — let's step up our reverse engineering skills." },
    ];
    for (const gp of groupPosts) {
      await conn.query(
        `INSERT INTO Group_Posts (group_id,user_id,content) VALUES (?,?,?)`,
        [groupIds[gp.gi], userIds[gp.u], gp.content]
      );
    }
    console.log("✅ Group posts inserted");

    // ─── FILES ──────────────────────────────────────────────────────────────
    const files = [
      { u:"kareem_m", name:"Data Structures Complete Notes.pdf",          type:"pdf",  size:2048000, subject:"Data Structures",       year:"3", desc:"Comprehensive notes covering all DS topics with examples and diagrams." },
      { u:"adam_t",   name:"Machine Learning Lecture Slides.pptx",        type:"pptx", size:5120000, subject:"Machine Learning",       year:"4", desc:"Full semester ML slides: regression, classification, neural nets, CNNs." },
      { u:"nour_ali", name:"Web Development Cheat Sheet.pdf",             type:"pdf",  size:512000,  subject:"Software Engineering",   year:"2", desc:"Quick reference for HTML, CSS, JavaScript, React, and Node.js patterns." },
      { u:"lina_f",   name:"Algorithms & Complexity Notes.pdf",           type:"pdf",  size:1536000, subject:"Algorithms",             year:"3", desc:"Time complexity analysis, sorting algorithms, dynamic programming guide." },
      { u:"ziad_k",   name:"Embedded Systems Lab Manual.pdf",             type:"pdf",  size:3072000, subject:"Computer Networks",      year:"3", desc:"Complete lab manual with circuit diagrams and Arduino/ESP32 examples." },
      { u:"mina_g",   name:"Cybersecurity Fundamentals.pdf",              type:"pdf",  size:2560000, subject:"Cybersecurity",          year:"2", desc:"Network security, cryptography, ethical hacking basics, and CTF tips." },
      { u:"omar_b",   name:"Database Systems Question Bank.docx",         type:"docx", size:1024000, subject:"DBMS",                   year:"2", desc:"500+ practice questions with answers for DBMS final exam preparation." },
      { u:"rania_h",  name:"Anatomy & Physiology Summary.pdf",            type:"pdf",  size:4096000, subject:"Medicine",               year:"3", desc:"Comprehensive summary of human anatomy for medical students." },
      { u:"salma_y",  name:"Business Strategy Case Studies.pptx",        type:"pptx", size:3584000, subject:"Business",               year:"2", desc:"Harvard Business School style case studies with analysis frameworks." },
      { u:"dr_ahmed", name:"AI Course — Week 1 to 8 Slides.pdf",         type:"pdf",  size:8192000, subject:"Artificial Intelligence", year:"4", desc:"Official course slides for COMP-401 AI covering all exam topics." },
      { u:"dr_sara",  name:"Software Testing Techniques.pdf",            type:"pdf",  size:1792000, subject:"Software Engineering",   year:"3", desc:"Unit testing, integration testing, TDD, BDD, and test automation." },
      { u:"dr_omar",  name:"Advanced SQL Queries Workbook.pdf",           type:"pdf",  size:2304000, subject:"DBMS",                   year:"3", desc:"Complex JOIN operations, subqueries, indexing, stored procedures." },
      { u:"adam_t",   name:"Python for Data Science — Full Notes.pdf",   type:"pdf",  size:3840000, subject:"Data Analysis",          year:"3", desc:"NumPy, Pandas, Matplotlib, Seaborn, and Scikit-learn complete guide." },
      { u:"kareem_m", name:"Operating Systems Past Papers 2020-2024.pdf",type:"pdf",  size:1280000, subject:"Operating Systems",      year:"3", desc:"5 years of past exam papers with model answers for OS course." },
    ];
    const fileIds = [];
    for (const f of files) {
      const [r] = await conn.query(
        `INSERT INTO Files (uploader_id,file_name,file_url,file_type,file_size,subject,academic_year,description) VALUES (?,?,?,?,?,?,?,?)`,
        [userIds[f.u], f.name, `/uploads/${f.name.replace(/ /g,"_")}`, f.type, f.size, f.subject, f.year, f.desc]
      );
      fileIds.push(r.insertId);
    }
    console.log("✅ Files inserted:", fileIds.length);

    // ─── FILE LIKES & RATINGS ────────────────────────────────────────────────
    const raters = ["kareem_m","nour_ali","adam_t","hana_s","ziad_k","lina_f","omar_b","rania_h","mina_g","salma_y"];
    for (let i = 0; i < fileIds.length; i++) {
      const numActions = Math.floor(Math.random() * 6) + 3;
      const shuffled = [...raters].sort(() => 0.5 - Math.random()).slice(0, numActions);
      for (const r of shuffled) {
        await conn.query(`INSERT IGNORE INTO File_Likes (file_id,user_id) VALUES (?,?)`,
          [fileIds[i], userIds[r]]);
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
        await conn.query(`INSERT IGNORE INTO File_Ratings (file_id,user_id,rating) VALUES (?,?,?)`,
          [fileIds[i], userIds[r], rating]);
        await conn.query(`INSERT INTO File_Comments (file_id,user_id,content) VALUES (?,?,?)`,
          [fileIds[i], userIds[r], ["Very helpful, thanks!", "Excellent resource!", "Saved me so much time!", "Best notes I've found!"][Math.floor(Math.random()*4)]]);
      }
    }
    console.log("✅ File likes, ratings, comments inserted");

    // ─── PROJECTS ────────────────────────────────────────────────────────────
    const projects = [
      { u:"kareem_m",   title:"AI Study Planner",               desc:"An intelligent study scheduler that uses ML to optimize your revision timetable based on exam dates, difficulty, and past performance. Built with React and Python/Flask backend.", cat:"IT",          status:"mvp",       funding:5000,  github:"https://github.com/sample/ai-study-planner" },
      { u:"adam_t",     title:"Smart Plagiarism Detector",       desc:"Deep learning model for detecting academic plagiarism with 95% accuracy. Uses BERT embeddings and cosine similarity. Deployed as a web service for university use.", cat:"IT",          status:"launched",  funding:0,     github:"https://github.com/sample/plagiarism-detector" },
      { u:"ziad_k",     title:"Campus Navigation System",        desc:"Indoor navigation system using BLE beacons and ESP32 microcontrollers. Helps students find classrooms, labs, and facilities across 12 campus buildings.",                                cat:"Engineering", status:"prototype", funding:8000  },
      { u:"nour_ali",   title:"Student Mental Health App",       desc:"Mobile application connecting students with mental health resources, anonymous peer support, and professional counseling booking. React Native + Node.js.",                           cat:"IT",          status:"idea",      funding:15000 },
      { u:"salma_y",    title:"UniTutor — Peer Learning Platform",desc:"Subscription platform connecting students for paid peer tutoring sessions. Built marketplace with verified tutors, scheduling, and payment integration.",                           cat:"Business",    status:"mvp",       funding:20000, demo:"https://unitutor-demo.vercel.app" },
      { u:"mina_g",     title:"Campus IoT Security Monitor",     desc:"Network security monitoring system specifically designed for university campus IoT devices. Detects anomalies, unauthorized access, and vulnerability scanning.",                   cat:"IT",          status:"prototype", funding:12000 },
      { u:"rania_h",    title:"AI Medical Diagnosis Assistant",  desc:"Machine learning model that assists medical students in differential diagnosis. Trained on 50,000+ clinical cases. Accuracy: 87% on test set.",                                      cat:"Medicine",    status:"prototype", funding:30000, github:"https://github.com/sample/med-ai" },
      { u:"omar_b",     title:"Smart Building Energy Manager",   desc:"IoT-based building energy management system that reduces electricity consumption by 35% through smart scheduling of HVAC, lighting, and appliances.",                               cat:"Engineering", status:"launched",  funding:0     },
    ];
    const projectIds = [];
    for (const p of projects) {
      const [r] = await conn.query(
        `INSERT INTO Projects (creator_id,title,description,category,status,required_funding,github_link,demo_url) VALUES (?,?,?,?,?,?,?,?)`,
        [userIds[p.u], p.title, p.desc, p.cat, p.status, p.funding, p.github||null, p.demo||null]
      );
      projectIds.push(r.insertId);
      await conn.query(`INSERT IGNORE INTO Project_Members (project_id,user_id) VALUES (?,?)`,
        [r.insertId, userIds[p.u]]);
    }
    console.log("✅ Projects inserted:", projectIds.length);

    // ─── PROJECT MEMBERS & INTERESTS ─────────────────────────────────────────
    const projMembers = [
      [0, ["nour_ali","adam_t","lina_f"]],
      [1, ["kareem_m","mina_g"]],
      [2, ["adam_t","omar_b"]],
      [4, ["nour_ali","kareem_m"]],
      [6, ["kareem_m","mina_g"]],
    ];
    for (const [pi, members] of projMembers) {
      for (const m of members) {
        await conn.query(`INSERT IGNORE INTO Project_Members (project_id,user_id) VALUES (?,?)`,
          [projectIds[pi], userIds[m]]);
      }
    }

    const interests = [
      [0,"invest_tarek","This AI study planner has great commercial potential. Interested in seed funding."],
      [0,"invest_dina", "Love the concept. Happy to provide mentorship and initial funding."],
      [3,"invest_tarek","Mental health apps are a growing market. Would love to schedule a call."],
      [4,"invest_ali",  "The peer tutoring model is scalable. Interested in Series A after MVP validation."],
      [6,"invest_dina", "Healthcare AI is my investment focus. This project aligns perfectly."],
      [6,"invest_ali",  "Impressive accuracy numbers. Would like to see a live demo."],
    ];
    for (const [pi, u, note] of interests) {
      await conn.query(`INSERT IGNORE INTO Project_Interests (project_id,investor_id,note) VALUES (?,?,?)`,
        [projectIds[pi], userIds[u], note]);
    }
    console.log("✅ Project members & interests inserted");

    // ─── ACADEMIC REVIEWS ─────────────────────────────────────────────────────
    const reviews = [
      { student:"kareem_m", doctor:"dr_ahmed",   rating:5, anon:false, comment:"Dr. Ahmed is an exceptional professor. His AI lectures are clear, well-structured, and always include real-world examples. He genuinely cares about students' understanding. Best professor I've had!" },
      { student:"nour_ali",  doctor:"dr_ahmed",   rating:4, anon:false, comment:"Great teaching style and very knowledgeable. Office hours are very helpful. Sometimes the pace is a bit fast but overall excellent course." },
      { student:"adam_t",   doctor:"dr_ahmed",   rating:5, anon:true,  comment:"Truly inspiring! Changed my perspective on AI completely. The research opportunities he offers to students are incredible." },
      { student:"lina_f",   doctor:"dr_ahmed",   rating:4, anon:false, comment:"Very approachable and helpful. The course projects are challenging but you learn a lot from them." },
      { student:"kareem_m", doctor:"dr_sara",    rating:5, anon:false, comment:"Dr. Sara's software engineering course is the most practical course I've taken. Real industry practices, not just theory. She brings in guest speakers from top companies too!" },
      { student:"nour_ali",  doctor:"dr_sara",    rating:5, anon:false, comment:"Amazing professor! She really understands what the industry needs and teaches accordingly. Her code reviews are incredibly detailed and helpful." },
      { student:"lina_f",   doctor:"dr_sara",    rating:4, anon:true,  comment:"Good teacher with high standards. The workload is heavy but you come out very well prepared." },
      { student:"adam_t",   doctor:"dr_omar",    rating:4, anon:false, comment:"Dr. Omar's database course completely changed how I think about data. The query optimization techniques I learned saved my current project from being unusably slow." },
      { student:"kareem_m", doctor:"dr_omar",    rating:3, anon:true,  comment:"Knowledgeable professor but the exam questions could be clearer. Office hours are very helpful when you go." },
      { student:"omar_b",   doctor:"dr_omar",    rating:5, anon:false, comment:"Best database professor I've ever had. The hands-on SQL workshops are gold. I got my internship largely thanks to the SQL skills from his course." },
      { student:"rania_h",  doctor:"dr_layla",   rating:5, anon:false, comment:"Dr. Layla is pioneering medical informatics research at our university. Her passion for the intersection of medicine and technology is contagious. Highly recommend!" },
      { student:"hana_s",   doctor:"dr_layla",   rating:4, anon:false, comment:"Brilliant doctor and researcher. The course gives a great overview of how AI is transforming healthcare." },
      { student:"ziad_k",   doctor:"dr_youssef", rating:5, anon:false, comment:"Dr. Youssef's electrical engineering lectures are always perfectly organized. He never leaves a question unanswered and his lab sessions are fantastic." },
      { student:"omar_b",   doctor:"dr_youssef", rating:4, anon:true,  comment:"Great professor, very patient with students. The exams are fair and reflect what was taught in lectures." },
    ];
    for (const rv of reviews) {
      await conn.query(
        `INSERT IGNORE INTO Academic_Reviews (doctor_id,student_id,rating,comment,is_anonymous) VALUES (?,?,?,?,?)`,
        [userIds[rv.doctor], userIds[rv.student], rv.rating, rv.comment, rv.anon]
      );
    }
    console.log("✅ Academic reviews inserted:", reviews.length);

    // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
    const notifs = [
      { u:"kareem_m", sender:"nour_ali",    type:"follow",  msg:"Nour Ali started following you",                   ref:null },
      { u:"kareem_m", sender:"adam_t",      type:"like",    msg:"Adam Tarek liked your post",                        ref:postIds[0] },
      { u:"kareem_m", sender:"dr_ahmed",    type:"comment", msg:"Dr. Ahmed Hassan commented on your post",          ref:postIds[0] },
      { u:"kareem_m", sender:"invest_tarek",type:"post",    msg:"Tarek Mansour expressed interest in your project", ref:projectIds[0] },
      { u:"nour_ali",  sender:"kareem_m",   type:"follow",  msg:"Kareem Mohamed started following you",             ref:null },
      { u:"nour_ali",  sender:"lina_f",     type:"like",    msg:"Lina Fawzi liked your post",                        ref:postIds[2] },
      { u:"adam_t",   sender:"kareem_m",    type:"like",    msg:"Kareem Mohamed liked your post",                   ref:postIds[3] },
      { u:"adam_t",   sender:"invest_dina", type:"post",    msg:"Dina Sherif expressed interest in your project",   ref:projectIds[1] },
      { u:"dr_ahmed", sender:"kareem_m",    type:"review",  msg:"Kareem Mohamed reviewed your profile",             ref:null },
      { u:"dr_ahmed", sender:"nour_ali",    type:"review",  msg:"Nour Ali reviewed your profile",                   ref:null },
      { u:"ziad_k",   sender:"adam_t",      type:"like",    msg:"Adam Tarek liked your post",                        ref:postIds[6] },
      { u:"mina_g",   sender:"kareem_m",    type:"follow",  msg:"Kareem Mohamed started following you",             ref:null },
    ];
    for (const n of notifs) {
      await conn.query(
        `INSERT INTO Notifications (user_id,sender_id,type,reference_id,message,is_read) VALUES (?,?,?,?,?,0)`,
        [userIds[n.u], userIds[n.sender], n.type, n.ref, n.msg]
      );
    }
    console.log("✅ Notifications inserted:", notifs.length);

    // ─── COURSES & ENROLLMENTS ───────────────────────────────────────────────
    const courses = [
      { u:"dr_ahmed",   title:"Artificial Intelligence COMP-401",  desc:"Comprehensive AI course covering search, ML, neural networks, NLP, and computer vision. 3 credit hours." },
      { u:"dr_ahmed",   title:"Machine Learning Fundamentals",      desc:"Practical ML course with hands-on projects using Python, scikit-learn, and TensorFlow." },
      { u:"dr_sara",    title:"Software Engineering SE-301",        desc:"Industry-standard software development practices: Agile, design patterns, testing, CI/CD." },
      { u:"dr_sara",    title:"Web Development Full Stack",         desc:"Complete web development: React, Node.js, MySQL, REST APIs, authentication, deployment." },
      { u:"dr_omar",    title:"Database Systems DB-201",            desc:"Relational databases, SQL mastery, normalization, indexing, transactions, and NoSQL intro." },
      { u:"dr_omar",    title:"Advanced Database Design",           desc:"Query optimization, stored procedures, triggers, distributed databases, and database security." },
      { u:"dr_layla",   title:"Health Informatics HI-401",         desc:"Digital health systems, medical records, telemedicine, and AI applications in healthcare." },
      { u:"dr_youssef", title:"Electrical Circuits EE-201",        desc:"Circuit analysis, AC/DC theory, operational amplifiers, filters, and power systems fundamentals." },
    ];
    const courseIds = [];
    for (const c of courses) {
      const [r] = await conn.query(
        `INSERT INTO courses (doctor_id,title,description) VALUES (?,?,?)`,
        [userIds[c.u], c.title, c.desc]
      );
      courseIds.push(r.insertId);
    }

    const enrollments = [
      ["kareem_m",0],["kareem_m",1],["kareem_m",2],["kareem_m",4],
      ["nour_ali",2],["nour_ali",3],["nour_ali",0],
      ["adam_t",0],["adam_t",1],["adam_t",4],
      ["lina_f",2],["lina_f",3],["lina_f",4],
      ["ziad_k",7],["ziad_k",4],
      ["rania_h",6],["hana_s",6],
      ["mina_g",0],["mina_g",4],
      ["omar_b",4],["omar_b",7],["salma_y",2],
    ];
    for (const [u, ci] of enrollments) {
      await conn.query(
        `INSERT IGNORE INTO course_enrollments (course_id,student_id) VALUES (?,?)`,
        [courseIds[ci], userIds[u]]
      );
    }
    console.log("✅ Courses & enrollments inserted:", courses.length, "courses,", enrollments.length, "enrollments");

    await conn.commit();
    console.log("\n🎉 Seed completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Test accounts (password: UniConnect123):");
    console.log("  Admin:    admin@uniconnect.com");
    console.log("  Doctor:   ahmed.hassan@uni.edu");
    console.log("  Student:  kareem@student.edu");
    console.log("  Investor: tarek@ventures.com");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Seed failed:", err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
