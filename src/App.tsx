import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { List } from './pages/organizations/List';
import { Board } from './pages/organizations/Board';
import { CopilotIndex } from './pages/copilot/Index';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={
            <div className="w-full h-full border-2 border-dashed border-gray-200/60 rounded-xl flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-gray-400 font-medium tracking-wide">Main Dashboard</p>
            </div>
          } />
          
          <Route path="organizations">
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<List />} />
            <Route path="board" element={<Board />} />
          </Route>

          <Route path="copilot" element={<CopilotIndex />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
