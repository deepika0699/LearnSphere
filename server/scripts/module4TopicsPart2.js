/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 4 — MongoDB and Mongoose Content (Part 2: Topics 6–9)
 */

export const module4TopicsPart2 = [
  // =========================================================================
  // TOPIC 6: Mongoose Schemas and Models
  // ID: 6abe9dd0f15c2b4f6008ac40
  // =========================================================================
  {
    topicId: '6abe9dd0f15c2b4f6008ac40',
    title: 'Mongoose Schemas and Models',
    content: {
      explanation: `Every Mongoose data file in a Node.js backend revolves around three distinct but connected building blocks that follow a strict progression:
Schema → Model → Document

1. Schema: The blueprint or configuration object that defines the field names, data types, default values, and validation rules for records in a collection. A Schema by itself cannot query or write to the database.
2. Model: A compiled constructor function created from a Schema ('mongoose.model("Course", courseSchema)') that represents a specific MongoDB collection ('courses') and provides static methods to create, query, update, and delete records.
3. Document: A single instance of a Model representing one specific record (for example, the single Course document for "Backend Development with Node.js, Express & MongoDB").

Mastering the exact distinction between a Schema, a Model, and a Document—along with common schema options like 'timestamps: true' and 'ObjectId' fields—allows you to read and write any model in LearnSphere with confidence.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Clearly explain and distinguish the three-part progression: Schema → Model → Document.
2. Define a Mongoose Schema using standard SchemaTypes ('String', 'Number', 'Boolean', 'Date', 'mongoose.Schema.Types.ObjectId', and arrays).
3. Configure common field options ('required', 'default', 'trim', 'lowercase', 'unique', 'enum') and schema-level options ('timestamps: true').
4. Compile a Schema into a Model using 'mongoose.model()' and explain how Mongoose maps model names to collection names.
5. Create, save, and query documents using a Mongoose Model.`,
        },
        {
          order: 1,
          heading: 'The Core Relationship: Schema → Model → Document',
          body: `Beginners often mix up the words Schema, Model, and Document. Let us make the distinction crystal clear:

Schema (Blueprint)
   ↓  mongoose.model('Course', courseSchema)
Model (Collection Interface / Constructor)
   ↓  await Course.create({...}) or new Course({...})
Document (Individual Record Instance)

Real-World Analogy — Architectural Blueprint vs. Factory Mould vs. Finished Car:
• Schema: Like the architectural blueprint on paper. It lists every part, measurement, and safety requirement, but you cannot drive a paper blueprint.
• Model: Like the automated factory assembly line built from that blueprint. You ask the factory ('Course.create()', 'Course.find()') to build or locate cars.
• Document: Like one specific physical car that rolled off the assembly line with its own unique VIN number ('_id: ObjectId("...")').

Key Differences in Code:
• You configure fields and rules on the Schema ('new mongoose.Schema({ ... })').
• You call static query methods on the Model ('Course.findById(id)', 'Course.find({ status: "published" })').
• You read properties or call instance methods on a Document ('courseDoc.title', 'await courseDoc.save()').`,
        },
        {
          order: 2,
          heading: 'Defining a Schema: SchemaTypes, ObjectId Fields, and Options',
          body: `When defining a Schema in 'server/models/Course.js' or 'server/models/User.js', each field specifies a 'type' and optional configuration rules:

1. Common SchemaTypes:
• 'String': Text data (supports 'trim', 'lowercase', 'uppercase', 'minlength', 'maxlength', 'enum', 'match').
• 'Number': Numeric data (supports 'min', 'max').
• 'Boolean': 'true' or 'false' flags (such as 'isActive: { type: Boolean, default: true }').
• 'Date': Timestamps (such as 'issuedAt: { type: Date, default: Date.now }').
• 'mongoose.Schema.Types.ObjectId': A 12-byte MongoDB ObjectId used to reference another document (such as 'courseCreator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }').
• Arrays: Written as '[String]' (array of strings) or '[subSchema]' (array of nested subdocuments).

2. Common Field-Level Options:
• 'required: [true, "Custom error message"]': Rejects saving if the field is missing or empty.
• 'default: "draft"': Automatically populates the default value if none is provided when creating a document.
• 'trim: true': Automatically strips leading and trailing whitespace from strings.
• 'lowercase: true': Automatically converts strings (like email addresses) to lowercase before saving.
• 'unique: true': Configures a MongoDB unique index on the field (for example, 'email' in the 'User' model).

3. Schema-Level Option — '{ timestamps: true }':
Passing '{ timestamps: true }' as the second argument to 'new mongoose.Schema(fields, { timestamps: true })' tells Mongoose to automatically add and manage two 'Date' fields on every document:
• 'createdAt': Set automatically when the document is first created.
• 'updatedAt': Updated automatically whenever the document is saved or modified.`,
        },
        {
          order: 3,
          heading: 'Creating a Model and Persisting Documents',
          body: `Once your Schema is defined, you compile it into a Model:
const Course = mongoose.model('Course', courseSchema);

How Mongoose Chooses the Collection Name:
By default, Mongoose takes the singular model name ('"Course"'), converts it to lowercase, and pluralizes it to determine the MongoDB collection name ('"courses"'). Similarly, '"User"' maps to '"users"', and '"Topic"' maps to '"topics"'.

Two Ways to Create and Save a Document:
1. Using 'Model.create(data)' (One-Step Create + Save):
   const course = await Course.create({
     title: 'Backend Development with Node.js, Express & MongoDB',
     category: 'backend',
     courseCreator: creatorUserId
   });
2. Using 'new Model(data)' followed by 'await doc.save()' (Two-Step Instantiate + Save):
   const course = new Course({
     title: 'Backend Development with Node.js, Express & MongoDB',
     category: 'backend',
     courseCreator: creatorUserId
   });
   await course.save();

Both approaches run full Schema validation, apply 'default' values, apply 'trim'/'lowercase' modifiers, generate a unique '_id', set 'createdAt'/'updatedAt', and insert the document into MongoDB.`,
        },
        {
          order: 4,
          heading: 'Querying Models Safely in Controllers and Services',
          body: `A Mongoose Model exposes asynchronous static methods for reading and updating documents:
• 'await Course.find(filter)': Returns an array of matching Mongoose documents.
• 'await Course.findOne(filter)': Returns the first matching document or 'null'.
• 'await Course.findById(id)': Shorthand for 'Course.findOne({ _id: id })'.
• 'await Course.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })': Finds a document by '_id', validates and applies the '$set' updates, and returns the updated document (because '{ new: true }' is set).

Performance Tip — '.lean()':
When an Express route only needs to read data and send it as JSON (without calling 'doc.save()'), chaining '.lean()' onto a query ('await Course.find(filter).lean()') tells Mongoose to return plain JavaScript objects instead of heavy Mongoose Document instances, making read queries significantly faster and lighter in memory.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Trying to call '.find()' or '.create()' on a Schema instead of a Model: 'courseSchema.find()' throws a 'TypeError: courseSchema.find is not a function'. Always compile the schema into a Model ('const Course = mongoose.model("Course", courseSchema)') and call 'Course.find()'.
2. Forgetting '{ new: true, runValidators: true }' in 'findByIdAndUpdate': By default, 'findByIdAndUpdate(id, update)' returns the OLD document before the update and does not run schema validators unless you pass '{ new: true, runValidators: true }'.
3. Passing Mass-Assignment 'req.body' directly into 'Model.create(req.body)' or 'findByIdAndUpdate(id, req.body)': Even when a Schema has 'strict: true', a Schema might include sensitive fields like 'role: "admin"' or 'status: "published"'. Always extract only the specific allowed fields from 'req.body' before calling 'Model.create()' or 'updateOne()'!`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing a Realistic Course Schema and Model:
1. Write a Mongoose Schema named 'courseSchema' with the following fields:
   • 'title': String, required, trimmed, max length 200.
   • 'description': String, trimmed, default empty string '""'.
   • 'status': String, enum '["draft", "published"]', default '"draft"'.
   • 'courseCreator': 'mongoose.Schema.Types.ObjectId', ref '"User"', required.
2. Enable '{ timestamps: true }' on the schema.
3. Compile 'courseSchema' into a Model named 'Course'.
4. Write a short explanation of what represents the Schema, what represents the Model, and what represents the Document when you run 'const myCourse = await Course.create({ ... })'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Mongoose follows the progression: Schema (structural blueprint) → Model (compiled collection constructor) → Document (individual record instance).
• Schemas define field types ('String', 'Number', 'Boolean', 'Date', 'ObjectId', arrays), field options ('required', 'default', 'trim', 'enum'), and '{ timestamps: true }'.
• Models are compiled via 'mongoose.model("Name", schema)' and provide static methods ('create', 'find', 'findOne', 'findById', 'findByIdAndUpdate') to interact with MongoDB.
• Always extract explicit allowed fields rather than passing raw 'req.body' into model creation or update calls to prevent mass-assignment vulnerabilities.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Realistic LearnSphere Course Schema, Model, and Document Instantiation',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

// ============================================================================
// 1. SCHEMA: The structural blueprint and rules for a Course
// ============================================================================
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Course title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'general',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    courseCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course creator reference is required'],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// ============================================================================
// 2. MODEL: Compiled constructor linked to the 'courses' collection
// ============================================================================
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

// ============================================================================
// 3. DOCUMENT: An individual instance created from the Course Model
// ============================================================================
const sampleCourseDoc = new Course({
  title: '  Backend Development with Node.js, Express & MongoDB  ',
  category: 'BACKEND',
  courseCreator: new mongoose.Types.ObjectId('6abe9dc1f15c2b4f6008ac11'),
});

console.log('Trimmed Title:', sampleCourseDoc.title);
console.log('Lowercased Category:', sampleCourseDoc.category);
console.log('Default Status:', sampleCourseDoc.status);
console.log('Creator ObjectId:', sampleCourseDoc.courseCreator.toString());

/*
Expected Output:
Trimmed Title: Backend Development with Node.js, Express & MongoDB
Lowercased Category: backend
Default Status: draft
Creator ObjectId: 6abe9dc1f15c2b4f6008ac11
*/`,
        explanation:
          'Clearly demonstrates the progression from Schema (courseSchema) to Model (Course) to Document (sampleCourseDoc), including automatic string trimming, lowercasing, default status assignment, and ObjectId typing.',
      },
    ],
    importantPoints: [
      'A Schema defines the document structure and validation rules; a Model is the compiled constructor tied to a MongoDB collection; a Document is one individual record instance.',
      'Enable { timestamps: true } on a Schema to have Mongoose automatically manage createdAt and updatedAt Date fields.',
      'Use mongoose.Schema.Types.ObjectId with ref to store references to documents in other collections (such as courseCreator referencing User).',
      'When updating with findByIdAndUpdate, always pass { new: true, runValidators: true } so schema validation runs and the updated document is returned.',
      'Never pass raw req.body directly into Model.create() or update calls; explicitly pick allowed fields to prevent mass assignment.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Official Docs: Models',
        url: 'https://mongoosejs.com/docs/models.html',
        source: 'Mongoose Official Documentation',
      },
      {
        title: 'Mongoose Official Docs: SchemaTypes',
        url: 'https://mongoosejs.com/docs/schematypes.html',
        source: 'Mongoose Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: Validation
  // ID: 6abe9dd0f15c2b4f6008ac41
  // =========================================================================
  {
    topicId: '6abe9dd0f15c2b4f6008ac41',
    title: 'Validation',
    content: {
      explanation: `One of the golden rules of backend software engineering is:
Frontend validation improves user experience (UX), but backend validation is authoritative.

Why? Because any person can bypass your React browser form completely by sending an HTTP request directly to your Express server using 'curl', Postman, or a custom script. If your backend does not validate incoming data, malformed, missing, or malicious values will be written directly into your MongoDB database.

In a Node.js, Express, and Mongoose backend, we protect data integrity at two complementary layers:
1. Request-Level Validation & Sanitization (in Express routes/middleware, checking HTTP body/params/query).
2. Schema-Level Validation (in Mongoose schemas, enforcing 'required', data types, 'enum', 'min'/'max', 'minlength'/'maxlength', and custom validators before any document can be saved to MongoDB).`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why frontend validation is only for UX while backend validation is authoritative for security and data integrity.
2. Clearly distinguish between Validation (checking whether input meets rules) and Sanitization (cleaning or normalizing input).
3. Configure Mongoose built-in validators: 'required', data type casting, 'enum', 'min'/'max', and 'minlength'/'maxlength'.
4. Write a clean, safe custom validator function in a Mongoose schema.
5. Handle Mongoose 'ValidationError' exceptions safely and enable 'runValidators: true' on update queries.`,
        },
        {
          order: 1,
          heading: 'Frontend vs. Backend Validation & Validation vs. Sanitization',
          body: `1. Frontend Validation vs. Backend Validation:
• Frontend Validation (e.g., HTML 'required' attributes or React form checks): Gives instant visual feedback to honest users so they do not have to wait for a network round-trip when they forget to fill in a field. However, frontend code runs on the client's machine and can be bypassed in seconds.
• Backend Validation (Express Middleware + Mongoose Schema): Runs inside your trusted server environment. No matter how a request arrives—browser, mobile app, or 'curl'—backend validation is the authoritative gatekeeper that decides whether data is valid.

2. Validation vs. Sanitization:
Beginners often use these two words interchangeably, but they perform two distinct jobs:
• Sanitization (Cleaning / Normalizing): Modifies or cleans the input before validation or storage so it is in a safe, canonical format. Examples include trimming leading/trailing spaces ('"  Alice  "' → '"Alice"'), lowercasing an email ('"USER@Example.com"' → '"user@example.com"'), or stripping unexpected keys.
• Validation (Rule Checking): Inspects the value and answers a strict Yes/No question: "Does this value satisfy our rules?" If 'title' is empty after trimming, or 'role' is not one of the allowed enum values, validation rejects the operation with a clear error.`,
        },
        {
          order: 2,
          heading: 'Built-In Mongoose Validators: Required, Types, Enum, Min/Max, Length',
          body: `Mongoose provides built-in validators based on each field's SchemaType:

1. All SchemaTypes — 'required':
Marks a field as mandatory. You can supply a custom message in an array:
title: { type: String, required: [true, 'Topic title is required'] }

2. String Validators — 'enum', 'minlength', 'maxlength', 'match':
• 'enum': Restricts a string to a strict whitelist of allowed values. In LearnSphere, a user's 'role' uses 'enum: ["student", "course_creator", "admin"]' and a course's 'status' uses 'enum: ["draft", "published"]'. Any other string is rejected!
• 'minlength' / 'maxlength': Enforces minimum and maximum character lengths so someone cannot submit a 1-character password or a 50-megabyte string that bloats a document.

3. Number Validators — 'min' and 'max':
Enforces numeric boundaries. For example, a topic's 'order' field uses 'min: [1, "Order must be at least 1"]', and an assessment passing score might enforce 'min: 0, max: 100'.`,
        },
        {
          order: 3,
          heading: 'Custom Validators and Handling ValidationError',
          body: `What if you need a domain-specific rule that built-in validators do not cover—such as verifying that an array of tags contains no more than 10 items, or that a URL string starts with '"https://"'?

You can define a 'validate' object on any schema field with two properties:
• 'validator': A pure function '(value) => Boolean' that returns 'true' if the value is valid and 'false' if invalid.
• 'message': A human-readable error message explaining why validation failed.

Example:
externalUrl: {
  type: String,
  validate: {
    validator: function (val) {
      return val === null || val.startsWith('https://');
    },
    message: 'External reference URL must use HTTPS (https://)'
  }
}

How Mongoose Reports Validation Failures ('ValidationError'):
When validation fails during 'doc.save()' or 'Model.create()', Mongoose throws an error with 'err.name === "ValidationError"'. The 'err.errors' object contains a key for each invalid field (for example, 'err.errors.title.message'). Your Express error-handling middleware can catch 'ValidationError' and return a clean '400 Bad Request' JSON response without crashing the server.`,
        },
        {
          order: 4,
          heading: 'Enabling Validation on Updates (runValidators: true)',
          body: `A crucial detail in Mongoose:
• 'doc.save()' and 'Model.create()' run all Schema validators automatically by default.
• Query-based update methods like 'Model.updateOne()', 'Model.updateMany()', and 'Model.findByIdAndUpdate()' do NOT run schema validators by default unless you pass the option '{ runValidators: true }'!

Always include 'runValidators: true' when updating documents via query methods:
await Course.findByIdAndUpdate(
  courseId,
  { $set: { title: newTitle, status: newStatus } },
  { new: true, runValidators: true }
);`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Relying only on frontend React form validation: An attacker can send 'POST /api/creator/courses' directly via 'curl' with invalid data. Always enforce validation on the backend.
2. Forgetting 'trim: true' alongside 'required: true' on Strings: Without 'trim: true', a string made of spaces ('"     "') passes 'required: true'! When you combine 'trim: true' and 'required: true', Mongoose trims the whitespace first, sees an empty string '""', and properly rejects it.
3. Omitting '{ runValidators: true }' on 'findByIdAndUpdate' or 'updateOne': Without 'runValidators: true', an update query could set an invalid enum value or exceed 'maxlength'.
4. Writing unsafe regular expressions in custom validators: Keep custom validators simple and deterministic (such as checking array length or 'URL' parsing) rather than complex backtracking regexes that can slow down the Node.js event loop.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Adding Sanitization and Validation Rules to a Schema:
1. Create a Mongoose schema for an 'AssessmentQuestion' with three fields:
   • 'questionText': String, trimmed, required, minimum length 10, maximum length 500.
   • 'difficulty': String, required, restricted via 'enum' to '["easy", "medium", "hard"]'.
   • 'points': Number, required, minimum 1, maximum 20.
2. Write down what happens when you attempt to validate a document with '{ questionText: "   Short  ", difficulty: "impossible", points: 50 }'. Which specific validator fails on each of the three fields?`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Frontend validation improves UX, but backend validation is authoritative because clients can bypass the browser UI entirely.
• Sanitization cleans and normalizes input (such as 'trim' and 'lowercase'), while Validation checks whether the cleaned value satisfies strict rules ('required', 'enum', 'min'/'max', 'minlength'/'maxlength', and custom validators).
• Failed Mongoose validation throws a 'ValidationError' containing field-specific error messages that map cleanly to an HTTP '400 Bad Request' response.
• Always pass '{ runValidators: true }' when executing 'updateOne' or 'findByIdAndUpdate' so schema rules are enforced on updates just as they are on document creation.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Authoritative Backend Schema Sanitization, Built-In Validators, and Custom Validation',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

const referenceLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true, // Sanitization: strips leading/trailing whitespace first
    required: [true, 'Reference title is required'],
    minlength: [3, 'Reference title must be at least 3 characters'],
    maxlength: [200, 'Reference title cannot exceed 200 characters'],
  },
  category: {
    type: String,
    trim: true,
    lowercase: true, // Sanitization: normalizes to lowercase before enum check
    enum: {
      values: ['documentation', 'specification', 'guide'],
      message: 'Category must be documentation, specification, or guide',
    },
    required: true,
  },
  priorityOrder: {
    type: Number,
    min: [1, 'Priority order must be at least 1'],
    max: [50, 'Priority order cannot exceed 50'],
    default: 1,
  },
  url: {
    type: String,
    trim: true,
    required: [true, 'Reference URL is required'],
    validate: {
      // Safe, deterministic custom validator ensuring HTTPS protocol
      validator: (value) => typeof value === 'string' && value.startsWith('https://'),
      message: 'Reference URL must start with https://',
    },
  },
});

const ReferenceLink =
  mongoose.models.ReferenceLink || mongoose.model('ReferenceLink', referenceLinkSchema);

// Testing validation with invalid inputs:
const invalidDoc = new ReferenceLink({
  title: '   ',                 // Fails 'required' after 'trim' removes spaces
  category: 'random-blog',      // Fails 'enum' whitelist
  priorityOrder: 99,            // Fails 'max: 50'
  url: 'http://insecure.test',  // Fails custom 'https://' validator
});

const validationError = invalidDoc.validateSync();
for (const [field, err] of Object.entries(validationError.errors)) {
  console.log(\`Field "\${field}" failed: \${err.message}\`);
}

/*
Expected Output:
Field "title" failed: Reference title is required
Field "category" failed: Category must be documentation, specification, or guide
Field "priorityOrder" failed: Priority order cannot exceed 50
Field "url" failed: Reference URL must start with https://
*/`,
        explanation:
          'Demonstrates how Mongoose sanitization (trim, lowercase), built-in validators (required, minlength, maxlength, enum, min, max), and custom validators work together to catch every invalid field before data reaches MongoDB.',
      },
    ],
    importantPoints: [
      'Frontend validation improves user experience, but backend validation is authoritative because HTTP requests can be sent directly to the server.',
      'Sanitization cleans and normalizes input (e.g., trim, lowercase), whereas Validation verifies that data meets strict constraints.',
      'Combine trim: true with required: true on String fields so whitespace-only strings are properly rejected.',
      'Use enum on strings (such as role or status) and min/max on numbers to enforce strict domain boundaries.',
      'Always pass { runValidators: true } in updateOne and findByIdAndUpdate so Mongoose enforces schema validation during updates.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Official Docs: Validation Guide',
        url: 'https://mongoosejs.com/docs/validation.html',
        source: 'Mongoose Official Documentation',
      },
      {
        title: 'MongoDB Manual: Schema Validation',
        url: 'https://www.mongodb.com/docs/manual/core/schema-validation/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Querying and Filtering
  // ID: 6abe9dd1f15c2b4f6008ac42
  // =========================================================================
  {
    topicId: '6abe9dd1f15c2b4f6008ac42',
    title: 'Querying and Filtering',
    content: {
      explanation: `In a real backend application, you rarely dump an entire MongoDB collection back to the client. Instead, your API needs to find specific records that match exact conditions, comparison ranges, or allowed sets—and then project only safe fields, sort the results in a predictable order, and limit how many documents are returned per page.

MongoDB and Mongoose provide expressive query operators ('$gt', '$gte', '$lt', '$lte', '$in', '$ne', '$and', '$or') and chainable query helper methods ('.select()', '.sort()', '.limit()', '.skip()') to accomplish this cleanly.

Just as importantly, this is where a critical backend security boundary lives: you must NEVER blindly pass raw client objects (like 'req.query' or 'req.body') directly into a MongoDB filter. Instead, your backend must validate and convert expected query parameters into safe, controlled query conditions to prevent NoSQL operator injection.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Build MongoDB and Mongoose queries using 'find', 'findOne', and 'findById'.
2. Use comparison query operators ('$gt', '$gte', '$lt', '$lte', '$in', '$ne') and logical operators ('$and', '$or').
3. Chain '.select()' (projection), '.sort()', '.limit()', and '.skip()' to control which fields and how many documents are returned.
4. Translate validated HTTP query parameters ('req.query') into safe Mongoose filter objects.
5. Prevent NoSQL operator injection by never passing unvalidated client objects directly into MongoDB queries.`,
        },
        {
          order: 1,
          heading: 'Comparison and Logical Query Operators',
          body: `When an exact equality match ('{ status: "published" }') is not enough, MongoDB provides query operators prefixed with '$':

1. Comparison Operators:
• '$gt' (Greater Than): Matches values strictly greater than the specified number or date (e.g., '{ order: { $gt: 3 } }').
• '$gte' (Greater Than or Equal): Matches values greater than or equal to the target (e.g., '{ score: { $gte: 70 } }').
• '$lt' (Less Than): Matches values strictly less than the target (e.g., '{ order: { $lt: 5 } }').
• '$lte' (Less Than or Equal): Matches values less than or equal to the target (e.g., '{ estimatedMinutes: { $lte: 60 } }').
• '$ne' (Not Equal): Matches all values that do not equal the target (e.g., '{ status: { $ne: "archived" } }').
• '$in' (In Array): Matches any document where the field equals one of the values in the given array (e.g., '{ category: { $in: ["backend", "database"] } }').

2. Logical Operators at a Beginner Level:
• Implicit AND: Listing multiple keys in one filter object ('{ status: "published", category: "backend" }') automatically requires BOTH conditions to be true.
• '$and': Explicitly combines multiple filter conditions that must all be true.
• '$or': Matches documents where AT LEAST ONE of the conditions in the array is true:
  Course.find({
    status: 'published',
    $or: [{ category: 'backend' }, { category: 'database' }]
  });`,
        },
        {
          order: 2,
          heading: 'Projection (.select), Sorting (.sort), and Pagination (.limit / .skip)',
          body: `In Mongoose, calling 'Course.find(filter)' without 'await' returns a chainable 'Query' object before executing the database request:

1. Field Projection with '.select()':
Controls which fields are included or excluded in the returned documents:
• Inclusion: '.select("title category status createdAt")' returns ONLY those fields (plus '_id').
• Exclusion: '.select("-passwordHash -__v")' excludes sensitive or internal fields.
In LearnSphere, the 'User' model also sets 'select: false' on the password field at the schema level so 'User.find()' never returns password hashes by default.

2. Sorting with '.sort()':
Orders the matching documents before limiting or returning them:
• Ascending order ('1'): '.sort({ order: 1 })' sorts topics from 1, 2, 3... up to 9.
• Descending order ('-1'): '.sort({ createdAt: -1 })' returns the newest courses first.

3. Limiting & Skipping for Pagination ('.limit()' and '.skip()'):
• '.limit(n)': Restricts the query to return at most 'n' documents.
• '.skip(m)': Skips the first 'm' matching documents. For page 'page' with 'limit' items per page, we calculate 'const skip = (page - 1) * limit;'.`,
        },
        {
          order: 3,
          heading: 'Critical Security Rule: Preventing NoSQL Operator Injection',
          body: `Why Must You Never Pass Raw 'req.query' or 'req.body' Directly into a MongoDB Filter?

In Express, if a URL contains '?category[$ne]=none', or if a JSON request body contains '{ "email": "admin@learnsphere.io", "password": { "$ne": "" } }', Express parses that input into a nested JavaScript object containing a MongoDB operator: '{ $ne: "" }' (Not Equal to empty string)!

Look at what happens in Vulnerable Code vs. Safe Code:

✗ VULNERABLE CODE (NEVER DO THIS):
// If req.query is { status: { $ne: 'draft' } } or arbitrary fields,
// the client controls the MongoDB query structure!
const courses = await Course.find(req.query);

✓ SAFE, AUTHORITATIVE CODE:
// 1. Explicitly build a fresh filter object with enforced server rules
const safeFilter = { status: 'published' }; // Public catalog ONLY shows published courses

// 2. Validate that optional query parameters are primitive strings
if (typeof req.query.category === 'string' && req.query.category.trim().length > 0) {
  safeFilter.category = req.query.category.trim().toLowerCase();
}

const courses = await Course.find(safeFilter)
  .select('title description category createdAt')
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();

Notice how the safe code guarantees:
1. A student can never override 'status: "published"' to peek at draft courses.
2. Because 'typeof req.query.category === "string"' is checked, any injected operator object like '{ $ne: null }' is immediately ignored or rejected!`,
        },
        {
          order: 4,
          heading: 'Step-by-Step Flow: From HTTP Query String to Safe Mongoose Query',
          body: `Let us trace how an incoming HTTP request becomes a safe database query in LearnSphere:

1. Client sends HTTP Request:
   'GET /api/courses?category=backend&page=1&limit=10'
2. Express Controller / Validation Layer:
   • Verifies 'category' is a plain string (if provided).
   • Parses 'page' and 'limit' using 'Number.parseInt()', enforcing minimum ('1') and maximum ('50') bounds.
3. Service Layer ('courseService.js'):
   • Constructs a clean 'filter' object ('{ status: "published", category: "backend" }').
   • Chains '.select()', '.sort({ createdAt: -1 })', '.skip(0)', '.limit(10)', and '.lean()'.
4. MongoDB Execution:
   • Executes the query safely and returns only the requested page of published courses.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Passing 'req.query' or 'req.body' directly into 'Model.find()', 'Model.findOne()', or 'Model.deleteOne()': This is the #1 cause of NoSQL injection vulnerabilities in Node.js apps. Always construct your filter object explicitly from validated primitive values.
2. Mixing inclusion and exclusion in the same '.select()' call: In MongoDB projection, you cannot mix including fields and excluding fields in the same projection (e.g., '.select("title -description")' throws an error), with the sole exception of excluding '_id' ('.select("title -_id")'). Choose either a list of fields to include OR a list of fields to exclude.
3. Forgetting to bound '.limit()': Never pass an unbounded user number into '.limit(Number(req.query.limit))'. Always cap it with 'Math.min(parsedLimit, 50)' so a client cannot request 10,000,000 documents at once.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing a Safe Filtered & Paginated Query Function:
1. Write an async function 'getModuleTopicsInRange(courseId, moduleId, minOrder, maxOrder)' that queries the 'Topic' model.
2. Validate that 'minOrder' and 'maxOrder' are finite numbers.
3. Build a filter that matches 'courseId', 'moduleId', and uses '$gte' and '$lte' on the 'order' field.
4. Chain '.select("title order updatedAt")', '.sort({ order: 1 })', and '.lean()'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Mongoose queries use 'find', 'findOne', and 'findById' along with comparison operators ('$gt', '$gte', '$lt', '$lte', '$in', '$ne') and logical operators ('$and', '$or').
• Chain '.select()' to project specific fields, '.sort()' to order results, and '.skip()' / '.limit()' to paginate collections efficiently.
• Never pass raw 'req.query' or 'req.body' objects directly into a MongoDB filter; always validate primitive types and build a clean filter object to prevent NoSQL operator injection.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Safe Query Construction with Comparison Operators, Projection, Sorting, and Pagination',
        language: 'javascript',
        code: `/**
 * Safely builds a MongoDB filter from validated HTTP query parameters
 * and demonstrates comparison operators ($gte, $lte, $in), projection, and sorting.
 */
function buildSafeTopicQueryParams(rawQuery = {}) {
  // 1. Always start with an explicit, server-controlled filter object
  const filter = {};

  // 2. Safely validate string array or comma-separated categories using $in
  const allowedCategories = ['backend', 'database', 'security'];
  if (typeof rawQuery.category === 'string') {
    const normalized = rawQuery.category.trim().toLowerCase();
    if (allowedCategories.includes(normalized)) {
      filter.category = { $in: [normalized] };
    }
  }

  // 3. Safely validate numeric range filters using $gte and $lte
  const minOrder = Number.parseInt(rawQuery.minOrder, 10);
  const maxOrder = Number.parseInt(rawQuery.maxOrder, 10);
  if (Number.isInteger(minOrder) && minOrder >= 1) {
    filter.order = { ...(filter.order || {}), $gte: minOrder };
  }
  if (Number.isInteger(maxOrder) && maxOrder >= 1) {
    filter.order = { ...(filter.order || {}), $lte: maxOrder };
  }

  // 4. Safe bounded pagination
  const page = Math.max(1, Number.parseInt(rawQuery.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(rawQuery.limit, 10) || 10));
  const skip = (page - 1) * limit;

  return { filter, projection: 'title category order updatedAt', sort: { order: 1 }, skip, limit };
}

// Test 1: Valid query parameters
console.log(
  'Valid Query Plan:',
  JSON.stringify(buildSafeTopicQueryParams({ category: 'BACKEND', minOrder: '2', maxOrder: '8', page: '1', limit: '5' }))
);

// Test 2: Attempted NoSQL Operator Injection ({ category: { $ne: null } }) is safely ignored!
console.log(
  'Blocked Injection Plan:',
  JSON.stringify(buildSafeTopicQueryParams({ category: { $ne: null }, limit: '999999' }))
);

/*
Expected Output:
Valid Query Plan: {"filter":{"category":{"$in":["backend"]},"order":{"$gte":2,"$lte":8}},"projection":"title category order updatedAt","sort":{"order":1},"skip":0,"limit":5}
Blocked Injection Plan: {"filter":{},"projection":"title category order updatedAt","sort":{"order":1},"skip":0,"limit":50}
*/`,
        explanation:
          'Demonstrates how to convert untrusted HTTP query parameters into a safe MongoDB filter using $in, $gte, and $lte, while rejecting injected operator objects and bounding pagination limits.',
      },
    ],
    importantPoints: [
      'Use comparison operators ($gt, $gte, $lt, $lte, $in, $ne) and logical operators ($and, $or) to express rich query conditions in MongoDB.',
      'Use .select() to project only necessary fields (or exclude sensitive fields), .sort() to order results, and .skip()/.limit() for bounded pagination.',
      'Never pass raw req.query or req.body objects directly into MongoDB queries; doing so exposes the backend to NoSQL operator injection.',
      'Always verify that user-supplied filter values are primitive strings or numbers before placing them into a query filter object.',
      'Chain .lean() onto read-only Mongoose queries to return plain JavaScript objects with lower memory and CPU overhead.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Official Docs: Queries Guide',
        url: 'https://mongoosejs.com/docs/queries.html',
        source: 'Mongoose Official Documentation',
      },
      {
        title: 'MongoDB Manual: Query and Projection Operators',
        url: 'https://www.mongodb.com/docs/manual/reference/operator/query/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 9: References and Relationships
  // ID: 6abe9dd1f15c2b4f6008ac43
  // =========================================================================
  {
    topicId: '6abe9dd1f15c2b4f6008ac43',
    title: 'References and Relationships',
    content: {
      explanation: `A common misconception among beginners is that because MongoDB is a non-relational (NoSQL) document database, it cannot represent relationships between entities. That is false! Real applications—including LearnSphere—are full of connected entities: a Course Creator owns Courses, a Course contains Modules, a Module contains Topics, and Students enroll in Courses.

In MongoDB and Mongoose, you model relationships using two complementary patterns:
1. Embedding (Denormalization): Storing related subdocuments directly inside a parent document (for example, storing 'sections' and 'codeExamples' directly inside a 'Topic' document).
2. Referencing (Normalization): Storing a document's 'ObjectId' inside another document in a separate collection (for example, storing 'courseId' and 'moduleId' inside a 'Topic' document, or storing 'userId' and 'courseId' inside an 'Enrollment' document).

Understanding One-to-One, One-to-Many, and Many-to-Many relationships—and knowing when to embed versus when to reference using Mongoose's 'ref' option and '.populate()'—is the capstone skill of MongoDB data modeling.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain how document databases represent relationships using Embedding and Referencing.
2. Model One-to-One, One-to-Many, and Many-to-Many relationships at a conceptual and practical level.
3. Evaluate when Embedding is the right choice versus when Referencing ('ObjectId') is the right choice.
4. Configure 'ObjectId' references in Mongoose Schemas using 'type: mongoose.Schema.Types.ObjectId' and 'ref'.
5. Explain how Mongoose's '.populate()' method resolves referenced documents and how LearnSphere models 'Course → Module → Topic' and 'User → Enrollment → Course'.`,
        },
        {
          order: 1,
          heading: 'Embedding vs. Referencing Explained',
          body: `When two pieces of data are related, MongoDB gives you two ways to store them:

Pattern 1 — Embedding (Subdocuments Inside One Document):
You store the child data directly inside a field or array of the parent document.
• LearnSphere Example: Inside every 'Topic' document, the 'content.sections' array, 'codeExamples' array, 'externalReferences' array, and 'videos' object are embedded directly inside the Topic document.
• Advantage: Fetching the Topic document in a single database read returns the explanation, all sections, and all code examples together with zero extra queries!

Pattern 2 — Referencing (Linking Separate Collections via ObjectId):
You store the related records in separate collections and link them using an 'ObjectId' field.
• LearnSphere Example: 'Course', 'Module', and 'Topic' are three separate collections:
  Course ('_id: 6abe9dc2f15c2b4f6008ac1c')
     ↑  referenced by 'module.courseId'
  Module ('_id: 6abe9dcef15c2b4f6008ac3a', 'courseId: 6abe9dc2f15c2b4f6008ac1c')
     ↑  referenced by 'topic.moduleId' and 'topic.courseId'
  Topic  ('_id: 6abe9dd1f15c2b4f6008ac43', 'moduleId: ...', 'courseId: ...')
• Advantage: Listing a course's 8 module titles on a syllabus sidebar does not have to load the massive educational text of all 73 topics into memory! Each Topic can also be updated, reordered, or queried independently.`,
        },
        {
          order: 2,
          heading: 'One-to-One, One-to-Many, and Many-to-Many in LearnSphere',
          body: `Let us see how the three classic relationship cardinalities work in MongoDB using real LearnSphere architecture examples:

1. One-to-One (1:1):
One record is associated with at most one related configuration object.
• Example: One 'Topic' has one 'videos' object ('{ english, telugu, hindi }'). Because this object is small and belongs exclusively to that topic, embedding it directly inside the 'Topic' document is clean and simple.

2. One-to-Many (1:N):
One parent record owns multiple child records.
• Small, Bounded 1:N (Use Embedding): One 'Topic' has 6 to 8 'sections' and 1 to 3 'codeExamples'. Because they are bounded in count and always displayed when reading that topic, they are embedded inside the 'Topic' document.
• Large or Independently Queried 1:N (Use Referencing): One 'Course' has 8 'Modules' and 73 'Topics'. Each 'Module' document stores 'courseId', and each 'Topic' document stores both 'courseId' and 'moduleId' as 'ObjectId' references.

3. Many-to-Many (M:N):
Many students can enroll in many courses, and each course can have many enrolled students.
• Why We Use a Join/Bridge Collection ('Enrollment'):
If we embedded an array of 'enrolledStudentIds' inside the 'Course' document, a popular course with 500,000 students would grow huge and hit document size limits. Instead, LearnSphere models Many-to-Many using a dedicated 'Enrollment' collection:
   User ('_id')  ←──  Enrollment ('userId', 'courseId', 'status', 'enrolledAt')  ──→  Course ('_id')
Each Enrollment document holds a reference to one 'User' and one 'Course', plus metadata about that specific enrollment (such as when the student enrolled and their completion status)!`,
        },
        {
          order: 3,
          heading: 'Decision Guide: When to Embed vs. When to Reference',
          body: `Ask these four engineering questions whenever you design a MongoDB schema:

Choose EMBEDDING when:
1. The child data is owned exclusively by one parent document and never queried on its own.
2. The child data is always needed at the exact same time the parent document is loaded.
3. The array of embedded items is small and strictly bounded (for example, 5–10 sections per topic).

Choose REFERENCING ('ObjectId') when:
1. The child collection can grow large or unbounded (such as Enrollments, Notes, AssessmentAttempts, or RefreshSessions).
2. The related documents need to be queried, updated, or paginated independently (for example, loading only 1 Topic at a time in the Topic Reader without loading the other 72 Topics).
3. The relationship is Many-to-Many (such as 'User ↔ Enrollment ↔ Course') or shared across multiple records (such as 'course.courseCreator' referencing a 'User' document).`,
        },
        {
          order: 4,
          heading: 'Mongoose ref and .populate() Concept',
          body: `How do you declare and resolve an 'ObjectId' reference in Mongoose?

Step 1 — Declare 'ref' in the Schema:
In your Mongoose schema, set the field's 'type' to 'mongoose.Schema.Types.ObjectId' and specify 'ref' with the exact model name it points to:
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseCreator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Tells Mongoose this ObjectId points to the 'User' model
    required: true
  }
});

Step 2 — Resolve the Reference with '.populate()' When Needed:
• Without '.populate()':
  'const course = await Course.findById(courseId);'
  Here, 'course.courseCreator' is just the raw 24-character 'ObjectId' (e.g., 'ObjectId("6abe9dc1f15c2b4f6008ac11")').
• With '.populate("courseCreator", "name email role")':
  'const course = await Course.findById(courseId).populate("courseCreator", "name email role");'
  Mongoose automatically performs a follow-up query on the 'users' collection and replaces 'course.courseCreator' in the returned object with the populated user object containing only the safe selected fields ('{ _id, name, email, role }')!

Security Tip with '.populate()':
Always pass the second argument to '.populate(field, "name email")' to whitelist which fields of the referenced document are included, so sensitive fields are never accidentally exposed in API responses.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Embedding unbounded arrays inside a parent document: Never store an array of every student enrollment or every assessment attempt inside the 'Course' document. Use a separate collection ('Enrollment', 'AssessmentAttempt') with 'ObjectId' references.
2. Calling '.populate("user")' without selecting safe fields: Always specify the second argument (e.g., '.populate("courseCreator", "name email")') so you only fetch and expose the exact public fields needed.
3. Mismatching the 'ref' string with the Model name: If you registered your model as 'mongoose.model("User", userSchema)', then 'ref' must be '"User"' (case-sensitive), not '"users"' or '"user"'.
4. Forgetting hierarchical ownership verification on referenced IDs: In a nested URL like '/api/creator/courses/:courseId/modules/:moduleId/topics/:topicId', do not query Topic by 'topicId' alone! Always query with '{ _id: topicId, moduleId, courseId }' so a user cannot access a topic belonging to a different module or course.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Designing LearnSphere Relationships:
1. Sketch the Mongoose Schema fields for a 'Note' model where a student saves personal study notes on a specific topic inside a course.
2. Include three 'ObjectId' reference fields ('userId' referencing '"User"', 'courseId' referencing '"Course"', and 'topicId' referencing '"Topic"') plus a 'content' String field.
3. Explain why 'Note' documents should be stored in their own 'notes' collection referencing 'User' and 'Topic' rather than being embedded inside the 'Topic' document.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• MongoDB models relationships using two patterns: Embedding (nesting bounded subdocuments inside a parent document) and Referencing (storing 'ObjectId' links across separate collections).
• In LearnSphere, 'Topic' embeds its 'sections' and 'codeExamples' (bounded 1:N), 'Course → Module → Topic' uses 'ObjectId' references (hierarchical 1:N), and 'User → Enrollment → Course' uses a dedicated join collection for Many-to-Many relationships.
• Mongoose's 'ref' property links an 'ObjectId' field to another Model, and '.populate("field", "selectedFields")' resolves the referenced document's public fields.
• Always verify hierarchical references ('{ _id: topicId, moduleId, courseId }') in backend queries to enforce strict ownership and hierarchy boundaries.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Modeling Course -> Module -> Topic and User -> Enrollment -> Course with Mongoose ref',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

// ============================================================================
// 1. Hierarchical One-to-Many (Course -> Module -> Topic) with Embedded Content
// ============================================================================
const topicSchema = new mongoose.Schema(
  {
    // Referencing parent Course and Module via ObjectId + ref
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },

    // Embedding bounded sections directly inside the Topic document
    content: {
      explanation: { type: String, default: '' },
      sections: [
        {
          order: { type: Number, default: 0 },
          heading: { type: String, trim: true },
          body: { type: String, trim: true },
        },
      ],
    },
  },
  { timestamps: true }
);

// ============================================================================
// 2. Many-to-Many Join Collection (User -> Enrollment -> Course)
// ============================================================================
const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Example of how a service queries a Topic with strict hierarchy scoping
// and how .populate() resolves a reference safely:
/*
  const topic = await Topic.findOne({ _id: topicId, moduleId, courseId })
    .populate('courseId', 'title category status')
    .lean();
*/

console.log('Topic courseId ref model:', topicSchema.path('courseId').options.ref);
console.log('Topic moduleId ref model:', topicSchema.path('moduleId').options.ref);
console.log('Enrollment userId ref model:', enrollmentSchema.path('userId').options.ref);
console.log('Enrollment courseId ref model:', enrollmentSchema.path('courseId').options.ref);

/*
Expected Output:
Topic courseId ref model: Course
Topic moduleId ref model: Module
Enrollment userId ref model: User
Enrollment courseId ref model: Course
*/`,
        explanation:
          'Demonstrates how LearnSphere combines Embedding (content.sections inside Topic) and Referencing (Course -> Module -> Topic and User -> Enrollment -> Course using ObjectId and ref).',
      },
    ],
    importantPoints: [
      'MongoDB represents relationships through two core patterns: Embedding (nested subdocuments) and Referencing (ObjectId links across collections).',
      'Embed data when it is small, strictly bounded, owned by one parent document, and always loaded together (such as sections inside a Topic).',
      'Reference data via ObjectId when collections grow large, are queried independently (Course -> Module -> Topic), or form Many-to-Many relationships (User -> Enrollment -> Course).',
      'Use type: mongoose.Schema.Types.ObjectId with ref: "ModelName" in Mongoose schemas, and use .populate("field", "safeFields") to resolve references.',
      'Always scope nested resource queries by their parent IDs (e.g., { _id: topicId, moduleId, courseId }) to enforce strict hierarchy integrity.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Official Docs: Populate (References)',
        url: 'https://mongoosejs.com/docs/populate.html',
        source: 'Mongoose Official Documentation',
      },
      {
        title: 'MongoDB Manual: Data Modeling — Embedded vs. Normalized Data Models',
        url: 'https://www.mongodb.com/docs/manual/core/data-model-design/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
