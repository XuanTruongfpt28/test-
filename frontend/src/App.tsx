import { useEffect, useState } from 'react';
import { Header, type AppTab } from './components/Header';
import { BranchDateFilter } from './components/BranchDateFilter';
import { StatsCard } from './components/StatsCard';
import { CheckInForm } from './components/CheckInForm';
import { AttendanceTable } from './components/AttendanceTable';
import { ShiftConfigModal } from './components/ShiftConfigModal';
import { ExportPanel } from './components/ExportPanel';
import { LoginScreen } from './components/LoginScreen';
import { AccountManagement } from './components/AccountManagement';
import { EmployeePortal } from './components/EmployeePortal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { useShifts } from './hooks/useShifts';
import { useAttendance } from './hooks/useAttendance';
import { useAuth } from './hooks/useAuth';
import { Zap } from 'lucide-react';

/**
 * App.tsx
 * -------
 * Điểm khởi đầu của giao diện Xe Điện Thanh Tươi.
 * Quản lý xác thực, phân quyền (Admin vs Nhân viên cá nhân), và điều
 * phối các phân hệ: Bảng chấm công, Quản lý tài khoản con, Cổng điểm danh
 * cá nhân, và Kiosk quầy chung.
 */
export default function App() {
  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    accounts,
    isLoading: isAuthLoading,
    login,
    logout,
    quickSwitch,
    createAccount,
    updateAccount,
    toggleAccountLock,
    resetAccountPassword,
    changePersonalPassword,
    deleteAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AppTab>('admin-attendance');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  const { shifts, addShift, editShift, removeShift } = useShifts();
  const {
    branchFilter,
    setBranchFilter,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    employees,
    employeesInScope,
    records,
    stats,
    doCheckIn,
    doCheckOut,
    setNote,
  } = useAttendance(shifts);

  // Tự động chuyển tab phù hợp khi đăng nhập với vai trò khác nhau
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveTab('admin-attendance');
      } else {
        setActiveTab('employee-checkin');
      }
    }
  }, [currentUser]);

  // Đang tải phiên đăng nhập
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-md animate-bounce">
            <Zap size={24} />
          </div>
          <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
            Đang khởi tạo hệ thống Xe Điện Thanh Tươi...
          </span>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập -> Hiển thị Màn hình Đăng nhập
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginScreen
        accounts={accounts}
        onLogin={async (uname, pass) => {
          await login(uname, pass);
        }}
        onQuickSwitch={async (uname) => {
          await quickSwitch(uname);
        }}
      />
    );
  }

  return (
    <div className="min-h-full">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        accounts={accounts}
        onLogout={logout}
        onOpenChangePassword={() => setIsChangePassOpen(true)}
        onQuickSwitch={quickSwitch}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Phân hệ 1: Cổng điểm danh cá nhân (Dành cho tài khoản nhân viên con) */}
        {activeTab === 'employee-checkin' && (
          <EmployeePortal
            user={currentUser}
            shifts={shifts}
            onOpenChangePassword={() => setIsChangePassOpen(true)}
          />
        )}

        {/* Phân hệ 2: Quản trị tài khoản con (Dành cho Admin) */}
        {activeTab === 'admin-accounts' && isAdmin && (
          <AccountManagement
            accounts={accounts}
            onCreateAccount={createAccount}
            onUpdateAccount={updateAccount}
            onToggleLock={toggleAccountLock}
            onResetPassword={resetAccountPassword}
            onDeleteAccount={deleteAccount}
          />
        )}

        {/* Phân hệ 3: Bảng tổng quan chấm công & Báo cáo (Dành cho Admin) */}
        {activeTab === 'admin-attendance' && isAdmin && (
          <section className="flex flex-col gap-5">
            <BranchDateFilter
              branchFilter={branchFilter}
              onBranchChange={setBranchFilter}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />

            <StatsCard stats={stats} />

            <ExportPanel
              records={records}
              employeesInScope={employeesInScope}
              selectedDate={selectedDate}
              onOpenShiftConfig={() => setIsShiftModalOpen(true)}
            />

            <AttendanceTable
              records={records}
              shifts={shifts}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onNoteChange={setNote}
            />
          </section>
        )}

        {/* Phân hệ 4: Kiosk điểm danh quầy chung (Dành cho quầy tablet) */}
        {activeTab === 'kiosk' && (
          <section className="py-4">
            <CheckInForm
              employees={employees}
              shifts={shifts}
              onCheckIn={doCheckIn}
              onCheckOut={doCheckOut}
            />
          </section>
        )}
      </main>

      {/* Modal Cấu hình ca làm việc (Admin) */}
      <ShiftConfigModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shifts={shifts}
        onAdd={addShift}
        onEdit={editShift}
        onRemove={removeShift}
      />

      {/* Modal Đổi mật khẩu cá nhân */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        userName={currentUser.username}
        onSubmit={async (oldPass, newPass) => {
          await changePersonalPassword(oldPass, newPass);
        }}
      />
    </div>
  );
}
