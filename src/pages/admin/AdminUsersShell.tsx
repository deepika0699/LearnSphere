/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  adminApi,
  AdminUser,
  AdminUsersPagination,
  GetUsersParams,
} from '../../services/api';
import { FeedbackState } from '../../components/FeedbackState';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const AdminUsersShell: React.FC = () => {
  const { accessToken, state, isLoading: authLoading } = useApp();
  const searchInputId = useId();
  const roleFilterId = useId();
  const statusFilterId = useId();

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminUsersPagination>({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Query filter state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'student' | 'courseCreator' | 'admin' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mutation modal state
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'student' | 'courseCreator' | 'admin'>('student');
  const [isSubmittingRole, setIsSubmittingRole] = useState<boolean>(false);

  const [statusModalUser, setStatusModalUser] = useState<AdminUser | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1); // Reset to page 1 on search change
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch users from backend API
  const fetchUsers = useCallback(
    async (isSilent = false) => {
      if (!accessToken) return;

      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams: GetUsersParams = {
          page,
          limit,
          search: searchQuery || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        };

        const res = await adminApi.getUsers(accessToken, queryParams);
        setUsers(res.users);
        setPagination(res.pagination);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve user records. Please try again.');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [accessToken, page, limit, searchQuery, roleFilter, statusFilter]
  );

  // Load on mount and when query parameters change
  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchUsers(false);
    }
  }, [authLoading, accessToken, fetchUsers]);

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Role Change
  const handleOpenRoleModal = (user: AdminUser) => {
    setRoleModalUser(user);
    setSelectedRole((user.role === ('course_creator' as any) ? 'courseCreator' : user.role) as 'student' | 'courseCreator' | 'admin');
  };

  const handleConfirmRoleChange = async () => {
    if (!accessToken || !roleModalUser) return;

    // Frontend self-demotion verification
    if (state.user?.id === roleModalUser.id && selectedRole !== 'admin') {
      setFeedback({
        type: 'error',
        message: 'Administrators cannot demote their own account.',
      });
      setRoleModalUser(null);
      return;
    }

    setIsSubmittingRole(true);
    try {
      const updatedUser = await adminApi.updateUserRole(
        accessToken,
        roleModalUser.id,
        selectedRole
      );

      // Update visible user record locally without full reload
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u))
      );

      setFeedback({
        type: 'success',
        message: `Role for ${roleModalUser.name} updated to ${formatRoleName(selectedRole)}.`,
      });
      setRoleModalUser(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update user role.',
      });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Handle Status Change
  const handleOpenStatusModal = (user: AdminUser) => {
    setStatusModalUser(user);
  };

  const handleConfirmStatusChange = async () => {
    if (!accessToken || !statusModalUser) return;

    const targetNewStatus = statusModalUser.status === 'active' ? 'inactive' : 'active';

    // Frontend self-deactivation verification
    if (state.user?.id === statusModalUser.id && targetNewStatus === 'inactive') {
      setFeedback({
        type: 'error',
        message: 'Administrators cannot deactivate their own account.',
      });
      setStatusModalUser(null);
      return;
    }

    setIsSubmittingStatus(true);
    try {
      const updatedUser = await adminApi.updateUserStatus(
        accessToken,
        statusModalUser.id,
        targetNewStatus
      );

      // Update visible user record locally
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, status: updatedUser.status } : u))
      );

      setFeedback({
        type: 'success',
        message: `Account status for ${statusModalUser.name} set to ${targetNewStatus}.`,
      });
      setStatusModalUser(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update user status.',
      });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Format Helpers
  const formatRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'courseCreator':
      case 'course_creator':
        return 'Course Creator';
      case 'student':
        return 'Student';
      default:
        return role;
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </span>
        );
      case 'courseCreator':
      case 'course_creator':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BookOpen className="w-3.5 h-3.5" />
            Course Creator
          </span>
        );
      case 'student':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <GraduationCap className="w-3.5 h-3.5" />
            Student
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    const isActive = status === 'active';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
        />
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div id="admin-users-container" className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            id="admin-users-heading"
            className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight"
          >
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative directory, role governance, and account status controls.
          </p>
        </div>

        <button
          id="btn-refresh-users"
          type="button"
          onClick={() => fetchUsers(true)}
          disabled={loading || isRefreshing}
          className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs self-start sm:self-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Refresh user list"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : 'text-slate-500'}`}
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Feedback Banner (Success / Error Notification) */}
      {feedback && (
        <div
          id="admin-users-feedback"
          className={`flex items-start justify-between p-3.5 rounded-lg border text-xs sm:text-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          role="alert"
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 focus-visible:outline-hidden"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        id="admin-users-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4"
      >
        {/* Search Input */}
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">
            Search users by name or email
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={searchInputId}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="w-full sm:w-48">
          <label htmlFor={roleFilterId} className="sr-only">
            Filter by role
          </label>
          <div className="relative">
            <select
              id={roleFilterId}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-2 pl-3 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none transition-colors"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="courseCreator">Course Creators</option>
              <option value="admin">Administrators</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-40">
          <label htmlFor={statusFilterId} className="sr-only">
            Filter by status
          </label>
          <div className="relative">
            <select
              id={statusFilterId}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-2 pl-3 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Clear Filters button when active */}
        {(searchInput || roleFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setRoleFilter('');
              setStatusFilter('');
              setPage(1);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap px-2 py-1 underline font-medium self-end sm:self-center"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Content Area */}

      {/* 1. Loading Skeleton */}
      {loading && (
        <div
          id="admin-users-skeleton"
          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs animate-pulse p-6 space-y-4"
        >
          <div className="h-5 bg-slate-100 rounded w-48" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100/70 rounded-lg w-full" />
            ))}
          </div>
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && (
        <div id="admin-users-error" className="py-8">
          <FeedbackState
            title="Failed to Load User Directory"
            message={error}
            onRetry={() => fetchUsers(false)}
            retryLabel="Retry User Query"
          />
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && users.length === 0 && (
        <div
          id="admin-users-empty"
          className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3"
        >
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchQuery || roleFilter || statusFilter
              ? 'No users match your filter criteria'
              : 'No users registered yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery || roleFilter || statusFilter
              ? 'Try modifying your search query or reset the role and status filters.'
              : 'The database currently contains zero user accounts.'}
          </p>
          {(searchQuery || roleFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setRoleFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              className="mt-2 inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* 4. Real User Data Table (Desktop & Mobile Responsive) */}
      {!loading && !error && users.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Table wrapper with smooth horizontal scroll for mobile */}
            <div className="overflow-x-auto">
              <table
                id="admin-users-table"
                className="w-full text-left border-collapse text-xs sm:text-sm"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">User</th>
                    <th className="py-3 px-4 sm:px-6">Role</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6">Registered</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {users.map((u) => {
                    const isCurrentAdmin = state.user?.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        id={`user-row-${u.id}`}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Name & Email */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-semibold text-xs shrink-0 uppercase">
                              {u.name ? u.name.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 truncate">
                                  {u.name}
                                </span>
                                {isCurrentAdmin && (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 block truncate">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          {renderRoleBadge(u.role)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          {renderStatusBadge(u.status)}
                        </td>

                        {/* Registered Date */}
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-500 text-xs">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end space-x-2">
                            {/* Role Action Button */}
                            <button
                              id={`btn-role-${u.id}`}
                              type="button"
                              onClick={() => handleOpenRoleModal(u)}
                              disabled={isCurrentAdmin}
                              title={
                                isCurrentAdmin
                                  ? 'Current administrator (cannot self-demote)'
                                  : 'Modify user role'
                              }
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                            >
                              Change Role
                            </button>

                            {/* Status Action Button */}
                            <button
                              id={`btn-status-${u.id}`}
                              type="button"
                              onClick={() => handleOpenStatusModal(u)}
                              disabled={isCurrentAdmin}
                              title={
                                isCurrentAdmin
                                  ? 'Current administrator (cannot self-deactivate)'
                                  : u.status === 'active'
                                  ? 'Deactivate account'
                                  : 'Activate account'
                              }
                              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
                                u.status === 'active'
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              id="admin-users-pagination"
              className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
            >
              <div>
                <span>
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {pagination.totalUsers === 0
                      ? 0
                      : (pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-700">
                    {Math.min(pagination.page * pagination.limit, pagination.totalUsers)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700">
                    {pagination.totalUsers}
                  </span>{' '}
                  registered accounts
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-pagination-prev"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage || loading}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </button>

                <span className="px-2 font-medium text-slate-700">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>

                <button
                  id="btn-pagination-next"
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="role-modal-title" className="text-base font-bold text-slate-900">
                    Change User Role
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update platform permissions for {roleModalUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 space-y-1">
                <div>
                  <span className="font-medium text-slate-700">Account:</span>{' '}
                  {roleModalUser.name} ({roleModalUser.email})
                </div>
                <div>
                  <span className="font-medium text-slate-700">Current Role:</span>{' '}
                  {formatRoleName(roleModalUser.role)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-slate-700 text-xs">
                  Select New Role:
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === 'student'
                        ? 'border-primary-500 bg-primary-50/40 text-primary-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={selectedRole === 'student'}
                      onChange={() => setSelectedRole('student')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="font-semibold text-xs sm:text-sm block">Student</span>
                      <span className="text-xs text-slate-500 block">
                        Standard learner account with access to learning courses.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === 'courseCreator'
                        ? 'border-primary-500 bg-primary-50/40 text-primary-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="courseCreator"
                      checked={selectedRole === 'courseCreator'}
                      onChange={() => setSelectedRole('courseCreator')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="font-semibold text-xs sm:text-sm block">Course Creator</span>
                      <span className="text-xs text-slate-500 block">
                        Course creator account capable of authoring and managing courses.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === 'admin'
                        ? 'border-primary-500 bg-primary-50/40 text-primary-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedRole === 'admin'}
                      onChange={() => setSelectedRole('admin')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="font-semibold text-xs sm:text-sm block">Administrator</span>
                      <span className="text-xs text-slate-500 block">
                        Full administrative access to governance, users, and platform data.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span>Active refresh sessions will be revoked upon role modification.</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                disabled={isSubmittingRole}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isSubmittingRole || selectedRole === roleModalUser.role}
                className="px-4 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingRole ? 'Updating Role...' : 'Confirm Role Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-modal-title"
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    statusModalUser.status === 'active'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {statusModalUser.status === 'active' ? (
                    <UserX className="w-5 h-5" />
                  ) : (
                    <UserCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 id="status-modal-title" className="text-base font-bold text-slate-900">
                    {statusModalUser.status === 'active'
                      ? 'Deactivate User Account'
                      : 'Activate User Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {statusModalUser.name} ({statusModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              {statusModalUser.status === 'active' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1.5">
                  <div className="flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Security Notice</span>
                      <span>
                        Deactivating this user will immediately revoke all active refresh sessions.
                        The user will be prevented from signing in or requesting new access tokens.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  <span>
                    Activating this user will allow them to log in to LearnSphere and resume
                    course progress or authoring.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={isSubmittingStatus}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isSubmittingStatus}
                className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  statusModalUser.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmittingStatus
                  ? 'Updating Status...'
                  : statusModalUser.status === 'active'
                  ? 'Confirm Deactivation'
                  : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
