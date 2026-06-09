import type {
  Building, FireStation, FireHydrant, PatrolRobot,
  ApprovalItem, WorkOrder, LoginRecord, ChannelOccupation, FireZone
} from '@/types';

const N = 'normal' as const;

export const mockBuildings: Building[] = [
  {
    id: 'b1',
    name: '天际中心大厦',
    type: 'landmark',
    floors: 48,
    height: 192,
    position: [0, 0, 0],
    size: [14, 192, 14],
    color: '#4a90d9',
    facilities: Array.from({ length: 48 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: i === 23 ? 'alarm' : (i === 12 || i === 35 ? 'fault' : N) },
      sprinkler: { status: i === 23 ? 'active' : (i === 7 ? 'fault' : N) },
      hydrantPressure: i === 15 ? 0.32 : i === 30 ? 0.38 : 0.6 + Math.random() * 0.4,
    })),
    fireDoors: Array.from({ length: 10 }, (_, i) => ({
      id: `fd-b1-${i}`,
      floor: (i + 1) * 5,
      status: i === 2 ? 'open' : 'closed' as const,
    })),
    fireZones: [1, 2, 3],
  },
  {
    id: 'b2',
    name: '金融双塔A座',
    type: 'commercial',
    floors: 36,
    height: 144,
    position: [-28, 0, 10],
    size: [12, 144, 10],
    color: '#6b7c93',
    facilities: Array.from({ length: 36 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: i === 18 ? 'fault' : N },
      sprinkler: { status: N },
      hydrantPressure: 0.55 + Math.random() * 0.5,
    })),
    fireDoors: [],
    fireZones: [1],
  },
  {
    id: 'b3',
    name: '金融双塔B座',
    type: 'commercial',
    floors: 32,
    height: 128,
    position: [-28, 0, -18],
    size: [12, 128, 10],
    color: '#7b8ea8',
    facilities: Array.from({ length: 32 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: N },
      sprinkler: { status: N },
      hydrantPressure: i === 22 ? 0.35 : 0.7 + Math.random() * 0.3,
    })),
    fireDoors: [],
    fireZones: [1],
  },
  {
    id: 'b4',
    name: '科技园1号楼',
    type: 'commercial',
    floors: 24,
    height: 96,
    position: [26, 0, 12],
    size: [10, 96, 10],
    color: '#5a8f7b',
    facilities: Array.from({ length: 24 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: N },
      sprinkler: { status: i === 10 ? 'fault' : N },
      hydrantPressure: 0.6 + Math.random() * 0.4,
    })),
    fireDoors: [],
    fireZones: [2],
  },
  {
    id: 'b5',
    name: '科技园2号楼',
    type: 'commercial',
    floors: 20,
    height: 80,
    position: [26, 0, -14],
    size: [10, 80, 10],
    color: '#76a890',
    facilities: Array.from({ length: 20 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: N },
      sprinkler: { status: N },
      hydrantPressure: 0.65 + Math.random() * 0.35,
    })),
    fireDoors: [],
    fireZones: [2],
  },
  {
    id: 'b6',
    name: '华府小区1号楼',
    type: 'residential',
    floors: 33,
    height: 99,
    position: [0, 0, -42],
    size: [10, 99, 10],
    color: '#c9956c',
    facilities: Array.from({ length: 33 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: i === 8 ? 'fault' : N },
      sprinkler: { status: N },
      hydrantPressure: 0.58 + Math.random() * 0.42,
    })),
    fireDoors: [],
    fireZones: [3],
  },
  {
    id: 'b7',
    name: '华府小区2号楼',
    type: 'residential',
    floors: 30,
    height: 90,
    position: [18, 0, -42],
    size: [10, 90, 10],
    color: '#d4a373',
    facilities: Array.from({ length: 30 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: N },
      sprinkler: { status: N },
      hydrantPressure: 0.62 + Math.random() * 0.38,
    })),
    fireDoors: [],
    fireZones: [3],
  },
  {
    id: 'b8',
    name: '华府小区3号楼',
    type: 'residential',
    floors: 28,
    height: 84,
    position: [-18, 0, -42],
    size: [10, 84, 10],
    color: '#c49060',
    facilities: Array.from({ length: 28 }, (_, i) => ({
      floor: i + 1,
      smokeDetector: { status: N },
      sprinkler: { status: N },
      hydrantPressure: 0.68 + Math.random() * 0.32,
    })),
    fireDoors: [],
    fireZones: [3],
  },
];

