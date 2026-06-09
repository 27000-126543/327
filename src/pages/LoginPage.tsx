import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Camera, CheckCircle2, User, Users, Building2, Activity, ScanFace, Clock, Map, FileCheck } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';
import type { UserRole } from '@/types';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useFireStore(s => s.login);
  const loginRecords = useFireStore(s => s.loginRecords).slice(0, 6);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole>('command');
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (!scanning) return;
    setProgress(0);
    setScanComplete(false);
    const iv = setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 9 + 3;
        if (next >= 100) {
          clearInterval(iv);
          setScanComplete(true);
          setTimeout(() => {
            login(selectedRole);
            navigate('/dashboard');
          }, 600);
          return 100;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(iv);
  }, [scanning, selectedRole, login, navigate]);

  const roles: { key: UserRole; name: string; desc: string; icon: any; color: string; border: string; bg: string }[] = [
    { key: 'command', name: '指挥中心', desc: '火警指挥、全局调度、报表导出', icon: Activity, color: 'text-fire-red', border: 'border-fire-red/50', bg: 'from-fire-red/10' },
    { key: 'inspector', name: '消防巡查', desc: '设施巡检、工单处理、机器人管理', icon: Shield, color: 'text-cyber-blue', border: 'border-cyber-blue/50', bg: 'from-cyber-blue/10' },
    { key: 'property', name: '物业人员', desc: '设施查看、装修审批、疏散引导', icon: Building2, color: 'text-life-green', border: 'border-life-green/50', bg: 'from-life-green/10' },
  ];

  return (
    <div className="w-full h-full bg-deep-space grid-bg overflow-hidden relative">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-96 h-96 -top-32 -left-32 rounded-full bg-fire-red/10 blur-3xl" />
        <div className="absolute w-96 h-96 top-1/3 -right-32 rounded-full bg-cyber-blue/15 blur-3xl" />
        <div className="absolute w-80 h-80 bottom-0 left-1/3 rounded-full bg-life-green/10 blur-3xl" />
      </div>

      <div className="relative h-full flex">
        <div className="w-1/2 flex flex-col justify-center px-20">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fire-red via-warn-orange to-power-yellow flex items-center justify-center shadow-2xl shadow-fire-red/20">
                <Shield className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="font-orbitron font-black text-4xl text-white tracking-wide leading-tight">
                  智慧城市
                  <span className="block text-cyber-blue text-5xl mt-1">消防应急平台</span>
                </h1>
              </div>
            </div>
            <p className="text-slate-400 text-base max-w-md leading-relaxed pl-1">
              3D 可视化指挥中心 · 实时消防设施监控 · 智能火警联动 · 最优调度 · 一体化安全管理
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: Map, label: '3D 城市建模', val: '8 栋重点建筑', color: 'text-cyber-blue' },
              { icon: FileCheck, label: '在线设施', val: '2,640 个点位', color: 'text-life-green' },
              { icon: Shield, label: '今日火警', val: '0 起待处置', color: 'text-warn-orange' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="cyber-panel corner-border p-3.5">
                  <Icon className={`w-5 h-5 ${item.color} mb-1.5`} />
                  <div className="text-xs text-slate-400">{item.label}</div>
                  <div className={`text-base font-bold ${item.color} font-orbitron mt-0.5`}>{item.val}</div>
                </div>
              );
            })}
          </div>

          <div>
            <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> 选择登录角色
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {roles.map(r => {
                const Icon = r.icon;
                const selected = selectedRole === r.key;
                return (
                  <button key={r.key} onClick={() => setSelectedRole(r.key)}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden ${selected ? `${r.border} bg-gradient-to-br ${r.bg} shadow-lg` : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'}`}>
                    <div className={`flex items-center gap-2.5 mb-2 ${selected ? r.color : 'text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-sm">{r.name}</span>
                    </div>
                    <div className={`text-[11px] leading-snug ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {r.desc}
                    </div>
                    {selected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className={`w-4 h-4 ${r.color} animate-pulse`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center pr-20">
          <div className="cyber-panel corner-border p-10 w-[440px] relative overflow-hidden">
            <div className="absolute inset-0 scan-line pointer-events-none opacity-60" />

            <div className="text-center mb-8">
              <h2 className="hud-title text-xl mb-1 flex items-center justify-center gap-2">
                <ScanFace className="w-5 h-5" /> 人脸识别登录
              </h2>
              <p className="text-xs text-slate-500">请面向摄像头，保持光线充足</p>
            </div>

            <div className="relative w-56 h-56 mx-auto mb-8">
              <div className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${scanComplete ? 'border-life-green shadow-neon-green' : scanning ? 'border-cyber-blue shadow-neon-blue animate-pulse' : 'border-white/20'}`} />
              <div className="absolute inset-3 rounded-full border border-white/10" />
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-black overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-2">
                      <User className={`w-24 h-24 transition-all duration-500 ${scanComplete ? 'text-life-green' : 'text-cyber-blue/70'}`} />
                      {scanning && !scanComplete && (
                        <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyber-blue to-transparent animate-scan rounded-full" style={{ top: `${progress}%` }} />
                      )}
                      {scanComplete && (
                        <div className="absolute inset-0 rounded-full bg-life-green/20 animate-ping" />
                      )}
                    </div>
                    {scanComplete ? (
                      <div className="text-life-green text-xs font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 识别通过
                      </div>
                    ) : scanning ? (
                      <div className="text-cyber-blue text-xs font-mono">{progress.toFixed(0)}%</div>
                    ) : (
                      <div className="text-slate-500 text-xs">待扫描</div>
                    )}
                  </div>
                </div>
                <Camera className="absolute top-3 left-3 w-3 h-3 text-slate-600" />
                <Eye className="absolute top-3 right-3 w-3 h-3 text-slate-600" />
              </div>
              <div className="absolute top-1/2 left-0 w-3 h-[1px] bg-cyber-blue/60" />
              <div className="absolute top-1/2 right-0 w-3 h-[1px] bg-cyber-blue/60" />
              <div className="absolute top-0 left-1/2 w-[1px] h-3 bg-cyber-blue/60" />
              <div className="absolute bottom-0 left-1/2 w-[1px] h-3 bg-cyber-blue/60" />
            </div>

            <button
              onClick={() => !scanning && setScanning(true)}
              disabled={scanning}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 ${scanComplete ? 'bg-life-green/20 text-life-green border border-life-green/50 shadow-neon-green' : scanning ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/50 cursor-wait' : 'cyber-btn py-3.5 text-base hover:shadow-neon-blue'}`}
            >
              {scanComplete ? (
                <><CheckCircle2 className="w-5 h-5" /> 正在进入系统...</>
              ) : scanning ? (
                <><Eye className="w-5 h-5 animate-pulse" /> 识别中...</>
              ) : (
                <><Camera className="w-5 h-5" /> 开始人脸识别</>
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-cyber-blue/15">
              <div className="text-[11px] text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> 最近登录日志
              </div>
              <div className="space-y-1.5">
                {loginRecords.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-space-blue/40">
                    <span className={`font-medium ${r.role === 'command' ? 'text-fire-red' : r.role === 'inspector' ? 'text-cyber-blue' : 'text-life-green'}`}>
                      {r.userName}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{r.loginTime.slice(-8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-slate-600">
        © 2026 智慧城市消防应急可视化平台 · V1.0.0 · Powered by React + Three.js
      </div>
    </div>
  );
}
