import { useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Clock, Flame, Truck, AlertTriangle, Radio, Building2 } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';

const typeStyleMap: Record<string, { bg: string; icon: any; label: string }> = {
  alarm_trigger: { bg: 'bg-fire-red/20 border-fire-red/50 text-fire-red', icon: Flame, label: '火警' },
  linkage_start: { bg: 'bg-warn-orange/20 border-warn-orange/50 text-warn-orange', icon: Radio, label: '联动' },
  linkage_shutter: { bg: 'bg-warn-orange/20 border-warn-orange/40 text-warn-orange', icon: Building2, label: '卷帘' },
  linkage_exhaust: { bg: 'bg-cyber-blue/20 border-cyber-blue/40 text-cyber-blue', icon: Radio, label: '排烟' },
  linkage_broadcast: { bg: 'bg-power-yellow/20 border-power-yellow/40 text-power-yellow', icon: Radio, label: '广播' },
  linkage_sprinkler: { bg: 'bg-life-green/20 border-life-green/40 text-life-green', icon: AlertTriangle, label: '喷淋' },
  truck_dispatched: { bg: 'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue', icon: Truck, label: '出警' },
  truck_travel: { bg: 'bg-cyber-blue/15 border-cyber-blue/40 text-cyber-blue', icon: Truck, label: '行驶' },
  truck_arrived: { bg: 'bg-life-green/20 border-life-green/50 text-life-green', icon: Truck, label: '到达' },
  fire_spread: { bg: 'bg-fire-red/30 border-fire-red/60 text-fire-red', icon: Flame, label: '蔓延' },
  fire_contained: { bg: 'bg-warn-orange/25 border-warn-orange/60 text-warn-orange', icon: AlertTriangle, label: '控制' },
  fire_resolved: { bg: 'bg-life-green/25 border-life-green/60 text-life-green', icon: Flame, label: '完成' },
};

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ReplayPanel() {
  const alarms = useFireStore(s => s.fireAlarms);
  const timelineEvents = useFireStore(s => s.timelineEvents);
  const replayAlarmId = useFireStore(s => s.replayAlarmId);
  const replayCurrentTime = useFireStore(s => s.replayCurrentTime);
  const replayPlaying = useFireStore(s => s.replayPlaying);
  const replayMode = useFireStore(s => s.replayMode);
  const replaySnapshots = useFireStore(s => s.replaySnapshots);
  const currentUser = useFireStore(s => s.currentUser);

  const startReplay = useFireStore(s => s.startReplay);
  const stopReplay = useFireStore(s => s.stopReplay);
  const toggleReplayPlaying = useFireStore(s => s.toggleReplayPlaying);
  const seekReplay = useFireStore(s => s.seekReplay);

  const maxTs = replaySnapshots.length ? replaySnapshots[replaySnapshots.length - 1].timestamp : 0;
  const progressPct = maxTs ? (replayCurrentTime / maxTs) * 100 : 0;

  const currentEventIndex = useMemo(() => {
    let idx = -1;
    replaySnapshots.forEach((e, i) => { if (e.timestamp <= replayCurrentTime) idx = i; });
    return idx;
  }, [replaySnapshots, replayCurrentTime]);

  const currentAlarm = replayAlarmId ? alarms.find(a => a.id === replayAlarmId) : null;
  const visibleEvents = replayAlarmId
    ? timelineEvents.filter(e => e.alarmId === replayAlarmId).sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const alarmsWithEvents = useMemo(() => {
    return alarms.map(a => ({
      ...a,
      count: timelineEvents.filter(e => e.alarmId === a.id).length,
    })).sort((a, b) => (b.triggerTimestamp || 0) - (a.triggerTimestamp || 0));
  }, [alarms, timelineEvents]);

  if (!replayMode) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[180px] z-30">
        <div className="flex flex-col items-center gap-2">
          <select
            className="w-64 px-3 py-2 rounded-lg bg-deep-900/90 border border-cyber-blue/30 text-cyber-blue text-xs font-bold backdrop-blur-sm focus:border-cyber-blue/70 outline-none"
            onChange={e => e.target.value && startReplay(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>▶ 选择火警进入复盘模式</option>
            {currentUser && alarmsWithEvents.map(a => (
              <option key={a.id} value={a.id}>
                {a.buildingName} {a.sourceFloor}F · Lv.{a.level} · {a.count}个节点 · {new Date(a.triggerTimestamp).toLocaleTimeString('zh-CN')}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-4 right-4 bottom-[180px] z-40 flex flex-col gap-3 pointer-events-none">
      <div className="cyber-panel p-4 pointer-events-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-fire-red to-warn-orange rounded-full" />
            <div>
              <div className="text-fire-red font-bold text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 animate-pulse" />
                火警处置复盘中心
              </div>
              <div className="text-[10px] text-cyber-muted mt-0.5">
                {currentAlarm?.buildingName} · {currentAlarm?.sourceFloor}F · 等级 Lv.{currentAlarm?.level} · {visibleEvents.length}个关键节点
              </div>
            </div>
          </div>
          <button onClick={stopReplay}
            className="px-3 py-1 rounded bg-fire-red/20 text-fire-red text-xs border border-fire-red/40 hover:bg-fire-red/30 flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> 退出复盘
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => seekReplay(0)}
            className="w-9 h-9 rounded-lg bg-space-blue/60 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 flex items-center justify-center">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={toggleReplayPlaying}
            className={`w-11 h-11 rounded-lg flex items-center justify-center border font-bold shadow-lg ${
              replayPlaying
                ? 'bg-warn-orange/25 border-warn-orange/60 text-warn-orange shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                : 'bg-life-green/25 border-life-green/60 text-life-green shadow-[0_0_20px_rgba(34,197,94,0.2)]'
            }`}>
            {replayPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={() => seekReplay(maxTs)}
            className="w-9 h-9 rounded-lg bg-space-blue/60 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 flex items-center justify-center">
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="flex-1 relative h-12">
            <div className="absolute inset-x-0 top-4 h-2 rounded bg-space-blue/70 border border-cyber-blue/20 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-fire-red via-warn-orange to-life-green transition-all duration-100"
                style={{ width: `${progressPct}%` }} />
            </div>
            <input
              type="range" min={0} max={Math.max(1, maxTs)} step={500}
              value={replayCurrentTime}
              onChange={e => seekReplay(+e.target.value)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center">
              <span className="text-[10px] text-cyber-muted font-orbitron flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatMs(replayCurrentTime)}
              </span>
              <span className="text-[10px] text-cyber-muted">
                {currentEventIndex >= 0 ? `进度: ${currentEventIndex + 1}/${visibleEvents.length} 节点` : '拖动滑块调整进度'}
              </span>
              <span className="text-[10px] text-cyber-muted font-orbitron">{formatMs(maxTs)}</span>
            </div>
          </div>
        </div>

        <div className="relative h-28 rounded-lg bg-deep-800/60 border border-cyber-blue/15 overflow-hidden">
          <div className="absolute inset-y-3 left-0 right-0 flex items-start">
            <div className="w-full h-0.5 bg-cyber-blue/20 mt-8" />
            {replaySnapshots.map((ev, i) => {
              const style = typeStyleMap[ev.type] || typeStyleMap.alarm_trigger;
              const Icon = style.icon;
              const pct = maxTs ? (ev.timestamp / maxTs) * 100 : 0;
              const passed = ev.timestamp <= replayCurrentTime;
              return (
                <div key={i}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                  style={{ left: `${pct}%` }}
                  onClick={() => seekReplay(ev.timestamp)}>
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    passed
                      ? `${style.bg} ${style.label} scale-100 shadow-lg`
                      : 'bg-space-blue/70 border-slate-600/40 text-slate-500 scale-90'
                  } ${currentEventIndex === i ? 'ring-4 ring-white/30 scale-110 z-10' : ''}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className={`mt-1 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap font-bold ${
                    passed ? style.bg : 'bg-slate-700/40 text-slate-400'
                  }`}>
                    {style.label}
                  </div>
                  <div className={`text-[9px] font-orbitron mt-0.5 ${passed ? 'text-white' : 'text-slate-500'}`}>
                    {formatMs(ev.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
          {currentEventIndex >= 0 && replaySnapshots[currentEventIndex] && (
            <div className="absolute bottom-2 left-2 right-2 p-2 rounded bg-deep-900/80 border border-cyber-blue/30 text-xs">
              <div className="text-cyber-blue font-bold mb-0.5">
                【当前节点】{replaySnapshots[currentEventIndex].title}
              </div>
              <div className="text-slate-400 text-[10px]">
                {replaySnapshots[currentEventIndex].description || '无详细说明'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
