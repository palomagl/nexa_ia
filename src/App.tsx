import { useEffect, useState } from 'react';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fecha a gaveta mobile sempre que a rota muda (troca de página == "fechar menu").
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-paper">
      {!isWorkspace && (
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      )}
      {/* Scrim: fecha a gaveta ao tocar fora dela (só existe enquanto aberta no mobile) */}
      {!isWorkspace && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-ink/25 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          isWorkspace
            ? 'ml-0'
            : cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64')
        )}
      >
        {!isWorkspace && <Topbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />}
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
