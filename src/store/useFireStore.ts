import { create } from 'zustand';
import type {
  User, UserRole, LoginRecord, Building, FireAlarm, WorkOrder,
  FireStation, FireTruck, PatrolRobot, ApprovalItem, FireHydrant,
  ChannelOccupation, LinkedDeviceStatus, FireZone
} from '@/types';
import {
  mockBuildings, mockFireStation, mockHydrants, mockRobots,
  mockApprovals, mockWorkOrders, mockLoginRecords, mockChannelOccupations,
  mockFireZones
} from '@/data/mockData';

const WORKORDERS_LS_KEY = 'fire_platform_workorders_v1';

function loadWorkOrdersFromLS(): WorkOrder[] | null {
  try {
    const raw = localStorage.getItem(WORKORDERS_LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkOrder[];
  } catch {
    return null;
  }
}

function saveWorkOrdersToLS(orders: WorkOrder[]) {
  try {
    localStorage.setItem(WORKORDERS_LS_KEY, JSON.stringify(orders));
  } catch { /* ignore */ }
}

function makeFaultKey(buildingId: string, floor: number, type: string): string {
  return `${buildingId}__${floor}__${type}`;
}

function generateFacilityWorkOrders(buildings: Building[]): WorkOrder[] {
  const created: WorkOrder[] = [];
  const today = new Date().toLocaleString('zh-CN');
  buildings.forEach(b => {
    b.facilities.forEach(f => {
      if (f.smokeDetector.status === 'fault') {
        created.push({
          id: `wo_smoke_${b.id}_${f.floor}`,
          type: 'facility_repair',
          title: `${b.name} ${f.floor}层烟感探测器故障维修`,
          description: `烟感探测器信号异常或设备离线，需现场排查更换`,
          buildingId: b.id,
          floor: f.floor,
          status: 'pending',
          createdAt: today,
        });
      }
      if (f.sprinkler.status === 'fault') {
        created.push({
          id: `wo_spr_${b.id}_${f.floor}`,
          type: 'facility_repair',
          title: `${b.name} ${f.floor}层喷淋系统故障检修`,
          description: `喷淋系统支管压力异常或电磁阀故障，需检修`,
          buildingId: b.id,
          floor: f.floor,
          status: 'pending',
          createdAt: today,
        });
      }
      if (f.hydrantPressure < 0.4) {
        created.push({
          id: `wo_hyd_${b.id}_${f.floor}`,
          type: 'pressure_boost',
          title: `${b.name} ${f.floor}层消防栓水压不足加压`,
          description: `当前水压${f.hydrantPressure.toFixed(2)}MPa，低于标准0.4MPa，需排查管网并加压`,
          buildingId: b.id,
          floor: f.floor,
          status: 'pending',
          createdAt: today,
        });
      }
    });
  });
  return created;
}

function mergeAndDedupWorkOrders(mockOrders: WorkOrder[], buildings: Building[]): WorkOrder[] {
  const persisted = loadWorkOrdersFromLS();
  const base = persisted && persisted.length > 0 ? persisted : mockOrders;

  const byKey = new Map<string, WorkOrder>();
  base.forEach(o => {
    let key: string;
    if (o.type === 'pressure_boost') key = makeFaultKey(o.buildingId, o.floor || 0, 'hydrant');
    else if (o.id.includes('_smoke_')) key = makeFaultKey(o.buildingId, o.floor || 0, 'smoke');
    else if (o.id.includes('_spr_')) key = makeFaultKey(o.buildingId, o.floor || 0, 'sprinkler');
    else key = o.id;
    byKey.set(key, o);
  });

  const autoGen = generateFacilityWorkOrders(buildings);
  autoGen.forEach(o => {
    const key = makeFaultKey(o.buildingId, o.floor || 0,
      o.type === 'pressure_boost' ? 'hydrant' : o.id.includes('_spr_') ? 'sprinkler' : 'smoke');
    if (!byKey.has(key)) {
      byKey.set(key, o);
    } else {
      const existing = byKey.get(key)!;
      if (existing.status === 'completed') {
        byKey.set(key, existing);
      }
    }
  });

  return Array.from(byKey.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

interface FireState {
  currentUser: User | null;
  loginRecords: LoginRecord[];
  buildings: Building[];
  fireAlarms: FireAlarm[];
  timelineEvents: FireTimelineEvent[];
  workOrders: WorkOrder[];
  fireStation: FireStation;
  activeTruck: FireTruck | null;
  dispatchPath: [number, number, number][] | null;
  robots: PatrolRobot[];
  approvals: ApprovalItem[];
  hydrants: FireHydrant[];
  fireZones: FireZone[];
  channelOccupations: ChannelOccupation[];
  evacuationActive: boolean;
  evacuationBuildingId: string | null;
  linkedDevices: LinkedDeviceStatus;
  selectedBuildingId: string | null;
  activeTab: 'dashboard' | 'approval' | 'reports';

  replayMode: boolean;
  replayAlarmId: string | null;
  replayCurrentTime: number;
  replayPlaying: boolean;
  replaySnapshots: FireTimelineEvent[];

  login: (role: UserRole) => void;
  logout: () => void;

  triggerFireAlarm: (buildingId: string, floor: number, level: 1 | 2 | 3) => void;
  updateFireSpread: (alarmId: string, floors: number[]) => void;
  resolveFireAlarm: (alarmId: string) => void;

  dispatchTrucks: (buildingId: string, level: 1 | 2 | 3) => void;
  updateTruckPosition: (truckId: string, pos: [number, number, number], eta?: number) => void;

  activateEvacuation: (buildingId: string) => void;
  deactivateEvacuation: () => void;

  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createdAt'>) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrder['status']) => void;

  submitApproval: (data: { title: string; description: string; buildingId: string }) => void;
  advanceApproval: (approvalId: string, role: UserRole, comment?: string) => void;

  updateHydrantPressure: (id: string, pressure: number) => void;
  updateChannelOccupation: (id: string, status: ChannelOccupation['status']) => void;
  updateRobotPosition: (robotId: string, pos: [number, number, number], routeIndex: number) => void;
  setSelectedBuilding: (id: string | null) => void;
  setActiveTab: (tab: 'dashboard' | 'approval' | 'reports') => void;
  triggerLinkedDevices: () => void;
  resetLinkedDevices: () => void;
  tickRobots: () => void;
  tickTrucks: () => void;
  tickFireSpread: () => void;

  addTimelineEvent: (e: Omit<FireTimelineEvent, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  startReplay: (alarmId: string) => void;
  stopReplay: () => void;
  toggleReplayPlaying: () => void;
  seekReplay: (offsetMs: number) => void;
  tickReplay: (deltaMs: number) => void;
}

export const useFireStore = create<FireState>((set, get) => {
  const nowTs = Date.now();
  const initialTriggerTs = nowTs - 60_000;
  const initialAlarm: FireAlarm = {
    id: 'fa1',
    buildingId: 'b1',
    buildingName: '天际中心大厦',
    sourceFloor: 24,
    level: 2,
    triggerTime: new Date(initialTriggerTs).toISOString(),
    triggerTimestamp: initialTriggerTs,
    status: 'active',
    spreadFloors: [24],
  };

  return {
  currentUser: null,
  loginRecords: mockLoginRecords,
  buildings: mockBuildings,
  fireAlarms: [initialAlarm],
  timelineEvents: [
    { id: 'tl1', alarmId: 'fa1', type: 'alarm_trigger', timestamp: initialTriggerTs,
      title: '火警触发', description: '24层烟感探测器触发信号',
      snapshot: { spreadFloors: [24] } },
    { id: 'tl2', alarmId: 'fa1', type: 'linkage_start', timestamp: initialTriggerTs + 3000,
      title: '联动启动', description: '启动应急联动预案' },
    { id: 'tl3', alarmId: 'fa1', type: 'linkage_shutter', timestamp: initialTriggerTs + 5000,
      title: '防火卷帘关闭', description: '防火分区卷帘下降完成' },
    { id: 'tl4', alarmId: 'fa1', type: 'truck_dispatched', timestamp: initialTriggerTs + 10000,
      title: '消防车出动', description: '调度3辆消防车出警',
      snapshot: { truckStatuses: { ft1: 'dispatched', ft2: 'dispatched', ft3: 'dispatched' } } },
    { id: 'tl5', alarmId: 'fa1', type: 'fire_spread', timestamp: initialTriggerTs + 40000,
      title: '火势蔓延', description: '蔓延至23、25层',
      snapshot: { spreadFloors: [23, 24, 25] } },
  ],
  workOrders: mergeAndDedupWorkOrders(mockWorkOrders, mockBuildings),
  fireStation: mockFireStation,
  activeTruck: null,
  dispatchPath: null,
  robots: mockRobots,
  approvals: mockApprovals,
  hydrants: mockHydrants,
  fireZones: mockFireZones,
  channelOccupations: mockChannelOccupations,
  evacuationActive: false,
  evacuationBuildingId: null,
  linkedDevices: {
    fireShutter: false, smokeExtractor: false, broadcast: false,
    sprinkler: false, elevatorDrop: false,
  },
  selectedBuildingId: 'b1',
  activeTab: 'dashboard',

  replayMode: false,
  replayAlarmId: null,
  replayCurrentTime: 0,
  replayPlaying: false,
  replaySnapshots: [],

  login: (role) => {
    const userMap: Record<UserRole, User> = {
      property: { id: 'u3', name: '物业-王物业', role: 'property' },
      inspector: { id: 'u2', name: '巡查员-李巡查', role: 'inspector' },
      command: { id: 'u1', name: '指挥长-陈指挥', role: 'command' },
    };
    const user = userMap[role];
    set({
      currentUser: user,
      loginRecords: [
        { id: `l${Date.now()}`, userId: user.id, userName: user.name, role,
          loginTime: new Date().toLocaleString('zh-CN'), success: true },
        ...get().loginRecords,
      ],
    });
  },

  logout: () => set({ currentUser: null }),

  triggerFireAlarm: (buildingId, floor, level) => {
    const b = get().buildings.find(x => x.id === buildingId);
    if (!b) return;
    const ts = Date.now();
    const alarm: FireAlarm = {
      id: `fa${ts}`, buildingId, buildingName: b.name,
      sourceFloor: floor, level, triggerTime: new Date(ts).toISOString(),
      triggerTimestamp: ts, status: 'active', spreadFloors: [floor],
    };
    set({ fireAlarms: [...get().fireAlarms, alarm] });
    get().addTimelineEvent({ alarmId: alarm.id, type: 'alarm_trigger',
      title: '火警触发', description: `${b.name} ${floor}层烟感触发`,
      snapshot: { spreadFloors: [floor], linkedDevices: get().linkedDevices } });
    setTimeout(() => {
      get().triggerLinkedDevices();
      get().addTimelineEvent({ alarmId: alarm.id, type: 'linkage_start',
        title: '联动系统启动', description: '启动应急联动预案' });
      setTimeout(() => get().addTimelineEvent({ alarmId: alarm.id, type: 'linkage_shutter',
        title: '防火卷帘关闭', snapshot: { linkedDevices: { fireShutter: true } } }), 800);
      setTimeout(() => get().addTimelineEvent({ alarmId: alarm.id, type: 'linkage_exhaust',
        title: '排烟风机启动', snapshot: { linkedDevices: { smokeExtractor: true } } }), 1500);
      setTimeout(() => get().addTimelineEvent({ alarmId: alarm.id, type: 'linkage_broadcast',
        title: '消防广播开启', snapshot: { linkedDevices: { broadcast: true } } }), 2200);
      setTimeout(() => get().addTimelineEvent({ alarmId: alarm.id, type: 'linkage_sprinkler',
        title: '喷淋系统启动', snapshot: { linkedDevices: { sprinkler: true } } }), 2800);
    }, 500);
    setTimeout(() => {
      get().dispatchTrucks(buildingId, level);
      get().addTimelineEvent({ alarmId: alarm.id, type: 'truck_dispatched',
        title: '消防车出动', description: `调度${level === 1 ? 2 : level === 2 ? 3 : 5}辆消防车`,
        timestamp: Date.now() });
    }, 1500);
  },

  updateFireSpread: (alarmId, floors) => {
    set((s) => ({ fireAlarms: s.fireAlarms.map(a => a.id === alarmId ? { ...a, spreadFloors: floors } : a) }));
    get().addTimelineEvent({ alarmId, type: 'fire_spread',
      title: '火势蔓延', description: `涉及楼层: ${floors.sort().join('、')}层`,
      snapshot: { spreadFloors: floors } });
  },

  resolveFireAlarm: (alarmId) => {
    const ts = Date.now();
    set((s) => ({ fireAlarms: s.fireAlarms.map(a =>
      a.id === alarmId ? { ...a, status: 'resolved', resolvedAt: ts } : a) }));
    get().addTimelineEvent({ alarmId, type: 'fire_resolved',
      title: '火警处置完成', description: '现场处置结束，确认无复燃风险' });
  },

  dispatchTrucks: (buildingId, level) => {
    const b = get().buildings.find(x => x.id === buildingId);
    if (!b) return;
    const truckCount = level === 1 ? 2 : level === 2 ? 3 : 5;
    const station = get().fireStation;
    const idleTrucks = station.trucks.filter(t => t.status === 'idle').slice(0, truckCount);
    if (idleTrucks.length === 0) return;

    const path: [number, number, number][] = [];
    const [sx, , sz] = station.position;
    const [ex, , ez] = b.position;
    const midX = (sx + ex) / 2;
    path.push([...station.position] as [number, number, number]);
    path.push([midX, 0, sz + 8]);
    path.push([midX, 0, (sz + ez) / 2]);
    path.push([ex + 8, 0, ez]);
    path.push([...b.position] as [number, number, number]);

    let totalDist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][2] - path[i][2]);
      totalDist += d;
    }
    const baseEta = Math.max(120, Math.floor(totalDist * 8));

    const newTrucks = station.trucks.map((t, idx) => {
      const matchIdx = idleTrucks.findIndex(it => it.id === t.id);
      if (matchIdx >= 0) {
        const startPos: [number, number, number] = [...station.position];
        return {
          ...t,
          status: 'dispatched' as const,
          eta: baseEta + matchIdx * 25,
          targetBuildingId: buildingId,
          pathSegmentIndex: 0,
          progressPercent: 0,
          currentPosition: startPos,
        };
      }
      return t;
    });

    set({
      fireStation: { ...station, trucks: newTrucks },
      activeTruck: newTrucks.find(t => t.id === idleTrucks[0].id) || null,
      dispatchPath: path,
    });
  },

  updateTruckPosition: (truckId, pos, eta) => set((s) => ({
    fireStation: {
      ...s.fireStation,
      trucks: s.fireStation.trucks.map(t =>
        t.id === truckId ? { ...t, currentPosition: pos, eta } : t
      ),
    },
  })),

  activateEvacuation: (buildingId) => set({
    evacuationActive: true, evacuationBuildingId: buildingId,
  }),
  deactivateEvacuation: () => set({ evacuationActive: false, evacuationBuildingId: null }),

  addWorkOrder: (order) => set((s) => {
    const newOrder: WorkOrder = { ...order, id: `wo${Date.now()}`, createdAt: new Date().toLocaleString('zh-CN') };
    const next = [...s.workOrders, newOrder];
    saveWorkOrdersToLS(next);
    return { workOrders: next };
  }),

  updateWorkOrderStatus: (id, status) => set((s) => {
    const next = s.workOrders.map(w => w.id === id ? { ...w, status } : w);
    saveWorkOrdersToLS(next);
    return { workOrders: next };
  }),

  advanceApproval: (approvalId, role, comment) => set((s) => ({
    approvals: s.approvals.map(a => {
      if (a.id !== approvalId) return a;
      const roleToStep: Record<string, 'property' | 'fire_dept' | 'fire_bureau'> = {
        property: 'property',
        inspector: 'fire_dept',
        command: 'fire_bureau',
      };
      const stepRole = roleToStep[role];
      const stepIndex = a.steps.findIndex(st => st.role === stepRole && st.status === 'pending');
      if (stepIndex === -1) return a;
      if (stepIndex !== a.currentStep) return a;
      const steps = [...a.steps];
      steps[stepIndex] = {
        ...steps[stepIndex], status: 'approved', comment,
        approver: role === 'property' ? '物业审核员' : role === 'inspector' ? '消防科审核员' : '消防大队审核员',
        approvedAt: new Date().toLocaleString('zh-CN'),
      };
      const nextStep = steps.findIndex(st => st.status === 'pending');
      return {
        ...a, steps,
        currentStep: nextStep === -1 ? 3 : nextStep,
        status: nextStep === -1 ? 'approved' : 'pending',
      };
    }),
  })),

  updateHydrantPressure: (id, pressure) => set((s) => ({
    hydrants: s.hydrants.map(h => h.id === id ? { ...h, pressure } : h),
  })),

  updateChannelOccupation: (id, status) => set((s) => ({
    channelOccupations: s.channelOccupations.map(c =>
      c.id === id ? { ...c, status, notified: status === 'occupied' ? true : c.notified } : c
    ),
  })),

  updateRobotPosition: (robotId, pos, routeIndex) => set((s) => ({
    robots: s.robots.map(r =>
      r.id === robotId ? { ...r, currentPosition: pos, currentRouteIndex: routeIndex } : r
    ),
  })),

  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  triggerLinkedDevices: () => set({
    linkedDevices: { fireShutter: true, smokeExtractor: true, broadcast: true, sprinkler: true, elevatorDrop: true },
  }),
  resetLinkedDevices: () => set({
    linkedDevices: { fireShutter: false, smokeExtractor: false, broadcast: false, sprinkler: false, elevatorDrop: false },
  }),

  tickRobots: () => set((s) => ({
    robots: s.robots.map(r => {
      if (r.status !== 'patrolling' || r.route.length < 2) return r;
      const nextIdx = (r.currentRouteIndex + 1) % r.route.length;
      const curr = r.currentPosition;
      const next = r.route[nextIdx];
      const dx = (next[0] - curr[0]);
      const dz = (next[2] - curr[2]);
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.5) {
        return { ...r, currentPosition: next, currentRouteIndex: nextIdx };
      }
      const speed = 0.4;
      return {
        ...r,
        currentPosition: [curr[0] + (dx / dist) * speed, curr[1], curr[2] + (dz / dist) * speed],
      };
    }),
  })),

  tickTrucks: () => set((s) => {
    const path = s.dispatchPath;
    if (!path || path.length < 2) return {};
    const station = s.fireStation;

    let totalPathDist = 0;
    const segLens: number[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const d = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][2] - path[i][2]);
      segLens.push(d);
      totalPathDist += d;
    }

    let activeIdx = -1;
    const arrivedIds: string[] = [];
    const newTrucks = station.trucks.map((t, i) => {
      if (t.status !== 'dispatched') return t;
      activeIdx = i;

      let segIdx = t.pathSegmentIndex || 0;
      if (segIdx >= path.length - 1) {
        if (t.status !== 'arrived') arrivedIds.push(t.id);
        return {
          ...t,
          status: 'arrived' as const,
          eta: 0,
          progressPercent: 100,
          currentPosition: path[path.length - 1],
        };
      }

      const from = path[segIdx];
      const to = path[segIdx + 1];
      const dx = to[0] - t.currentPosition[0];
      const dz = to[2] - t.currentPosition[2];
      const dist = Math.hypot(dx, dz);

      const speed = 0.6;
      let newPos: [number, number, number];
      let newSegIdx = segIdx;

      if (dist < speed) {
        newPos = [...to] as [number, number, number];
        newSegIdx = segIdx + 1;
      } else {
        newPos = [
          t.currentPosition[0] + (dx / dist) * speed,
          0,
          t.currentPosition[2] + (dz / dist) * speed,
        ];
      }

      let traveled = 0;
      for (let j = 0; j < newSegIdx; j++) traveled += segLens[j] || 0;
      if (newSegIdx < path.length - 1) {
        traveled += Math.hypot(newPos[0] - path[newSegIdx][0], newPos[2] - path[newSegIdx][2]);
      }
      const progress = Math.min(100, Math.round((traveled / Math.max(0.01, totalPathDist)) * 100));
      const remainDist = Math.max(0, totalPathDist - traveled);
      const newEta = Math.max(0, Math.round(remainDist * 10));

      if (newSegIdx >= path.length - 1) {
        arrivedIds.push(t.id);
        return {
          ...t,
          status: 'arrived' as const,
          eta: 0,
          pathSegmentIndex: path.length - 1,
          progressPercent: 100,
          currentPosition: path[path.length - 1],
        };
      }

      return {
        ...t,
        currentPosition: newPos,
        pathSegmentIndex: newSegIdx,
        progressPercent: progress,
        eta: newEta,
      };
    });

    setTimeout(() => {
      arrivedIds.forEach(tid => {
        const truck = get().fireStation.trucks.find(x => x.id === tid);
        const alarm = get().fireAlarms.find(a => a.status !== 'resolved'
          && (a.buildingId === truck?.targetBuildingId));
        if (truck && alarm) {
          get().addTimelineEvent({ alarmId: alarm.id, type: 'truck_arrived',
            title: `${truck.name}到达现场`, description: '消防指战员已就位开始处置',
            snapshot: { truckStatuses: { [tid]: 'arrived' }, truckProgress: { [tid]: 100 } } });
        }
      });
    }, 30);

    const firstDispatched = newTrucks.findIndex(t => t.status === 'dispatched' || t.status === 'arrived');
    if (firstDispatched >= 0) {
      activeIdx = firstDispatched;
    }
    if (activeIdx >= 0) {
      return { fireStation: { ...station, trucks: newTrucks }, activeTruck: newTrucks[activeIdx] };
    }
    return {};
  }),

  tickFireSpread: () => {
    const s = get();
    const updates: { alarmId: string; floors: number[] }[] = [];
    const newAlarms = s.fireAlarms.map(a => {
      if (a.status !== 'active') return a;
      const maxSpread = a.level === 1 ? 2 : a.level === 2 ? 5 : 10;
      if (a.spreadFloors.length >= maxSpread) return a;
      if (Math.random() > 0.35) return a;
      const lastFloor = a.sourceFloor;
      const delta = a.spreadFloors.length % 2 === 0 ? 1 : -1;
      const newFloor = lastFloor + Math.floor((a.spreadFloors.length + 1) / 2) * delta;
      if (newFloor < 1) return a;
      const b = s.buildings.find(bb => bb.id === a.buildingId);
      if (b && newFloor > b.floors) return a;
      if (a.spreadFloors.includes(newFloor)) return a;
      const nextFloors = [...a.spreadFloors, newFloor];
      updates.push({ alarmId: a.id, floors: nextFloors });
      return { ...a, spreadFloors: nextFloors };
    });
    set({ fireAlarms: newAlarms });
    updates.forEach(u => {
      const alarm = get().fireAlarms.find(x => x.id === u.alarmId);
      if (alarm) get().addTimelineEvent({ alarmId: u.alarmId, type: 'fire_spread',
        title: '火势蔓延', description: `新增${u.floors[u.floors.length - 1]}层受影响`,
        snapshot: { spreadFloors: u.floors } });
    });
  },

  addTimelineEvent: (e) => set((s) => ({
    timelineEvents: [...s.timelineEvents, {
      ...e,
      id: `tl${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: e.timestamp ?? Date.now(),
    }],
  })),

  submitApproval: (data) => set((s) => {
    const now = new Date();
    const ts = now.toLocaleString('zh-CN');
    const building = s.buildings.find(b => b.id === data.buildingId);
    const newItem: ApprovalItem = {
      id: `ap${Date.now()}`,
      title: data.title,
      applicant: s.currentUser?.name || '物业人员',
      buildingId: data.buildingId,
      description: `${data.description}${building ? `（${building.name}）` : ''}`,
      submittedAt: ts,
      steps: [
        { role: 'property', status: 'pending' },
        { role: 'fire_dept', status: 'pending' },
        { role: 'fire_bureau', status: 'pending' },
      ],
      currentStep: 0,
      status: 'pending',
    };
    return { approvals: [...s.approvals, newItem] };
  }),

  startReplay: (alarmId) => set((s) => {
    const events = s.timelineEvents.filter(e => e.alarmId === alarmId).sort((a, b) => a.timestamp - b.timestamp);
    if (events.length === 0) return {};
    const startTs = events[0].timestamp;
    const normalizedEvents = events.map(e => ({ ...e, timestamp: e.timestamp - startTs }));
    return {
      replayMode: true,
      replayAlarmId: alarmId,
      replayCurrentTime: 0,
      replayPlaying: true,
      replaySnapshots: normalizedEvents,
    };
  }),
  stopReplay: () => set({ replayMode: false, replayAlarmId: null, replayCurrentTime: 0, replayPlaying: false, replaySnapshots: [] }),
  toggleReplayPlaying: () => set((s) => ({ replayPlaying: !s.replayPlaying })),
  seekReplay: (offsetMs) => set((s) => {
    const max = s.replaySnapshots.length > 0
      ? s.replaySnapshots[s.replaySnapshots.length - 1].timestamp : 0;
    return { replayCurrentTime: Math.max(0, Math.min(max, offsetMs)) };
  }),
  tickReplay: (deltaMs) => set((s) => {
    if (!s.replayPlaying || s.replaySnapshots.length === 0) return {};
    const max = s.replaySnapshots[s.replaySnapshots.length - 1].timestamp;
    const next = s.replayCurrentTime + deltaMs;
    if (next >= max) {
      return { replayCurrentTime: max, replayPlaying: false };
    }
    return { replayCurrentTime: next };
  }),
  };
}));