export const mockFireStation: FireStation = {
  id: 'fs1',
  name: '城市中心消防救援站',
  position: [-60, 0, 35],
  trucks: [
    { id: 't1', name: '消-01 水罐车', type: 'water', stationId: 'fs1', status: 'idle', currentPosition: [-60, 0, 35] },
    { id: 't2', name: '消-02 水罐车', type: 'water', stationId: 'fs1', status: 'idle', currentPosition: [-60, 0, 35] },
    { id: 't3', name: '消-03 云梯车', type: 'ladder', stationId: 'fs1', status: 'idle', currentPosition: [-60, 0, 35] },
    { id: 't4', name: '消-04 救援车', type: 'rescue', stationId: 'fs1', status: 'idle', currentPosition: [-60, 0, 35] },
    { id: 't5', name: '消-05 指挥车', type: 'command', stationId: 'fs1', status: 'idle', currentPosition: [-60, 0, 35] },
  ],
};

export const mockHydrants: FireHydrant[] = [
  { id: 'h1', position: [-15, 0.3, 15], pressure: 0.65, type: 'ground' },
  { id: 'h2', position: [15, 0.3, 15], pressure: 0.72, type: 'ground' },
  { id: 'h3', position: [-15, 0.3, -15], pressure: 0.58, type: 'ground' },
  { id: 'h4', position: [15, 0.3, -15], pressure: 0.36, type: 'ground' },
  { id: 'h5', position: [-40, 0.3, 0], pressure: 0.8, type: 'underground' },
  { id: 'h6', position: [40, 0.3, 0], pressure: 0.44, type: 'underground' },
];

export const mockFireZones: FireZone[] = [
  { id: 'z1', name: '中央商务区', buildings: ['b1', 'b2', 'b3'], boundaries: [[-50, 0, -30], [50, 0, 30]] },
  { id: 'z2', name: '科技园区', buildings: ['b4', 'b5'], boundaries: [[10, 0, -30], [50, 0, 30]] },
  { id: 'z3', name: '住宅社区', buildings: ['b6', 'b7', 'b8'], boundaries: [[-30, 0, -60], [30, 0, -30]] },
];

export const mockRobots: PatrolRobot[] = [
  {
    id: 'r1',
    name: '巡查机器人Alpha',
    status: 'patrolling',
    currentPosition: [-10, 1.2, -10],
    route: [[-20, 1.2, -20], [20, 1.2, -20], [20, 1.2, 20], [-20, 1.2, 20]],
    currentRouteIndex: 1,
    battery: 78,
    photos: [
      { id: 'p1', timestamp: '2026-06-09 14:32:18', type: 'door_open', description: '25层东侧常闭防火门处于开启状态', imageUrl: '', location: '天际中心大厦 25F-E' },
      { id: 'p2', timestamp: '2026-06-09 10:15:42', type: 'blocked', description: 'B1层疏散通道堆放杂物', imageUrl: '', location: '天际中心大厦 B1' },
    ],
  },
  {
    id: 'r2',
    name: '巡查机器人Beta',
    status: 'idle',
    currentPosition: [30, 1.2, 0],
    route: [],
    currentRouteIndex: 0,
    battery: 95,
    photos: [],
  },
];

