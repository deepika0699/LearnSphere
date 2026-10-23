/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 6 — Authentication and Authorization Content (Part 2: Topics 6–9)
 */

export const module6TopicsPart2 = [
  // ===========================================================================
  // TOPIC 6: Protected Routes
  // ===========================================================================
  {
    topicId: '6abe9dd8f15c2b4f6008ac55',
    title: 'Protected Routes',
    content: {
      explanation: `In a backend REST API, public routes (such as browsing a published course catalog or submitting login credentials) are open to unauthenticated visitors, whereas protected routes (such as reading a user's profile, creating a draft course, or managing platform users) must reject unauthenticated or unauthorized requests before any controller or service logic executes. Express applications implement protected routes using a modular chain of middleware functions. Rather than copying token-parsing and permission-checking code inside every controller, you mount reusable authentication and authorization middleware directly on the route definition so that only verified, permitted requests ever reach the controller.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Trace how a request flows through an Express protected route pipeline from Authentication Middleware to Authorization Middleware, Controller, Service, and Resource.
2. Parse and validate an HTTP Authorization: Bearer <token> header safely inside authentication middleware.
3. Handle missing tokens, malformed headers, invalid signatures, expired tokens, and deleted or deactivated users consistently with HTTP 401 Unauthorized.
4. Explain why authentication middleware in LearnSphere verifies the user's current status and role in MongoDB before attaching req.user.
5. Distinguish clearly between "Is the user authenticated?" and "Is this authenticated user allowed to perform this operation?" in route middleware chains.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Protected Route: An API endpoint guarded by authentication (and typically authorization) middleware so that unauthenticated or unauthorized requests are rejected before controller execution.
- Bearer Token: An HTTP authentication scheme (RFC 6750) where the client sends the access token in the header format Authorization: Bearer <token>.
- Authentication Middleware: An Express middleware function (such as authenticate) that extracts and verifies the Bearer token, checks that the user account is active, populates req.user, and calls next().
- Deactivated / Deleted User Check: Querying the database during authentication to ensure that a user whose account was deactivated or deleted after their token was issued is immediately blocked.
- Request Context (req.user): The server-verified identity object attached to the Express req object by authentication middleware for downstream middleware and controllers to consume.`,
        },
        {
          order: 2,
          heading: 'The Protected Route Middleware Pipeline',
          body: `Every protected route in an Express architecture processes requests through a strict sequential pipeline:

Request
 ↓
Authentication middleware
 ↓
Identify user
 ↓
Authorization middleware
 ↓
Controller
 ↓
Service
 ↓
Resource

Let's trace each stage:
1. Request: The client sends an HTTP request including Authorization: Bearer <accessToken>.
2. Authentication Middleware (authenticate): Extracts the Bearer token, verifies its HS256 signature and exp timestamp, queries MongoDB to confirm the user still exists and has status: 'active', and populates req.user = { userId, id, role, status }.
3. Identify User: If any check in step 2 fails, the middleware immediately responds with HTTP 401 Unauthorized and never calls next().
4. Authorization Middleware (authorize / ownership check): Inspects the verified req.user identity to confirm whether this user's role and resource ownership permit the operation. If not, it responds with HTTP 403 Forbidden (or HTTP 404 Not Found for private resource isolation).
5. Controller & Service: Only after both middleware layers call next() does the controller invoke the service layer to read or mutate the Resource.`,
        },
        {
          order: 3,
          heading: 'How Authentication Middleware Validates Every Failure Mode',
          body: `Look at how LearnSphere's server/middleware/authenticate.js handles every potential failure case safely:

1. Missing Authorization Header:
   If req.headers.authorization is undefined or not a string, return HTTP 401.
2. Malformed Header Format:
   The header must split into exactly two whitespace-separated parts where the first part is "Bearer" (case-insensitive) and the second part is a non-empty token string. Otherwise, return HTTP 401.
3. Invalid Signature or Expired Token:
   jwt.verify(token, accessSecret, { algorithms: ['HS256'] }) throws an error if the signature does not match, the token is malformed, or the exp timestamp has passed. Catch the error and return a generic HTTP 401 ("Authentication required") without leaking internal verification error details or echoing the token back.
4. Invalid User ID Claim:
   Verify that decoded.userId (or decoded.sub) is a valid MongoDB ObjectId via mongoose.Types.ObjectId.isValid(userId).
5. Deleted, Inactive, or Expired Temporary User:
   Query User.findById(userId).select('role status isTemporary expiresAt'). If the user was deleted from MongoDB, has status === 'inactive', or is an expired temporary account, reject with HTTP 401.`,
        },
        {
          order: 4,
          heading: 'Authentication Check vs Operation Permission Check',
          body: `When protecting routes, always separate these two questions into distinct middleware functions:

Question 1: "Is the user authenticated?" (Handled by authenticate)
- Checks whether the request carries a valid, unexpired Bearer token belonging to an existing, active user account.
- Does not care whether the route is for students, course creators, or admins.
- Answers "No" with HTTP 401 Unauthorized.

Question 2: "Is this authenticated user allowed to perform this operation?" (Handled by authorize and ownership middleware)
- Assumes Question 1 already succeeded and reads req.user.
- Checks whether req.user.role matches the endpoint's required role and, for specific resource routes, whether req.user.userId owns the target resource.
- Answers "No" with HTTP 403 Forbidden (or 404 Not Found for unowned private resources).`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Echoing the rejected token or raw jwt.verify() error message in 401 responses: Returning messages like "Token signature mismatch for token eyJ..." leaks internal details and reflects untrusted input. Return a consistent generic message such as "Authentication required".
2. Skipping the database user-status check in authenticate: If your middleware trusts the decoded JWT payload without checking whether the user account still exists and is active in MongoDB, a deleted or suspended user can continue calling protected routes until their token expires.
3. Reading req.body.userId instead of req.user.userId in controllers: Once a route is protected by authenticate, controllers must always use req.user.userId as the authoritative caller identity.
4. Forgetting to return when sending a 401 response inside middleware: Writing res.status(401).json(...) without return before next() causes Express to execute the downstream controller even after sending the 401 response!`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `1. Write an Express authentication middleware function that validates the Authorization: Bearer <token> header, verifies the token with jwt.verify() using HS256, checks that the user exists and is active in MongoDB, and attaches req.user.
2. Mount your middleware on GET /api/auth/me and trace the exact HTTP status code returned for:
   - A request with no Authorization header.
   - A request with Authorization: Basic 12345.
   - A request with an expired Bearer token.
   - A request with a valid Bearer token for a user whose status in MongoDB was changed to 'inactive'.
   - A request with a valid Bearer token for an active user.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `- Protected routes guard backend resources using a sequential pipeline: Request -> Authentication middleware -> Authorization middleware -> Controller -> Service -> Resource.
- Authentication middleware extracts the Bearer token from the Authorization header, verifies its HS256 signature and expiration, confirms the user is active in MongoDB, and populates req.user.
- Missing, malformed, invalid, or expired tokens—as well as deleted or inactive users—are rejected with HTTP 401 Unauthorized.
- Separating authentication middleware ("Is the user authenticated?") from authorization middleware ("Is this authenticated user allowed to perform this operation?") keeps routes clean, modular, and secure.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Production JWT Authentication Middleware (LearnSphere authenticate.js Pattern)',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User, { normalizeRole } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Must be in "Bearer <token>" format
    const parts = authHeader.trim().split(/\\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const token = parts[1];
    const accessSecret = process.env.JWT_ACCESS_SECRET;

    let decoded;
    try {
      decoded = jwt.verify(token, accessSecret, {
        algorithms: ['HS256'],
      });
    } catch {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userId = decoded?.userId || decoded?.sub;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Confirm user still exists and is active in MongoDB
    const user = await User.findById(userId).select('role status');
    if (!user || user.status === 'inactive') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Populate authoritative identity on req.user
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      role: normalizeRole(user.role) || user.role,
      status: user.status,
    };

    return next();
  } catch (err) {
    return next(err);
  }
};`,
        explanation: `This middleware mirrors LearnSphere's server/middleware/authenticate.js: it validates the Bearer header, verifies the HS256 JWT, checks MongoDB to confirm the user exists and is active, and attaches the authoritative identity to req.user.`,
      },
    ],
    importantPoints: [
      'Protected routes use middleware chains: Request -> Authentication middleware -> Identify user -> Authorization middleware -> Controller -> Service -> Resource.',
      'Clients send access tokens in the HTTP Authorization header using the Bearer <token> format.',
      'Authentication middleware rejects missing, malformed, invalid, or expired tokens with a generic HTTP 401 Unauthorized response.',
      'Checking the database for user existence and active status prevents deleted or deactivated accounts from using previously issued tokens.',
      'Downstream middleware and controllers must read user identity exclusively from req.user, never from client-supplied body or query fields.',
    ],
    externalReferences: [
      {
        title: 'RFC 6750 — The OAuth 2.0 Authorization Framework: Bearer Token Usage',
        url: 'https://datatracker.ietf.org/doc/html/rfc6750',
        source: 'IETF Datatracker',
      },
      {
        title: 'Express.js Guide — Using Middleware',
        url: 'https://expressjs.com/en/guide/using-middleware.html',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 7: Role-Based Access Control
  // ===========================================================================
  {
    topicId: '6abe9dd9f15c2b4f6008ac56',
    title: 'Role-Based Access Control',
    content: {
      explanation: `Once authentication middleware has verified who a user is, the backend must determine whether that user's platform role allows them to access a given route category. Role-Based Access Control (RBAC) is a security model in which permissions are assigned to specific canonical roles rather than managed ad-hoc on individual user accounts. In LearnSphere, every user account is assigned one of three canonical platform roles—student, course_creator, or admin—and server-side RBAC middleware enforces strict boundaries between student learning endpoints, course-creation endpoints, and platform administration endpoints.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define Role-Based Access Control (RBAC) and explain how roles group permissions across a backend application.
2. Describe LearnSphere's three canonical platform roles (student, course_creator, and admin) and their respective domain boundaries.
3. Explain the Principle of Least Privilege and fail-closed authorization design.
4. Implement reusable role-authorization middleware in Express that queries the authoritative user role from MongoDB.
5. Explain why hiding buttons or routes in the React frontend is only a user-experience convenience and never a substitute for backend RBAC enforcement.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Role-Based Access Control (RBAC): An authorization strategy that restricts system access based on a user's assigned role within the platform.
- Canonical Role: The standardized, authoritative role identifier stored and enforced by the backend. In LearnSphere, the three canonical roles are student, course_creator, and admin.
- Principle of Least Privilege: The security rule that every user account should be granted only the minimum role and permissions required to perform its intended tasks (for example, new public registrations default strictly to student).
- Fail-Closed Authorization: Designing security checks so that if a role is missing, unrecognized, malformed, or not explicitly in the route's allowlist, access is denied by default (HTTP 403 Forbidden).
- Server-Authoritative Role Check: Verifying the user's current role directly from the database on the server rather than trusting client-supplied headers, body fields, or stale token claims.`,
        },
        {
          order: 2,
          heading: 'LearnSphere Canonical Roles and Boundaries',
          body: `LearnSphere enforces three strict canonical roles across the entire platform:

student
   → student resources

course_creator
   → course creation/content management

admin
   → administrative operations

1. student:
   - The default role assigned during self-registration (POST /api/auth/register).
   - Authorized to enroll in published courses, track topic progress, take assessments, write personal notes, and earn certificates.
   - Forbidden (403) from calling any /api/creator/* or /api/admin/* endpoints.

2. course_creator:
   - Assigned to faculty and curriculum authors who build courses.
   - Authorized to create and manage their own courses, modules, topics, and assessments under /api/creator/*.
   - Forbidden (403) from calling /api/admin/* endpoints or student-only enrollment/progress mutation endpoints.

3. admin:
   - Assigned to platform administrators.
   - Authorized to manage user accounts, assign roles, and oversee platform-wide operations under /api/admin/*.`,
        },
        {
          order: 3,
          heading: 'Server-Authoritative Role Verification and Fail-Closed Design',
          body: `How should an Express backend verify a user's role? Look at LearnSphere's server/middleware/authorize.js:
1. Never Trust Client Input: A malicious client might send { "role": "admin" } in req.body during registration or pass ?role=course_creator in a query string. LearnSphere's registration controller ignores any role field in req.body and hardcodes role: 'student', while authorize() never reads roles from req.body, req.query, or req.params.
2. Query Authoritative Database State: When authorize(...allowedRoles) runs, it takes the verified req.user.userId, queries User.findById(userId).select('role status') in MongoDB, and normalizes the role using normalizeRole(user.role). Why query MongoDB? If an administrator demotes a user or deactivates their account, the change takes effect immediately on the very next request—even before the user's current access token expires!
3. Fail-Closed Enforcement:
   - If req.user is missing or the user no longer exists in MongoDB -> return HTTP 401 Unauthorized.
   - If the user's role is null, unrecognized, or not included in allowedRoles -> return HTTP 403 Forbidden ("Access denied: insufficient permissions").`,
        },
        {
          order: 4,
          heading: 'Why Frontend Role Checks Alone Are Never Enough',
          body: `In a React Single-Page Application (SPA), you will often see conditional rendering based on the user's role—for example, only showing the "Creator Studio" navigation link if user.role === 'course_creator', or redirecting a student away from an /admin URL using a frontend route guard.

Why is that insufficient for security?
- Every line of frontend JavaScript runs on the user's own computer inside their browser.
- Anyone can open browser Developer Tools, edit React state in memory, or bypass the browser completely using curl, Postman, or fetch() to send an HTTP request directly to POST /api/creator/courses or PATCH /api/admin/users/:id/role.
- Therefore, frontend role checks exist purely for user experience (avoiding showing buttons that would fail when clicked). True security requires enforcing authorize('course_creator') or authorize('admin') on every protected backend route.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Allowing users to choose their own privileged role during registration: Passing req.body directly into User.create(req.body) allows an attacker to register with { "name": "Attacker", "email": "...", "password": "...", "role": "admin" } (a Mass Assignment vulnerability). Always force role: 'student' on public registration.
2. Relying only on frontend route guards: Hiding a button in React does not protect the backend API endpoint.
3. Failing open when role configuration is missing: Writing middleware that calls next() if user.role is undefined or unexpected. Always fail closed by validating that currentRole is in CANONICAL_ROLES and in allowedRoles.
4. Using inconsistent role names across files: Mixing unnormalized role strings causes subtle authorization bugs. Define a single frozen constant CANONICAL_ROLES = Object.freeze(['student', 'course_creator', 'admin']) and a normalizeRole() helper in the User model.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `1. Inspect how authorize(...roles) in server/middleware/authorize.js creates reusable middleware boundaries:
   - requireStudent = authorize('student')
   - requireCourseCreator = authorize('course_creator')
   - requireAdmin = authorize('admin')
2. Trace what happens when a user with role: 'student' sends an authenticated GET request to /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content. Which middleware stops the request, and what HTTP status code is returned?`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `- Role-Based Access Control (RBAC) assigns permissions to canonical roles: in LearnSphere, student, course_creator, and admin.
- Public registration enforces Least Privilege by assigning the student role by default and ignoring any client-supplied role field.
- Backend RBAC middleware must verify the user's authoritative role from MongoDB and fail closed with HTTP 403 Forbidden whenever a role is insufficient or unrecognized.
- Frontend role checks improve UI navigation, but backend middleware is the authoritative security boundary.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Fail-Closed RBAC Middleware Factory (LearnSphere authorize.js Pattern)',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import User, { CANONICAL_ROLES, normalizeRole } from '../models/User.js';

/**
 * Role-Based Authorization Middleware Factory
 * Usage: router.use(authenticate, authorize('course_creator'))
 */
export const authorize = (...roles) => {
  const allowedRoles = roles
    .flat()
    .map((r) => normalizeRole(r))
    .filter((r) => r && CANONICAL_ROLES.includes(r));

  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Query MongoDB for the user's authoritative current role and status
      const user = await User.findById(userId).select('role status');
      if (!user || user.status === 'inactive') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const currentRole = normalizeRole(user.role);

      // Fail closed if role is invalid or not permitted for this route
      if (
        !currentRole ||
        !CANONICAL_ROLES.includes(currentRole) ||
        (allowedRoles.length > 0 && !allowedRoles.includes(currentRole))
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied: insufficient permissions',
        });
      }

      req.user.role = currentRole;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export const requireStudent = authorize('student');
export const requireCourseCreator = authorize('course_creator');
export const requireAdmin = authorize('admin');`,
        explanation: `This middleware from LearnSphere's server/middleware/authorize.js enforces server-authoritative RBAC across the three canonical roles (student, course_creator, admin) and fails closed with HTTP 403 Forbidden whenever a user's role is not permitted.`,
      },
    ],
    importantPoints: [
      'LearnSphere enforces three canonical platform roles: student, course_creator, and admin.',
      'Apply the Principle of Least Privilege: public user registration always assigns the student role and ignores client-supplied role fields.',
      'RBAC middleware must run after authenticate and verify the user\'s current authoritative role from MongoDB.',
      'Fail-closed design means any missing, invalid, or non-matching role is rejected immediately with HTTP 403 Forbidden.',
      'Frontend role checks only control UI visibility; backend routes must always enforce RBAC on the server.',
    ],
    externalReferences: [
      {
        title: 'OWASP Access Control Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'NIST — Role Based Access Control (RBAC) Overview',
        url: 'https://csrc.nist.gov/projects/role-based-access-control',
        source: 'NIST Computer Security Resource Center',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 8: Ownership and Resource Authorization
  // ===========================================================================
  {
    topicId: '6abe9dd9f15c2b4f6008ac57',
    title: 'Ownership and Resource Authorization',
    content: {
      explanation: `Checking a user's role is necessary, but in multi-user applications it is rarely sufficient on its own. Suppose Course Creator A and Course Creator B both log into LearnSphere. Both users are validly authenticated, and both have the canonical role course_creator. If an endpoint like PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content only checked that req.user.role === 'course_creator', then Course Creator A could pass Course Creator B's courseId in the URL and overwrite or steal Course Creator B's draft course content! This vulnerability is known as Broken Object Level Authorization (BOLA) or Insecure Direct Object Reference (IDOR). Preventing it requires Ownership and Resource Authorization: verifying that the authenticated user actually owns (or has explicit permission for) the specific database record being accessed.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain the difference between Role Authorization (checking a user's general role) and Resource Ownership Authorization (checking whether the user owns the target record).
2. Identify Broken Object Level Authorization (BOLA / IDOR) vulnerabilities and explain how attackers exploit them by changing resource IDs in URLs or payloads.
3. Trace the complete resource-authorization decision flow from authenticated user through role check, resource lookup, and ownership comparison.
4. Explain why backends must always compare resource ownership against the server-derived req.user.userId and never trust a userId sent in req.body or req.query.
5. Decide when to return HTTP 404 Not Found versus HTTP 403 Forbidden to prevent leaking the existence of private resources owned by other users.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Resource Ownership Authorization: Verifying that the specific database document targeted by a request (such as a Course, Note, or Enrollment) belongs to the currently authenticated user (req.user.userId).
- BOLA (Broken Object Level Authorization) / IDOR (Insecure Direct Object Reference): A critical API security flaw (#1 on the OWASP API Security Top 10) where an endpoint accepts a resource ID (such as :courseId or :noteId) and performs the operation without verifying that the authenticated caller owns that object.
- Tenant / Resource Isolation: Ensuring that one user's private resources (such as a Course Creator's draft courses or a Student's personal study notes) cannot be read, listed, updated, or deleted by another user of the same role.
- Existence Leak Prevention (404 vs 403): Returning HTTP 404 Not Found when a user requests a private resource ID they do not own, so an attacker cannot tell whether that private ID exists in the database.`,
        },
        {
          order: 2,
          heading: 'Role Authorization vs Resource Ownership',
          body: `Consider two users in LearnSphere:
- Course Creator A (userId: "665f...0001", role: "course_creator") owns Course X.
- Course Creator B (userId: "665f...0002", role: "course_creator") owns Course Y.

Both users pass authenticate (401 check) and both pass requireCourseCreator (403 role check). However, when Course Creator A sends a request targeting Course Y, Resource Ownership Authorization must step in and block the request:

Authenticated user
       ↓
Role allowed?
       ↓
Resource exists?
       ↓
User owns resource / has permission?
       ↓
Allow or deny

The same principle applies to student resources:
- Student A and Student B both have role = student.
- Student A must only be able to read or update Student A's own study notes, enrollments, and assessment attempts—never Student B's.`,
        },
        {
          order: 3,
          heading: 'Enforcing Hierarchical Ownership in LearnSphere',
          body: `In nested REST APIs like /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content, ownership verification must also validate the hierarchy of the resources:
1. Validate ObjectIds: Confirm that courseId, moduleId, and topicId are valid MongoDB ObjectIds.
2. Verify Course Existence and Ownership: Query Course.findById(courseId) (or Course.findOne({ _id: courseId, createdBy: req.user.userId })) and confirm that course.createdBy.toString() === req.user.userId.
3. Verify Parent-Child Relationships: Confirm that the Module belongs to that exact courseId (module.courseId.toString() === courseId) and the Topic belongs to both that courseId and moduleId. Why? Without checking parent-child binding, a malicious creator could pass their own valid :courseId in the first URL segment (passing a naive course ownership check) while passing another creator's :topicId in the last URL segment!`,
        },
        {
          order: 4,
          heading: '403 Forbidden vs 404 Not Found for Resource Isolation',
          body: `When User A (who has the course_creator role) requests GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content for a course owned by User B, should the server return 403 Forbidden or 404 Not Found?
- If a student calls a /api/creator/* endpoint, returning 403 Forbidden is appropriate because the entire endpoint category is forbidden to the student role.
- However, if an authenticated course_creator requests a specific :courseId that belongs to another creator, returning 404 Not Found ("Course not found") prevents ID enumeration leaks. To Course Creator A, Course Creator B's private draft course simply does not exist. LearnSphere's courseCreatorAuthorization middleware and services enforce this 404 isolation boundary so unrelated Course Creators cannot discover or modify each other's courses.`,
        },
        {
          order: 5,
          heading: 'Never Trust Client-Supplied userId',
          body: `One of the golden rules of resource authorization is:
NEVER read the owner's userId from req.body, req.query, or an unverified header.

- Insecure Pattern:
  // WRONG: Trusts client-supplied userId in request body!
  const notes = await Note.find({ userId: req.body.userId, topicId: req.params.topicId });

- Secure Pattern:
  // RIGHT: Uses only the server-verified identity from req.user.userId!
  const notes = await Note.find({ userId: req.user.userId, topicId: req.params.topicId });

When creating a new resource (such as a Course or Note), always set createdBy: req.user.userId (or userId: req.user.userId) on the server. When reading, updating, or deleting a resource, always scope the MongoDB query or ownership check to req.user.userId.`,
        },
        {
          order: 6,
          heading: 'Common Beginner Mistakes',
          body: `1. Checking only the user's role and forgetting to check resource ownership (creating a classic BOLA/IDOR vulnerability).
2. Comparing MongoDB ObjectIds with === without calling .toString() or .equals(): In JavaScript, two distinct ObjectId instances (new ObjectId("...") === new ObjectId("...")) evaluate to false with === because they are different object references in memory! Always use course.createdBy.toString() === req.user.userId or course.createdBy.equals(req.user.userId).
3. Verifying ownership on the parent :courseId in the URL, but updating Topic.findByIdAndUpdate(req.params.topicId, ...) without verifying that the topic actually belongs to that courseId.
4. Checking ownership on PATCH/DELETE routes while forgetting to check ownership on GET routes for private or draft resources.`,
        },
        {
          order: 7,
          heading: 'Suggested Practice Task',
          body: `1. Write an Express middleware function verifyCourseOwnership(req, res, next) that:
   - Validates req.params.courseId is a valid MongoDB ObjectId (returning 404 if invalid).
   - Queries the course in MongoDB.
   - Returns 404 Not Found if the course does not exist OR if course.createdBy.toString() !== req.user.userId.
   - Attaches req.course = course and calls next() when ownership is confirmed.
2. Explain how scoping a query directly with Course.findOne({ _id: courseId, createdBy: req.user.userId }) enforces existence and ownership in a single database query.`,
        },
        {
          order: 8,
          heading: 'Topic Summary',
          body: `- Role authorization verifies that a user belongs to an allowed role (such as course_creator); resource ownership authorization verifies that the user owns the specific database record being accessed.
- Failing to verify resource ownership causes Broken Object Level Authorization (BOLA / IDOR), allowing users of the same role to read or modify each other's data.
- Always derive the caller's identity from req.user.userId on the server, never from req.body or req.query.
- In nested routes, verify both top-level ownership and parent-child hierarchy (course -> module -> topic), and return 404 Not Found to isolate private resources across unrelated owners.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Course Ownership & Hierarchy Verification (LearnSphere Pattern)',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

/**
 * Verifies that the authenticated Course Creator owns the target course
 * and that the module and topic belong to that exact course hierarchy.
 */
export async function verifyCreatorTopicOwnership(req, res, next) {
  try {
    const creatorId = req.user?.userId;
    const { courseId, moduleId, topicId } = req.params;

    // 1. Validate all route parameter ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(moduleId) ||
      !mongoose.Types.ObjectId.isValid(topicId)
    ) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Requested resource was not found',
      });
    }

    // 2. Verify course exists AND is owned by the authenticated Course Creator
    const course = await Course.findOne({
      _id: courseId,
      createdBy: creatorId,
    }).lean();

    if (!course) {
      // Return 404 Not Found to prevent leaking existence of other creators' courses
      return res.status(404).json({
        error: 'Not Found',
        message: 'Course not found',
      });
    }

    // 3. Verify module belongs to this course, and topic belongs to this module & course
    const [moduleDoc, topicDoc] = await Promise.all([
      Module.findOne({ _id: moduleId, courseId: course._id }).lean(),
      Topic.findOne({ _id: topicId, moduleId, courseId: course._id }).lean(),
    ]);

    if (!moduleDoc || !topicDoc) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Topic or module not found in this course',
      });
    }

    req.course = course;
    req.moduleDoc = moduleDoc;
    req.topicDoc = topicDoc;
    return next();
  } catch (err) {
    return next(err);
  }
}`,
        explanation: `This pattern reflects LearnSphere's course creator ownership protection: it never trusts client-supplied user IDs, scopes Course lookup by createdBy: req.user.userId, verifies the Course -> Module -> Topic hierarchy, and returns 404 Not Found if another Course Creator attempts access.`,
      },
    ],
    importantPoints: [
      'Having the required role (e.g., course_creator) does not authorize a user to access or modify another user\'s resources.',
      'Always verify resource ownership on every read, update, and delete operation targeting user-owned records to prevent BOLA/IDOR vulnerabilities.',
      'Derive the caller\'s user ID exclusively from the server-verified req.user.userId—never from req.body, req.query, or client headers.',
      'When comparing MongoDB ObjectIds in JavaScript, always convert with .toString() or use .equals() rather than raw ===.',
      'In nested routes (Course -> Module -> Topic), verify that child resources actually belong to the parent resource ID in the URL.',
      'Returning 404 Not Found when an unrelated user requests another user\'s private resource prevents leaking whether that resource ID exists.',
    ],
    externalReferences: [
      {
        title: 'OWASP API Security Top 10 — API1:2023 Broken Object Level Authorization',
        url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/',
        source: 'OWASP Foundation',
      },
      {
        title: 'OWASP Insecure Direct Object Reference Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 9: Secure Logout and Token Revocation
  // ===========================================================================
  {
    topicId: '6abe9ddaf15c2b4f6008ac58',
    title: 'Secure Logout and Token Revocation',
    content: {
      explanation: `In many beginner tutorials, "logging out" is implemented simply by deleting a token variable in the frontend React application. While clearing frontend memory hides the logged-in UI in that browser tab, it does not invalidate a long-lived session on the server! If a refresh token cookie remains in the browser or an active refresh session remains unrevoked in the database, the session can immediately mint new access tokens. A production-grade authentication system like LearnSphere implements true server-side logout and token revocation: tracking refresh sessions in MongoDB, rotating sessions atomically on every refresh, revoking the active RefreshSession record on logout, and clearing the HttpOnly refresh cookie.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why clearing a token only in the frontend browser is insufficient for secure logout.
2. Describe the fields and indexes of LearnSphere's RefreshSession Mongoose model (userId, tokenHash, expiresAt, createdAt, lastUsedAt, revokedAt).
3. Trace the complete refresh-token rotation lifecycle and explain how atomic revocation prevents replay and reuse attacks.
4. Trace the complete server-side logout lifecycle (revoking the RefreshSession in MongoDB and clearing the HttpOnly cookie).
5. Accurately explain the behavior of already-issued short-lived stateless access tokens after logout and why short access-token lifetimes matter.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Token Revocation: Marking a token's server-side session record as invalid (for example, setting revokedAt: new Date()) before its natural expiration time so it can never be used again.
- RefreshSession Model: LearnSphere's MongoDB collection that tracks active and revoked refresh tokens by storing their SHA-256 tokenHash, userId, and lifecycle timestamps.
- Token Replay / Reuse Attack: An attack where an intercepted or outdated refresh token is submitted again after it has already been rotated or revoked.
- TTL (Time-To-Live) Index: A special MongoDB index ({ expiresAt: 1 }, { expireAfterSeconds: 0 }) that automatically purges expired session documents from the collection once their expiration date passes.
- Idempotent Logout: Designing POST /api/auth/logout so that even if the cookie is already missing, expired, or revoked, the server safely clears the cookie and returns HTTP 200 OK.`,
        },
        {
          order: 2,
          heading: 'Why Deleting a Frontend Token Alone Is Not Enough',
          body: `Suppose an application only cleared its React state variable on logout without notifying the backend:
1. The HttpOnly refresh token cookie cannot be deleted by frontend JavaScript (because HttpOnly specifically blocks document.cookie access!). If the backend does not send a Set-Cookie header clearing the cookie, the next page reload will automatically send the cookie to /api/auth/refresh and log the user right back in!
2. Even if the browser tab is closed, if the refresh token was ever copied or intercepted before logout, an unrevoked RefreshSession in the database would still allow that refresh token to mint new access tokens for days.

Therefore, secure logout requires coordinated action across three layers:
- Frontend: Clear the in-memory access token and user state.
- Backend Database: Compute the SHA-256 hash of the refresh token and set revokedAt: new Date() on the matching RefreshSession document in MongoDB.
- Backend HTTP Response: Call res.clearCookie() with matching cookie options (path: '/api/auth', httpOnly: true, etc.) to instruct the browser to delete the HttpOnly refresh cookie immediately.`,
        },
        {
          order: 3,
          heading: 'LearnSphere RefreshSession Architecture',
          body: `Let's inspect the exact design of LearnSphere's server/models/RefreshSession.js:
- userId (ObjectId, ref: 'User', indexed): Associates the session with the owning user account so all sessions for a user can be revoked simultaneously if the user account is deactivated or expires.
- tokenHash (String, unique, indexed): Stores the one-way SHA-256 hex digest of the refresh token—never the plaintext JWT string.
- expiresAt (Date, TTL indexed): Matches the refresh token's expiration timestamp. MongoDB's TTL index ({ expiresAt: 1 }, { expireAfterSeconds: 0 }) automatically deletes expired documents so the collection does not grow indefinitely.
- createdAt (Date, immutable): Records when the session was first issued.
- lastUsedAt (Date, default null): Records the timestamp when the refresh token was presented and rotated.
- revokedAt (Date, default null): When null, the session is active. When set to a Date timestamp, the session is permanently revoked.`,
        },
        {
          order: 4,
          heading: 'Refresh Rotation and Logout Flows',
          body: `Let's compare the two core session lifecycle flows in LearnSphere:

1. Refresh Session Validation & Rotation Flow (POST /api/auth/refresh):

Refresh Token
 ↓
Refresh Session
 ↓
Validate
 ↓
Rotate
 ↓
Old token invalidated
 ↓
New refresh token issued

When the client refreshes its session, the server hashes the incoming refresh token and atomically updates the matching RefreshSession where revokedAt: null, setting revokedAt: new Date() and lastUsedAt: new Date(). The old refresh token is now permanently invalidated, and a brand-new refresh token (with a new RefreshSession document) is issued. If anyone attempts to replay the old refresh token again, no active session with revokedAt: null matches, and the server immediately rejects the request with HTTP 401 and clears the cookie.

2. Secure Logout Flow (POST /api/auth/logout):

Logout
 ↓
Revoke refresh session
 ↓
Clear refresh cookie
 ↓
Future refresh attempt rejected

When the user logs out, the server extracts the refresh token from the HttpOnly cookie, computes its SHA-256 hash, updates the RefreshSession in MongoDB to set revokedAt: new Date(), and calls clearRefreshTokenCookie(res). Any subsequent attempt to call /api/auth/refresh with that token is rejected with HTTP 401.`,
        },
        {
          order: 5,
          heading: 'Stateless Access Tokens vs Refresh Revocation',
          body: `It is important to be technically accurate about what logout does and does not do to an already-issued short-lived Access Token:
- Revoking the RefreshSession in MongoDB and clearing the refresh cookie immediately prevents the client (or an attacker) from ever obtaining a NEW access token via /api/auth/refresh.
- However, what about an already-issued Access Token before its 15-minute expiration timestamp? In a purely stateless JWT check, an access token remains cryptographically valid until its exp claim expires unless the server performs an additional server-side check (such as checking user status in MongoDB, revoking sessions on account deactivation, or maintaining an access-token deny-list/session reference).
- This is the exact reason why Access Tokens are designed with short lifetimes (such as 15 minutes) and why LearnSphere's authenticate middleware also verifies user.status !== 'inactive' in MongoDB on every protected request.`,
        },
        {
          order: 6,
          heading: 'Common Beginner Mistakes',
          body: `1. Claiming that deleting a token in React state or localStorage invalidates the token on the server: Without server-side session revocation, the token remains valid until it expires.
2. Calling res.clearCookie(name) without passing the exact same path and cookie options used when setting the cookie: If a cookie was set with path: '/api/auth', calling res.clearCookie(name) with the default path '/' will NOT clear the cookie in the browser! Always spread the exact cookie options (path, httpOnly, secure, sameSite) into res.clearCookie().
3. Deleting the RefreshSession document instead of setting revokedAt: Keeping the session record with a non-null revokedAt timestamp (until MongoDB's TTL index purges it at expiresAt) preserves an audit trail of when the token was used or revoked.
4. Failing with a 401 or 500 error during logout if the refresh cookie is already expired or missing: Logout should be idempotent—always clear the cookie and return 200 OK so the user can cleanly sign out.`,
        },
        {
          order: 7,
          heading: 'Suggested Practice Task',
          body: `1. Inspect server/models/RefreshSession.js and server/controllers/authController.js (specifically the refresh and logout controllers).
2. Trace the database state of RefreshSession across these three events:
   - Event A: User logs in via POST /api/auth/login (1 active session: revokedAt === null).
   - Event B: User refreshes via POST /api/auth/refresh (Session 1 now has revokedAt: <Date>, lastUsedAt: <Date>; Session 2 is created with revokedAt === null).
   - Event C: User logs out via POST /api/auth/logout (Session 2 now has revokedAt: <Date>, and the HttpOnly cookie is cleared).
3. Verify what happens if the client replays the refresh token from Event A or Event B after Event C.`,
        },
        {
          order: 8,
          heading: 'Topic Summary',
          body: `- Secure logout in a token-based system requires revoking the server-side RefreshSession in MongoDB and clearing the HttpOnly refresh cookie via the HTTP response.
- LearnSphere's RefreshSession model stores userId, a SHA-256 tokenHash, expiresAt (with a MongoDB TTL index), createdAt, lastUsedAt, and revokedAt.
- Refresh-token rotation invalidates the old refresh session on every refresh call and issues a new refresh token, preventing token replay attacks.
- Because stateless access tokens remain valid until their exp claim unless checked server-side, access tokens must always be kept short-lived while refresh tokens are strictly revocable.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'RefreshSession Schema with SHA-256 Hash and TTL Index (LearnSphere Pattern)',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// MongoDB TTL Index: automatically removes expired session documents
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying active sessions belonging to a user
refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);`,
        explanation: `This schema matches LearnSphere's server/models/RefreshSession.js: it stores only the SHA-256 tokenHash, tracks createdAt, lastUsedAt, and revokedAt timestamps, and uses a MongoDB TTL index on expiresAt for automatic cleanup.`,
      },
      {
        title: 'Secure Logout Controller with Session Revocation and Cookie Clearing',
        language: 'javascript',
        code: `import RefreshSession from '../models/RefreshSession.js';
import {
  hashToken,
  getRefreshTokenFromRequest,
  clearRefreshTokenCookie,
} from '../services/tokenService.js';

export const logout = async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    // 1. If a refresh token cookie is present, revoke its active RefreshSession in MongoDB
    if (refreshToken && typeof refreshToken === 'string') {
      try {
        const tokenHash = hashToken(refreshToken);
        await RefreshSession.updateOne(
          { tokenHash, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
      } catch {
        // Ensure cookie is still cleared even if token hashing or lookup fails
      }
    }

    // 2. Clear the HttpOnly refresh cookie using the exact path/security options
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    return next(err);
  }
};`,
        explanation: `This controller mirrors LearnSphere's POST /api/auth/logout implementation: it hashes the presented refresh token, marks the matching RefreshSession as revoked in MongoDB, clears the HttpOnly cookie, and returns a clean 200 response.`,
      },
    ],
    importantPoints: [
      'Deleting a token only in frontend state is not a complete logout; the backend must revoke the refresh session and clear the HttpOnly refresh cookie.',
      'LearnSphere\'s RefreshSession collection stores userId, SHA-256 tokenHash, expiresAt, createdAt, lastUsedAt, and revokedAt.',
      'During refresh rotation, the old RefreshSession is atomically marked with revokedAt and lastUsedAt before a new refresh token is issued.',
      'When clearing an HttpOnly cookie with res.clearCookie(), always pass the exact same path (/api/auth) and cookie options used when setting it.',
      'Short-lived stateless access tokens remain cryptographically valid until expiration unless additional server-side checks are performed, which is why access token lifetimes are kept short.',
      'Account deactivation or expiration can revoke all active sessions for a user at once via RefreshSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } }).',
    ],
    externalReferences: [
      {
        title: 'OWASP Authentication Cheat Sheet — Session & Logout Management',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'MongoDB Manual — Expire Data from Collections by Setting TTL',
        url: 'https://www.mongodb.com/docs/manual/tutorial/expire-data/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
