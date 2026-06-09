import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFireStore } from '@/store/useFireStore';
import { generateDailyReport, exportDailyReportExcel } from '@/utils/excelExport';
import { TopBar } from '@/components/Panels/TopBar';
import {
  FileBarChart, Download, Calendar, TrendingUp,
  Flame, Wrench, Truck, AlertTriangle, BarChart3, PieChart
} from 'lucide-react';

export default function ReportsPage() {
  const navigate = useNavigate();
  const currentUser = useFireStore(s => s.currentUser);
  const buildings = useFireStore(s => s.buildings);
  const fireAlarms = useFireStore(s => s.fireAlarms);
  const workOrders = useFireStore(s => s.workOrders);

  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true });
  }, [currentUser, navigate]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const report = useMemo(() => {
    return generateDailyReport(buildings, fireAlarms, workOrders, selectedDate);
  }, [selectedDate, buildings, fireAlarms, workOrders]);

  const handleExport = () => {
    exportDailyReportExcel(report);
  };

  const displayAlarms = report.todayAlarms || fireAlarms;
  const displayOrders = report.todayOrders || workOrders;

  if (!currentUser) return null;

  const totalFaultRate = (
    report.facilityFaultRate.smokeDetector +
    report.facilityFaultRate.sprinkler +
    report.facilityFaultRate.hydrant
  ) / 3;

  return (
    <div className="min-h-screen w-full bg-deep-space relative overflow-hidden">
      <TopBar />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scan-line pointer-events-none opacity-40" />

      <div className="relative z-10 p-6 pt-24 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="hud-title text-3xl mb-1 flex items-center gap-3">
              <FileBarChart className="text-cyber-blue" size={32} />
              消防日报管理系统
            </h1>
            <p className="text-cyber-muted text-sm">Fire Safety Daily Report Management System</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="cyber-panel px-4 py-3 flex items-center gap-3">
              <Calendar className="text-cyber-blue" size={20} />
              <div className="flex flex-col">
                <span className="text-[10px] text-cyber-muted tracking-wider">REPORT DATE</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-cyber-blue font-bold text-lg outline-none border-b border-cyber-blue/40 focus:border-cyber-blue cursor-pointer"
                />
              </div>
            </div>
            <button
              onClick={handleExport}
              className="cyber-btn cyber-btn-primary !px-6 !py-3 flex items-center gap-3 text-base"
            >
              <Download size={20} />
              导出 Excel 日报
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-8">
          <div className="cyber-panel p-5 corner-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-cyber-muted text-xs tracking-wider mb-1">火警总数</p>
                <p className="text-fire-red text-4xl font-bold font-mono">{report.fireAlarmCount}</p>
                <p className="text-[11px] text-fire-red/70 mt-1">Fire Alarms Today</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-fire-red/15 border border-fire-red/40 flex items-center justify-center">
                <Flame className="text-fire-red" size={24} />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-cyber-blue/20">
              {[1, 2, 3].map(lv => (
                <div key={lv} className="flex-1 text-center">
                  <span className="text-[10px] text-cyber-muted">Lv.{lv}</span>
                  <p className={`font-bold font-mono ${
                    lv === 1 ? 'text-power-yellow' : lv === 2 ? 'text-warn-orange' : 'text-fire-red'
                  }`}>
                    {report.fireAlarmByLevel[lv] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="cyber-panel p-5 corner-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-cyber-muted text-xs tracking-wider mb-1">平均响应时间</p>
                <p className="text-cyber-blue text-4xl font-bold font-mono">
                  {report.avgResponseTime}<span className="text-lg ml-1">s</span>
                </p>
                <p className="text-[11px] text-cyber-blue/70 mt-1">Avg Response Time</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyber-blue/15 border border-cyber-blue/40 flex items-center justify-center">
                <Truck className="text-cyber-blue" size={24} />
              </div>
            </div>
            <div className="pt-3 border-t border-cyber-blue/20">
              <div className="flex items-center gap-2">
                <TrendingUp className={report.avgResponseTime < 240 ? 'text-life-green' : 'text-warn-orange'} size={14} />
                <span className="text-[11px] text-cyber-muted">
                  {report.avgResponseTime < 240 ? '响应速度达标（<4分钟）' : '响应超时，需优化调度'}
                </span>
              </div>
            </div>
          </div>

          <div className="cyber-panel p-5 corner-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-cyber-muted text-xs tracking-wider mb-1">综合设施故障率</p>
                <p className="text-warn-orange text-4xl font-bold font-mono">
                  {totalFaultRate.toFixed(1)}<span className="text-lg ml-1">%</span>
                </p>
                <p className="text-[11px] text-warn-orange/70 mt-1">Facility Fault Rate</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warn-orange/15 border border-warn-orange/40 flex items-center justify-center">
                <AlertTriangle className="text-warn-orange" size={24} />
              </div>
            </div>
            <div className="pt-3 border-t border-cyber-blue/20 space-y-1.5">
              {[
                { name: '烟感', v: report.facilityFaultRate.smokeDetector, c: 'text-power-yellow' },
                { name: '喷淋', v: report.facilityFaultRate.sprinkler, c: 'text-cyber-blue' },
                { name: '消防栓', v: report.facilityFaultRate.hydrant, c: 'text-fire-red' },
              ].map(it => (
                <div key={it.name} className="flex items-center gap-2 text-[11px]">
                  <span className="text-cyber-muted w-12">{it.name}</span>
                  <div className="flex-1 h-1.5 bg-deep-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${it.c.replace('text-', 'bg-')}`}
                      style={{ width: `${Math.min(it.v * 10, 100)}%` }}
                    />
                  </div>
                  <span className={`${it.c} font-mono w-14 text-right`}>{it.v}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cyber-panel p-5 corner-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-cyber-muted text-xs tracking-wider mb-1">待处理工单</p>
                <p className="text-life-green text-4xl font-bold font-mono">{report.pendingOrders}</p>
                <p className="text-[11px] text-life-green/70 mt-1">Pending Work Orders</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-life-green/15 border border-life-green/40 flex items-center justify-center">
                <Wrench className="text-life-green" size={24} />
              </div>
            </div>
            <div className="pt-3 border-t border-cyber-blue/20">
              <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
                <div>
                  <span className="text-cyber-muted">待处理</span>
                  <p className="text-warn-orange font-bold font-mono">
                    {displayOrders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <div>
                  <span className="text-cyber-muted">处理中</span>
                  <p className="text-cyber-blue font-bold font-mono">
                    {displayOrders.filter(o => o.status === 'processing').length}
                  </p>
                </div>
                <div>
                  <span className="text-cyber-muted">已完成</span>
                  <p className="text-life-green font-bold font-mono">
                    {displayOrders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-8">
          <div className="cyber-panel p-6 corner-border">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="text-cyber-blue" size={22} />
              <h3 className="text-cyber-blue font-bold tracking-wider">火警等级分布柱状图</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-cyber-blue/40 to-transparent" />
            </div>
            <div className="h-56 flex items-end justify-around gap-6 px-4">
              {[
                { lv: '一级火警', v: report.fireAlarmByLevel[1] || 0, c: 'bg-power-yellow', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]' },
                { lv: '二级火警', v: report.fireAlarmByLevel[2] || 0, c: 'bg-warn-orange', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
                { lv: '三级火警', v: report.fireAlarmByLevel[3] || 0, c: 'bg-fire-red', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]' },
              ].map(item => {
                const max = Math.max(1, ...[1, 2, 3].map(l => report.fireAlarmByLevel[l] || 0));
                const h = (item.v / max) * 100;
                return (
                  <div key={item.lv} className="flex-1 flex flex-col items-center gap-3">
                    <div className="text-white font-bold font-mono text-2xl">{item.v}</div>
                    <div className="w-full h-44 bg-deep-800/60 rounded-t-lg relative overflow-hidden border border-cyber-blue/20 border-b-0">
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${item.c} ${item.glow} rounded-t transition-all duration-700`}
                        style={{ height: `${h}%` }}
                      >
                        <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-transparent to-white/30" />
                      </div>
                      {[25, 50, 75].map(p => (
                        <div key={p} className="absolute left-0 right-0 border-t border-dashed border-cyber-blue/20" style={{ bottom: `${p}%` }} />
                      ))}
                    </div>
                    <div className="text-cyber-muted text-sm">{item.lv}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cyber-panel p-6 corner-border">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="text-warn-orange" size={22} />
              <h3 className="text-cyber-blue font-bold tracking-wider">设施故障率饼图</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-cyber-blue/40 to-transparent" />
            </div>
            <div className="h-56 flex items-center justify-center gap-10">
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {(() => {
                    const parts = [
                      { v: report.facilityFaultRate.smokeDetector, c: '#facc15', name: '烟感' },
                      { v: report.facilityFaultRate.sprinkler, c: '#38bdf8', name: '喷淋' },
                      { v: report.facilityFaultRate.hydrant, c: '#ef4444', name: '消防栓' },
                    ];
                    const total = parts.reduce((s, p) => s + p.v, 0) || 1;
                    let cum = 0;
                    return parts.map((p, i) => {
                      const pct = (p.v / total) * 100;
                      const dash = `${pct} ${100 - pct}`;
                      const offset = -cum;
                      cum += pct;
                      const colors = ['#facc15', '#38bdf8', '#ef4444'];
                      return (
                        <circle
                          key={i}
                          cx="18" cy="18" r="15.915"
                          fill="transparent"
                          stroke={colors[i]}
                          strokeWidth="4"
                          strokeDasharray={dash}
                          strokeDashoffset={offset}
                          style={{ filter: `drop-shadow(0 0 6px ${colors[i]})` }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-cyber-muted text-[10px] tracking-wider">TOTAL</span>
                  <span className="text-white font-bold text-2xl font-mono">{totalFaultRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { n: '烟感探测器', v: report.facilityFaultRate.smokeDetector, c: 'bg-power-yellow' },
                  { n: '喷淋系统', v: report.facilityFaultRate.sprinkler, c: 'bg-cyber-blue' },
                  { n: '消防栓水压', v: report.facilityFaultRate.hydrant, c: 'bg-fire-red' },
                ].map(it => (
                  <div key={it.n} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${it.c} shadow-[0_0_10px_currentColor]`} />
                    <div>
                      <div className="text-white text-sm">{it.n}</div>
                      <div className="text-cyber-muted text-xs">故障率：<span className="text-white font-mono font-bold">{it.v}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="cyber-panel p-6 corner-border">
            <div className="flex items-center gap-3 mb-5">
              <Truck className="text-cyber-blue" size={20} />
              <h3 className="text-cyber-blue font-bold tracking-wider">消防车出警响应记录</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-cyber-blue/40 to-transparent" />
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-cyber-blue/10 border border-cyber-blue/30 text-[11px] text-cyber-blue font-bold tracking-wider">
                <span>序号</span>
                <span>车辆编号</span>
                <span>火警等级</span>
                <span>响应时间</span>
              </div>
              {report.truckDispatches.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-2 px-3 py-3 border border-cyber-blue/15 hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all"
                >
                  <span className="text-cyber-muted font-mono">#{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-white text-sm">{t.truckName}</span>
                  <span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      t.alarmLevel === 1 ? 'bg-power-yellow/20 text-power-yellow border border-power-yellow/40' :
                      t.alarmLevel === 2 ? 'bg-warn-orange/20 text-warn-orange border border-warn-orange/40' :
                      'bg-fire-red/20 text-fire-red border border-fire-red/40'
                    }`}>
                      Lv.{t.alarmLevel}
                    </span>
                  </span>
                  <span className={`font-mono font-bold ${
                    t.responseTime < 240 ? 'text-life-green' : 'text-warn-orange'
                  }`}>
                    {Math.floor(t.responseTime / 60)}分{t.responseTime % 60}秒
                  </span>
                </div>
              ))}
              {report.truckDispatches.length === 0 && (
                <div className="text-center py-8 text-cyber-muted text-sm">暂无出警记录</div>
              )}
            </div>
          </div>

          <div className="cyber-panel p-6 corner-border">
            <div className="flex items-center gap-3 mb-5">
              <Wrench className="text-warn-orange" size={20} />
              <h3 className="text-cyber-blue font-bold tracking-wider">工单明细汇总</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-cyber-blue/40 to-transparent" />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-warn-orange/10 border border-warn-orange/30 text-[11px] text-warn-orange font-bold tracking-wider sticky top-0 bg-deep-900">
                <span className="col-span-2">工单ID</span>
                <span className="col-span-2">类型</span>
                <span className="col-span-4">标题</span>
                <span className="col-span-1">楼层</span>
                <span className="col-span-3">状态</span>
              </div>
              {displayOrders.length === 0 ? (
                <div className="text-center py-16 text-cyber-muted text-sm flex flex-col items-center gap-2">
                  <Wrench size={36} className="opacity-30" />
                  <span>当日无工单记录</span>
                </div>
              ) : displayOrders.map(o => (
                <div
                  key={o.id}
                  className="grid grid-cols-12 gap-2 px-3 py-2.5 border border-cyber-blue/15 hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all text-xs items-center"
                >
                  <span className="col-span-2 text-cyber-muted font-mono truncate">{o.id}</span>
                  <span className="col-span-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                      o.type === 'facility_repair' ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30' :
                      o.type === 'pressure_boost' ? 'bg-warn-orange/20 text-warn-orange border border-warn-orange/30' :
                      o.type === 'tow_vehicle' ? 'bg-fire-red/20 text-fire-red border border-fire-red/30' :
                      'bg-life-green/20 text-life-green border border-life-green/30'
                    }`}>
                      {o.type === 'facility_repair' ? '维修' :
                        o.type === 'pressure_boost' ? '加压' :
                        o.type === 'tow_vehicle' ? '拖车' : '清理'}
                    </span>
                  </span>
                  <span className="col-span-4 text-white truncate">{o.title}</span>
                  <span className="col-span-1 text-cyber-muted font-mono">{o.floor ? `${o.floor}F` : '-'}</span>
                  <span className="col-span-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'pending' ? 'bg-warn-orange/20 text-warn-orange' :
                      o.status === 'processing' ? 'bg-cyber-blue/20 text-cyber-blue' :
                      'bg-life-green/20 text-life-green'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        o.status === 'pending' ? 'bg-warn-orange animate-pulse' :
                        o.status === 'processing' ? 'bg-cyber-blue animate-pulse' :
                        'bg-life-green'
                      }`} />
                      {o.status === 'pending' ? '待处理' :
                        o.status === 'processing' ? '处理中' : '已完成'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 cyber-panel p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 text-cyber-muted">
            <span>报告生成时间: <span className="text-cyber-blue font-mono">{new Date().toLocaleString('zh-CN')}</span></span>
            <span>操作人: <span className="text-white">{currentUser.name}</span></span>
            <span>角色: <span className="text-life-green">
              {currentUser.role === 'command' ? '指挥中心' : currentUser.role === 'inspector' ? '消防巡查' : '物业管理员'}
            </span></span>
          </div>
          <div className="text-cyber-blue/60 tracking-wider font-mono">
            © SMART CITY FIRE SAFETY PLATFORM v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
