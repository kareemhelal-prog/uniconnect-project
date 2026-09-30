// بيانات الديمو — كلها في الذاكرة. أي تعديل بيتمسح مع الـ refresh.
const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();
let seq = 1000;
export const nextId = () => ++seq;

const U = (id, name, username, email, role, extra = {}) => ({
  id, name, username, email, role,
  bio: `${name} — ${role} at UniConnect University`,
  profile_picture: "", is_active: true,
  faculty: "Faculty of Computing", major: "Computer Science", academic_year: 3,
  created_at: ago(24 * 60), ...extra,
});

export const db = {
  users: [
    U(1, "Admin UniConnect", "admin", "admin@uniconnect.com", "admin"),
    U(2, "Dr. Ahmed Hassan", "dr_ahmed", "ahmed.hassan@uni.edu", "doctor", { specialization: "Artificial Intelligence", office_location: "B-201" }),
    U(3, "Dr. Sara Khalil", "dr_sara", "sara.khalil@uni.edu", "doctor", { specialization: "Software Engineering", office_location: "A-305" }),
    U(4, "Dr. Omar Nasser", "dr_omar", "omar.nasser@uni.edu", "doctor", { specialization: "Database Systems", office_location: "B-110" }),
    U(5, "Kareem Mohamed", "kareem_m", "kareem@student.edu", "student"),
    U(6, "Nour Ali", "nour_ali", "nour@student.edu", "student", { academic_year: 2, major: "Software Engineering" }),
    U(7, "Adam Tarek", "adam_t", "adam@student.edu", "student", { academic_year: 4, major: "Information Technology" }),
    U(8, "Hana Salem", "hana_s", "hana@student.edu", "student", { academic_year: 1, major: "Psychology" }),
    U(9, "Lina Fawzi", "lina_f", "lina@student.edu", "student", { academic_year: 2 }),
    U(10, "Tarek Mansour", "invest_tarek", "tarek@ventures.com", "investor"),
  ],

  posts: [
    { id: 1, user_id: 5, title: "My Experience with Machine Learning", content: "After 6 months of studying ML, I finally built my first neural network! Happy to share resources with anyone interested 🚀", created_at: ago(3) },
    { id: 2, user_id: 2, title: "New AI Course Material Available", content: "I've uploaded the complete lecture slides for COMP-401 Artificial Intelligence. Check the Files section!", created_at: ago(8) },
    { id: 3, user_id: 6, title: "Looking for Team Members for Hackathon", content: "Our university hackathon is in 3 weeks! Looking for someone with backend skills and a UI designer 💡", created_at: ago(20) },
    { id: 4, user_id: 7, title: "Final Year Project Presentation Done!", content: "Just finished presenting my graduation project — an AI-powered plagiarism detection system. Got an A grade! 🎓", created_at: ago(30) },
    { id: 5, user_id: 3, title: "Software Engineering Best Practices", content: "1) Write clean code. 2) Test early. 3) Document your APIs. 4) Use version control. 5) Refactor continuously.", created_at: ago(48) },
    { id: 6, user_id: 10, title: "Funding Opportunity for Student Startups", content: "My fund is looking for student projects in EdTech, HealthTech and AI. Grants up to $10,000. Apply now!", created_at: ago(60) },
    { id: 7, user_id: 9, title: "Study Group for Data Structures Exam", content: "Anyone in Year 2 want to form a study group? Meeting Saturday 10am in the library. Comment below!", created_at: ago(72) },
  ],
  comments: [
    { id: 1, post_id: 1, user_id: 2, content: "Great work Kareem, keep it up!", parent_id: null, created_at: ago(2) },
    { id: 2, post_id: 1, user_id: 5, content: "Thank you Dr. Ahmed 🙏", parent_id: 1, created_at: ago(1.5) },
    { id: 3, post_id: 1, user_id: 6, content: "Can you share the resources?", parent_id: null, created_at: ago(1) },
    { id: 4, post_id: 3, user_id: 5, content: "I'm in! I can do the backend.", parent_id: null, created_at: ago(15) },
    { id: 5, post_id: 4, user_id: 8, content: "Congratulations Adam! 🎉", parent_id: null, created_at: ago(25) },
    { id: 6, post_id: 6, user_id: 7, content: "Just applied, thanks for the opportunity!", parent_id: null, created_at: ago(50) },
  ],
  likes: [
    { post_id: 1, user_id: 6 }, { post_id: 1, user_id: 7 }, { post_id: 1, user_id: 2 },
    { post_id: 2, user_id: 5 }, { post_id: 2, user_id: 6 },
    { post_id: 3, user_id: 5 }, { post_id: 4, user_id: 5 }, { post_id: 4, user_id: 9 },
    { post_id: 5, user_id: 5 }, { post_id: 5, user_id: 7 }, { post_id: 5, user_id: 8 },
  ],
  follows: [
    { follower_id: 5, following_id: 6 }, { follower_id: 5, following_id: 2 },
    { follower_id: 6, following_id: 5 }, { follower_id: 7, following_id: 5 },
    { follower_id: 9, following_id: 5 }, { follower_id: 8, following_id: 2 },
  ],
  notifications: [
    { id: 1, user_id: 5, sender_id: 6, type: "follow", message: "started following you", is_read: false, created_at: ago(1) },
    { id: 2, user_id: 5, sender_id: 7, type: "like", message: "liked your post", is_read: false, created_at: ago(2) },
    { id: 3, user_id: 5, sender_id: 2, type: "comment", message: "commented on your post", is_read: true, created_at: ago(5) },
    { id: 4, user_id: 2, sender_id: 5, type: "like", message: "liked your post", is_read: false, created_at: ago(4) },
    { id: 5, user_id: 1, sender_id: 8, type: "comment", message: "reported a post", is_read: false, created_at: ago(6) },
  ],

  groups: [
    { id: 1, creator_id: 5, name: "CS Study Group", description: "Computer Science students sharing notes and study tips.", is_private: false, group_type: "subject", academic_year: "3", created_at: ago(500) },
    { id: 2, creator_id: 2, name: "AI Research Lab", description: "Research group focused on AI and deep learning.", is_private: false, group_type: "subject", academic_year: "4", created_at: ago(400) },
    { id: 3, creator_id: 6, name: "Web Dev Community", description: "Frontend and backend developers building real projects.", is_private: false, group_type: "other", academic_year: "", created_at: ago(300) },
    { id: 4, creator_id: 10, name: "Startup Founders Network", description: "Connect student entrepreneurs with mentors and investors.", is_private: false, group_type: "other", academic_year: "", created_at: ago(200) },
  ],
  groupMembers: [
    { group_id: 1, user_id: 5, role: "admin" }, { group_id: 1, user_id: 6, role: "member" }, { group_id: 1, user_id: 7, role: "member" }, { group_id: 1, user_id: 9, role: "member" },
    { group_id: 2, user_id: 2, role: "admin" }, { group_id: 2, user_id: 5, role: "member" }, { group_id: 2, user_id: 7, role: "member" },
    { group_id: 3, user_id: 6, role: "admin" }, { group_id: 3, user_id: 5, role: "member" },
    { group_id: 4, user_id: 10, role: "admin" }, { group_id: 4, user_id: 5, role: "member" }, { group_id: 4, user_id: 7, role: "member" },
  ],
  groupPosts: [
    { id: 1, group_id: 1, user_id: 5, content: "Sharing my complete Data Structures notes — 120 pages!", created_at: ago(10), likes: [] },
    { id: 2, group_id: 1, user_id: 6, content: "OS exam is next Tuesday. Review session on Friday?", created_at: ago(6), likes: [] },
    { id: 3, group_id: 2, user_id: 2, content: "New research paper published on Adaptive Learning Systems.", created_at: ago(40), likes: [] },
  ],

  files: [
    { id: 1, uploader_id: 5, file_name: "Data Structures Complete Notes.pdf", file_type: "pdf", file_size: 2048000, subject: "Data Structures", academic_year: "3", created_at: ago(100), likes_count: 12, comments_count: 3, avg_rating: 4.6 },
    { id: 2, uploader_id: 2, file_name: "AI Course — Week 1 to 8 Slides.pdf", file_type: "pdf", file_size: 8192000, subject: "Machine Learning", academic_year: "4", created_at: ago(80), likes_count: 25, comments_count: 6, avg_rating: 4.9 },
    { id: 3, uploader_id: 6, file_name: "Web Development Cheat Sheet.pdf", file_type: "pdf", file_size: 512000, subject: "Software Engineering", academic_year: "2", created_at: ago(60), likes_count: 8, comments_count: 1, avg_rating: 4.2 },
    { id: 4, uploader_id: 4, file_name: "Advanced SQL Queries Workbook.pdf", file_type: "pdf", file_size: 2304000, subject: "DBMS", academic_year: "3", created_at: ago(40), likes_count: 15, comments_count: 4, avg_rating: 4.7 },
    { id: 5, uploader_id: 7, file_name: "Python for Data Science.docx", file_type: "docx", file_size: 3840000, subject: "Mathematics", academic_year: "3", created_at: ago(20), likes_count: 9, comments_count: 2, avg_rating: 4.4 },
  ],
  courses: [
    { id: 1, doctor_id: 2, title: "Artificial Intelligence COMP-401", description: "Search, ML, neural networks, NLP and computer vision." },
    { id: 2, doctor_id: 3, title: "Software Engineering SE-301", description: "Agile, design patterns, testing, CI/CD." },
    { id: 3, doctor_id: 4, title: "Database Systems DB-201", description: "SQL mastery, normalization, indexing, transactions." },
  ],

  projects: [
    { id: 1, creator_id: 5, title: "AI Study Planner", description: "An intelligent study scheduler that optimizes your revision timetable using ML.", category: "IT", status: "mvp", required_funding: 5000, github_link: "https://github.com", demo_url: "", created_at: ago(200), member_ids: [5, 6, 9], interest_count: 2 },
    { id: 2, creator_id: 7, title: "Smart Plagiarism Detector", description: "Deep learning model detecting academic plagiarism with 95% accuracy.", category: "IT", status: "launched", required_funding: 0, github_link: "https://github.com", demo_url: "", created_at: ago(150), member_ids: [7], interest_count: 1 },
    { id: 3, creator_id: 6, title: "Student Mental Health App", description: "Mobile app connecting students with peer support and counseling.", category: "IT", status: "idea", required_funding: 15000, github_link: "", demo_url: "", created_at: ago(90), member_ids: [6, 8], interest_count: 1 },
    { id: 4, creator_id: 9, title: "Campus Navigation System", description: "Indoor navigation using BLE beacons and ESP32 microcontrollers.", category: "Engineering", status: "prototype", required_funding: 8000, github_link: "", demo_url: "", created_at: ago(50), member_ids: [9, 5], interest_count: 0 },
  ],

  reviews: [
    { id: 1, doctor_id: 2, student_id: 5, rating: 5, comment: "Dr. Ahmed is an exceptional professor. His AI lectures are clear and full of real-world examples.", is_anonymous: false, created_at: ago(300) },
    { id: 2, doctor_id: 2, student_id: 7, rating: 5, comment: "Truly inspiring! Changed my perspective on AI completely.", is_anonymous: true, created_at: ago(280) },
    { id: 3, doctor_id: 3, student_id: 6, rating: 5, comment: "The most practical course I've taken. Real industry practices.", is_anonymous: false, created_at: ago(260) },
    { id: 4, doctor_id: 3, student_id: 9, rating: 4, comment: "Good teacher with high standards. Heavy workload but worth it.", is_anonymous: true, created_at: ago(240) },
    { id: 5, doctor_id: 4, student_id: 7, rating: 4, comment: "The query optimization techniques saved my project.", is_anonymous: false, created_at: ago(220) },
  ],

  reports: [
    { id: 1, reporter_id: 8, type: "Post", reason: "Inappropriate Content", status: "Pending", content: "Post by Adam Tarek", contentBody: "Just finished presenting my graduation project…", created_at: ago(6) },
    { id: 2, reporter_id: 6, type: "Comment", reason: "Personal Harassment", status: "Pending", content: "Comment on Post", contentBody: "This is a reported comment example.", created_at: ago(12) },
    { id: 3, reporter_id: 9, type: "File", reason: "False Information", status: "Resolved", content: "File: Web Development Cheat Sheet.pdf", contentBody: "Uploaded by Nour Ali", created_at: ago(70) },
    { id: 4, reporter_id: 5, type: "Group", reason: "Other", status: "Dismissed", content: "Group: Startup Founders Network", contentBody: "Connect student entrepreneurs with mentors.", created_at: ago(90) },
  ],
  announcements: [
    { id: 1, title: "Final Exams Schedule Published", content: "The final exams schedule is now available. Please check your faculty portal.", target: "Everyone", type: "exam", created_at: ago(24) },
    { id: 2, title: "Scholarship Applications Open", content: "Applications for the excellence scholarship are open until the end of the month.", target: "Students", type: "scholarship", created_at: ago(72) },
    { id: 3, title: "Faculty Meeting", content: "Reminder: faculty meeting on Sunday at 11am.", target: "Doctors", type: "notice", created_at: ago(120) },
  ],
  emails: [
    { id: 1, recipient_type: "all_students", recipient_count: 7, subject: "Welcome to the new semester", message: "We wish you a great semester full of success and achievement.", message_type: "Good News", created_at: ago(48), sender_name: "Admin UniConnect" },
    { id: 2, recipient_type: "user", recipient_user_name: "Adam Tarek", recipient_user_email: "adam@student.edu", subject: "Content Policy Warning", message: "Your content was reported. Please follow community guidelines.", message_type: "Warning", created_at: ago(96), sender_name: "Admin UniConnect" },
  ],
  logs: [
    { id: 1, action_type: "resolve", target_label: "Report #3", details: "Resolved report", created_at: ago(70) },
    { id: 2, action_type: "dismiss", target_label: "Report #4", details: "Dismissed report as invalid", created_at: ago(90) },
    { id: 3, action_type: "send_email", target_label: "Adam Tarek", details: "Warning sent", created_at: ago(96) },
    { id: 4, action_type: "ban_user", target_label: "Spam User", details: "Banned account", created_at: ago(150) },
  ],
};
