import Layout from './components/Layout';
import Dashboard from './features/Dashboard/Dashboard';
import Synchronizer from './features/Synchronizer/Synchronizer';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const activeProjectId = useAppStore((state) => state.activeProjectId);

  return <Layout>{activeProjectId ? <Synchronizer /> : <Dashboard />}</Layout>;
}
