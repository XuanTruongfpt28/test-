/**
 * useShifts.ts
 * ------------
 * Custom hook quản lý state danh sách ca làm việc + expose các hành
 * động thêm/sửa/xoá. Component chỉ cần gọi hook này, không cần biết
 * dữ liệu đang nằm ở LocalStorage hay nguồn nào khác.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ShiftConfig } from '../types';
import { createShift, deleteShift, getShifts, updateShift } from '../services/shiftService';

export function useShifts() {
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const data = await getShifts();
    setShifts(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addShift = useCallback(
    async (input: Omit<ShiftConfig, 'id'>) => {
      await createShift(input);
      await reload();
    },
    [reload],
  );

  const editShift = useCallback(
    async (shiftId: string, changes: Partial<Omit<ShiftConfig, 'id'>>) => {
      await updateShift(shiftId, changes);
      await reload();
    },
    [reload],
  );

  const removeShift = useCallback(
    async (shiftId: string) => {
      await deleteShift(shiftId);
      await reload();
    },
    [reload],
  );

  return { shifts, isLoading, addShift, editShift, removeShift, reload };
}
