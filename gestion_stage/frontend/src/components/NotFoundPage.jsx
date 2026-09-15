import { useNavigate } from 'react-router-dom';
import './style.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  // Generate random academic elements for background
  const academicElements = Array.from({ length: 12 }).map((_, i) => {
    const type = Math.floor(Math.random() * 3);
    const style = {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      transform: `rotate(${Math.random() * 360}deg)`,
      opacity: 0.05 + Math.random() * 0.1
    };
    
    return (
      <div 
        key={i} 
        className={`academic-element ${type === 0 ? 'book-element' : type === 1 ? 'cap-element' : 'pen-element'}`} 
        style={style}
      />
    );
  });

  return (
    <div className="not-found-container">
      <div className="background-pattern"></div>
      <div className="academic-elements">
        {academicElements}
      </div>
      
      <div className="not-found-content">
   
        
        <div className="not-found-text">
          <h1>404</h1>
          <h2>Page non trouvée</h2>
          <p>La page que vous recherchez a peut-être été supprimée, renommée ou est temporairement indisponible.</p>
          <button onClick={() => navigate('/login')} className="home-button">
            Retour à l’accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;