import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// تسجيل مكتبات الرسم البياني
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Tooltip, Legend
);

function App() {
  // بيانات الرسوم البيانية
  const lineData = {
    labels: ['1am', '5am', '10am', '3pm', '8pm', '11pm'],
    datasets: [{
      label: 'Activity',
      data: [300, 600, 400, 800, 500, 900],
      borderColor: '#00e5ff',
      backgroundColor: 'rgba(0, 229, 255, 0.2)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  };

  const barData = {
    labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    datasets: [{
      label: 'Subjects',
      data: [40, 60, 30, 80, 50, 70],
      backgroundColor: '#bd00ff',
      borderRadius: 5,
    }]
  };

  // التنسيقات (CSS)
  const styles = {
    container: { backgroundColor: '#050510', color: '#fff', padding: '20px', minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    logo: { color: '#00e5ff', fontSize: '24px', fontWeight: 'bold' },
    adminTitle: { color: '#ff33cc', fontSize: '28px', textShadow: '0 0 10px rgba(255,51,204,0.3)', position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
    createBtn: { background: 'transparent', border: '2px solid #00e5ff', color: '#fff', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,229,255,0.4)' },
    mainGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: '20px' },
    card: { backgroundColor: '#0d0d21', borderRadius: '15px', padding: '20px', border: '1px solid #1a1a3a' },
    neonBlue: { border: '1px solid #00e5ff', boxShadow: '0 0 10px rgba(0,229,255,0.1)' },
    neonPink: { border: '1px solid #ff33cc', boxShadow: '0 0 10px rgba(255,51,204,0.1)' },
    bigNumber: { fontSize: '32px', fontWeight: 'bold', margin: '10px 0' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' },
    th: { color: '#888', textAlign: 'left', padding: '12px', borderBottom: '1px solid #222' },
    td: { padding: '12px', borderBottom: '1px solid #1a1a3a' },
    modItem: { backgroundColor: '#161633', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>🌀 UniConnect</div>
        <h1 style={styles.adminTitle}>Admin Dashboard</h1>
        <button style={styles.createBtn}>Create Team</button>
      </header>

      <div style={styles.mainGrid}>
        {/* العمود الأول */}
        <div>
          <h3 style={{marginBottom:'10px'}}>User Statistics</h3>
          <div style={{...styles.card, ...styles.neonBlue, marginBottom: '20px'}}>
            <div style={{color: '#888'}}>Total Users</div>
            <div style={styles.bigNumber}>15,000</div>
          </div>
          <div style={{...styles.card, ...styles.neonBlue, height: '220px'}}>
            <p>Most Pled Activity (Hourly)</p>
            <div style={{height: '160px'}}><Line data={lineData} options={{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}}} /></div>
          </div>
        </div>

        {/* العمود الثاني */}
        <div style={{marginTop: '40px'}}>
          <div style={{...styles.card, ...styles.neonPink, marginBottom: '20px', display: 'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{color: '#888'}}>New Users</div>
              <div style={{fontSize: '18px', fontWeight:'bold'}}>60 this Month</div>
            </div>
            <div style={{width: '70px', height: '70px'}}>
              <Doughnut data={{datasets:[{data:[550, 450], backgroundColor:['#ff33cc', '#1a1a3a'], borderWidth:0}]}} />
            </div>
          </div>
          <div style={{...styles.card, ...styles.neonPink, height: '220px'}}>
            <p>Most Popular Subjects</p>
            <div style={{height: '160px'}}><Bar data={barData} options={{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}}} /></div>
          </div>
        </div>

        {/* العمود الثالث */}
        <div>
          <h3 style={{marginBottom:'10px'}}>Moderation Controls</h3>
          <div style={styles.card}>
            <div style={styles.modItem}><span>👁️ Review Reports</span></div>
            <div style={styles.modItem}><span>🚫 Suspend Tier</span></div>
            <div style={styles.modItem}><span>📂 Manage Content</span></div>
            <div style={styles.modItem}><span>✔️ Resolve</span><button style={{background:'#00e5ff', border:'none', borderRadius:'10px', padding:'2px 8px', cursor:'pointer'}}>Resolved</button></div>
          </div>
        </div>
      </div>

      <div style={{...styles.card, marginTop:'20px'}}>
        <h3>Recent Reports</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Report</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}>Kareem_Admin</td><td style={styles.td}>1535 000</td><td style={styles.td}>Type A</td><td style={styles.td}><span style={{color: '#00e5ff'}}>● Active</span></td></tr>
            <tr><td style={styles.td}>User_Test</td><td style={styles.td}>1255 500</td><td style={styles.td}>Type B</td><td style={styles.td}><span style={{color: '#888'}}>● Inactive</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;