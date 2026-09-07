import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  X,
  MessageSquarePlus,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';
import type { AttendanceRecord, Branch, ShiftConfig, UserAccount } from '../types';
import { DEFAULT_BRANCHES } from '../constants/branches';
import { addBranch, getBranches } from '../services/branchService';
import {
  checkIn,
  checkOut,
  getRecordsForEmployee,
  getTodayRecordForEmployee,
  updateRecordNote,
} from '../services/attendanceStorage';
import { getCurrentDateString, suggestNearestShift } from '../utils/timeUtils';
import { StatusBadge } from './StatusBadge';

interface EmployeePortalProps {
  user: UserAccount;
  shifts: ShiftConfig[];
  onOpenChangePassword?: () => void;
}

/**
 * Giao diện tối giản dành cho nhân viên:
 * - Tập trung vào Check-in / Check-out nhanh gọn.
 * - Cho phép chọn hoặc nhập thêm chi nhánh mới ngay khi check-in.
 * - Cho phép check-in thêm ca / chi nhánh khác trong ngày nếu luân chuyển.
 */
export function EmployeePortal({ user, shifts }: EmployeePortalProps) {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    user.branchId || DEFAULT_BRANCHES[0]?.id || '',
  );
  const [isCustomBranch, setIsCustomBranch] = useState(false);
  const [customBranchName, setCustomBranchName] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [currentClock, setCurrentClock] = useState<string>('');
  const [noteText, setNoteText] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isAddingAnotherShift, setIsAddingAnotherShift] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Nạp danh sách chi nhánh
  const loadBranches = useCallback(async () => {
    const list = await getBranches();
    setBranches(list);
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Map tên chi nhánh
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  // Tên chi nhánh đang làm hôm nay
  const activeBranchName = useMemo(() => {
    const targetBranchId = todayRecord ? todayRecord.branchId : selectedBranchId;
    return branchMap.get(targetBranchId) || targetBranchId;
  }, [todayRecord, selectedBranchId, branchMap]);

  // Đồng hồ chạy thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentClock(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tải dữ liệu hôm nay & tháng
  const loadData = useCallback(async () => {
    if (!user.employeeId) return;
    const todayRec = await getTodayRecordForEmployee(user.employeeId);
    setTodayRecord(todayRec || null);
    if (todayRec?.note) {
      setNoteText(todayRec.note);
      setShowNoteInput(true);
    }

    const currentMonth = getCurrentDateString().substring(0, 7);
    const mRecords = await getRecordsForEmployee(user.employeeId, currentMonth);
    setMonthRecords(mRecords);
  }, [user.employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tự động gợi ý ca làm gần nhất
  useEffect(() => {
    if (shifts.length > 0 && !selectedShiftId) {
      const suggested = suggestNearestShift(shifts);
      setSelectedShiftId(suggested?.id || shifts[0].id);
    }
  }, [shifts, selectedShiftId]);

  // Xử lý Check-in
  const handleCheckIn = async () => {
    if (!user.employeeId) return;
    const shift = shifts.find((s) => s.id === selectedShiftId);
    if (!shift) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn ca làm việc.' });
      return;
    }

    let finalBranchId = selectedBranchId;
    if (isCustomBranch) {
      if (!customBranchName.trim()) {
        setFeedback({ type: 'error', message: 'Vui lòng nhập tên chi nhánh mới.' });
        return;
      }
      try {
        const createdBranch = await addBranch(customBranchName.trim());
        finalBranchId = createdBranch.id;
        setSelectedBranchId(createdBranch.id);
        setIsCustomBranch(false);
        setCustomBranchName('');
        await loadBranches();
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err instanceof Error ? err.message : 'Lỗi thêm chi nhánh mới.',
        });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const record = await checkIn({
        employeeId: user.employeeId,
        employeeName: user.name,
        branchId: finalBranchId || user.branchId || DEFAULT_BRANCHES[0].id,
        shift,
      });
      if (noteText.trim()) {
        await updateRecordNote(record.id, noteText.trim());
      }
      setFeedback({ type: 'success', message: 'Đã check-in vào ca thành công!' });
      setIsAddingAnotherShift(false);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi check-in.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Check-out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    const shift = shifts.find((s) => s.id === todayRecord.shiftId);
    if (!shift) {
      setFeedback({ type: 'error', message: 'Không tìm thấy ca làm việc.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await checkOut({
        recordId: todayRecord.id,
        shift,
      });
      if (noteText.trim()) {
        await updateRecordNote(todayRecord.id, noteText.trim());
      }
      setFeedback({ type: 'success', message: 'Đã check-out tan ca thành công!' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi check-out.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ca làm việc hiện tại
  const currentShift = shifts.find(
    (s) => s.id === (todayRecord ? todayRecord.shiftId : selectedShiftId),
  );

  // Xác định xem có hiển thị Form Check-in hay không:
  // Hiển thị form Check-in khi chưa có bản ghi hôm nay, HOẶC khi nhân viên bấm "+ Check-in thêm ca/chi nhánh"
  const isShowCheckInForm = !todayRecord || (!todayRecord.checkOutTime ? false : isAddingAnotherShift);

  return (
    <div className="flex min-h-[78vh] flex-col items-center justify-center px-3 py-6">
      {/* Bảng điểm danh chính: Tối giản, trực quan, trọng tâm */}
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-black/[0.03] sm:p-8">
        {/* Header nhân viên & Giờ hiện tại */}
        <div className="text-center pb-5 border-b border-[var(--color-border)]">
          <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">
            Xin chào, {user.name}
          </h2>
          <div className="mt-1 flex items-center justify-center gap-2 text-xs text-[var(--color-ink-soft)]">
            <span className="font-semibold text-[var(--color-ink)]">{user.employeeId || 'NV'}</span>
            <span>·</span>
            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-bg)] px-4 py-1.5 border border-[var(--color-border)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
            <span className="font-mono text-base font-bold text-[var(--color-ink)] tracking-wider">
              {currentClock || '--:--:--'}
            </span>
          </div>
        </div>

        {/* Thông báo kết quả thao tác */}
        {feedback && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-2xl p-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ================= PHẦN THAO TÁC ĐIỂM DANH ================= */}
        <div className="mt-6 space-y-4">
          {/* TRƯỜNG HỢP 1: FORM CHECK-IN */}
          {isShowCheckInForm && (
            <div className="space-y-4">
              {isAddingAnotherShift && (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-[var(--color-primary-dark)]">
                    + Vào ca mới / Chi nhánh khác
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingAnotherShift(false)}
                    className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink-soft)] hover:text-red-600"
                  >
                    <ArrowLeft size={13} />
                    <span>Quay lại</span>
                  </button>
                </div>
              )}

              {/* Chọn hoặc Thêm Chi Nhánh Làm Việc */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)]">
                    <Building size={14} className="text-[var(--color-primary)]" />
                    Cửa hàng / Chi nhánh làm việc
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomBranch(!isCustomBranch);
                      setCustomBranchName('');
                    }}
                    className="text-[11px] font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    {isCustomBranch ? 'Chọn từ danh sách' : '+ Thêm chi nhánh khác'}
                  </button>
                </div>

                {!isCustomBranch ? (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomBranch(true);
                      } else {
                        setSelectedBranchId(e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                    <option value="__NEW__">+ Thêm chi nhánh mới khác...</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      autoFocus
                      value={customBranchName}
                      onChange={(e) => setCustomBranchName(e.target.value)}
                      placeholder="Nhập tên chi nhánh mới (VD: Cửa hàng Chợ Vàm, Điểm lưu động...)"
                      className="w-full rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-bg)] p-3 text-sm font-medium text-[var(--color-ink)] outline-none focus:bg-white"
                    />
                    <p className="text-[10px] text-[var(--color-ink-soft)] italic">
                      Chi nhánh này sẽ tự động lưu vào danh sách khi bạn bấm Check-in.
                    </p>
                  </div>
                )}
              </div>

              {/* Chọn Ca làm việc */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--color-ink)]">
                  Ca làm việc
                </label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ghi chú tuỳ chọn (ẩn gọn, bấm mới hiện) */}
              {!showNoteInput ? (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)] cursor-pointer"
                >
                  <MessageSquarePlus size={13} />
                  <span>+ Thêm ghi chú (nếu đi trễ có phép)</span>
                </button>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                    Ghi chú / Lý do
                  </label>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="VD: Kẹt xe cầu Chợ Mới vào trễ 10p..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}

              {/* NÚT CHECK-IN LỚN DUY NHẤT */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckIn}
                className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--color-primary)] py-4 text-base font-bold text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all hover:bg-[var(--color-primary-dark)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <LogIn size={22} />
                <span>{isSubmitting ? 'Đang ghi nhận...' : 'CHECK-IN (VÀO CA)'}</span>
              </button>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: ĐANG TRONG CA -> NÚT CHECK-OUT */}
          {todayRecord && !todayRecord.checkOutTime && (
            <div className="space-y-4">
              {/* Thông tin ca hiện tại */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Đang làm việc
                </div>

                <div className="mt-3 text-sm font-bold text-[var(--color-ink)]">
                  {activeBranchName}
                </div>
                <div className="mt-1 text-xs text-emerald-800">
                  Vào ca lúc: <span className="font-bold text-sm">{todayRecord.checkInTime}</span>{' '}
                  ({todayRecord.checkInStatus === 'on_time' ? 'Đúng giờ' : `Trễ ${todayRecord.lateMinutes || 0}p`})
                </div>
                <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                  Ca: {currentShift?.name || todayRecord.shiftId}
                </div>
              </div>

              {/* Ghi chú tuỳ chọn nếu muốn bổ sung */}
              {showNoteInput && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                    Ghi chú ca hôm nay
                  </label>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Bổ sung ghi chú giải trình..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}

              {/* NÚT CHECK-OUT LỚN DUY NHẤT */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckOut}
                className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[var(--color-primary)] bg-white py-4 text-base font-bold text-[var(--color-primary-dark)] shadow-sm transition-all hover:bg-[var(--color-primary)] hover:text-white active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <LogOut size={22} />
                <span>{isSubmitting ? 'Đang xử lý...' : 'CHECK-OUT (TAN CA)'}</span>
              </button>
            </div>
          )}

          {/* TRƯỜNG HỢP 3: ĐÃ HOÀN THÀNH CA HÔM NAY (VÀ CHƯA BẤM VÀO CA MỚI) */}
          {todayRecord && todayRecord.checkOutTime && !isAddingAnotherShift && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  <CheckCircle2 size={14} />
                  Đã hoàn thành ca làm việc
                </div>

                <div className="text-sm font-bold text-[var(--color-ink)]">
                  {activeBranchName}
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-3 border border-blue-100 text-xs">
                  <div>
                    <span className="text-[var(--color-ink-soft)] block text-[11px]">Giờ vào</span>
                    <span className="font-bold text-sm text-[var(--color-ink)]">{todayRecord.checkInTime}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-ink-soft)] block text-[11px]">Giờ ra</span>
                    <span className="font-bold text-sm text-[var(--color-ink)]">{todayRecord.checkOutTime}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--color-ink-soft)]">
                  Ca: {currentShift?.name} · {todayRecord.checkOutStatus === 'overtime' ? `Tăng ca ${todayRecord.overtimeMinutes}p` : 'Đúng giờ'}
                </div>
              </div>

              {/* Nút cho phép nhân viên check-in thêm ca hoặc chi nhánh khác hôm nay */}
              <button
                type="button"
                onClick={() => setIsAddingAnotherShift(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-all cursor-pointer"
              >
                <PlusCircle size={15} className="text-[var(--color-primary)]" />
                <span>+ Check-in thêm ca / Chi nhánh khác hôm nay</span>
              </button>
            </div>
          )}
        </div>

        {/* Nút phụ: Xem lại lịch sử (Nhẹ nhàng ở dưới, không gây rối mắt) */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-primary)] cursor-pointer"
          >
            <Calendar size={14} />
            <span>Xem lịch sử chấm công tháng này ({monthRecords.length} ngày)</span>
          </button>
        </div>
      </div>

      {/* MODAL LỊCH SỬ THÁNG (Chỉ mở khi nhân viên chủ động bấm xem) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
                  Lịch sử điểm danh tháng {getCurrentDateString().substring(0, 7)}
                </h3>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  Nhân viên: {user.name} ({user.employeeId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto mt-4 divide-y divide-[var(--color-border)]">
              {monthRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-ink-soft)]">
                  Chưa có bản ghi điểm danh nào trong tháng này.
                </div>
              ) : (
                monthRecords.map((r) => {
                  const shift = shifts.find((s) => s.id === r.shiftId);
                  const store = branchMap.get(r.branchId) || r.branchId;
                  return (
                    <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[var(--color-ink)]">
                          {new Date(r.date).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                          {' · '}
                          <span className="text-[var(--color-primary-dark)]">{store}</span>
                        </div>
                        <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                          Ca: {shift?.name || r.shiftId}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-[var(--color-ink)]">
                          {r.checkInTime || '--:--'} → {r.checkOutTime || 'Chưa ra'}
                        </div>
                        <div className="mt-0.5">
                          <StatusBadge tone={r.checkInStatus === 'on_time' ? 'primary' : 'amber'}>
                            {r.checkInStatus === 'on_time' ? 'Đúng giờ' : `Trễ ${r.lateMinutes || 0}p`}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] text-right">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
