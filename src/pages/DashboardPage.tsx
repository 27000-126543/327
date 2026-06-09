import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFireStore } from '@/store/useFireStore';
import { CityScene } from '@/components/Scene3D/CityScene';
import { TopBar } from '@/components/Panels/TopBar';
import { LeftPanel } from '@/components/Panels/LeftPanel';
import { RightPanel } from '@/components/Panels/RightPanel';
import { BottomPanel } from '@/components/Panels/BottomPanel';

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = useFireStore(s => s.currentUser);
  const triggerLinkedDevices = useFireStore(s => s.triggerLinkedDevices);
  const dispatchTrucks = useFireStore(s => s.dispatchTrucks);

  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true });
  }, [currentUser, navigate]);

  useEffect(() => {
    const t1 = setTimeout(() => triggerLinkedDevices(), 500);
    const t2 = setTimeout(() => dispatchTrucks('b1', 2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [triggerLinkedDevices, dispatchTrucks]);

  if (!currentUser) return null;

  return (
    <div className="w-full h-full bg-deep-space overflow-hidden relative">
      <div className="absolute inset-0">
        <CityScene />
      </div>
      <TopBar />
      <LeftPanel />
      <RightPanel />
      <BottomPanel />

      <div className="absolute left-1/2 -translate-x-1/2 top-[72px] z-20">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-fire-red/15 border border-fire-red/40 backdrop-blur-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-fire-red animate-ping" />
          <span className="text-fire-red text-xs font-bold tracking-wide">
            🚨 天际中心大厦 Lv.2 火警处置中 · 火源 24F · 已调度 3 辆消防车
          </span>
        </div>
      </div>
    </div>
  );
}
