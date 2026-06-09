import * as XLSX from 'xlsx';
import type { DailyReport, FireAlarm, WorkOrder, Building } from '@/types';

export function generateDailyReport(
  buildings: Building[],
  alarms: FireAlarm[],
  orders: WorkOrder[],
  dateStr?: string,
): DailyReport {
  const todayAlarms = alarms;
  const fireAlarmByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  alarms.forEach(a => { fireAlarmByLevel[a.level]++; });

  let totalFacilities = 0, smokeFault = 0, sprinklerFault = 0, hydrantFault = 0;
  buildings.forEach(b => {
    b.facilities.forEach(f => {
      totalFacilities++;
      if (f.smokeDetector.status === 'fault') smokeFault++;
      if (f.sprinkler.status === 'fault') sprinklerFault++;
      if (f.hydrantPressure < 0.4) hydrantFault++;
    });
  });

  const truckDispatches = alarms.slice(0, 5).map(a => ({
    truckName: `消-0${a.level} 水罐车`,
    alarmLevel: a.level,
    responseTime: 180 + Math.floor(Math.random() * 120),
  }));

  const avgResponseTime = truckDispatches.length
    ? Math.round(truckDispatches.reduce((s, t) => s + t.responseTime, 0) / truckDispatches.length)
    : 0;

  return {
    date: dateStr || new Date().toLocaleDateString('zh-CN'),
    fireAlarmCount: todayAlarms.length,
    fireAlarmByLevel,
    avgResponseTime,
    facilityFaultRate: {
      smokeDetector: totalFacilities ? +(smokeFault / totalFacilities * 100).toFixed(2) : 0,
      sprinkler: totalFacilities ? +(sprinklerFault / totalFacilities * 100).toFixed(2) : 0,
      hydrant: totalFacilities ? +(hydrantFault / totalFacilities * 100).toFixed(2) : 0,
    },
    truckDispatches,
    pendingOrders: orders.filter(o => o.status !== 'completed').length,
  };
}

export function exportDailyReportExcel(report: DailyReport, alarms: FireAlarm[], orders: WorkOrder[]) {
  const wb = XLSX.utils.book_new();

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
    ['三、未完成工单数量', report.pendingOrders],
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
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(dispatchData);
  ws2['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, '消防车出警记录');

  const alarmDetail = [
    ['ID', '建筑名称', '火源楼层', '等级', '状态', '触发时间'],
    ...alarms.map(a => [
      a.id, a.buildingName, a.sourceFloor + 'F',
      `Lv.${a.level}`,
      a.status === 'active' ? '处置中' : a.status === 'contained' ? '已控制' : '已解决',
      new Date(a.triggerTime).toLocaleString('zh-CN'),
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(alarmDetail);
  ws3['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws3, '火警明细');

  const orderData = [
    ['工单ID', '类型', '标题', '楼层', '状态', '创建时间', '指派'],
    ...orders.map(o => [
      o.id,
      o.type === 'facility_repair' ? '设施维修'
        : o.type === 'pressure_boost' ? '水压加压'
        : o.type === 'tow_vehicle' ? '拖车通知' : '通道清理',
      o.title, o.floor ? o.floor + 'F' : '-',
      o.status === 'pending' ? '待处理' : o.status === 'processing' ? '处理中' : '已完成',
      o.createdAt, o.assignedTo || '-',
    ]),
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(orderData);
  ws4['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, '工单明细');

  const fileName = `消防日报_${report.date.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
