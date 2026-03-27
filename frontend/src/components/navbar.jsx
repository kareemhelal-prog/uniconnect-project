// بنستورد useState من React
// عشان نقدر نتحكم في حالة الـ Dropdown (مفتوح أو مغلق)
import { useState } from "react";

// بنستورد ملف الـ CSS عشان يتطبق الستايل على الكومبوننت
import "./Navbar.css";

// بنعرف الكومبوننت بتاعت الـ Navbar
const Navbar = () => {

  // dropdownOpen: بيخزن حالة الـ Dropdown
  // true = مفتوح / false = مغلق
  // setDropdownOpen: الفنكشن اللي بنغير بيها الحالة
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // فنكشن بتتنفذ لما المستخدم يضغط على زرار Logout
  // دلوقتي بتطبع في الـ console، لاحقاً هتتربط بالـ auth service
  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    // عنصر nav الرئيسي بتاع الـ Navbar
    // بياخد كلاس navbar من ملف الـ CSS
    <nav className="navbar">

      {/* اللوجو بتاع الموقع
          كلمة Connect جوه span عشان تاخد لون مختلف من الـ CSS */}
      <div className="navbar-logo">
        Uni<span>Connect</span>
      </div>

      {/* الجزء الأيمن من الـ Navbar
          فيه زرار البروفايل وزرار الـ Logout */}
      <div className="navbar-right">

        {/* زرار أيقونة البروفايل
            onClick بيعكس حالة الـ Dropdown
            لو كان false يخليه true والعكس */}
        <button
          className="profile-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title="Profile"
        >
          {/* أيقونة شكل شخص مرسومة بـ SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 
            7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 
            4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </button>

        {/* الـ Dropdown Menu
            بتظهر بس لما dropdownOpen تبقى true
            لو false مش هتظهر خالص */}
        {dropdownOpen && (
          <div className="dropdown">

            {/* زرار My Profile
                لما يتضغط بيقفل الـ Dropdown */}
            <button onClick={() => setDropdownOpen(false)}>
              My Profile
            </button>

            {/* زرار Settings
                لما يتضغط بيقفل الـ Dropdown */}
            <button onClick={() => setDropdownOpen(false)}>
              Settings
            </button>

            {/* خط فاصل بين الأزرار العادية وزرار Logout */}
            <hr />

            {/* زرار Logout داخل الـ Dropdown
                بياخد كلاس logout-dropdown-btn عشان لونه يبقى أحمر */}
            <button
              className="logout-dropdown-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        )}

        {/* زرار Logout الكبير اللي بيظهر دايماً في الـ Navbar
            بيختفي على الموبايل (مشروح في الـ CSS) */}
        <button className="logout-btn" onClick={handleLogout}>

          {/* أيقونة السهم اللي بيدل على الخروج مرسومة بـ SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            width="16"
            height="16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 
              0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 
              0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Logout
        </button>

      </div>
    </nav>
  );
};

// بنعمل export للكومبوننت
// عشان نقدر نستخدمها في أي ملف تاني في المشروع
export default Navbar;
