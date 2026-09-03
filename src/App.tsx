import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/ui/Toast';
import { CommandPalette } from './components/ui/CommandPalette';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { FilteredProjects } from './pages/FilteredProjects';
import { useStore } from './store/useStore';
import { cn } from './lib/utils';

function App() {
  const { sidebarCollapsed } = useStore();
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/project/');

  return (
    <div className="min-h-screen bg-paper">
      {!isWorkspace && <Sidebar />}
      <div
        className={cn(
          isWorkspace
            ? 'ml-0'
            : cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')
        )}
      >
        {!isWorkspace && <Topbar />}
        <main className={isWorkspace ? 'h-screen overflow-hidden' : 'min-h-[calc(100vh-4rem)]'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id" element={<ProjectWorkspace />} />
            <Route path="/starred" element={<FilteredProjects filter="starred" />} />
            <Route path="/all" element={<FilteredProjects filter="all" />} />
            <Route path="/shared" element={<FilteredProjects filter="shared" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
      <CommandPalette />
    </div>
  );
}

export default App;
