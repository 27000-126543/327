import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, UserCheck, Building, Clock, MessageSquare, CheckCircle2, Loader2, ChevronRight, FileText, Upload, X, AlertCircle } from 'lucide-react';
import { useFireStore } from '@/store/useFireStore';
import { TopBar } from '@/components/Panels/TopBar';
import type { UserRole } from '@/types';

export default function ApprovalPage() {
  const navigate = useNavigate();
  const currentUser = useFireStore(s => s.currentUser);
  const approvals = useFireStore(s => s.approvals);
  const buildings = useFireStore(s => s.buildings);
  const advanceApproval = useFireStore(s => s.advanceApproval);
  const submitApproval = useFireStore(s => s.submitApproval);
  const role = currentUser?.role || 'command';

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buildingId, setBuildingId] = useState('b1');
  const [formError, setFormError] = useState('');

  useEffect(() => { if (!currentUser) navigate('/login', { replace: true }); }, [currentUser, navigate]);

  if (!currentUser) return null;

  const stepConfig = [
    { role: 'property' as UserRole, label: '物业初审', desc: '物业管理员审核材料完整性' },
    { role: 'inspector' as UserRole, label: '消防科审核', desc: '消防科设计方案合规性审核' },
    { role: 'command' as UserRole, label: '消防大队终审', desc: '消防大队最终审批签发' },
  ];

  const canSubmit = role === 'property';

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !buildingId) {
      setFormError('请完整填写申请标题、描述和所属楼宇');
      return;
    }
    submitApproval({ title: title.trim(), description: description.trim(), buildingId });
    setTitle(''); setDescription(''); setBuildingId('b1'); setFormError(''); setShowForm(false);
  };

  return (
    <div className="w-full min-h-screen bg-deep-space relative overflow-auto">
      <TopBar />
      <div className="max-w-6xl mx-auto px-8 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="hud-title text-2xl flex items-center gap-3">
              <FileSignature className="w-7 h-7 text-cyber-blue" /> 装修审批中心
            </h1>
            <p className="text-slate-500 text-sm mt-1">物业 → 消防科 → 消防大队 三级电子会签流程 · 共 {approvals.length} 条申请</p>
          </div>
          <button
            onClick={() => canSubmit && setShowForm(true)}
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-5 py-2.5 ${canSubmit ? 'cyber-btn-green' : 'cyber-btn-disabled opacity-50 cursor-not-allowed'}`}
            title={canSubmit ? '' : '仅物业角色可提交新申请'}
          >
            <Upload className="w-4 h-4" /> 提交新申请
            {!canSubmit && <span className="text-[10px] opacity-70">（仅物业）</span>}
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <div className="cyber-panel p-6 w-[520px] max-w-[92vw]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="hud-title text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-life-green" /> 提交装修审批申请
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-cyber-blue mb-1.5 font-bold">所属楼宇 *</label>
                  <select value={buildingId} onChange={e => setBuildingId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-space-blue/40 border border-cyber-blue/30 text-white text-sm focus:border-cyber-blue outline-none">
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}（共{b.floors}层）</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-cyber-blue mb-1.5 font-bold">申请标题 *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="例如：A座23层XX公司装修消防审批"
                    className="w-full px-3 py-2.5 rounded-lg bg-space-blue/40 border border-cyber-blue/30 text-white text-sm focus:border-cyber-blue outline-none placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-[11px] text-cyber-blue mb-1.5 font-bold">申请内容 *</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                    placeholder="请描述装修范围、施工日期、涉及的消防设施变更等详细信息..."
                    className="w-full px-3 py-2.5 rounded-lg bg-space-blue/40 border border-cyber-blue/30 text-white text-sm focus:border-cyber-blue outline-none placeholder:text-slate-600 resize-none" />
                </div>
                {formError && (
                  <div className="flex items-center gap-2 p-2.5 rounded bg-fire-red/10 border border-fire-red/30 text-fire-red text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="px-5 py-2 rounded border border-slate-600 text-slate-300 text-sm hover:bg-space-blue/50">
                    取消
                  </button>
                  <button onClick={handleSubmit} className="cyber-btn-green px-5 py-2 text-sm">
                    ⚡ 提交申请（物业初审节点）
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="cyber-panel p-5 mb-6 corner-border relative overflow-hidden">
          <div className="absolute inset-0 scan-line pointer-events-none opacity-40" />
          <h2 className="hud-title text-sm mb-4">审批流程进度总览（指挥中心大屏展示）</h2>
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-life-green/10 to-transparent border border-life-green/30">
              <div className="text-3xl font-orbitron font-bold text-life-green">{approvals.filter(a => a.status === 'pending').length}</div>
              <div className="text-xs text-slate-400 mt-1">审批中</div>
            </div>
            {stepConfig.map((s, i) => {
              const doneCount = approvals.filter(a => a.currentStep > i).length;
              const activeCount = approvals.filter(a => a.currentStep === i && a.status === 'pending').length;
              return (
                <div key={s.role} className="flex items-center gap-3">
                  {i > 0 && <ChevronRight className="w-5 h-5 text-cyber-blue/40 shrink-0" />}
                  <div className={`p-3 rounded-lg border flex-1 ${activeCount > 0 ? 'bg-cyber-blue/10 border-cyber-blue/40 shadow-neon-blue' : doneCount === approvals.length ? 'bg-life-green/8 border-life-green/25' : 'bg-space-blue/40 border-transparent'}`}>
                    <div className={`text-xs font-bold mb-0.5 flex items-center gap-1 ${activeCount > 0 ? 'text-cyber-blue' : 'text-slate-300'}`}>
                      {activeCount > 0 && <Loader2 className="w-3 h-3 animate-spin" />}
                      {s.label}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mb-1.5">{s.desc}</div>
                    <div className="flex gap-2">
                      <span className="text-xs font-orbitron text-life-green font-bold">{doneCount} ✓</span>
                      {activeCount > 0 && <span className="text-xs font-orbitron text-cyber-blue font-bold">{activeCount} ←</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {approvals.map(a => {
            const b = buildings.find(x => x.id === a.buildingId);
            return (
              <div key={a.id} className="cyber-panel p-6 relative overflow-hidden hover:border-cyber-blue/50 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-blue/20 to-life-green/10 border border-cyber-blue/30 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-cyber-blue" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg text-white font-bold mb-1">{a.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />{b?.name}
                          </span>
                          <span>申请人: {a.applicant}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{a.submittedAt}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${a.status === 'approved' ? 'bg-life-green/15 text-life-green border border-life-green/30' : 'bg-warn-orange/15 text-warn-orange border border-warn-orange/40 animate-pulse'}`}>
                        {a.status === 'approved' ? '✓ 审批通过' : `进行中（第${a.currentStep + 1}步）`}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 mb-5 p-3 rounded-lg bg-space-blue/40 border border-cyber-blue/10">
                      {a.description}
                    </p>

                    <div className="relative">
                      <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700/50" />
                      <div className="flex justify-between relative">
                        {stepConfig.map((s, i) => {
                          const st = a.steps[i];
                          const isCurrent = a.currentStep === i && a.status === 'pending';
                          const isDone = st.status === 'approved';
                          const currentRoleCanSign = isCurrent && s.role === role;
                          return (
                            <div key={s.role} className="flex flex-col items-center relative z-10">
                              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${isDone ? 'bg-life-green/20 border-life-green shadow-neon-green' : isCurrent ? 'bg-cyber-blue/15 border-cyber-blue shadow-neon-blue animate-pulse' : 'bg-space-blue/60 border-slate-600'}`}>
                                {isDone ? <CheckCircle2 className="w-6 h-6 text-life-green" />
                                  : isCurrent ? <UserCheck className="w-6 h-6 text-cyber-blue" />
                                  : <span className="font-orbitron font-bold text-slate-500 text-lg">{i + 1}</span>}
                              </div>
                              <div className={`text-xs font-bold mb-0.5 ${isDone ? 'text-life-green' : isCurrent ? 'text-cyber-blue' : 'text-slate-400'}`}>{s.label}</div>
                              {st.approver ? (
                                <div className="text-[10px] text-slate-500">{st.approver}</div>
                              ) : (
                                <div className="text-[10px] text-slate-600">等待审核</div>
                              )}
                              {st.approvedAt && (
                                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{st.approvedAt.slice(-8)}</div>
                              )}
                              {st.comment && (
                                <div className="mt-2 p-2 rounded-lg bg-space-blue/50 border border-cyber-blue/10 text-[11px] text-slate-400 max-w-[200px] flex items-start gap-1.5">
                                  <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-cyber-blue" />
                                  {st.comment}
                                </div>
                              )}
                              {currentRoleCanSign && (
                                <button onClick={() => advanceApproval(a.id, role, '材料齐全，同意通过')}
                                  className="mt-2 cyber-btn-green text-xs px-3 py-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> 电子会签
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
