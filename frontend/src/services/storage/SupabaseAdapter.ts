/**
 * ============================================================
 *  SUPABASE ADAPTER (ĐÃ SỬA TS1294 & UPSERT CONFLICT)
 * ============================================================
 */
import { supabase } from '../supabaseClient';
import type { IStorageAdapter } from './StorageAdapter';

/** "checkInTime" -> "check_in_time" */
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** "check_in_time" -> "checkInTime" */
function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

function rowToItem<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null) result[toCamelCase(key)] = value;
  }
  return result as T;
}

function itemToRow<T extends object>(item: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

export class SupabaseAdapter<T extends { id: string }> implements IStorageAdapter<T> {
  // Khai báo tường minh để tương thích erasableSyntaxOnly
  private readonly table: string;

  constructor(table: string) {
    this.table = table;
  }

  async getAll(): Promise<T[]> {
    try {
      const { data, error } = await supabase.from(this.table).select('*');
      if (error) {
        console.error(`[SupabaseAdapter] Lỗi đọc bảng "${this.table}":`, error);
        return [];
      }
      return (data ?? []).map((row) => rowToItem<T>(row));
    } catch (err) {
      console.error(`[SupabaseAdapter] Ngoại lệ đọc bảng "${this.table}":`, err);
      return [];
    }
  }

  async saveAll(items: T[]): Promise<void> {
    const rows = items.map((item) => itemToRow(item));

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from(this.table)
        .upsert(rows, { onConflict: 'id' });

      if (upsertError) {
        console.warn(`[SupabaseAdapter] Cảnh báo ghi bảng "${this.table}":`, upsertError);
      }
    }
  }
}