import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MoodCheckPage from './pages/MoodCheckPage';
import DashboardPage from './pages/DashboardPage';
import MudraTherapyPage from './pages/MudraTherapyPage';
import GamesPage from './pages/GamesPage';
import NgoDashboardPage from './pages/NgoDashboardPage';
import VolunteerSupportPage from './pages/VolunteerSupportPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mood-check" element={<MoodCheckPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mudra-therapy" element={<MudraTherapyPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/ngo-dashboard" element={<NgoDashboardPage />} />
        <Route path="/volunteer-support" element={<VolunteerSupportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
