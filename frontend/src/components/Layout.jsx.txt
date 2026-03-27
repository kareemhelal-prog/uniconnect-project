// بنستورد Navbar عشان تظهر في كل الصفحات
import Navbar from "./Navbar";

// بنستورد ملف الـ CSS الخاص بالـ Layout
import "./Layout.css";

// الـ Layout كومبوننت بتاخد children كـ prop
// يعني أي حاجة هنحطها جوه <Layout> هتظهر في المحتوى
const Layout = ({ children }) => {

  return (

    // الكونتينر الرئيسي بتاع الصفحة كلها
    <div className="layout">

      {/* الـ Navbar بتظهر في الأعلى في كل الصفحات */}
      <Navbar />

      {/* المحتوى الرئيسي بتاع كل صفحة هيتحط هنا */}
      <main className="layout-content">
        {children}
      </main>

    </div>
  );
};

// بنعمل export عشان نقدر نستخدم الـ Layout في أي صفحة
export default Layout;
