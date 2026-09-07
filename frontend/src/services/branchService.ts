/**
 * branchService.ts
 * ----------------
 * Quản lý danh sách chi nhánh chuỗi Xe Điện Thanh Tươi.
 * Hỗ trợ lấy danh sách chi nhánh và thêm mới chi nhánh/cửa hàng linh hoạt
 * khi nhân viên luân phiên hoặc có thêm điểm bán hàng mới.
 */
import type { Branch } from '../types';
import { DEFAULT_BRANCHES } from '../constants/branches';
import { STORAGE_KEYS, type IStorageAdapter } from './storage/StorageAdapter';
import { createAdapter } from './storage/adapterFactory';

const branchAdapter: IStorageAdapter<Branch> = createAdapter<Branch>(
  STORAGE_KEYS.BRANCHES,
  'branches',
);

/** Lấy toàn bộ chi nhánh. Tự động seed nếu chưa có dữ liệu. */
export async function getBranches(): Promise<Branch[]> {
  const branches = await branchAdapter.getAll();
  if (branches.length === 0) {
    await branchAdapter.saveAll(DEFAULT_BRANCHES);
    return DEFAULT_BRANCHES;
  }
  return branches;
}

/** Thêm một chi nhánh mới. */
export async function addBranch(name: string, address?: string): Promise<Branch> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Tên chi nhánh không được để trống.');
  }

  const branches = await getBranches();
  const existing = branches.find(
    (b) => b.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (existing) {
    return existing;
  }

  const id = `CN_${Date.now()}`;
  const newBranch: Branch = {
    id,
    name: cleanName,
    address: address?.trim(),
  };

  await branchAdapter.saveAll([...branches, newBranch]);
  return newBranch;
}

/** Tìm chi nhánh theo ID */
export async function findBranchById(id: string): Promise<Branch | undefined> {
  const branches = await getBranches();
  return branches.find((b) => b.id === id);
}
