import type { SingleValueData, Time } from 'lightweight-charts';

export function toChartData(
  data: Array<{ date: string; value: number }>
): SingleValueData<Time>[] {
  return data
    .map((d) => ({
      time: d.date as Time,
      value: d.value,
    }))
    .sort((a, b) => (a.time as string).localeCompare(b.time as string));
}

export function getChartColors(isDark: boolean) {
  return {
    backgroundColor: isDark ? '#131c31' : '#ffffff',
    textColor: isDark ? '#94a3b8' : '#64748b',
    lineColor: '#c89b3c',
    areaTopColor: 'rgba(200, 155, 60, 0.3)',
    areaBottomColor: 'rgba(200, 155, 60, 0.02)',
    gridColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)',
  };
}
