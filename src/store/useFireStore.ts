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

interface FireState {
  currentUser: User | null;
  loginRecords: LoginRecord[];
  buildings: Building[];
  fireAlarms: FireAlarm[];
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
}

export const useFireStore = create<FireState>((set, get) => ({
  currentUser: null,
  loginRecords: mockLoginRecords,
  buildings: mockBuildings,
  fireAlarms: [{
    id: 'fa1',
    buildingId: 'b1',
    buildingName: '天际中心大厦',
    sourceFloor: 24,
    level: 2,
    triggerTime: new Date().toISOString(),
    status: 'active',
    spreadFloors: [24],
  }],
  workOrders: mockWorkOrders,
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
    const alarm: FireAlarm = {
      id: `fa${Date.now()}`, buildingId, buildingName: b.name,
      sourceFloor: floor, level, triggerTime: new Date().toISOString(),
      status: 'active', spreadFloors: [floor],
    };
    set({ fireAlarms: [...get().fireAlarms, alarm] });
    get().triggerLinkedDevices();
    setTimeout(() => get().dispatchTrucks(buildingId, level), 1500);
  },

  updateFireSpread: (alarmId, floors) => set((s) => ({
    fireAlarms: s.fireAlarms.map(a => a.id === alarmId ? { ...a, spreadFloors: floors } : a),
  })),

  resolveFireAlarm: (alarmId) => set((s) => ({
    fireAlarms: s.fireAlarms.map(a => a.id === alarmId ? { ...a, status: 'resolved' } : a),
  })),

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
    path.push(station.position);
    path.push([midX, 0, sz + 8]);
    path.push([midX, 0, (sz + ez) / 2]);
    path.push([ex + 8, 0, ez]);
    path.push(b.position);

    const newTrucks = station.trucks.map(t => {
      if (idleTrucks.find(it => it.id === t.id)) {
        return { ...t, status: 'dispatched' as const, eta: 180 + Math.floor(Math.random() * 120) };
      }
      return t;
    });

    set({
      fireStation: { ...station, trucks: newTrucks },
      activeTruck: idleTrucks[0],
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

  addWorkOrder: (order) => set((s) => ({
    workOrders: [...s.workOrders, { ...order, id: `wo${Date.now()}`, createdAt: new Date().toLocaleString('zh-CN') }],
  })),

  updateWorkOrderStatus: (id, status) => set((s) => ({
    workOrders: s.workOrders.map(w => w.id === id ? { ...w, status } : w),
  })),

  advanceApproval: (approvalId, role, comment) => set((s) => ({
    approvals: s.approvals.map(a => {
      if (a.id !== approvalId) return a;
      const stepIndex = a.steps.findIndex(st => st.role === role && st.status === 'pending');
      if (stepIndex === -1) return a;
      const steps = [...a.steps];
      steps[stepIndex] = {
        ...steps[stepIndex], status: 'approved', comment,
        approver: role === 'property' ? '物业审核员' : role === 'inspector' ? '消防科审核员' : '消防大队审核员',
        approvedAt: new Date().toLocaleString('zh-CN'),
      };
      const nextStep = steps.findIndex(st => st.status === 'pending');
      return {
        ...a, steps,
        currentStep: nextStep === -1 ? 3 : stepIndex + 1,
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
    let activeIdx = -1;
    const newTrucks = station.trucks.map((t, i) => {
      if (t.status !== 'dispatched') return t;
      activeIdx = i;
      const target = path[Math.min(path.length - 1, 1 + i % (path.length - 1))];
      const dx = target[0] - t.currentPosition[0];
      const dz = target[2] - t.currentPosition[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.3) {
        return { ...t, eta: t.eta ? Math.max(0, t.eta - 1) : 0 };
      }
      const speed = 0.5;
      const newEta = t.eta ? Math.max(0, t.eta - 1) : 0;
      const newPos: [number, number, number] = [
        t.currentPosition[0] + (dx / dist) * speed,
        0,
        t.currentPosition[2] + (dz / dist) * speed,
      ];
      return {
        ...t,
        currentPosition: newPos,
        eta: newEta,
      };
    });
    if (activeIdx >= 0) {
      return { fireStation: { ...station, trucks: newTrucks }, activeTruck: newTrucks[activeIdx] };
    }
    return {};
  }),

  tickFireSpread: () => set((s) => ({
    fireAlarms: s.fireAlarms.map(a => {
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
      return { ...a, spreadFloors: [...a.spreadFloors, newFloor] };
    }),
  })),
}));
