export type UserRole = 'property' | 'inspector' | 'command';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface LoginRecord {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  loginTime: string;
  success: boolean;
}

export type FacilityStatus = 'normal' | 'alarm' | 'fault' | 'active';

export interface FloorFacility {
  floor: number;
  smokeDetector: { status: FacilityStatus };
  sprinkler: { status: FacilityStatus };
  hydrantPressure: number;
}

export interface FireDoor {
  id: string;
  floor: number;
  status: 'closed' | 'open' | 'fault';
}

export interface Building {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'landmark';
  floors: number;
  height: number;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  facilities: FloorFacility[];
  fireDoors: FireDoor[];
  fireZones: number[];
}

export type TimelineEventType =
  | 'alarm_trigger'
  | 'linkage_start'
  | 'linkage_shutter'
  | 'linkage_exhaust'
  | 'linkage_broadcast'
  | 'linkage_sprinkler'
  | 'truck_dispatched'
  | 'truck_arrived'
  | 'fire_spread'
  | 'fire_contained'
  | 'fire_resolved';

export interface FireTimelineEvent {
  id: string;
  alarmId: string;
  type: TimelineEventType;
  timestamp: number;
  title: string;
  description?: string;
  snapshot?: {
    truckPositions?: Record<string, [number, number, number]>;
    truckEtas?: Record<string, number>;
    truckStatuses?: Record<string, FireTruck['status']>;
    truckProgress?: Record<string, number>;
    spreadFloors?: number[];
    linkedDevices?: Partial<LinkedDeviceStatus>;
  };
}

export interface FireAlarm {
  id: string;
  buildingId: string;
  buildingName: string;
  sourceFloor: number;
  level: 1 | 2 | 3;
  triggerTime: string;
  triggerTimestamp: number;
  status: 'active' | 'contained' | 'resolved';
  spreadFloors: number[];
  containedAt?: number;
  resolvedAt?: number;
}

export type WorkOrderType = 'facility_repair' | 'pressure_boost' | 'tow_vehicle' | 'evacuation_clear';

export interface WorkOrder {
  id: string;
  type: WorkOrderType;
  title: string;
  description: string;
  buildingId: string;
  floor?: number;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  assignedTo?: string;
}

export interface FireStation {
  id: string;
  name: string;
  position: [number, number, number];
  trucks: FireTruck[];
}

export interface FireTruck {
  id: string;
  name: string;
  type: 'water' | 'ladder' | 'rescue' | 'command';
  stationId: string;
  status: 'idle' | 'dispatched' | 'arrived' | 'returning';
  currentPosition: [number, number, number];
  eta?: number;
  targetBuildingId?: string;
  pathSegmentIndex?: number;
  progressPercent?: number;
}

export interface EvacuationPath {
  buildingId: string;
  floor: number;
  waypoints: [number, number, number][];
}

export interface PatrolRobot {
  id: string;
  name: string;
  status: 'idle' | 'patrolling' | 'alert';
  currentPosition: [number, number, number];
  route: [number, number, number][];
  currentRouteIndex: number;
  battery: number;
  photos: RobotPhoto[];
}

export interface RobotPhoto {
  id: string;
  timestamp: string;
  type: 'door_open' | 'blocked' | 'other';
  description: string;
  imageUrl: string;
  location: string;
}

export interface ApprovalStep {
  role: 'property' | 'fire_dept' | 'fire_bureau';
  approver?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  applicant: string;
  buildingId: string;
  description: string;
  submittedAt: string;
  steps: ApprovalStep[];
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FireHydrant {
  id: string;
  position: [number, number, number];
  pressure: number;
  type: 'ground' | 'underground';
}

export interface FireZone {
  id: string;
  name: string;
  buildings: string[];
  boundaries: [number, number, number][];
}

export interface ChannelOccupation {
  id: string;
  roadId: string;
  location: string;
  status: 'clear' | 'occupied';
  notified: boolean;
}

export interface LinkedDeviceStatus {
  fireShutter: boolean;
  smokeExtractor: boolean;
  broadcast: boolean;
  sprinkler: boolean;
  elevatorDrop: boolean;
}

export interface ReplayBackupState {
  fireAlarms: FireAlarm[];
  fireStation: FireStation;
  linkedDevices: LinkedDeviceStatus;
  activeTruck: FireTruck | null;
  dispatchPath: [number, number, number][] | null;
}

export interface DailyReport {
  date: string;
  filterDate?: string;
  fireAlarmCount: number;
  fireAlarmByLevel: Record<number, number>;
  avgResponseTime: number;
  facilityFaultRate: {
    smokeDetector: number;
    sprinkler: number;
    hydrant: number;
  };
  truckDispatches: Array<{
    truckName: string; alarmLevel: number; responseTime: number; }>;
  pendingOrders: number;
  todayAlarms?: FireAlarm[];
  todayOrders?: WorkOrder[];
}
