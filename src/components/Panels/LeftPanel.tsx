import { useState } from 'react';
import { Building, AlertTriangle, Droplets, Thermometer, Gauge, ChevronDown, ChevronUp, Check, X, Sparkles } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';
import type { FacilityStatus } from '@/types';

function StatusBadge({ status }: { status: FacilityStatus | number }) {
  if (typeof status === 'number') {
    const low = status < 0.4;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${low ? 'animate-blink-orange' : 'bg-life-green/15 text-life-green'}`}>
        <Gauge className={`w-3 h-3 ${low ? 'text-warn-orange' : 'text-life-green'}`} />
        {status.toFixed(2)}MPa
      </span>
    );
  }
  const map: Record<string, { bg: string; icon: any; label: string; color: string }> = {
    normal: { bg: 'bg-life-green/15', icon: Check, label: '正常', color: 'text-life-green' },
    alarm: { bg: 'bg-fire-red/15 animate-pulse', icon: AlertTriangle, label: '告警', color: 'text-fire-red' },
    fault: { bg: 'bg-warn-orange/15', icon: X, label: '故障', color: 'text-warn-orange' },
    active: { bg: 'bg-cyber-blue/15', icon: Sparkles, label: '启动', color: 'text-cyber-blue' },
  };
  const cfg = map[status] || map.normal;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function BuildingDetail({ buildingId }: { buildingId: string }) {
  const buildings = useFireStore(s => s.buildings);
  const b = buildings.find(x => x.id === buildingId);
  const fireAlarms = useFireStore(s => s.fireAlarms);
  const alarm = fireAlarms.find(a => a.buildingId === buildingId && a.status === 'active');
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null);

  if (!b) return null;

  const summary = {
    smokeFault: b.facilities.filter(f => f.smokeDetector.status === 'fault' || f.smokeDetector.status === 'alarm').length,
    sprinklerFault: b.facilities.filter(f => f.sprinkler.status === 'fault' || f.sprinkler.status === 'active').length,
    lowPressure: b.facilities.filter(f => f.hydrantPressure < 0.4).length,
    total: b.floors,
  };

  const displayFloors = b.facilities.filter(f => {
    if (expandedFloor !== null) return f.floor === expandedFloor;
    return f.smokeDetector.status !== 'normal'
      || f.sprinkler.status !== 'normal'
      || f.hydrantPressure < 0.4
      || (alarm && alarm.spreadFloors.includes(f.floor))
      || f.floor % 5 === 0
      || f.floor === b.floors;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between p-3 rounded-lg bg-gradient-to-r from-cyber-blue/10 to-transparent border border-cyber-blue/20">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyber-blue" />
            <h3 className="text-white font-bold text-base">{b.name}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{b.type === 'landmark' ? '超高层地标' : b.type === 'commercial' ? '商业建筑' : '住宅建筑'} · {b.floors}层 · {b.height}米</p>
        </div>
        {alarm && (
          <div className="text-right px-2 py-1 rounded bg-fire-red/15 border border-fire-red/40 animate-pulse">
            <div className="text-xs text-fire-red">Lv.{alarm.level} 级火警</div>
            <div className="text-[10px] text-fire-red/80">火源 {alarm.sourceFloor}F</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-space-blue/50 border border-fire-red/20">
          <div className="text-slate-400">烟感异常</div>
          <div className={`text-lg font-bold ${summary.smokeFault > 0 ? 'text-fire-red' : 'text-life-green'}`}>{summary.smokeFault}F</div>
        </div>
        <div className="p-2 rounded bg-space-blue/50 border border-cyber-blue/20">
          <div className="text-slate-400">喷淋状态</div>
          <div className={`text-lg font-bold ${summary.sprinklerFault > 0 ? 'text-cyber-blue' : 'text-life-green'}`}>{summary.sprinklerFault}F</div>
        </div>
        <div className="p-2 rounded bg-space-blue/50 border border-warn-orange/20">
          <div className="text-slate-400">水压不足</div>
          <div className={`text-lg font-bold ${summary.lowPressure > 0 ? 'text-warn-orange' : 'text-life-green'}`}>{summary.lowPressure}F</div>
        </div>
        <div className="p-2 rounded bg-space-blue/50 border border-life-green/20">
          <div className="text-slate-400">总楼层</div>
          <div className="text-lg font-bold text-cyber-blue">{summary.total}F</div>
        </div>
      </div>

      <div className="pt-2 border-t border-cyber-blue/15">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span className="font-semibold text-cyber-blue/90">🧱 楼层设施状态</span>
          {expandedFloor !== null && (
            <button onClick={() => setExpandedFloor(null)} className="text-cyber-blue hover:underline">显示重点层</button>
          )}
        </div>
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
          {displayFloors.map(f => {
            const hasFire = alarm?.spreadFloors.includes(f.floor);
            const hasIssue = f.smokeDetector.status !== 'normal' || f.sprinkler.status !== 'normal' || f.hydrantPressure < 0.4;
            return (
              <div
                key={f.floor}
                onClick={() => setExpandedFloor(expandedFloor === f.floor ? null : f.floor)}
                className={`rounded-lg p-2 border cursor-pointer transition-all ${hasFire ? 'bg-fire-red/10 border-fire-red/50 animate-pulse-fast' : hasIssue ? 'bg-warn-orange/5 border-warn-orange/30' : 'bg-space-blue/40 border-transparent hover:border-cyber-blue/30'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold font-orbitron w-10 ${hasFire ? 'text-fire-red' : hasIssue ? 'text-warn-orange' : 'text-cyber-blue'}`}>
                      {f.floor}F
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {f.floor === 1 ? '大堂' : f.floor === b.floors ? '顶层' : f.floor % 5 === 0 ? '避难层' : '办公/住宅'}
                    </span>
                  </div>
                  {expandedFloor === f.floor ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                </div>
                {(expandedFloor === f.floor || hasIssue || hasFire) && (
                  <div className="mt-2 space-y-1.5 text-xs border-t border-cyber-blue/10 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" /> 烟感探测器
                      </span>
                      <StatusBadge status={f.smokeDetector.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" /> 自动喷淋
                      </span>
                      <StatusBadge status={f.sprinkler.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5" /> 消防栓水压
                      </span>
                      <StatusBadge status={f.hydrantPressure} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LeftPanel() {
  const { selectedBuildingId, buildings, fireAlarms, workOrders } = useFireStore();
  const activeAlarms = fireAlarms.filter(a => a.status === 'active');
  const pendingOrders = workOrders.filter(w => w.status !== 'completed').slice(0, 5);

  return (
    <div className="absolute top-20 left-4 z-20 w-[340px] bottom-24 flex flex-col gap-3">
      <div className="cyber-panel corner-border p-4 relative overflow-hidden">
        <div className="absolute inset-0 scan-line pointer-events-none" />
        <h2 className="hud-title mb-3 flex items-center gap-2">
          <Building className="w-4 h-4" /> 建筑设施监控
        </h2>

        <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-cyber-blue/15">
          {buildings.map(b => {
            const hasAlarm = activeAlarms.some(a => a.buildingId === b.id);
            return (
              <button
                key={b.id}
                onClick={() => useFireStore.getState().setSelectedBuilding(b.id)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${selectedBuildingId === b.id ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/60 shadow-neon-blue' : hasAlarm ? 'bg-fire-red/15 text-fire-red border border-fire-red/40' : 'bg-space-blue/60 text-slate-300 border border-transparent hover:border-cyber-blue/30'}`}
              >
                {b.name.slice(0, 6)}
              </button>
            );
          })}
        </div>

        {selectedBuildingId ? (
          <BuildingDetail buildingId={selectedBuildingId} />
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Building className="w-10 h-10 mx-auto mb-2 opacity-30" />
            点击3D场景中的建筑查看详情
          </div>
        )}
      </div>

      <div className="cyber-panel-red p-4 flex-1 min-h-0 flex flex-col">
        <h2 className="hud-title text-fire-red mb-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" /> 实时告警列表
          <span className="ml-auto px-2 py-0.5 rounded-full bg-fire-red/20 text-xs">{activeAlarms.length + pendingOrders.length}</span>
        </h2>
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {activeAlarms.map(a => (
            <div key={a.id} className="p-2.5 rounded-lg bg-fire-red/10 border border-fire-red/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fire-red">🔥 Lv.{a.level} 火警</span>
                <span className="text-[10px] text-fire-red/70">{new Date(a.triggerTime).toLocaleTimeString('zh-CN')}</span>
              </div>
              <div className="text-xs text-white mt-1">{a.buildingName} · 火源{a.sourceFloor}F · 已蔓延{a.spreadFloors.length}层</div>
            </div>
          ))}
          {pendingOrders.map(w => (
            <div key={w.id} className={`p-2.5 rounded-lg border ${w.status === 'processing' ? 'bg-cyber-blue/8 border-cyber-blue/30' : 'bg-warn-orange/8 border-warn-orange/30'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${w.status === 'processing' ? 'text-cyber-blue' : 'text-warn-orange'}`}>
                  {w.type === 'pressure_boost' ? '💧 水压工单' : w.type === 'tow_vehicle' ? '🚗 拖车通知' : w.type === 'facility_repair' ? '🔧 维修工单' : '🚶 通道清理'}
                </span>
                <span className="text-[10px] text-slate-500">{w.createdAt.slice(-8)}</span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5 truncate">{w.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
