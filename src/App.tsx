import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import EditorPage from './pages/EditorPage';
import CertificatesPage from './pages/CertificatesPage';
import AboutPage from './pages/AboutPage';
import GuidePage from './pages/GuidePage';
import { Home, FileText, Database, Download, Info, BookOpen } from 'lucide-react';

function NavLinks() {
  const location = useLocation();
  
  const links = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/template', icon: FileText, label: 'Template' },
    { path: '/editor', icon: Database, label: 'Data Import' },
    { path: '/certificates', icon: Download, label: 'Export' },
    { path: '/about', icon: Info, label: 'About' },
    { path: '/guide', icon: BookOpen, label: 'Guide' },
  ];

  return (
    <nav className="flex-1 p-4 space-y-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive 
                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-200">
          <Link to="/home" className="text-sm font-bold text-gray-900 flex items-center gap-3 hover:opacity-80 transition-opacity leading-tight">
            <img 
              src="/lime.png"
              alt="Certificate system logo"
              className="w-8 h-8 object-contain shrink-0" 
              referrerPolicy="no-referrer"
            />
            Automated Certificate Generation System
          </Link>
        </div>
        <NavLinks />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/template" element={<TemplatesPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
