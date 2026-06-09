import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, ShieldAlert, LogOut, Building2, Flame, Siren, Users, FileSignature, BarChart3, LayoutDashboard } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';

export function TopBar() {
  const { currentUser, logout, fireAlarms, buildings, workOrders } = useFireStore();
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const activeAlarms = fireAlarms.filter(a => a.status === 'active').length;
  const pendingOrders = workOrders.filter(w => w.status !== 'completed').length;

  const roleLabel = { command: '指挥中心', inspector: '消防巡查', property: '物业' }[currentUser?.role || 'command'];

  const navItems = [
    { path: '/dashboard', label: '指挥中心', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/approval', label: '审批管理', icon: FileSignature, key: 'approval' },
    { path: '/reports', label: '报表中心', icon: BarChart3, key: 'reports' },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 z-30 h-16 bg-panel-bg/95 backdrop-blur border-b border-cyber-blue/30 flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fire-red to-warn-orange flex items-center justify-center shadow-neon-red">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="hud-title text-xl leading-tight">3D 智慧城市消防应急平台</h1>
          <p className="text-xs text-cyber-blue/70 font-orbitron tracking-widest">SMART CITY FIRE COMMAND CENTER</p>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-deep-900/80 border border-cyber-blue/20">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-cyber-blue/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-cyber-blue/20 mx-2" />

        <div className="flex items-center gap-2 cyber-panel px-3 py-1 rounded-full">
          <Building2 className="w-3.5 h-3.5 text-cyber-blue" />
          <span className="text-[11px] text-slate-400">建筑</span>
          <span className="text-sm font-bold text-white">{buildings.length}</span>
        </div>
        <div className={`flex items-center gap-2 ${activeAlarms > 0 ? 'cyber-panel-red animate-pulse' : 'cyber-panel'} px-3 py-1 rounded-full`}>
          <Siren className={`w-3.5 h-3.5 ${activeAlarms > 0 ? 'text-fire-red' : 'text-slate-400'}`} />
          <span className="text-[11px] text-slate-400">火警</span>
          <span className={`text-sm font-bold ${activeAlarms > 0 ? 'text-fire-red' : 'text-life-green'}`}>{activeAlarms}</span>
        </div>
        <div className="flex items-center gap-2 cyber-panel px-3 py-1 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5 text-warn-orange" />
          <span className="text-[11px] text-slate-400">工单</span>
          <span className="text-sm font-bold text-warn-orange">{pendingOrders}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right">
          <div className="font-orbitron text-cyber-blue text-lg tracking-wider leading-tight">
            {time.toLocaleTimeString('zh-CN', { hour12: false })}
          </div>
          <div className="text-xs text-slate-500">
            {time.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })}
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3 pl-4 border-l border-cyber-blue/20">
            <div className="text-right">
              <div className="text-sm text-white font-medium">{currentUser.name}</div>
              <div className="text-xs text-cyber-blue/80 flex items-center gap-1 justify-end">
                <Users className="w-3 h-3" />{roleLabel}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-blue/30 to-life-green/20 border-2 border-cyber-blue/50 flex items-center justify-center text-cyber-blue font-bold text-sm">
              {currentUser.name.slice(-3, -2)}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg border border-fire-red/30 text-fire-red/70 hover:text-fire-red hover:border-fire-red/60 hover:bg-fire-red/10 transition-all"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
