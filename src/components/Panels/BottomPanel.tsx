import { useState } from 'react';
import { LayoutDashboard, FileSignature, BarChart3, Download, PlusCircle, Eye, Filter, Wrench, Gauge, Car, AlertTriangle, Check } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';
import { generateDailyReport, exportDailyReportExcel } from '@/utils/excelExport';
import type { WorkOrderType, UserRole } from '@/types';

type Tab = 'stats' | 'orders' | 'approvals' | 'quick';

export function BottomPanel() {
  const s = useFireStore();
  const [tab, setTab] = useState<Tab>('stats');
  const buildings = s.buildings;
  const alarms = s.fireAlarms;
  const orders = s.workOrders;
  const approvals = s.approvals;
  const role = s.currentUser?.role;

  const orderTypeLabels: Record<WorkOrderType, { label: string; icon: any; color: string }> = {
    facility_repair: { label: '设施维修', icon: Wrench, color: 'cyber-blue' },
    pressure_boost: { label: '水压加压', icon: Gauge, color: 'warn-orange' },
    tow_vehicle: { label: '违停拖移', icon: Car, color: 'fire-red' },
    evacuation_clear: { label: '通道清理', icon: AlertTriangle, color: 'power-yellow' },
  };

  const roleLabel: Record<UserRole, string> = {
    property: '物业', inspector: '消防巡查', command: '指挥中心',
  };

  return (
    <div className="absolute left-80 right-96 bottom-4 z-20 h-56 cyber-panel flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-blue/20">
        <div className="flex gap-1">
          {([
            { k: 'stats', l: '📊 统计概览', i: BarChart3 },
            { k: 'orders', l: '🛠️ 维修工单', i: PlusCircle },
            { k: 'approvals', l: '📝 装修审批', i: FileSignature },
            { k: 'quick', l: '⚡ 快捷操作', i: Eye },
          ] as const).map(t => {
            const Icon = t.i;
            return (
              <button key={t.k} onClick={() => { setTab(t.k); }}
                className={`px-4 py-1.5 rounded-t-lg text-xs font-medium flex items-center gap-1.5 transition-all ${tab === t.k ? 'bg-cyber-blue/15 text-cyber-blue border border-b-0 border-cyber-blue/40 -mb-px' : 'text-slate-400 hover:text-white hover:bg-cyber-blue/5'}`}>
                <Icon className="w-3.5 h-3.5" />{t.l}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            const r = generateDailyReport(buildings, alarms, orders, new Date().toISOString().split('T')[0]);
            exportDailyReportExcel(r);
          }}
          className="cyber-btn-green text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> 导出消防日报Excel
        </button>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        {tab === 'stats' && <StatsTab />}
        {tab === 'orders' && <OrdersTab orders={orders} updateStatus={s.updateWorkOrderStatus} />}
        {tab === 'approvals' && <ApprovalsTab approvals={approvals} role={role || 'command'} advance={s.advanceApproval} />}
        {tab === 'quick' && <QuickTab />}
      </div>
    </div>
  );
}

function StatsTab() {
  const s = useFireStore();
  const total = s.buildings.reduce((a, b) => a + b.floors * 3, 0);
  const smokeFault = s.buildings.reduce((a, b) => a + b.facilities.filter(f => f.smokeDetector.status === 'fault').length, 0);
  const sprinklerFault = s.buildings.reduce((a, b) => a + b.facilities.filter(f => f.sprinkler.status === 'fault').length, 0);
  const lowPressure = s.buildings.reduce((a, b) => a + b.facilities.filter(f => f.hydrantPressure < 0.4).length, 0);

  const stats = [
    { label: '火警响应均时', val: '3分42秒', col: 'text-cyber-blue', sub: '+12% 优于目标' },
    { label: '设施完好率', val: ((1 - (smokeFault + sprinklerFault + lowPressure) / total) * 100).toFixed(1) + '%', col: 'text-life-green', sub: '目标 ≥ 98%' },
    { label: '消防车出警', val: '8 次', col: 'text-fire-red', sub: `其中${s.fireStation.trucks.filter(t=>t.status==='dispatched').length}辆正在出警` },
    { label: '工单处理率', val: ((s.workOrders.filter(w=>w.status==='completed').length / s.workOrders.length) * 100).toFixed(0) + '%', col: 'text-warn-orange', sub: `待处理 ${s.workOrders.filter(w=>w.status!=='completed').length} 件` },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {stats.map((st, i) => (
        <div key={i} className="p-4 rounded-lg bg-gradient-to-br from-space-blue/60 to-transparent border border-cyber-blue/15">
          <div className="text-xs text-slate-400 mb-1">{st.label}</div>
          <div className={`font-orbitron font-bold text-3xl ${st.col} tracking-wider`}>{st.val}</div>
          <div className="text-[10px] text-slate-500 mt-1">{st.sub}</div>
        </div>
      ))}
    </div>
  );
}

function OrdersTab({ orders, updateStatus }: { orders: any[]; updateStatus: (id: string, s: any) => void }) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="text-slate-400 text-left">
          <tr className="border-b border-cyber-blue/15">
            <th className="py-1.5 px-2 font-normal">工单ID</th>
            <th className="py-1.5 px-2 font-normal">类型</th>
            <th className="py-1.5 px-2 font-normal">标题</th>
            <th className="py-1.5 px-2 font-normal">楼层</th>
            <th className="py-1.5 px-2 font-normal">创建时间</th>
            <th className="py-1.5 px-2 font-normal">指派</th>
            <th className="py-1.5 px-2 font-normal">状态</th>
            <th className="py-1.5 px-2 font-normal text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-b border-cyber-blue/10 hover:bg-cyber-blue/5">
              <td className="py-1.5 px-2 text-slate-500 font-mono">{o.id}</td>
              <td className="py-1.5 px-2">
                <span className="px-1.5 py-0.5 rounded bg-cyber-blue/10 text-cyber-blue text-[10px]">
                  {o.type === 'pressure_boost' ? '水压' : o.type === 'tow_vehicle' ? '拖车' : o.type === 'facility_repair' ? '维修' : '清理'}
                </span>
              </td>
              <td className="py-1.5 px-2 text-white truncate max-w-[200px]">{o.title}</td>
              <td className="py-1.5 px-2 text-slate-400">{o.floor ? o.floor + 'F' : '-'}</td>
              <td className="py-1.5 px-2 text-slate-500 text-[10px]">{o.createdAt}</td>
              <td className="py-1.5 px-2 text-cyber-blue text-[10px]">{o.assignedTo || '待指派'}</td>
              <td className="py-1.5 px-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${o.status === 'completed' ? 'bg-life-green/15 text-life-green' : o.status === 'processing' ? 'bg-cyber-blue/15 text-cyber-blue' : 'bg-warn-orange/15 text-warn-orange'}`}>
                  {o.status === 'completed' ? <Check className="w-2.5 h-2.5" /> : null}
                  {o.status === 'completed' ? '已完成' : o.status === 'processing' ? '处理中' : '待处理'}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right">
                {o.status !== 'completed' && (
                  <button onClick={() => updateStatus(o.id, o.status === 'pending' ? 'processing' : 'completed')}
                    className="px-2 py-0.5 rounded bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-[10px] hover:bg-cyber-blue/20 transition">
                    {o.status === 'pending' ? '接单' : '完成'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalsTab({ approvals, role, advance }: { approvals: any[]; role: UserRole; advance: (id: string, r: UserRole, c?: string) => void }) {
  const stepLabels = ['物业审核', '消防科审核', '消防大队终审'];
  const stepRole: Record<string, UserRole> = { property: 'property', fire_dept: 'inspector', fire_bureau: 'command' };

  return (
    <div className="grid grid-cols-3 gap-3 h-full overflow-auto">
      {approvals.map(a => (
        <div key={a.id} className={`p-3 rounded-lg flex flex-col ${a.status === 'approved' ? 'bg-life-green/5 border border-life-green/30' : 'bg-space-blue/50 border border-cyber-blue/20'}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="font-medium text-white text-sm">{a.title}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${a.status === 'approved' ? 'bg-life-green/15 text-life-green border border-life-green/40' : 'bg-warn-orange/15 text-warn-orange border border-warn-orange/40 animate-pulse'}`}>
              {a.status === 'approved' ? '✓ 通过' : a.currentStep >= 3 ? '流程完成' : `第${a.currentStep + 1}步`}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mb-2">{a.applicant} · {a.submittedAt}</div>
          <div className="text-xs text-slate-300 mb-3 line-clamp-2">{a.description}</div>
          <div className="space-y-1 mt-auto">
            {a.steps.map((st: any, i: number) => {
              const currentRoleMatch = stepRole[st.role] === role;
              const isCurrent = a.currentStep === i && st.status === 'pending' && a.status === 'pending';
              return (
                <div key={i} className={`text-[11px] flex items-center gap-2 p-1.5 rounded ${st.status === 'approved' ? 'bg-life-green/8 border border-life-green/20' : isCurrent ? 'bg-cyber-blue/10 border border-cyber-blue/40 shadow-[0_0_12px_rgba(56,189,248,0.15)]' : 'bg-space-blue/30 border border-transparent'}`}>
                  <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${st.status === 'approved' ? 'bg-life-green/25 text-life-green' : isCurrent ? 'bg-cyber-blue/25 text-cyber-blue animate-pulse' : 'bg-slate-600/30 text-slate-500'}`}>
                    {st.status === 'approved' ? '✓' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`${st.status === 'approved' ? 'text-life-green' : isCurrent ? 'text-cyber-blue' : 'text-slate-500'} font-medium`}>
                      {stepLabels[i]}
                      {st.status === 'approved' && <span className="ml-1 text-life-green/70">(已通过)</span>}
                      {isCurrent && <span className="ml-1 text-cyber-blue/70">(当前节点)</span>}
                    </div>
                    {st.approver && <div className="text-[9px] text-slate-500 truncate">{st.approver} · {st.approvedAt}</div>}
                  </div>
                  {isCurrent && currentRoleMatch && (
                    <button onClick={() => advance(a.id, role, '同意')}
                      className="px-2.5 py-0.5 rounded bg-life-green/20 text-life-green text-[10px] hover:bg-life-green/30 border border-life-green/50 shrink-0 font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
                      ⚡ 电子会签
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickTab() {
  const s = useFireStore();
  return (
    <div className="h-full grid grid-cols-6 gap-3">
      {[
        { label: '触发测试火警', icon: '🔥', run: () => s.triggerFireAlarm('b4', 8, 1), color: 'cyber-btn-red' },
        { label: '启动疏散引导', icon: '🚶', run: () => s.activateEvacuation('b1'), color: 'cyber-btn-green' },
        { label: '解除疏散', icon: '✅', run: () => s.deactivateEvacuation(), color: 'cyber-btn' },
        { label: '激活联动设备', icon: '🔗', run: () => s.triggerLinkedDevices(), color: 'cyber-btn-orange' },
        { label: '重置联动', icon: '↺', run: () => s.resetLinkedDevices(), color: 'cyber-btn' },
        { label: '解决当前火警', icon: '🧯', run: () => s.fireAlarms.filter(a=>a.status==='active').forEach(a => s.resolveFireAlarm(a.id)), color: 'cyber-btn-green' },
      ].map((q, i) => (
        <button key={i} onClick={q.run}
          className={`${q.color} flex flex-col items-center justify-center gap-1.5 py-4 rounded-lg`}>
          <div className="text-2xl">{q.icon}</div>
          <div className="text-xs">{q.label}</div>
        </button>
      ))}
    </div>
  );
}
