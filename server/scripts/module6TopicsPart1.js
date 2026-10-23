/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 6 — Authentication and Authorization Content (Part 1: Topics 1–5)
 */

export const module6TopicsPart1 = [
  // ===========================================================================
  // TOPIC 1: Authentication vs Authorization
  // ===========================================================================
  {
    topicId: '6abe9dd6f15c2b4f6008ac50',
    title: 'Authentication vs Authorization',
    content: {
      explanation: `Every secure backend application must answer two distinct security questions whenever a request arrives at a protected endpoint: "Who are you?" and "What are you allowed to do?" Although beginners often use the words authentication and authorization interchangeably, they represent two separate, sequential stages of backend access control. Authentication (often abbreviated as AuthN) is the process of verifying a requester's identity—such as confirming a user's email and password during login or validating a cryptographic access token on an API call. Authorization (often abbreviated as AuthZ) happens after authentication succeeds and determines whether that identified user has permission to perform a specific action or access a specific resource. Understanding the boundary between authentication and authorization is essential for designing secure Express middleware pipelines and returning accurate HTTP status codes.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Clearly distinguish between Authentication ("Who are you?") and Authorization ("What are you allowed to do?").
2. Explain how identity verification, roles, permissions, and resource ownership work together in a backend API.
3. Trace the complete request security lifecycle from login through authentication and authorization to a protected resource.
4. Choose accurately between HTTP 401 Unauthorized and HTTP 403 Forbidden when rejecting unauthenticated or unauthorized requests.
5. Explain why proving your identity (authentication) never automatically grants access to every endpoint or resource (authorization).`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Authentication (AuthN): The process of verifying the identity of a user or client system (answering "Who are you?").
- Authorization (AuthZ): The process of verifying whether an authenticated user has permission to perform a requested action or access a specific resource (answering "What are you allowed to do?").
- Identity: The verified server-side representation of which user account is making the current request (such as req.user.userId).
- Role: A named classification assigned to a user account (such as student, course_creator, or admin) that groups a baseline set of permissions.
- Permission: Approval to perform a specific operation on a category of resources (for example, creating a course or viewing an administrative report).
- Resource Ownership: A fine-grained authorization rule requiring that the authenticated user is the actual owner or creator of the specific database record being read or modified.
- 401 Unauthorized: The HTTP status code returned when authentication is missing, invalid, or expired (the server cannot verify who the caller is).
- 403 Forbidden: The HTTP status code returned when authentication succeeded (the server knows who the caller is), but the caller lacks permission to perform the requested operation.`,
        },
        {
          order: 2,
          heading: 'Real-World Analogy: Airport Security and Boarding Zones',
          body: `Think of traveling through an international airport:
1. Authentication ("Who are you?"): At the security checkpoint, an officer inspects your government-issued passport or ID card and matches it against your face. Once verified, the airport knows your exact identity.
2. Authorization ("What are you allowed to do?"): Having a verified passport does not mean you can walk into the cockpit, enter the air-traffic control tower, or board any airplane at any gate. Your boarding pass specifies which flight you are allowed to board and which cabin class you can enter.

In a backend web application like LearnSphere:
- Logging in with your email and password (or presenting a valid access token) is like showing your passport: it establishes who you are.
- Checking whether your role is course_creator and whether you own a specific course before allowing a PATCH request is like checking your boarding pass at the gate: it enforces what you are allowed to do.`,
        },
        {
          order: 3,
          heading: 'Step-by-Step Backend Security Flow',
          body: `In a production Node.js and Express backend, authentication always runs before authorization:

Login
 ↓
Authentication
 ↓
Identity established
 ↓
Authorization
 ↓
Permission check
 ↓
Protected resource

Step 1 — Login: The user submits credentials (email and password) to POST /api/auth/login. The server verifies those credentials and issues a cryptographic token.
Step 2 — Authentication: On subsequent API requests, the client sends the token in the HTTP Authorization header. Authentication middleware verifies the token's signature and expiration, confirms the user account is active in MongoDB, and attaches req.user = { userId, role }.
Step 3 — Identity Established: The backend now knows authoritatively which user is making the request.
Step 4 — Authorization: Authorization middleware inspects req.user.role and/or queries the target resource in MongoDB to verify ownership.
Step 5 — Permission Check: If the user's role or ownership does not satisfy the endpoint's security policy, the request is rejected immediately.
Step 6 — Protected Resource: Only after both authentication and authorization succeed does the controller execute business logic and access the protected resource.`,
        },
        {
          order: 4,
          heading: '401 Unauthorized vs 403 Forbidden',
          body: `One of the most common questions in REST API design is when to return HTTP 401 versus HTTP 403:

1. Return HTTP 401 Unauthorized when Authentication fails:
   - No Authorization header was provided.
   - The Bearer token is malformed, has an invalid signature, or has expired.
   - The user account referenced by the token no longer exists or has been deactivated.
   (Note: Although the HTTP specification names 401 "Unauthorized", it specifically means "Unauthenticated".)

2. Return HTTP 403 Forbidden when Authorization fails:
   - The user is validly authenticated (req.user is populated), but their role is student and they are attempting to call a course_creator or admin endpoint.
   - Re-authenticating with the same account will not help because the account simply does not have permission for that operation.
   (Note: For resource-specific ownership checks, backends sometimes return 404 Not Found instead of 403 Forbidden when a user attempts to access another user's private draft resource, preventing attackers from probing which private IDs exist.)`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Assuming authentication implies authorization: Protecting a route with only authenticate middleware allows any logged-in user (including a student) to invoke administrative or course-creation endpoints if role and ownership checks are omitted.
2. Returning 401 when a logged-in user lacks permission: Returning 401 to an authenticated student who clicks an admin action often causes frontend HTTP clients to think the user's session expired and redirect them to the login screen in an infinite loop. Use 403 Forbidden for role denials.
3. Running authorization before authentication: Authorization middleware relies on the verified req.user identity established by authentication middleware. Mounting authorize() before authenticate() will fail because req.user is still undefined.
4. Trusting user identity or roles sent in the request body: Never read req.body.userId or req.body.role to decide who a user is or what they can do. Always derive identity from the verified authentication token and database record.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `1. Review five endpoints in an e-learning platform:
   - GET /api/courses (public course catalog)
   - GET /api/auth/me (current user profile)
   - POST /api/creator/courses (create a new draft course)
   - PATCH /api/creator/courses/:courseId (update a specific draft course)
   - PATCH /api/admin/users/:id/role (change a user's platform role)
2. For each endpoint, write down:
   - Does it require Authentication?
   - Does it require Role Authorization? If so, which role?
   - Does it require Resource Ownership Authorization?
   - What HTTP status code should be returned if an unauthenticated visitor calls it vs if an authenticated student calls it?`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `- Authentication answers "Who are you?" by verifying credentials or cryptographic tokens and establishing req.user.
- Authorization answers "What are you allowed to do?" by checking roles, permissions, and resource ownership after authentication succeeds.
- Authentication failures return HTTP 401 Unauthorized; role authorization failures return HTTP 403 Forbidden.
- Every protected backend operation must enforce both identity verification (authentication) and permission verification (authorization).`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Separating Authentication and Authorization Middleware in Express',
        language: 'javascript',
        code: `import express from 'express';

const router = express.Router();

// 1. Authentication Middleware: Answers "Who are you?"
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Caller has not proven their identity -> 401 Unauthorized
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Conceptual verification of token (detailed in JWT topics)
  // Suppose token verification establishes this verified user identity:
  req.user = {
    userId: '665f1a2b3c4d5e6f7a8b9c01',
    role: 'student',
  };
  return next();
}

// 2. Authorization Middleware: Answers "What are you allowed to do?"
function requireRole(allowedRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (req.user.role !== allowedRole) {
      // Caller's identity is known, but role is not permitted -> 403 Forbidden
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: insufficient permissions',
      });
    }

    return next();
  };
}

// Mounted in sequential order: authenticate first, then authorize
router.post(
  '/creator/courses',
  authenticate,
  requireRole('course_creator'),
  (req, res) => {
    return res.status(201).json({
      status: 'success',
      message: 'Draft course created by authorized course_creator',
    });
  }
);

export default router;`,
        explanation: `This example demonstrates how Express routes chain authenticate (which verifies identity and returns 401 if missing) followed by requireRole('course_creator') (which inspects the verified role and returns 403 if a student attempts to create a course).`,
      },
    ],
    importantPoints: [
      'Authentication ("Who are you?") verifies user identity; Authorization ("What are you allowed to do?") verifies permissions and ownership.',
      'Authentication must always execute before authorization so that authorization decisions are based on a verified server-side identity.',
      'Return HTTP 401 Unauthorized when authentication credentials or tokens are missing, invalid, or expired.',
      'Return HTTP 403 Forbidden when an authenticated user lacks the required role or permission for an operation.',
      'Being logged in (authenticated) never automatically authorizes a user to access every endpoint or another user\'s resources.',
      'Never trust client-supplied userId or role fields in request bodies or query strings for security decisions.',
    ],
    externalReferences: [
      {
        title: 'OWASP Authentication Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'MDN Web Docs — HTTP 401 Unauthorized vs 403 Forbidden',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 2: Password Hashing
  // ===========================================================================
  {
    topicId: '6abe9dd7f15c2b4f6008ac51',
    title: 'Password Hashing',
    content: {
      explanation: `Passwords are the primary secret users rely on to prove their identity during registration and login. Storing user passwords in plaintext inside a database is one of the most severe security vulnerabilities a backend developer can introduce: if an attacker gains read access to a database backup, log file, or query result, every user's account—and any external accounts where they reused that password—is immediately compromised. To protect user credentials at rest, backend systems never store plaintext passwords or reversible encrypted passwords. Instead, they pass passwords through a slow, salted, one-way cryptographic password-hashing function such as bcrypt before saving them to MongoDB, and verify future logins by comparing the candidate password against the stored hash.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why plaintext passwords must never be stored in a database, returned in API responses, or written to server logs.
2. Clearly distinguish between two-way Encryption and one-way Cryptographic Hashing.
3. Explain how cryptographic salts and adaptive work factors (cost factors) in bcrypt defend against rainbow table and brute-force attacks.
4. Implement secure password hashing during user registration and password verification during login using Mongoose hooks and bcrypt.
5. Configure Mongoose schemas with select: false and toJSON transforms so password hashes are excluded from query results and responses by default.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Plaintext Password: The raw, human-readable password string submitted by the user during registration or login.
- Hashing: A one-way mathematical transformation that converts an input string into a fixed-length digest that cannot be reversed back into the original input.
- Encryption: A two-way reversible transformation that scrambles data using a secret key so that anyone possessing the key can decrypt it back into plaintext.
- Salt: A cryptographically random string generated uniquely for each password and combined with the password before hashing so that two users with the exact same password produce completely different hashes.
- Work Factor (Cost Factor / Salt Rounds): A configurable parameter in bcrypt (such as 10 rounds) that controls how much CPU time is required to compute a single hash, intentionally slowing down offline brute-force cracking attempts.
- bcrypt: An industry-standard adaptive password-hashing function that automatically generates a unique per-password salt and embeds both the salt and cost factor directly into the resulting hash output string.`,
        },
        {
          order: 2,
          heading: 'Hashing vs Encryption: Why One-Way Matters',
          body: `Beginners often ask: "Why don't we encrypt passwords instead of hashing them?"

- Encryption is a two-way street: Data is encrypted with a key so that the server can later decrypt it back into the original value (for example, encrypting a stored payment webhook secret that the server must send to an external provider). If you encrypted user passwords and an attacker stole both the database and your server's encryption key, the attacker could instantly decrypt every password back into plaintext.
- Password Hashing is a one-way street: The server never needs to know what a user's original password is—it only needs to verify whether the password typed during login produces the same result when run through the hashing algorithm with the same salt. Because a proper password hash is mathematically irreversible, even the server itself cannot recover the original plaintext password from a stored bcrypt hash.`,
        },
        {
          order: 3,
          heading: 'How Salts and bcrypt Work During Registration and Login',
          body: `If a hashing algorithm produced the exact same output every time without a salt, an attacker could precompute a massive dictionary of common passwords and their hashes (known as a "rainbow table") and look up stolen hashes in milliseconds. Furthermore, any two users who chose the same password would have identical hashes in the database.

bcrypt solves both problems automatically:
1. Unique Per-Password Salt: When you generate a salt (e.g., bcrypt.genSalt(10)) and call bcrypt.hash(plainPassword, salt), bcrypt generates a fresh random salt and combines it with the password. Even if two users register with the exact same password, their stored bcrypt strings are completely different.
2. Embedded Salt for Verification: bcrypt stores the algorithm version, the cost factor, the random salt, and the resulting hash together in a single structured string.

Here is the complete registration and login flow:

Registration:
Plain password
     ↓
bcrypt hash
     ↓
Database

Login:
Entered password
     ↓
bcrypt compare
     ↓
Stored hash
     ↓
Match / reject

During login, you never try to "unhash" the database value. Instead, you call bcrypt.compare(candidatePassword, storedHash). Internally, bcrypt extracts the salt and cost factor from storedHash, hashes candidatePassword using those exact parameters, and checks whether the resulting digest matches.`,
        },
        {
          order: 4,
          heading: 'LearnSphere User Schema Password Protection',
          body: `In LearnSphere's server/models/User.js and server/controllers/authController.js, several layers of defense protect passwords:
1. Schema-Level Exclusion (select: false): The password field on userSchema sets select: false so that ordinary queries like User.findById(id) or User.find({}) never load the password hash from MongoDB unless a query explicitly opts in via .select('+password') during login verification.
2. Serialization Sanitization (toJSON / toObject): Even if a document in memory has the password field populated, the schema's toJSON and toObject transforms explicitly delete ret.password before JSON serialization.
3. Pre-Save Hashing Hook: A userSchema.pre('save') hook checks this.isModified('password'). Only when the password is newly created or changed does it generate a salt (bcrypt.genSalt(10)) and replace this.password with await bcrypt.hash(this.password, salt), preventing accidental double-hashing when unrelated fields like user.status are updated.
4. Generic Login Error Responses: If an email does not exist or bcrypt.compare() returns false, the login controller returns the exact same HTTP 401 response ("Invalid email or password") so attackers cannot enumerate which email addresses are registered.`,
        },
        {
          order: 5,
          heading: 'What Password Hashing Does and Does Not Solve',
          body: `While strong password hashing with bcrypt is mandatory, it is only one layer of authentication security:
- Password hashing protects credentials at rest in the database if records are leaked.
- Password hashing does NOT protect passwords in transit if the application is served over unencrypted HTTP instead of HTTPS.
- Password hashing does NOT stop online credential-stuffing or brute-force login requests against POST /api/auth/login unless paired with rate limiting, minimum password strength validation, and account security controls.
- Password hashing is completely bypassed if your application accidentally logs req.body or plaintext passwords to the console or log files before hashing! Never log passwords or password hashes.`,
        },
        {
          order: 6,
          heading: 'Common Beginner Mistakes',
          body: `1. Using fast general-purpose hashes like MD5 or SHA-256 for passwords: Algorithms like SHA-256 are designed to be extremely fast, allowing modern GPUs to test billions of candidate passwords per second. Always use an intentionally slow password-hashing algorithm like bcrypt, scrypt, or Argon2.
2. Comparing hashes with === during login: Calling bcrypt.hash(enteredPassword, 10) during login generates a brand-new random salt and therefore a different output string every time. Always use await bcrypt.compare(enteredPassword, user.password).
3. Double-hashing on user profile updates: Hashing user.password inside a pre('save') hook without checking if (!this.isModified('password')) will hash the already-hashed string whenever you update the user's name or status, permanently locking the user out of their account.
4. Returning the user document directly after User.create() without removing the password field, or logging req.body on authentication routes.`,
        },
        {
          order: 7,
          heading: 'Suggested Practice Task',
          body: `1. Inspect how a Mongoose User model uses pre('save') and instance methods to manage passwords.
2. Trace what happens if a user registers with an 8+ character password, and then later updates their name field via user.name = 'Updated Name'; await user.save(). Explain why checking this.isModified('password') prevents corrupting the stored password hash.
3. Write a login verification helper that queries a user with .select('+password'), calls user.comparePassword(candidatePassword), and returns a generic 401 message if either the user is missing or the comparison returns false.`,
        },
        {
          order: 8,
          heading: 'Topic Summary',
          body: `- Never store, return, or log plaintext passwords.
- Hashing is a one-way irreversible transformation, whereas encryption is two-way and reversible with a key.
- bcrypt automatically incorporates a unique random salt per password and a configurable work factor to defend against rainbow tables and brute-force attacks.
- Use bcrypt.hash() when saving a new or modified password, and bcrypt.compare() when verifying a login attempt against a stored hash.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Mongoose Pre-Save Password Hashing and Safe Comparison (LearnSphere Pattern)',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Excluded from query results by default
    },
    role: {
      type: String,
      enum: ['student', 'course_creator', 'admin'],
      default: 'student',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password; // Never serialize password hash in JSON responses
        return ret;
      },
    },
  }
);

// Hash password before saving ONLY when the password field was modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare a login candidate password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);`,
        explanation: `This pattern mirrors LearnSphere's User model: passwords are excluded by default via select: false, stripped from JSON responses via toJSON, hashed with a per-user salt when modified, and verified using bcrypt.compare().`,
      },
      {
        title: 'Verifying a Password Safely in a Login Controller',
        language: 'javascript',
        code: `export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Explicitly opt-in to loading the hashed password only for login verification
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Return the exact same generic 401 message whether email or password fails
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}`,
        explanation: `During login, the controller selects +password to run user.comparePassword(password), never logs the password, never includes the hash in the response, and returns a consistent 401 message on failure.`,
      },
    ],
    importantPoints: [
      'Never store plaintext passwords in a database, never return password hashes in API responses, and never log passwords.',
      'Password hashing is one-way and irreversible; encryption is two-way and reversible.',
      'A cryptographic salt ensures that two identical passwords produce completely different hashes and defeats precomputed rainbow tables.',
      'bcrypt embeds the algorithm version, cost factor (work factor), and unique salt directly inside the generated hash string.',
      'Always verify passwords at login using bcrypt.compare(enteredPassword, storedHash)—never by re-hashing and using ===.',
      'Check this.isModified("password") in Mongoose pre-save hooks to prevent double-hashing when updating other user fields.',
    ],
    externalReferences: [
      {
        title: 'OWASP Password Storage Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'npm — bcryptjs Documentation',
        url: 'https://www.npmjs.com/package/bcryptjs',
        source: 'npm Registry',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 3: Sessions vs Tokens
  // ===========================================================================
  {
    topicId: '6abe9dd7f15c2b4f6008ac52',
    title: 'Sessions vs Tokens',
    content: {
      explanation: `Because HTTP is a stateless protocol, every incoming request is independent by default—unless the client includes a credential on subsequent requests, the server would force the user to re-enter their email and password on every single click. Backend systems solve this problem using one of two primary architectural models (or a hybrid of both): traditional server-side sessions or cryptographic token-based authentication. Understanding how stateful server sessions and token-based authentication work, how they handle storage, scaling, and revocation, and why security depends on implementation details rather than buzzwords is vital for every backend engineer.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why authentication persistence mechanisms (sessions or tokens) are needed on top of stateless HTTP.
2. Trace the lifecycle of a traditional server-side session from login to session lookup.
3. Trace the lifecycle of token-based authentication from login to cryptographic token verification.
4. Compare sessions and tokens across storage location, server state, revocation, horizontal scaling, expiration, and cookie security.
5. Explain why hybrid architectures (short-lived access tokens paired with server-tracked refresh sessions) combine the strengths of both approaches.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Stateless Protocol: A communication protocol (such as HTTP) where the server does not automatically retain memory of previous requests between transactions.
- Server-Side Session (Stateful Authentication): An authentication mechanism where the server creates and stores a session record in memory or a database (like Redis or MongoDB) and sends only an opaque session ID to the browser.
- Session Identifier (Session ID): A random, high-entropy opaque string (typically stored in an HttpOnly cookie) that maps to a server-side session record.
- Token-Based Authentication: An authentication mechanism where the server issues a signed cryptographic token containing encoded claims, and the client presents that token on subsequent API calls for signature verification.
- Revocation: Immediately invalidating an active login session or token before its natural expiration timestamp (for example, on logout, password reset, or account suspension).`,
        },
        {
          order: 2,
          heading: 'Traditional Server-Side Sessions',
          body: `In a traditional session-based architecture, the server maintains the complete state of every logged-in user:

Browser
 ↓
Login
 ↓
Server creates session
 ↓
Session identifier
 ↓
Session stored server-side

How it works step by step:
1. The user submits their email and password from the browser.
2. After verifying the password, the server creates a session record in server-side storage (such as Redis or a database collection) containing the user ID, login timestamp, and expiration time.
3. The server sends back a Set-Cookie header containing only a random opaque Session ID (for example, sid=9f8a7b6c...). The Session ID itself contains no readable user data; it is just a lookup key.
4. On every subsequent request, the browser automatically includes the cookie, and the server queries its session store by that Session ID to look up who the user is.
5. When the user logs out, the server deletes the session record from its store, immediately revoking access.`,
        },
        {
          order: 3,
          heading: 'Token-Based Authentication',
          body: `In a token-based architecture, instead of returning an opaque lookup key for every request, the server issues a cryptographically signed token:

Login
 ↓
Server issues token
 ↓
Client presents token
 ↓
Server verifies token

How it works step by step:
1. The user authenticates with their credentials.
2. The server generates a structured payload (such as the user's ID, role, and expiration timestamp), signs it cryptographically using a server-only secret key, and returns the signed token to the client.
3. On subsequent API requests, the client presents the token in the HTTP Authorization header: Authorization: Bearer <token>.
4. The server verifies the cryptographic signature and expiration timestamp mathematically using its secret key. In many systems (including LearnSphere), the server also verifies the user's active status in the database to ensure deactivated accounts cannot continue acting.`,
        },
        {
          order: 4,
          heading: 'Detailed Comparison: Sessions vs Tokens',
          body: `Let's compare the two approaches across key engineering dimensions:

1. Server State & Database Lookups:
   - Pure Sessions: Stateful—every authenticated request requires looking up the session record in a session store.
   - Pure Stateless Tokens: Self-contained claims can be verified cryptographically, though security-conscious backends (like LearnSphere) still verify active user status or pair short-lived access tokens with stateful refresh sessions.
2. Immediate Revocation:
   - Sessions: Easy and immediate—deleting the session record from the server store invalidates the session on the very next request.
   - Pure Stateless Tokens: Harder—a purely stateless token remains cryptographically valid until its expiration timestamp (exp) unless the server checks a revocation list, user status, or uses short-lived access tokens with revocable refresh sessions.
3. Horizontal Scaling & Multi-Client Support:
   - Sessions: If stored in local process memory, requests must hit the same server instance ("sticky sessions"); scaling across multiple servers requires a shared store like Redis or MongoDB.
   - Tokens: Easily verified across multiple API instances, mobile apps, and SPA frontends using shared verification keys.
4. Cookie & Transport Security:
   - When cookies are used (either for a session ID or a refresh token), they must be configured with HttpOnly, Secure (in production HTTPS), and appropriate SameSite attributes to defend against XSS token theft and CSRF.`,
        },
        {
          order: 5,
          heading: 'Why Security Depends on Implementation, Not Hype',
          body: `A common misconception in beginner tutorials is claiming that "JWT tokens are automatically more secure than sessions" or vice versa. Neither statement is true:
- A token-based system that issues 30-day non-revocable access tokens and stores them in browser localStorage is far less secure than a well-implemented server-side session.
- Conversely, a session-based system that uses predictable session IDs or omits HttpOnly and CSRF protections is vulnerable to session hijacking.

Modern production systems like LearnSphere use a hybrid architecture that combines the best of both worlds:
1. A short-lived JWT Access Token presented via Authorization: Bearer <token> for API calls.
2. A stateful RefreshSession stored in MongoDB (recording only a SHA-256 hash of the refresh token) paired with a refresh token delivered inside an HttpOnly cookie, enabling immediate session revocation and rotation.`,
        },
        {
          order: 6,
          heading: 'Common Beginner Mistakes',
          body: `1. Claiming tokens are automatically more secure than sessions: Security is determined by token lifetime, storage mechanism (HttpOnly cookies vs memory vs localStorage), revocation controls, and signature verification.
2. Issuing long-lived stateless tokens with no revocation mechanism: If an access token lasts for 7 or 30 days with no server-side session or user-status check, a compromised token or deactivated user cannot be stopped until the token expires.
3. Storing session state in an Express process's local JavaScript object (e.g., const sessions = {}) in production: Restarting the server wipes all sessions, and running two server instances breaks authentication whenever a load balancer routes requests between instances.
4. Omitting HttpOnly on authentication cookies: Any cookie containing a session ID or refresh token without the HttpOnly flag can be read directly by malicious JavaScript via document.cookie during an XSS attack.`,
        },
        {
          order: 7,
          heading: 'Suggested Practice Task',
          body: `Create a two-column comparison matrix comparing Traditional Server-Side Sessions and Token-Based Authentication across five scenarios:
1. User clicks "Log Out on All Devices".
2. A mobile app and a React SPA both consume the same Express REST API.
3. An administrator deactivates a compromised user account and wants access blocked immediately.
4. The backend scales from 1 Node.js container to 4 Node.js containers behind a load balancer.
5. Explain how pairing a short-lived access token with a database-backed RefreshSession solves scenarios 1, 2, 3, and 4 simultaneously.`,
        },
        {
          order: 8,
          heading: 'Topic Summary',
          body: `- Traditional server-side sessions store login state on the server and give the browser an opaque session ID (typically in an HttpOnly cookie).
- Token-based authentication issues a cryptographically signed token that the client presents on API requests and the server verifies.
- Sessions make immediate server-side revocation straightforward, while tokens simplify cross-service and multi-client API authentication.
- Security depends on proper implementation—short token lifetimes, safe storage, revocation tracking, and strict server verification—not on choosing tokens over sessions alone.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Comparing Stateful Session Lookup vs Hybrid Token + RefreshSession Verification',
        language: 'javascript',
        code: `// Pattern A: Conceptual Stateful Server-Side Session Lookup
async function verifyServerSession(req, res, next) {
  const sessionId = req.cookies?.sid;
  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  // Look up active session document in database/cache on every request
  const session = await SessionModel.findOne({
    sessionId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or revoked' });
  }

  req.user = { userId: session.userId.toString(), role: session.role };
  return next();
}

// Pattern B: Signed Bearer Token Verification + Authoritative User Status Check
async function verifyBearerToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // 1. Verify cryptographic signature & expiration (HS256)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });

    // 2. Verify authoritative user status in MongoDB
    const user = await User.findById(decoded.sub).select('role status');
    if (!user || user.status === 'inactive') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    req.user = { userId: user._id.toString(), role: user.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
}`,
        explanation: `Pattern A demonstrates looking up an opaque session ID in a server store, while Pattern B shows LearnSphere's approach: verifying a signed short-lived Bearer JWT and confirming the user's active status and authoritative role in MongoDB.`,
      },
    ],
    importantPoints: [
      'HTTP is stateless by default; sessions and tokens are two architectural patterns for persisting authenticated state across requests.',
      'Traditional server-side sessions keep session state on the server and send only an opaque session identifier to the client.',
      'Token-based authentication issues a signed cryptographic token that the client presents on subsequent requests for server verification.',
      'Tokens are not automatically more secure than sessions; security depends on token expiration, storage, revocation, and verification rules.',
      'LearnSphere combines short-lived signed access tokens with MongoDB-backed RefreshSession records and HttpOnly refresh cookies.',
    ],
    externalReferences: [
      {
        title: 'OWASP Session Management Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'MDN Web Docs — Using HTTP Cookies',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 4: JWT Authentication
  // ===========================================================================
  {
    topicId: '6abe9dd8f15c2b4f6008ac53',
    title: 'JWT Authentication',
    content: {
      explanation: `A JSON Web Token (JWT, pronounced "jot" and standardized in RFC 7519) is a compact, URL-safe format for representing cryptographically signed claims between two parties. When a user logs into a backend like LearnSphere, the server creates a JWT containing minimal identity claims—such as the user's ID, role, creation time, and expiration time—and signs it using a secret key held exclusively on the server. One of the most critical concepts for every developer to understand is that a standard JWT is signed, NOT encrypted: anyone who sees a JWT can Base64URL-decode its header and payload to read its contents, which means secrets and passwords must never be placed inside a JWT payload. What the cryptographic signature guarantees is integrity and authenticity—no client or attacker can alter the payload (for example, changing role from student to admin) without invalidating the signature.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain what a JSON Web Token (JWT) is and identify its three dot-separated components: Header.Payload.Signature.
2. Explain the critical difference between Cryptographic Signing (integrity and authenticity) and Encryption (confidentiality), and why secrets or passwords must never be placed in a JWT payload.
3. Define standard JWT registered claims (sub, iat, exp, jti) and minimal custom claims (userId, role).
4. Explain how symmetric signing with HS256 works in LearnSphere and why the signing secret must be stored strictly in server environment variables.
5. Configure jwt.sign() and jwt.verify() safely in Node.js, including explicit algorithm allowlisting (algorithms: ['HS256']) to prevent algorithm confusion attacks.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- JWT (JSON Web Token): A compact, URL-safe token format consisting of three Base64URL-encoded parts separated by dots: Header.Payload.Signature.
- Base64URL Encoding: A text-encoding format that converts JSON objects into URL-safe characters. Encoding is NOT encryption—anyone can decode Base64URL without a key.
- Claim: A key-value assertion stored inside the JWT payload (such as sub for Subject or exp for Expiration Time).
- Cryptographic Signature: A mathematical digest computed over the encoded Header and Payload using a secret key (symmetric, such as HS256) or private key (asymmetric, such as RS256).
- HS256 (HMAC using SHA-256): A symmetric signing algorithm where the backend server uses a single strong secret key both to sign tokens and to verify them.
- Algorithm Confusion / "none" Algorithm Attack: A vulnerability where a poorly configured JWT verifier accepts an attacker-chosen algorithm (such as "none") instead of enforcing the server's expected algorithm.`,
        },
        {
          order: 2,
          heading: 'Anatomy of a JWT: Header.Payload.Signature',
          body: `Every signed JWT string consists of three Base64URL-encoded sections separated by two periods (.):

Header.Payload.Signature

1. Header: A JSON object describing the token type and the cryptographic signing algorithm used:
   {
     "alg": "HS256",
     "typ": "JWT"
   }

2. Payload (Claims): A JSON object containing standard registered claims and minimal non-sensitive application data:
   {
     "userId": "665f1a2b3c4d5e6f7a8b9c01",
     "role": "student",
     "iat": 1728000000,
     "exp": 1728000900,
     "sub": "665f1a2b3c4d5e6f7a8b9c01",
     "jti": "d84c92a0-4e11-4b88-9a21-7f1234567890"
   }

3. Signature: Calculated by taking the Base64URL-encoded Header and the Base64URL-encoded Payload, joining them with a dot, and running HMAC-SHA256 with the server's secret key:
   HMACSHA256(
     base64UrlEncode(header) + "." + base64UrlEncode(payload),
     process.env.JWT_ACCESS_SECRET
   )

If a user or attacker modifies even a single character of the Payload—for example, changing "role": "student" to "role": "admin"—and re-encodes the Payload, the server will recompute the HMAC-SHA256 signature using its secret key during jwt.verify(). Because the attacker does not know the server's secret key, the signatures will not match, and jwt.verify() will immediately throw a JsonWebTokenError ("invalid signature").`,
        },
        {
          order: 3,
          heading: 'Signing vs Encryption: Why Payloads Must Never Contain Secrets',
          body: `It is essential to distinguish between signing and encryption when working with JWTs:
- Standard JWTs (specifically JWS, JSON Web Signature) are SIGNED, NOT ENCRYPTED.
- Signing guarantees tamper-detection (integrity) and proves that the server possessing the secret key issued the token (authenticity).
- Signing does NOT hide the contents of the payload. Anyone who intercepts or inspects the token (including the user's own browser devtools) can Base64URL-decode the middle section and read every field in plain JSON.

Therefore:
- NEVER put passwords, password hashes, API keys, database credentials, or sensitive personal data inside a JWT payload.
- Keep the payload minimal: include only the identifiers and claims necessary for authentication (such as sub, userId, role, jti, iat, and exp).`,
        },
        {
          order: 4,
          heading: 'Understanding Standard JWT Claims',
          body: `LearnSphere's tokenService.js populates standard registered claims alongside minimal application claims:
- sub (Subject): Identifies the principal that is the subject of the JWT—in LearnSphere, the user's MongoDB ObjectId string.
- iat (Issued At): The Unix timestamp (in seconds) when the token was created, automatically added by jsonwebtoken.
- exp (Expiration Time): The Unix timestamp (in seconds) after which the token must be rejected as expired. Every token must have a bounded lifetime.
- jti (JWT ID): A unique identifier for the token (generated in LearnSphere via crypto.randomUUID()), ensuring that even two tokens issued in the same second for the same user have distinct cryptographic strings and unique identifiers.
- role / userId: Custom application claims indicating the user's ID and role at the time of token issuance (which LearnSphere's middleware further cross-checks against MongoDB).`,
        },
        {
          order: 5,
          heading: 'Safe Signing Secret Management and Verification Rules',
          body: `Because LearnSphere signs tokens with HS256 (a symmetric algorithm), the security of every JWT depends on keeping the signing secret strictly confidential on the server:
1. Load Secrets Exclusively from Environment Variables: Secrets such as process.env.JWT_ACCESS_SECRET and process.env.JWT_REFRESH_SECRET must never be hardcoded in source code or committed to Git.
2. Enforce Distinct Secrets: LearnSphere's tokenService.js explicitly verifies that accessSecret !== refreshSecret so a refresh token can never be accepted by authentication middleware as an access token.
3. Explicitly Restrict Verification Algorithms: When calling jwt.verify(token, secret, { algorithms: ['HS256'] }), always pass the algorithms allowlist. This prevents algorithm-switching attacks and ensures tokens with alg: "none" are strictly rejected.
4. Never Call jwt.decode() as a Substitute for jwt.verify(): jwt.decode() merely parses the Base64URL payload without checking the signature or expiration! Only use jwt.verify() to authenticate incoming tokens.`,
        },
        {
          order: 6,
          heading: 'Common Beginner Mistakes',
          body: `1. Using jwt.decode() instead of jwt.verify() in authentication middleware: jwt.decode() does not verify the cryptographic signature at all—an attacker could forge any userId and role and bypass authentication completely.
2. Hardcoding a fallback secret in code (e.g., process.env.JWT_SECRET || 'my-secret-123'): If an environment variable is missing in production, a hardcoded fallback allows anyone who reads the code to forge valid admin tokens. Instead, fail closed and throw an error if the secret is missing.
3. Putting sensitive user data or password hashes inside the JWT payload: Even if a Mongoose query loaded a full user document, never pass the raw document directly into jwt.sign(user, secret). Construct an explicit minimal payload object.
4. Omitting expiresIn when signing tokens: A JWT signed without an expiration claim (exp) never expires naturally.`,
        },
        {
          order: 7,
          heading: 'Suggested Practice Task',
          body: `1. Write a helper function generateAccessToken({ userId, role }) that validates userId is present, ensures process.env.JWT_ACCESS_SECRET is configured, and signs a minimal payload using algorithm: 'HS256', expiresIn: '15m', subject: String(userId), and jwtid: crypto.randomUUID().
2. Write a companion function verifyAccessToken(token) that calls jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }).
3. Test what happens if you tamper with one character in the middle (Payload) section of a signed JWT string and pass it to verifyAccessToken(token).`,
        },
        {
          order: 8,
          heading: 'Topic Summary',
          body: `- A JWT has three Base64URL-encoded parts: Header.Payload.Signature.
- Standard JWTs are cryptographically signed (guaranteeing integrity and authenticity), NOT encrypted—anyone can decode and read the payload.
- Never place passwords, hashes, or secrets inside a JWT payload, and never hardcode JWT signing secrets in source code.
- Always include an expiration claim (exp), a subject (sub), and a unique token ID (jti), and always verify tokens with jwt.verify() and an explicit algorithms: ['HS256'] allowlist.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Signing and Verifying HS256 JWTs Safely (LearnSphere tokenService Pattern)',
        language: 'javascript',
        code: `import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Generates a short-lived signed JWT access token with minimal claims.
 */
export function generateAccessToken({ userId, role }) {
  if (!userId) {
    throw new Error('User ID is required to generate an access token');
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret) {
    throw new Error('JWT access secret configuration is missing');
  }

  // Enforce separation between access and refresh secrets
  if (refreshSecret && accessSecret === refreshSecret) {
    throw new Error('Security violation: Access and refresh secrets must be distinct');
  }

  const userIdStr = userId.toString();

  // Minimal non-sensitive payload—never include passwords or secrets
  const payload = {
    userId: userIdStr,
    role: role || 'student',
  };

  return jwt.sign(payload, accessSecret, {
    expiresIn: '15m',
    algorithm: 'HS256',
    subject: userIdStr,
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Verifies a signed JWT access token and enforces the HS256 algorithm allowlist.
 */
export function verifyAccessToken(token) {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  if (!accessSecret) {
    throw new Error('JWT access secret configuration is missing');
  }

  // jwt.verify checks both signature integrity and the exp timestamp
  return jwt.verify(token, accessSecret, {
    algorithms: ['HS256'],
  });
}`,
        explanation: `This implementation matches LearnSphere's server/services/tokenService.js: it loads secrets from environment variables, ensures access and refresh secrets are distinct, signs minimal claims with HS256 and a unique jti, and restricts verification to HS256.`,
      },
    ],
    importantPoints: [
      'A JWT consists of three Base64URL-encoded sections separated by dots: Header.Payload.Signature.',
      'A standard JWT is cryptographically signed, NOT encrypted—anyone can decode and read the Header and Payload.',
      'Never store passwords, password hashes, or secret keys inside a JWT payload.',
      'Standard JWT claims include sub (Subject), iat (Issued At), exp (Expiration Time), and jti (Unique JWT ID).',
      'With symmetric signing (HS256), the signing secret must be stored strictly in server environment variables and never hardcoded.',
      'Always use jwt.verify() with an explicit algorithms: ["HS256"] allowlist; never use jwt.decode() to authenticate requests.',
    ],
    externalReferences: [
      {
        title: 'RFC 7519 — JSON Web Token (JWT) Specification',
        url: 'https://datatracker.ietf.org/doc/html/rfc7519',
        source: 'IETF Datatracker',
      },
      {
        title: 'OWASP JSON Web Token (JWT) Cheat Sheet for Java',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // ===========================================================================
  // TOPIC 5: Access Tokens and Refresh Tokens
  // ===========================================================================
  {
    topicId: '6abe9dd8f15c2b4f6008ac54',
    title: 'Access Tokens and Refresh Tokens',
    content: {
      explanation: `If a backend issues a single JWT that lasts for only 15 minutes, users stay safe because stolen tokens expire quickly—but forcing a user to type their email and password again every 15 minutes would create a frustrating user experience. Conversely, issuing a single access token that lasts for 7 or 30 days means any compromised token gives an attacker long-term access. Production web applications like LearnSphere solve this dilemma using a dual-token architecture: a short-lived Access Token used to authorize API requests, paired with a longer-lived Refresh Token delivered exclusively via a secure HttpOnly cookie, backed by a hashed RefreshSession record in MongoDB, and rotated on every refresh.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Contrast the purpose, lifetime, and security requirements of an Access Token versus a Refresh Token.
2. Trace LearnSphere's complete login and token-refresh architecture, including refresh-token rotation.
3. Explain why Refresh Tokens are delivered in HttpOnly, Secure, SameSite cookies scoped to /api/auth rather than exposed to JavaScript.
4. Explain why neither Access Tokens nor Refresh Tokens should be persisted in browser localStorage or sessionStorage.
5. Describe how LearnSphere hashes refresh tokens at rest using SHA-256 in the RefreshSession collection to prevent token theft from database leaks and detect token replay.`,
        },
        {
          order: 1,
          heading: 'Core Terminology',
          body: `- Access Token: A short-lived JWT (for example, 15 minutes) sent by the client in the Authorization: Bearer <token> header to access protected API endpoints.
- Refresh Token: A longer-lived JWT (for example, 7 days) signed with a separate secret and used solely at the /api/auth/refresh endpoint to obtain a fresh access token.
- HttpOnly Cookie: An HTTP cookie flag that instructs the browser never to expose the cookie to client-side JavaScript (document.cookie), protecting the token from Cross-Site Scripting (XSS) theft.
- Secure Cookie: An HTTP cookie flag ensuring the browser transmits the cookie only over encrypted HTTPS connections in production.
- SameSite Cookie Attribute: A cookie policy (such as Lax or Strict) that restricts when cookies are sent on cross-site requests to defend against Cross-Site Request Forgery (CSRF).
- Refresh-Token Rotation: A security pattern where every call to POST /api/auth/refresh immediately revokes the used refresh token and issues a brand-new refresh token in its place.
- Token Hashing at Rest: Storing only a one-way cryptographic hash (SHA-256) of the refresh token in the database rather than the raw token string.`,
        },
        {
          order: 2,
          heading: 'Access Token vs Refresh Token Responsibilities',
          body: `In LearnSphere, Access Tokens and Refresh Tokens have strictly separated roles and secrets:

1. Access Token:
   - Purpose: Authorizing API requests to protected routes (e.g., GET /api/auth/me, PATCH /api/creator/courses/...).
   - Transport: Sent in the HTTP header Authorization: Bearer <accessToken> and held only in React application memory (never persisted in localStorage or sessionStorage).
   - Lifetime: Short-lived (such as 15 minutes) to minimize the window of exposure if intercepted.
   - Signing Secret: Signed with JWT_ACCESS_SECRET.

2. Refresh Token:
   - Purpose: Used ONLY to request a new access token at POST /api/auth/refresh when the short-lived access token expires or when the user reloads the browser tab.
   - Transport: Delivered by the server in an HttpOnly cookie scoped strictly to path: '/api/auth'. Ordinary API endpoints never even receive the refresh cookie over the network.
   - Lifetime: Longer-lived (such as 7 days), tracked by a server-side RefreshSession document in MongoDB.
   - Signing Secret: Signed with a distinct JWT_REFRESH_SECRET. Because the secrets are different, a refresh token cannot be used as a Bearer token on regular API routes.`,
        },
        {
          order: 3,
          heading: 'LearnSphere Dual-Token & Rotation Flow',
          body: `Here is how LearnSphere's dual-token lifecycle operates from login through refresh rotation:

Login
 ↓
Access Token
 ↓
API requests

Refresh Token
 ↓
HttpOnly secure cookie
 ↓
Refresh endpoint
 ↓
New access token
 ↓
Refresh-token rotation

Step-by-step walkthrough:
1. On POST /api/auth/login, the server verifies the user's password and generates both an Access Token and a Refresh Token.
2. Before sending the response, the server hashes the Refresh Token with SHA-256 (hashToken(refreshToken)) and saves a RefreshSession document in MongoDB containing { userId, tokenHash, expiresAt, revokedAt: null }.
3. The server sets the raw Refresh Token inside an HttpOnly cookie and returns the Access Token in the JSON response body (held in memory by the frontend).
4. When the Access Token expires (or the page refreshes), the frontend calls POST /api/auth/refresh. The browser automatically attaches the HttpOnly refresh cookie.
5. The server verifies the refresh token's signature against JWT_REFRESH_SECRET, hashes the token with SHA-256, and atomically marks the matching active RefreshSession as revoked (revokedAt: new Date(), lastUsedAt: new Date()).
6. The server verifies the user is still active in MongoDB, generates a brand-new Refresh Token + new RefreshSession document, sets the new HttpOnly cookie, and returns a new short-lived Access Token.`,
        },
        {
          order: 4,
          heading: 'Why Browser Token Storage Decisions Matter',
          body: `Where a frontend stores tokens in the browser has major security implications:
- Why NOT localStorage or sessionStorage? Both window.localStorage and window.sessionStorage are synchronously readable by any JavaScript running on the page. If an application ever suffers from a Cross-Site Scripting (XSS) vulnerability—or loads a compromised third-party script—an attacker can run localStorage.getItem('token') and exfiltrate every token stored there.
- Why In-Memory Access Token + HttpOnly Refresh Cookie?
  1. The Refresh Token is stored inside an HttpOnly cookie. Even if JavaScript runs on the page, document.cookie cannot read an HttpOnly cookie. Furthermore, scoping the cookie path to '/api/auth' ensures the browser only sends the cookie to authentication endpoints.
  2. The short-lived Access Token is kept solely in JavaScript runtime memory (e.g., a React state/module variable), never written to localStorage or sessionStorage.`,
        },
        {
          order: 5,
          heading: 'Token Hashing at Rest and Replay Detection',
          body: `Look closely at LearnSphere's server/models/RefreshSession.js: it stores tokenHash, NOT the raw refresh token string. Why?
- Defense Against Database Leaks: Just like passwords, if an attacker ever gained read-only access to the RefreshSession collection in MongoDB, seeing raw refresh tokens would let them impersonate every logged-in user immediately. Because LearnSphere stores only crypto.createHash('sha256').update(token).digest('hex'), a database dump does not reveal usable JWT strings.
- Atomic Rotation and Replay Rejection: During POST /api/auth/refresh, LearnSphere uses RefreshSession.findOneAndUpdate({ tokenHash: oldTokenHash, revokedAt: null, expiresAt: { $gt: new Date() }, userId }, { $set: { revokedAt: new Date(), lastUsedAt: new Date() } }). Because MongoDB executes findOneAndUpdate atomically, two simultaneous requests presenting the same refresh token cannot both succeed, and any attempt to replay an already-rotated refresh token finds no document with revokedAt: null and is immediately rejected with HTTP 401 while clearing the cookie.`,
        },
        {
          order: 6,
          heading: 'Common Beginner Mistakes',
          body: `1. Storing access tokens or refresh tokens in localStorage or sessionStorage: This exposes tokens directly to XSS attacks. Keep access tokens in memory and refresh tokens in HttpOnly cookies.
2. Using the same secret key for both access tokens and refresh tokens: If both tokens share a secret and claim structure, a client could pass a 7-day refresh token in the Authorization: Bearer header as if it were an access token. Always use distinct secrets (JWT_ACCESS_SECRET vs JWT_REFRESH_SECRET).
3. Storing plaintext refresh tokens in the database: Always store a one-way cryptographic hash (SHA-256) of the refresh token in the session collection.
4. Updating refresh sessions with a non-atomic findOne() followed by save(): Under concurrent requests, two parallel refresh calls could both pass findOne() before either saves revokedAt, issuing duplicate active sessions. Use atomic findOneAndUpdate({ tokenHash, revokedAt: null }, ...).`,
        },
        {
          order: 7,
          heading: 'Suggested Practice Task',
          body: `1. Trace what happens in LearnSphere when a user logs in, makes an API call, reloads the browser page (losing in-memory React state), and calls POST /api/auth/refresh.
2. Inspect how hashToken(token) in server/services/tokenService.js computes a deterministic SHA-256 hex digest. Explain why SHA-256 is appropriate for hashing high-entropy random JWT strings, whereas bcrypt is required for human-chosen passwords.
3. Trace what happens if an attacker captures an old refresh token that has already been rotated once and tries to send it to POST /api/auth/refresh.`,
        },
        {
          order: 8,
          heading: 'Topic Summary',
          body: `- Access tokens are short-lived credentials sent in the Authorization: Bearer header and kept in memory; refresh tokens are longer-lived credentials used only to obtain new access tokens.
- LearnSphere delivers refresh tokens exclusively in HttpOnly, SameSite, path-scoped cookies (/api/auth) and never persists tokens in localStorage or sessionStorage.
- RefreshSession documents in MongoDB store only the SHA-256 hash of each refresh token alongside userId, expiresAt, createdAt, lastUsedAt, and revokedAt.
- On every refresh request, LearnSphere atomically revokes the presented session and rotates to a brand-new refresh token and session record.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Hashing Refresh Tokens and Setting HttpOnly Cookies (LearnSphere Pattern)',
        language: 'javascript',
        code: `import crypto from 'crypto';

/**
 * Computes a one-way SHA-256 hex digest of a refresh token for database storage.
 * High-entropy JWT strings can be hashed with SHA-256 for fast indexed lookup
 * without ever storing the raw token in MongoDB.
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token string is required for hashing');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Attaches the refresh token to the Express response as a secure HttpOnly cookie.
 */
export function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('learnsphere_refresh_token', refreshToken, {
    httpOnly: true, // Inaccessible to document.cookie in browser JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
    sameSite: 'lax', // Protects against cross-site request forgery
    path: '/api/auth', // Sent only to authentication endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
}`,
        explanation: `LearnSphere never exposes the refresh token to client-side JavaScript storage and never saves the raw token in MongoDB: the raw token goes only into an HttpOnly cookie scoped to /api/auth, while its SHA-256 hash is stored in RefreshSession.`,
      },
      {
        title: 'Atomic Refresh-Token Rotation and Reuse Protection',
        language: 'javascript',
        code: `export async function rotateRefreshTokenSession(req, res, next) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 1. Verify signature and expiration using the distinct refresh secret
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    const userId = decoded.userId || decoded.sub;
    const oldTokenHash = hashToken(refreshToken);

    // 2. Atomically claim and revoke the active RefreshSession
    const oldSession = await RefreshSession.findOneAndUpdate(
      {
        tokenHash: oldTokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
        userId,
      },
      {
        $set: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      },
      { returnDocument: 'before' }
    );

    // If no active unrevoked session matched, reject replay/expired attempt
    if (!oldSession) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 3. Verify authoritative user status in MongoDB and issue rotated tokens
    const user = await User.findById(userId).select('role name email status');
    if (!user || user.status === 'inactive') {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    const newRefreshToken = generateRefreshToken({ userId: user._id, role: user.role });
    await RefreshSession.create({
      userId: user._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      status: 'success',
      data: { accessToken },
    });
  } catch (err) {
    return next(err);
  }
}`,
        explanation: `This controller pattern from LearnSphere's authController.js atomically revokes the incoming refresh session using findOneAndUpdate, preventing race conditions and rejecting any replay of an already-used refresh token.`,
      },
    ],
    importantPoints: [
      'Access tokens are short-lived and sent via Authorization: Bearer <token> for API calls; refresh tokens are longer-lived and used only to obtain new access tokens.',
      'Never store access tokens or refresh tokens in browser localStorage or sessionStorage.',
      'Deliver refresh tokens in HttpOnly, Secure, SameSite cookies scoped strictly to the authentication path (/api/auth).',
      'Always sign access tokens and refresh tokens with separate, distinct server secrets (JWT_ACCESS_SECRET vs JWT_REFRESH_SECRET).',
      'Store only a one-way SHA-256 hash (tokenHash) of the refresh token in the database RefreshSession collection.',
      'Rotate refresh tokens atomically on every refresh request so each refresh token can be used at most once.',
    ],
    externalReferences: [
      {
        title: 'RFC 6749 — The OAuth 2.0 Authorization Framework (Refresh Tokens)',
        url: 'https://datatracker.ietf.org/doc/html/rfc6749#section-1.5',
        source: 'IETF Datatracker',
      },
      {
        title: 'OWASP HTML5 Security Cheat Sheet — Storage Security',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
