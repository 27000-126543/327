import { useState } from 'react';
import { Truck, Navigation, Wind, Volume2, Umbrella, ArrowDownToLine, Camera, UserCheck, FileCheck, Play, Pause, AlertTriangle, MapPinned, Siren } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';

export function RightPanel() {
  const {
    fireStation, fireAlarms, selectedBuildingId, buildings,
    linkedDevices, evacuationActive, evacuationBuildingId,
    activateEvacuation, deactivateEvacuation, triggerFireAlarm,
    robots, channelOccupations,
  } = useFireStore();

  const [fireLevel, setFireLevel] = useState<1 | 2 | 3>(2);
  const [fireFloor, setFireFloor] = useState(20);

  const dispatched = fireStation.trucks.filter(t => t.status === 'dispatched' || t.status === 'arrived');
  const idle = fireStation.trucks.filter(t => t.status === 'idle');
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const activeAlarm = fireAlarms.find(a => a.status === 'active');

  return (
    <div className="absolute top-20 right-4 z-20 w-[360px] bottom-24 flex flex-col gap-3">
      <div className="cyber-panel p-4 corner-border relative overflow-hidden">
        <div className="absolute inset-0 scan-line pointer-events-none" />
        <h2 className="hud-title mb-3 flex items-center gap-2 text-sm">
          <Siren className="w-4 h-4" /> 火警联动控制
          {activeAlarm && <span className="ml-auto px-2 py-0.5 rounded-full bg-fire-red/20 text-fire-red text-xs animate-pulse">处置中</span>}
        </h2>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">火警等级</label>
            <div className="flex gap-1">
              {([1, 2, 3] as const).map(l => (
                <button key={l} onClick={() => setFireLevel(l)}
                  className={`flex-1 py-1 rounded text-xs font-bold border transition-all ${fireLevel === l ? (l === 1 ? 'bg-life-green/20 text-life-green border-life-green/50' : l === 2 ? 'bg-warn-orange/20 text-warn-orange border-warn-orange/50' : 'bg-fire-red/20 text-fire-red border-fire-red/50') : 'bg-space-blue/50 text-slate-400 border-transparent hover:border-cyber-blue/30'}`}>
                  Lv.{l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">火源楼层</label>
            <input type="number" min={1} max={selectedBuilding?.floors || 50} value={fireFloor}
              onChange={e => setFireFloor(Math.max(1, Math.min(selectedBuilding?.floors || 50, +e.target.value)))}
              className="w-full px-3 py-1 rounded bg-space-blue/60 border border-cyber-blue/30 text-white text-sm focus:outline-none focus:border-cyber-blue" />
          </div>
        </div>

        <button
          onClick={() => selectedBuildingId && triggerFireAlarm(selectedBuildingId, fireFloor, fireLevel)}
          disabled={!selectedBuildingId}
          className="w-full cyber-btn-red mb-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed py-2.5"
        >
          <AlertTriangle className="w-4 h-4" />
          {selectedBuildingId ? `触发 ${selectedBuilding?.name || '建筑'} Lv.${fireLevel} 火警` : '请先选择建筑'}
        </button>

        <div className="space-y-1.5 text-xs">
          {[
            { key: 'fireShutter', label: '防火卷帘', icon: ArrowDownToLine, color: 'fire-red' },
            { key: 'smokeExtractor', label: '排烟风机', icon: Wind, color: 'cyber-blue' },
            { key: 'broadcast', label: '消防广播', icon: Volume2, color: 'power-yellow' },
            { key: 'sprinkler', label: '喷淋系统', icon: Umbrella, color: 'life-green' },
            { key: 'elevatorDrop', label: '电梯迫降', icon: ArrowDownToLine, color: 'warn-orange' },
          ].map(item => {
            const active = linkedDevices[item.key as keyof typeof linkedDevices];
            const Icon = item.icon;
            return (
              <div key={item.key} className={`flex items-center justify-between p-2 rounded border transition-all ${active ? 'bg-cyber-blue/10 border-cyber-blue/40' : 'bg-space-blue/40 border-transparent'}`}>
                <span className="flex items-center gap-2 text-slate-300">
                  <Icon className={`w-4 h-4 ${active ? `text-${item.color}` : 'text-slate-500'}`} />
                  {item.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? `bg-${item.color}/20 text-${item.color}` : 'bg-slate-700/40 text-slate-500'}`}>
                  {active ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                  {active ? '联动中' : '待机'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cyber-panel p-4">
        <h2 className="hud-title mb-3 flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4" /> 消防调度中心
        </h2>

        <div className="space-y-2 mb-3">
          {dispatched.map(t => {
            const isArrived = t.status === 'arrived';
            const progress = t.progressPercent || 0;
            return (
              <div key={t.id} className={`p-2 rounded-lg border transition-all ${
                isArrived
                  ? 'bg-life-green/10 border-life-green/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                  : 'bg-fire-red/10 border-fire-red/40 animate-pulse-fast'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isArrived ? 'text-life-green' : 'text-fire-red'}`}>
                    <Navigation className="w-3.5 h-3.5" />{t.name}
                  </span>
                  <span className={`text-[10px] font-orbitron font-bold px-1.5 py-0.5 rounded ${
                    isArrived
                      ? 'bg-life-green/20 text-life-green border border-life-green/40'
                      : 'text-warn-orange bg-warn-orange/10'
                  }`}>
                    {isArrived ? '✓ 已到达现场' : (t.eta !== undefined && t.eta > 0 ? `预计 ${Math.floor(t.eta / 60)}:${String(t.eta % 60).padStart(2, '0')}` : '即将到达')}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded bg-space-blue/60 overflow-hidden relative">
                  <div className={`h-full transition-all duration-300 ${
                    isArrived
                      ? 'bg-gradient-to-r from-life-green to-life-green/70'
                      : 'bg-gradient-to-r from-life-green via-cyber-blue to-warn-orange'
                  }`}
                    style={{ width: `${progress}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {progress}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPinned className="w-3 h-3" />
                    ({t.currentPosition[0].toFixed(1)}, {t.currentPosition[2].toFixed(1)})
                  </span>
                  {t.pathSegmentIndex !== undefined && (
                    <span>节点 {t.pathSegmentIndex + 1}/5</span>
                  )}
                </div>
              </div>
            );
          })}
          {idle.map(t => (
            <div key={t.id} className="p-2 rounded-lg bg-space-blue/40 border border-cyber-blue/15">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />{t.name}
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded-full">待命</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cyber-panel p-4 flex-1 min-h-0 flex flex-col">
        <h2 className="hud-title mb-3 flex items-center gap-2 text-sm">
          <Camera className="w-4 h-4" /> 巡查机器人 & 通道
        </h2>

        <div className="space-y-2 mb-3">
          {robots.map(r => (
            <div key={r.id} className="p-2 rounded-lg bg-space-blue/50 border border-cyber-blue/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-medium flex items-center gap-1.5">
                  <Camera className={`w-3.5 h-3.5 ${r.status === 'alert' ? 'text-fire-red' : r.status === 'patrolling' ? 'text-cyber-blue animate-pulse' : 'text-slate-500'}`} />
                  {r.name}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`status-dot ${r.status === 'patrolling' ? 'bg-cyber-blue animate-pulse' : r.status === 'alert' ? 'bg-fire-red' : 'bg-slate-500'}`} />
                  <span className={`text-[10px] ${r.status === 'alert' ? 'text-fire-red' : 'text-slate-400'}`}>
                    {r.status === 'patrolling' ? '巡检中' : r.status === 'alert' ? '异常' : '待命'}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                <span className="text-life-green flex items-center gap-1">⚡ {r.battery}%</span>
                {r.photos.length > 0 && (
                  <span className="text-warn-orange flex items-center gap-1">📷 {r.photos.length} 张异常</span>
                )}
              </div>
              {r.photos.slice(-1).map(p => (
                <div key={p.id} className="mt-1.5 p-1.5 rounded bg-fire-red/8 border border-fire-red/25 text-[10px] text-slate-300">
                  <div className="text-fire-red font-medium">{p.location}</div>
                  <div className="text-slate-400 mt-0.5">{p.description}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-cyber-blue/15">
          <h3 className="text-xs font-semibold text-cyber-blue mb-2 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" /> 消防通道状态
          </h3>
          <div className="space-y-1.5">
            {channelOccupations.map(c => (
              <div key={c.id} className={`p-2 rounded border text-xs flex items-center justify-between ${c.status === 'occupied' ? 'bg-fire-red/10 border-fire-red/40' : 'bg-space-blue/50 border-transparent'}`}>
                <span className={`${c.status === 'occupied' ? 'text-fire-red' : 'text-slate-400'} truncate pr-2`}>
                  {c.status === 'occupied' && '🚨 '}{c.location}
                </span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${c.status === 'occupied' ? 'bg-fire-red/20 text-fire-red' : 'bg-life-green/15 text-life-green'}`}>
                  {c.status === 'occupied' ? '占用' : '畅通'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`cyber-panel p-4 ${evacuationActive ? 'border-life-green/50 shadow-neon-green' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="hud-title text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> 疏散引导系统
          </h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${evacuationActive ? 'bg-life-green/20 text-life-green animate-pulse' : 'bg-slate-700/40 text-slate-500'}`}>
            {evacuationActive ? '已启动' : '未启动'}
          </span>
        </div>
        <button
          onClick={() => {
            const bid = selectedBuildingId || 'b1';
            evacuationActive ? deactivateEvacuation() : activateEvacuation(bid);
          }}
          className={evacuationActive ? 'w-full cyber-btn' : 'w-full cyber-btn-green'}
        >
          {evacuationActive ? '停止疏散引导' : '🚶 一键启动疏散引导'}
        </button>
        {evacuationActive && (
          <p className="text-[10px] text-life-green mt-2 flex items-center gap-1">
            ✅ {buildings.find(b => b.id === evacuationBuildingId)?.name || '建筑'}
            绿色逃生路径已生成，各层屏幕疏散动画播放中
          </p>
        )}
      </div>
    </div>
  );
}
