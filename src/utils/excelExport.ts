import * as XLSX from 'xlsx';
import type { DailyReport, FireAlarm, WorkOrder, Building } from '@/types';

function isSameDay(dateStr: string, isoOrLocaleStr: string): boolean {
  try {
    const target = new Date(dateStr);
    const targetY = target.getFullYear();
    const targetM = target.getMonth();
    const targetD = target.getDate();

    let src: Date;
    if (isoOrLocaleStr.includes('T')) {
      src = new Date(isoOrLocaleStr);
    } else {
      const parts = isoOrLocaleStr.replace(/\//g, '-').split(/[- :]/);
      if (parts.length >= 3) {
        src = new Date(+parts[0], +parts[1] - 1, +parts[2], +parts[3] || 0, +parts[4] || 0, +parts[5] || 0);
      } else {
        src = new Date(isoOrLocaleStr);
      }
    }
    return src.getFullYear() === targetY && src.getMonth() === targetM && src.getDate() === targetD;
  } catch {
    return false;
  }
}

export function generateDailyReport(
  buildings: Building[],
  alarms: FireAlarm[],
  orders: WorkOrder[],
  dateStr?: string,
): DailyReport {
  const filterDate = dateStr || new Date().toISOString().split('T')[0];

  const todayAlarms = alarms.filter(a => isSameDay(filterDate, a.triggerTime));
  const fireAlarmByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  todayAlarms.forEach(a => { fireAlarmByLevel[a.level]++; });

  const todayOrders = orders.filter(o => isSameDay(filterDate, o.createdAt));

  let totalFacilities = 0, smokeFault = 0, sprinklerFault = 0, hydrantFault = 0;
  buildings.forEach(b => {
    b.facilities.forEach(f => {
      totalFacilities++;
      if (f.smokeDetector.status === 'fault') smokeFault++;
      if (f.sprinkler.status === 'fault') sprinklerFault++;
      if (f.hydrantPressure < 0.4) hydrantFault++;
    });
  });

  const truckDispatches = todayAlarms.map(a => ({
    truckName: `消-0${a.level} 水罐车`,
    alarmLevel: a.level,
    responseTime: 180 + Math.floor((parseInt(a.id.replace(/\D/g, '')) || Math.random() * 1000) % 120),
  }));

  const avgResponseTime = truckDispatches.length
    ? Math.round(truckDispatches.reduce((s, t) => s + t.responseTime, 0) / truckDispatches.length)
    : 0;

  return {
    date: new Date(filterDate).toLocaleDateString('zh-CN'),
    filterDate,
    fireAlarmCount: todayAlarms.length,
    fireAlarmByLevel,
    avgResponseTime,
    facilityFaultRate: {
      smokeDetector: totalFacilities ? +(smokeFault / totalFacilities * 100).toFixed(2) : 0,
      sprinkler: totalFacilities ? +(sprinklerFault / totalFacilities * 100).toFixed(2) : 0,
      hydrant: totalFacilities ? +(hydrantFault / totalFacilities * 100).toFixed(2) : 0,
    },
    truckDispatches,
    pendingOrders: todayOrders.filter(o => o.status !== 'completed').length,
    todayAlarms,
    todayOrders,
  } as DailyReport & { filterDate: string; todayAlarms: FireAlarm[]; todayOrders: WorkOrder[] };
}

export function exportDailyReportExcel(report: DailyReport) {
  const wb = XLSX.utils.book_new();
  const filteredAlarms = report.todayAlarms || [];
  const filteredOrders = report.todayOrders || [];

  const overviewData = [
    ['智慧城市消防应急平台 - 消防日报'],
    ['日期', report.date],
    [],
    ['一、火警统计'],
    ['火警总数（次）', report.fireAlarmCount],
    ['一级火警（次）', report.fireAlarmByLevel[1] || 0],
    ['二级火警（次）', report.fireAlarmByLevel[2] || 0],
    ['三级火警（次）', report.fireAlarmByLevel[3] || 0],
    ['平均响应时间（秒）', report.avgResponseTime],
    [],
    ['二、设施故障率'],
    ['设施类型', '故障率（%）'],
    ['烟感探测器', report.facilityFaultRate.smokeDetector + '%'],
    ['喷淋系统', report.facilityFaultRate.sprinkler + '%'],
    ['消防栓（水压<0.4MPa）', report.facilityFaultRate.hydrant + '%'],
    [],
    ['三、本日未完成工单数量', report.pendingOrders],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  ws1['!cols'] = [{ wch: 35 }, { wch: 20 }];
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, ws1, '日报概览');

  const dispatchData = [
    ['序号', '车辆', '火警等级', '响应时间（秒）'],
    ...report.truckDispatches.map((t, i) => [
      i + 1, t.truckName, `Lv.${t.alarmLevel}`, t.responseTime,
    ]),
    report.truckDispatches.length === 0 ? ['-', '本日无出警记录', '-', '-'] : [],
  ].filter(r => r.length > 1 || r[0] !== '-');
  const ws2 = XLSX.utils.aoa_to_sheet(dispatchData);
  ws2['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, '消防车出警记录');

  const alarmDetail = [
    ['ID', '建筑名称', '火源楼层', '等级', '状态', '触发时间'],
    ...filteredAlarms.map(a => [
      a.id, a.buildingName, a.sourceFloor + 'F',
      `Lv.${a.level}`,
      a.status === 'active' ? '处置中' : a.status === 'contained' ? '已控制' : '已解决',
      new Date(a.triggerTime).toLocaleString('zh-CN'),
    ]),
    filteredAlarms.length === 0 ? ['-', '本日无火警记录', '-', '-', '-', '-'] : [],
  ].filter(r => r.length > 1 || r[0] !== '-');
  const ws3 = XLSX.utils.aoa_to_sheet(alarmDetail);
  ws3['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws3, '火警明细');

  const orderData = [
    ['工单ID', '类型', '标题', '楼层', '状态', '创建时间', '指派'],
    ...filteredOrders.map(o => [
      o.id,
      o.type === 'facility_repair' ? '设施维修'
        : o.type === 'pressure_boost' ? '水压加压'
        : o.type === 'tow_vehicle' ? '拖车通知' : '通道清理',
      o.title, o.floor ? o.floor + 'F' : '-',
      o.status === 'pending' ? '待处理' : o.status === 'processing' ? '处理中' : '已完成',
      o.createdAt, o.assignedTo || '-',
    ]),
    filteredOrders.length === 0 ? ['-', '本日无工单记录', '-', '-', '-', '-', '-'] : [],
  ].filter(r => r.length > 1 || r[0] !== '-');
  const ws4 = XLSX.utils.aoa_to_sheet(orderData);
  ws4['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, '工单明细');

  const fileName = `消防日报_${report.date.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
