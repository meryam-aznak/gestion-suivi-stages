import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm.js"; 
import DisplayEtudiant from "./components/DisplayEtudiant.js"; 
import DisplayEncadrantUniversitaire from "./components/DisplayEncadrantUniversitaire.js"; 
import DisplayEncadrantProfessionnel from "./components/DisplayEncadrantProfessionnel.js"; 
import DashboardAdmin  from "./components/DashboardAdmin.js";
import DisplayStage from "./components/DisplayStage.js"; 
import DisplayLauréat from "./components/DisplayLauréat.js"; 
import DisplayConvention from "./components/DisplayConvention.js"; 
import ConventionEtudiant from "./components/Espace_etudiant/ConventionEtudiant.js"; 
import ProfilEtudiant from "./components/Espace_etudiant/ProfilEtudiant.js"; 
import ProfilPro from "./components/Espace_encadrantPro/ProfilPro.jsx";
import ProfilUniv from "./components/Espace_encadrantUniv/ProfilUniv.jsx";
import ProfilAdmin from "./components/ProfilAdmin.jsx";
import ListEtudiantAffecter from "./components/ListEtudiantAffecter.js";
import CreerCompte from "./components/Espace_encadrantPro/CreerCompte.js";
import DepotConvention from "./components/Espace_etudiant/DepotConvention.jsx"; 
import ConventionASigne from "./components/Espace_encadrantPro/ConventionASigne.jsx";
import StageUniv from "./components/Espace_encadrantUniv/StageUniv.js";
import DisplayFilliere from "./components/DisplayFilliere.jsx"; 
import DisplayPresident from "./components/DisplayPresident.js"; 
import DisplayConventionPresident  from "./components/Espace_president/conventionAsinge.jsx";
import StagePro from "./components/Espace_encadrantPro/stageEncadre.jsx";
import EtudiantEncadre from "./components/Espace_encadrantPro/EtudiantEncadre.jsx";
import EtudiantUni from "./components/Espace_encadrantUniv/EtudiantUni.jsx";
import StageStudent from "./components/Espace_etudiant/StageStudent.js";
import DepotRapport from "./components/Espace_etudiant/DeportRaport.jsx";
import DisplayRapportStage from "./components/Espace_encadrantUniv/DisplayRapportStage.jsx";
import StudentEvaluationsPage from "./components/Espace_encadrantPro/StudentEvaluationsPage.jsx";
import NotFoundPage from "./components/NotFoundPage.jsx"; // Import the NotFoundPage component

import ForgotPassword from "./components/ForgotPassword.jsx"; // Import the NotFoundPage component
import Profilpre from "./components/Espace_president/preProfil.jsx"; // Import the NotFoundPage component















function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/GestionEtudiant" element={<DisplayEtudiant />} />
        <Route path="/DisplayEncadrantUniversitaire" element={<DisplayEncadrantUniversitaire />} />
        <Route path="/DisplayEncadrantProfessionnel" element={<DisplayEncadrantProfessionnel />} />
        <Route path="/Dashboard" element={<DashboardAdmin />} />
        <Route path="/DisplayStage" element={<DisplayStage />} />
        <Route path="/DisplayLauréat" element={<DisplayLauréat />} />
        <Route path="/DisplayConvention" element={<DisplayConvention />} />
        <Route path="/ConventionEtudiant" element={<ConventionEtudiant />} />
        <Route path="/etudiant/MonProfil" element={<ProfilEtudiant />} />
        <Route path="/encadrantPro/MonProfil" element={<ProfilPro />} />
        <Route path="encadrantUniv/MonProfil" element={<ProfilUniv />} />
        <Route path="/admin/MonProfil" element={<ProfilAdmin />} />
        <Route path="/ListEtudiantAffecter" element={<ListEtudiantAffecter />} />
        <Route path="/CreerCompte" element={<CreerCompte />} />
         <Route path="/DepotConvention" element={<DepotConvention />} />
        <Route path="/ConventionASigne" element={<ConventionASigne />} />
        <Route path="/StageUniv" element={<StageUniv />} />
        <Route path="/DisplayFilliere" element={<DisplayFilliere />} />
        <Route path="/DisplayPresident" element={<DisplayPresident />} />
        <Route path="/DisplayConventionPresident" element={<DisplayConventionPresident />} />
        <Route path="/StagePro" element={<StagePro />} />
        <Route path="/EtudiantEncadre" element={<EtudiantEncadre />} />
                <Route path="/EtudiantUni" element={<EtudiantUni />} />
          <Route path="/monStage" element={<StageStudent />} />
        <Route path="/DepotRapport" element={<DepotRapport />} />
                <Route path="/DisplayRapportStage" element={<DisplayRapportStage />} />
<Route path="/evaluations/:studentId" element={<StudentEvaluationsPage />} />
                <Route path="/PageNonTrouvee" element={<NotFoundPage />} />
        <Route path="/motdepassoublier" element={<ForgotPassword />} />
        <Route path="/president/MonProfil" element={<Profilpre />} />
        {/* Add a catch-all route for 404 Not Found */}
      </Routes>
    </Router>
  );
}

export default App;
