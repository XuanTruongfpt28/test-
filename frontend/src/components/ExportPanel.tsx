import { useState } from 'react';
import { Download, Settings2 } from 'lucide-react';
import type { AttendanceRecord, Employee } from '../types';
import { buildMonthlyReport, exportDailyAttendanceToCsv, exportMonthlyReportToCsv } from '../services/reportService';

interface ExportPanelProps {
  records: AttendanceRecord[];
  employeesInScope: Employee[];
  selectedDate: string;
  onOpenShiftConfig: () => void;
}

/** Cụm nút: mở cấu hình ca + xuất báo cáo CSV (theo ngày hoặc theo tháng). */
export function ExportPanel({ records, employeesInScope, selectedDate, onOpenShiftConfig }: ExportPanelProps) {
  const [isExportingMonthly, setIsExportingMonthly] = useState(false);

  const handleExportMonthly = async () => {
    setIsExportingMonthly(true);
    try {
      const [year, month] = selectedDate.split('-').map(Number);
      const report = await buildMonthlyReport(employeesInScope, year, month);
      exportMonthlyReportToCsv(report, year, month);
    } finally {
      setIsExportingMonthly(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onOpenShiftConfig}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)]"
      >
        <Settings2 size={16} />
        Cấu hình ca làm việc
      </button>
      <button
        type="button"
        onClick={() => exportDailyAttendanceToCsv(records, selectedDate)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)]"
      >
        <Download size={16} />
        Xuất chấm công ngày (CSV)
      </button>
      <button
        type="button"
        disabled={isExportingMonthly}
        onClick={handleExportMonthly}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        <Download size={16} />
        Xuất báo cáo tháng (CSV)
      </button>
    </div>
  );
}
