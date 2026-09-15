import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaUniversity } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import "./style.css";
import logoImage from './img/logo.png';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    mdp: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        redirectBasedOnRole(user.role);
      }
    }
  }, [navigate]);

  const redirectBasedOnRole = (role) => {
    switch(role) {
      case 'Administrateur':
        navigate('/dashboard');
        break;
      case 'EncadrantPro':
        navigate('/EtudiantEncadre');
        break;
      case 'EncadrantUniv':
        navigate('/EtudiantUni');
        break;
      case 'Etudiant':
        navigate('/ConventionEtudiant');
        break;
      case 'President':
      case 'Doyen':
      case 'Vice doyen':
        navigate('/DisplayConventionPresident');
        break;
      default:
        break;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      redirectBasedOnRole(response.data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || 
        'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <img src={logoImage} alt="Logo Université" className="logo" />
          </div>
          <h2>Se connecter</h2>
          {error && <div className="error-message">{error}</div>}
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Adresse Email</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input 
                type="email" 
                id="email"
                name="email"
                placeholder="votre@email.com" 
                required 
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                name="mdp"
                placeholder="••••••••" 
                required 
                value={formData.mdp}
                onChange={handleChange}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="forgot-password">
              <a href="/motdepassoublier">Mot de passe oublié ?</a>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se Connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} Plateforme de Gestion des Stages. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;