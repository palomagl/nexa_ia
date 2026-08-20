import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/ui/Toast';
import { CommandPalette } from './components/ui/CommandPalette';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { Settings } from './pages/Settings';
import { FilteredProjects } from './pages/FilteredProjects';
import { useStore } from './store/useStore';
import { cn } from './lib/utils';

function App() {
  const { sidebarCollapsed } = useStore();
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/project/');

  return (
    <div className="min-h-screen bg-bg-900">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')}>
        {!isWorkspace && <Topbar />}
        <main className={isWorkspace ? '' : 'min-h-[calc(100vh-4rem)]'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id" element={<ProjectWorkspace />} />
            <Route path="/starred" element={<FilteredProjects filter="starred" />} />
            <Route path="/recent" element={<FilteredProjects filter="recent" />} />
            <Route path="/shared" element={<FilteredProjects filter="shared" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<div className="p-8 text-center text-white/40">Help Center — coming soon</div>} />
            <Route path="/docs" element={<div className="p-8 text-center text-white/40">Documentation — coming soon</div>} />
            <Route path="/updates" element={<div className="p-8 text-center text-white/40">Updates — coming soon</div>} />
            <Route path="/status" element={<div className="p-8 text-center text-white/40">Status — coming soon</div>} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
      <CommandPalette />
    </div>
  );
}

export default App;
