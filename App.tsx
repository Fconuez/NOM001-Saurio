
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import VoltageDrop from './screens/VoltageDrop';
import ConduitSizing from './screens/ConduitSizing';
import AmpacityCalculation from './screens/AmpacityCalculation';
import ProtectionCalculation from './screens/ProtectionCalculation';
import MotorCalculation from './screens/MotorCalculation';
import TransformerCalculation from './screens/TransformerCalculation';
import LoadSchedule from './screens/LoadSchedule';
import ProjectManagement from './screens/ProjectManagement';
import AIChatPanel from './components/AIChatPanel';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/config" element={<ProjectManagement />} />
          <Route path="/voltage-drop" element={<VoltageDrop />} />
          <Route path="/conduit" element={<ConduitSizing />} />
          <Route path="/conductor" element={<AmpacityCalculation />} />
          <Route path="/protection" element={<ProtectionCalculation />} />
          <Route path="/motor" element={<MotorCalculation />} />
          <Route path="/transformer" element={<TransformerCalculation />} />
          <Route path="/schedule" element={<LoadSchedule />} />
        </Routes>
      </Layout>
      <AIChatPanel />
    </HashRouter>
  );
};

export default App;
