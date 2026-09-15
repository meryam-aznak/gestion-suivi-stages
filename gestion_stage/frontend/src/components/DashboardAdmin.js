import './style.css';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardAdmin = () => {
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
 if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role!='Administrateur') {
                navigate('/PageNonTrouvee');

      }
    }
  }, [navigate]);  
  useEffect(() => {
  const handleStorageChange = (event) => {
    if (event.key === 'logout') {
      navigate('/login');
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

  }, []);
  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return < div className="loader-container">

        <div id="wifi-loader">
          <svg className="circle-outer" viewBox="0 0 86 86">
            <circle className="back" cx="43" cy="43" r="40"></circle>
            <circle className="front" cx="43" cy="43" r="40"></circle>
            <circle className="new" cx="43" cy="43" r="40"></circle>
          </svg>
          <svg className="circle-middle" viewBox="0 0 60 60">
            <circle className="back" cx="30" cy="30" r="27"></circle>
            <circle className="front" cx="30" cy="30" r="27"></circle>
          </svg>
          <svg className="circle-inner" viewBox="0 0 34 34">
            <circle className="back" cx="17" cy="17" r="14"></circle>
            <circle className="front" cx="17" cy="17" r="14"></circle>
          </svg>
          <div className="text" data-text="Chargement"></div>
        </div>
                </div>;

  // Pie Chart: Statut
  const pieData = {
    labels: stats.statusStats.map(s => s._id),
    datasets: [{
      data: stats.statusStats.map(s => s.count),
      backgroundColor: ['#6C5CE7', '#FDCB6E', '#0984E3','#00B894']
    }]
  };

  // Bar Chart: Promotions
  const barData = {
    labels: stats.promotionStats.map(p => p._id),
    datasets: [{
      label: 'Lauréats',
      data: stats.promotionStats.map(p => p.count),
      backgroundColor: '#6C5CE7'
    }]
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
    <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
    <Sidebar
      activeItem="dashboard"
      isSidebarCollapsed={isSidebarCollapsed}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
    />
  
    <div className="main-content">
      <div className="dashboard-wrapper">
  
        <div className="cards-container">
          <div className="stat-card blue">
          <p><i className="fas fa-user-graduate icon"></i> Étudiants en Stage</p>
            <h3>{stats.studentsInStage}</h3>
          </div>
          <div className="stat-card gray">
            <p><i className="fas fa-chalkboard-teacher icon"></i> Encadrants Disponibles</p>
            <h3>{stats.availableMentors}</h3>
          </div>
          <div className="stat-card blue">
            <p><i className="fas fa-award icon"></i>Lauréats</p>
            <h3>{stats.laureats}</h3>
          </div>
        </div>
  
        <div className="charts-card">
          <div className="chart-section">
            <h4>Étudiants Par Statut</h4>
            <div className="chart-wrapper">
              <Pie data={pieData} />
            </div>
          </div>
  
          <div className="chart-section">
            <h4>Lauréats par promotion :</h4>
            <div className="chart-wrapper">
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  );
};

export default DashboardAdmin;