export const mockApprovals: ApprovalItem[] = [
  {
    id: 'a1',
    title: '天际中心15层室内装修工程',
    applicant: '张伟（物业）',
    buildingId: 'b1',
    description: '1503单元办公室装修，涉及消防喷淋系统改造，申请消防审批',
    submittedAt: '2026-06-08 09:30:00',
    steps: [
      { role: 'property', approver: '李明', status: 'approved', comment: '材料齐全，符合要求', approvedAt: '2026-06-08 14:20:00' },
      { role: 'fire_dept', approver: '王强', status: 'approved', comment: '消防设计审核通过', approvedAt: '2026-06-09 08:45:00' },
      { role: 'fire_bureau', status: 'pending' },
    ],
    currentStep: 2,
    status: 'pending',
  },
  {
    id: 'a2',
    title: '金融双塔A座大堂改造',
    applicant: '刘芳（物业）',
    buildingId: 'b2',
    description: '首层大堂装修，消防栓移位审批',
    submittedAt: '2026-06-07 16:00:00',
    steps: [
      { role: 'property', approver: '陈华', status: 'approved', comment: '初审通过', approvedAt: '2026-06-07 17:30:00' },
      { role: 'fire_dept', status: 'pending' },
      { role: 'fire_bureau', status: 'pending' },
    ],
    currentStep: 1,
    status: 'pending',
  },
  {
    id: 'a3',
    title: '科技园1号楼机房建设',
    applicant: '赵军（物业）',
    buildingId: 'b4',
    description: '3楼数据机房气体灭火系统安装审批',
    submittedAt: '2026-06-05 11:00:00',
    steps: [
      { role: 'property', approver: '孙丽', status: 'approved', comment: '材料完备', approvedAt: '2026-06-05 15:00:00' },
      { role: 'fire_dept', approver: '周涛', status: 'approved', comment: '设计合规', approvedAt: '2026-06-06 09:10:00' },
      { role: 'fire_bureau', approver: '吴局长', status: 'approved', comment: '同意施工', approvedAt: '2026-06-06 16:30:00' },
    ],
    currentStep: 3,
    status: 'approved',
  },
];

export const mockWorkOrders: WorkOrder[] = [
  { id: 'wo1', type: 'facility_repair', title: '天际中心大厦12层烟感故障维修', description: '12层烟感探测器信号丢失，需现场排查更换', buildingId: 'b1', floor: 12, status: 'pending', createdAt: '2026-06-09 08:15:00' },
  { id: 'wo2', type: 'pressure_boost', title: '天际中心大厦15层消防栓水压不足', description: '当前水压0.32MPa，低于标准0.4MPa，需加压检查', buildingId: 'b1', floor: 15, status: 'processing', createdAt: '2026-06-09 09:30:00', assignedTo: '抢修一组' },
  { id: 'wo3', type: 'tow_vehicle', title: '科技二街消防通道违停拖移', description: '一辆白色轿车占用科技二街消防通道', buildingId: 'b4', status: 'pending', createdAt: '2026-06-09 10:45:00' },
  { id: 'wo4', type: 'facility_repair', title: '科技园1号楼10层喷淋系统故障', description: '10层喷淋支管压力表异常，需检修', buildingId: 'b4', floor: 10, status: 'completed', createdAt: '2026-06-08 16:20:00' },
];

export const mockLoginRecords: LoginRecord[] = [
  { id: 'l1', userId: 'u1', userName: '指挥长-陈指挥', role: 'command', loginTime: '2026-06-09 08:00:12', success: true },
  { id: 'l2', userId: 'u2', userName: '巡查员-李巡查', role: 'inspector', loginTime: '2026-06-09 08:05:33', success: true },
  { id: 'l3', userId: 'u3', userName: '物业-王物业', role: 'property', loginTime: '2026-06-09 08:10:45', success: true },
];

export const mockChannelOccupations: ChannelOccupation[] = [
  { id: 'co1', roadId: 'r_tech2', location: '科技二街（科技园1号楼北侧）', status: 'occupied', notified: true },
  { id: 'co2', roadId: 'r_main_e', location: '中央大道东段', status: 'clear', notified: false },
  { id: 'co3', roadId: 'r_main_w', location: '中央大道西段', status: 'clear', notified: false },
];
