import React, { useState } from "react";
import { FaEnvelope, FaCheck, FaArrowLeft, FaKey, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import emailjs from '@emailjs/browser';
import "./style.css";
import logoImage from './img/logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [userEnteredCode, setUserEnteredCode] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const emailjsConfig = {
    serviceId: "service_x9r6u8i",
    templateId: "template_9yuiovj",
    publicKey: "MLm_f4re0soj7MxDn"
  };

  const startResendTimer = () => {
    setResendDisabled(true);
    let timer = 60;
    const interval = setInterval(() => {
      timer -= 1;
      setResendTimer(timer);
      if (timer <= 0) {
        clearInterval(interval);
        setResendDisabled(false);
        setResendTimer(60);
      }
    }, 1000);
  };

  const sendVerificationEmail = async () => {
    setError("");
    setLoading(true);

    try {
      // For password reset initiation
      const response = await fetch('http://localhost:5000/api/auth/initiate-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate password reset');
      }

      // Send email with EmailJS
      emailjs.init(emailjsConfig.publicKey);
      const emailResponse = await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          to_email: email,
          verification_code: data.code,
          from_name: "Plateforme de Gestion des Stages"
        }
      );

      if (emailResponse.status === 200) {
        setCodeSent(true);
        startResendTimer();
      } else {
        throw new Error("Failed to send verification email");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de l'email. Veuillez réessayer.");
      console.error("Password reset error:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!userEnteredCode || userEnteredCode.length !== 6) {
      setError("Veuillez entrer un code valide à 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: userEnteredCode })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Code invalide ou expiré');
      }

      setShowResetForm(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: userEnteredCode, 
          newPassword 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (!resendDisabled) {
      sendVerificationEmail();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <img src={logoImage} alt="Logo Université" className="logo" />
          </div>
          <h2>Réinitialisation du mot de passe</h2>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
              <FaCheck style={{ marginRight: "5px" }} />
              Mot de passe réinitialisé avec succès!
            </div>
          )}
        </div>

        {!success ? (
          !showResetForm ? (
            !codeSent ? (
              <form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendVerificationEmail();
                }}
              >
                <div className="form-group">
                  <label htmlFor="email">Adresse Email</label>
                  <div className="input-with-icon">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="votre@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le code de vérification'}
                </button>
              </form>
            ) : (
              <form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyCode();
                }}
              >
                <div className="form-group">
                  <label htmlFor="verificationCode">
                    Code de vérification
                  </label>
                  <div className="input-with-icon">
                    <FaKey className="input-icon" />
                    <input
                      type="text"
                      id="verificationCode"
                      placeholder="Entrez le code à 6 chiffres"
                      required
                      value={userEnteredCode}
                      onChange={(e) => setUserEnteredCode(e.target.value)}
                      maxLength="6"
                      className="verification-input"
                    />
                  </div>
                  <p className="code-instructions">
                    Un code de vérification a été envoyé à {email}
                  </p>
                  <div className="resend-code">
                    {resendDisabled ? (
                      <span>Renvoyer le code dans {resendTimer}s</span>
                    ) : (
                      <a onClick={handleResendCode}>Renvoyer le code</a>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  Vérifier le code
                </button>
              </form>
            )
          ) : (
            <form className="login-form" onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    id="newPassword"
                    placeholder="••••••••"
                    required
                    minLength="6"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="••••••••"
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'En cours...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )
        ) : (
          <button
            className="login-button"
            onClick={() => navigate('/login')}
            style={{ marginTop: '20px' }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Retour à la page de connexion
          </button>
        )}

        <div className="login-footer">
          <p>© {new Date().getFullYear()} Plateforme de Gestion des Stages. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;