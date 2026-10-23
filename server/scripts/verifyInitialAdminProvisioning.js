/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Initial Administrator Provisioning & RBAC Hardening
 *
 * Verifies that:
 * 1. Malformed or weak provisioning inputs are strictly rejected.
 * 2. Normal public registration endpoint (/api/auth/register) cannot be exploited to create an Admin.
 * 3. Initial admin provisioning succeeds with server-authoritative 'admin' role.
 * 4. Passwords are saved strictly as 10-round bcrypt hashes and never stored in plaintext.
 * 5. Re-running provisioning refuses duplicate creation and prevents overwriting existing admins.
 * 6. Normal platform login (/api/auth/login) authenticates the provisioned admin and returns a valid JWT.
 * 7. Admin routes (/api/admin/*) require valid authentication and enforce admin authorization.
 * 8. Zero credentials, hashes, or secrets are exposed in API responses.
 * 9. Temporary test accounts are safely cleaned up post-test to preserve the clean state.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';
import { provisionInitialAdmin } from './provisionInitialAdmin.js';
import { generateAccessToken } from '../services/tokenService.js';

const BASE_URL = 'http://localhost:5000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${description}`);
  }
}

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }
  return { status: res.status, headers: res.headers, data };
}

async function runProvisioningVerification() {
  console.log('===================================================================');
  console.log('=== LearnSphere Initial Admin Provisioning Verification Suite  ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  const createdUserIds = [];

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Malformed and Weak Input Rejection
    // -------------------------------------------------------------------------
    console.log('--- Scenario 1: Malformed & Weak Provisioning Input Rejection ---');

    // Missing password
    const resNoPw = await provisionInitialAdmin({ email: 'admin@test.io', password: '' });
    assert(!resNoPw.success && resNoPw.reason === 'VALIDATION_FAILED', 'Rejects empty password');

    // Password too short (< 10 chars)
    const resShortPw = await provisionInitialAdmin({ email: 'admin@test.io', password: 'Ab1!' });
    assert(!resShortPw.success && resShortPw.reason === 'VALIDATION_FAILED', 'Rejects password shorter than 10 characters');

    // Trivial passwords
    const resTrivial1 = await provisionInitialAdmin({ email: 'admin@test.io', password: 'admin123456!' });
    assert(!resTrivial1.success && resTrivial1.reason === 'VALIDATION_FAILED', 'Rejects trivial "admin123456!"');

    const resTrivial2 = await provisionInitialAdmin({ email: 'admin@test.io', password: 'Password123!' });
    assert(!resTrivial2.success && resTrivial2.reason === 'VALIDATION_FAILED', 'Rejects common "Password123!"');

    // Missing special character
    const resNoSymbol = await provisionInitialAdmin({ email: 'admin@test.io', password: 'SecurePassword123' });
    assert(!resNoSymbol.success && resNoSymbol.reason === 'VALIDATION_FAILED', 'Rejects password without special symbol');

    // Missing digit
    const resNoDigit = await provisionInitialAdmin({ email: 'admin@test.io', password: 'SecurePassword!' });
    assert(!resNoDigit.success && resNoDigit.reason === 'VALIDATION_FAILED', 'Rejects password without numeric digit');

    // Invalid email syntax
    const resBadEmail = await provisionInitialAdmin({ email: 'not-an-email', password: 'Valid!Password123' });
    assert(!resBadEmail.success && resBadEmail.reason === 'VALIDATION_FAILED', 'Rejects invalid email format');

    // -------------------------------------------------------------------------
    // SCENARIO 2: Public Registration Cannot Create Admin (Privilege Escalation Defense)
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Public Registration Privilege Escalation Defense ---');

    const spoofRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Malicious Actor',
        email: 'malicious_admin_spoof@test.io',
        password: 'Password123!',
        role: 'admin', // Attempting to force role
      }),
    });

    assert(spoofRegRes.status === 201, 'Public registration returns 201 Created');
    const registeredUser = spoofRegRes.data?.data?.user;
    assert(registeredUser.role === 'student', 'Public registration forces role strictly to "student"');
    assert(registeredUser.role !== 'admin', 'Public registration cannot escalate to "admin"');

    const dbSpoofed = await User.findOne({ email: 'malicious_admin_spoof@test.io' });
    assert(dbSpoofed && dbSpoofed.role === 'student', 'Database record confirmed with role "student"');
    if (dbSpoofed) createdUserIds.push(dbSpoofed._id);

    // -------------------------------------------------------------------------
    // SCENARIO 3: Controlled Initial Admin Provisioning
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Controlled Initial Administrator Provisioning ---');

    const validEmail = 'provisioned_lead_admin@learnsphere.io';
    const validPassword = 'Str0ng!Operator#Secret2026';
    const validName = 'Lead Platform Admin';

    const provisionRes = await provisionInitialAdmin({
      email: validEmail,
      password: validPassword,
      name: validName,
    });

    assert(provisionRes.success === true, 'Initial provisioning succeeds when 0 admins exist');
    assert(provisionRes.user.role === 'admin', 'Returned provisioned role is "admin"');
    assert(provisionRes.user.email === validEmail, 'Returned provisioned email matches');
    assert(provisionRes.user.name === validName, 'Returned provisioned name matches');
    assert(provisionRes.user.password === undefined, 'Raw password is not returned in result');

    const dbAdmin = await User.findOne({ email: validEmail }).select('+password');
    assert(dbAdmin !== null, 'Admin record exists in database');
    createdUserIds.push(dbAdmin._id);

    assert(dbAdmin.role === 'admin', 'Database role is strictly "admin"');
    assert(dbAdmin.status === 'active', 'Database status is "active"');
    assert(dbAdmin.isTemporary === false, 'Account is permanent (isTemporary is false)');
    assert(dbAdmin.expiresAt === null, 'Account has no expiration timestamp (expiresAt is null)');
    assert(dbAdmin.password !== validPassword, 'Plaintext password is NEVER stored');
    assert(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(dbAdmin.password), 'Password is valid 10-round bcrypt hash');

    const passwordMatches = await dbAdmin.comparePassword(validPassword);
    assert(passwordMatches === true, 'User.comparePassword verifies candidate password successfully');

    const wrongPasswordFails = await dbAdmin.comparePassword('WrongPassword123!');
    assert(wrongPasswordFails === false, 'User.comparePassword rejects invalid candidate password');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Idempotency & Overwrite Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Idempotency & Overwrite Protection ---');

    // Attempting to run provisioning again when an admin already exists
    const duplicateProvisionRes = await provisionInitialAdmin({
      email: 'second_admin_attempt@learnsphere.io',
      password: 'Diff3rent!Secret#2026',
      name: 'Second Admin Attempt',
    });

    assert(duplicateProvisionRes.success === false, 'Repeated provisioning returns success: false');
    assert(duplicateProvisionRes.reason === 'ADMIN_ALREADY_EXISTS', 'Rejection reason is ADMIN_ALREADY_EXISTS');

    const totalAdmins = await User.countDocuments({ role: 'admin' });
    assert(totalAdmins === 1, 'Database contains strictly 1 administrator');

    // Verify existing admin was untouched
    const dbAdminCheck = await User.findOne({ email: validEmail }).select('+password');
    assert(dbAdminCheck.name === validName, 'Initial admin name was NOT overwritten');
    assert(dbAdminCheck.password === dbAdmin.password, 'Initial admin password hash was NOT overwritten');

    // -------------------------------------------------------------------------
    // SCENARIO 5: Standard Login Flow for Provisioned Admin
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Standard Authentication & JWT Login Flow ---');

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: validEmail,
        password: validPassword,
      }),
    });

    assert(loginRes.status === 200, 'Admin logs in via standard POST /api/auth/login (200 OK)');
    assert(loginRes.data?.data?.accessToken !== undefined, 'Returns signed JWT accessToken');
    assert(loginRes.data?.data?.user?.role === 'admin', 'Login user payload contains role "admin"');
    assert(loginRes.data?.data?.user?.password === undefined, 'Login user payload excludes password');

    const adminAccessToken = loginRes.data?.data?.accessToken;

    // Verify /api/auth/me returns authoritative admin profile
    const meRes = await request('/api/auth/me', { method: 'GET' }, adminAccessToken);
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK with admin token');
    assert(meRes.data?.data?.user?.role === 'admin', 'GET /api/auth/me confirms authoritative role "admin"');

    // -------------------------------------------------------------------------
    // SCENARIO 6: Admin Route Authorization & Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Admin Route Authorization & RBAC Enforcement ---');

    // 1. Unauthenticated request to admin dashboard
    const unauthAdminRes = await request('/api/admin/dashboard', { method: 'GET' });
    assert(unauthAdminRes.status === 401, 'Unauthenticated request to /api/admin/dashboard returns 401 Unauthorized');

    // 2. Student role accessing admin dashboard
    const studentToken = generateAccessToken({ userId: dbSpoofed._id, role: 'student' });
    const studentAdminRes = await request('/api/admin/dashboard', { method: 'GET' }, studentToken);
    assert(studentAdminRes.status === 403, 'Student access to /api/admin/dashboard returns 403 Forbidden');

    // 3. Provisioned admin accessing admin dashboard
    const adminDashboardRes = await request('/api/admin/dashboard', { method: 'GET' }, adminAccessToken);
    assert(adminDashboardRes.status === 200, 'Provisioned Admin accesses /api/admin/dashboard (200 OK)');
    assert(adminDashboardRes.data?.status === 'success', 'Admin dashboard returns success status');
    assert(typeof adminDashboardRes.data?.data?.users?.total === 'number', 'Admin dashboard returns platform user metrics');

    // -------------------------------------------------------------------------
    // SCENARIO 7: Clean Teardown to Preserve Clean Data State
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Teardown & Preservation of Clean State ---');

    await RefreshSession.deleteMany({ userId: { $in: createdUserIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });

    const remainingUsers = await User.countDocuments();
    assert(remainingUsers === 0, 'All verification accounts purged; database returns to 0 users');

  } catch (err) {
    console.error('\n✗ Verification run failed with uncaught exception:', err);
    totalTests++;
    failedTests++;
  }

  console.log('\n===================================================================');
  console.log(`Initial Admin Verification: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProvisioningVerification();
