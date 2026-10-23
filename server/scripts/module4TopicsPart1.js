/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 4 — MongoDB and Mongoose Content (Part 1: Topics 1–5)
 */

export const module4TopicsPart1 = [
  // =========================================================================
  // TOPIC 1: What Is MongoDB?
  // ID: 6abe9dcef15c2b4f6008ac3b
  // =========================================================================
  {
    topicId: '6abe9dcef15c2b4f6008ac3b',
    title: 'What Is MongoDB?',
    content: {
      explanation: `When an Express.js server stores courses, users, or notes in a JavaScript array in memory, all of that data vanishes the moment the server restarts. A real production backend needs a persistent database—a specialized software system that stores data durably on disk, indexes it for fast lookups, and allows safe concurrent reads and writes.

MongoDB is an open-source, cross-platform NoSQL document database. Instead of storing data in rigid rows and columns inside predefined tables like traditional relational (SQL) databases, MongoDB stores data as self-contained, JSON-like records called Documents inside Collections.

Because MongoDB documents closely mirror the structure of JavaScript objects (key-value pairs, nested objects, and arrays), MongoDB pairs naturally with Node.js and Express.js backends. However, MongoDB is not automatically "better than SQL"—relational and document databases each have distinct strengths and trade-offs that every backend engineer must understand.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define MongoDB as a NoSQL document-oriented database and explain why NoSQL databases were created.
2. Compare relational (SQL) databases with document (NoSQL) databases at a beginner level.
3. Explain what a MongoDB document is, how BSON (Binary JSON) works under the hood, and what flexible schema structure means.
4. Describe where MongoDB fits inside a Node.js and Express.js backend architecture.
5. Evaluate when MongoDB is a strong fit for an application and identify its trade-offs compared with relational databases.`,
        },
        {
          order: 1,
          heading: 'Why NoSQL Databases Exist & Relational vs. Document Databases',
          body: `For decades, Relational Database Management Systems (RDBMS) such as PostgreSQL, MySQL, and Oracle have been the standard way to store structured data. Relational databases organize data into tables made of rows and fixed columns, and use Structured Query Language (SQL) to join data across multiple tables.

Why did engineers create NoSQL ("Not Only SQL") databases like MongoDB?
As modern web applications grew to handle rapidly evolving product features, hierarchical nested data, and horizontal scaling across distributed server clusters, developers encountered two common challenges with strict tabular schemas:
1. Object-Relational Impedance Mismatch: In application code (like JavaScript), a Course naturally contains an array of tags and nested metadata objects. Storing that single object in a strict relational database often requires splitting it across three or four separate tables and running multi-table JOIN queries on every read.
2. Schema Rigidity During Rapid Iteration: In a traditional relational table, adding a new optional attribute or storing items with slightly different structures requires altering the table definition across the entire dataset.

Real-World Analogy — Standardized Spreadsheet vs. Structured Filing Folder:
• Relational Database (SQL Table): Like a strict accounting spreadsheet where every single row must have the exact same columns. If one item needs a list of 4 tags, you have to create a second spreadsheet and link them by ID.
• Document Database (MongoDB Collection): Like a cabinet of labeled filing folders where each folder (Document) holds a complete, self-contained digital form with fields, nested sections, and bulleted lists kept together in one place.`,
        },
        {
          order: 2,
          heading: 'MongoDB Documents, BSON, and Flexible Structure',
          body: `In MongoDB, the fundamental unit of data is a Document. When you view a MongoDB document in your code or terminal, it looks almost identical to a JSON object:

{
  "_id": ObjectId("6abe9dc2f15c2b4f6008ac1c"),
  "title": "Backend Development with Node.js, Express & MongoDB",
  "category": "backend",
  "status": "draft",
  "tags": ["nodejs", "express", "mongodb"],
  "metadata": {
    "estimatedHours": 24,
    "difficulty": "beginner"
  },
  "createdAt": ISODate("2026-10-01T17:52:10.000Z")
}

How BSON Works Under the Hood:
Although we write and read documents using JSON syntax, MongoDB actually stores documents on disk and transmits them over the network in a binary-encoded format called BSON (Binary JSON). BSON extends standard JSON in two critical ways:
1. Speed and Efficiency: BSON encodes length prefixes and type information directly in binary, allowing MongoDB to scan and parse specific fields rapidly without parsing an entire text string character by character.
2. Richer Data Types: Plain JSON only supports strings, numbers, booleans, arrays, objects, and null. BSON adds native support for 'ObjectId' (unique 12-byte identifiers), 'Date' (exact UTC timestamps), 32-bit and 64-bit integers, 'Decimal128' (high-precision financial numbers), and binary buffers.

What "Flexible Document Structure" Means:
MongoDB collections are often called "schema-flexible" (or "schemaless" at the database engine level). Two documents in the same collection do not technically have to share the exact same fields. However, in professional Node.js applications, we almost always enforce a consistent application-level schema (using Mongoose or MongoDB Schema Validation) so our data stays predictable and clean.`,
        },
        {
          order: 3,
          heading: 'Key Terminology',
          body: `• Database: A physical or logical container for collections of data in a database server.
• NoSQL ("Not Only SQL"): A category of non-relational databases (including document, key-value, wide-column, and graph databases) designed for flexible data models and horizontal scalability.
• Document Database: A NoSQL database (such as MongoDB) that stores each record as a structured document containing key-value pairs, nested objects, and arrays.
• Document: A single record in MongoDB, analogous to a row in a relational database table, represented as a BSON object.
• Collection: A grouping of MongoDB documents within a database, analogous to a table in a relational database.
• BSON (Binary JSON): The binary serialization format MongoDB uses to store documents and support rich data types like ObjectId and Date.
• Primary Key (_id): Every MongoDB document is required to have a unique '_id' field that serves as its primary key within the collection.`,
        },
        {
          order: 4,
          heading: 'Where MongoDB Fits in a Node.js Backend & Trade-Offs',
          body: `Let us trace where MongoDB sits inside a full-stack application like LearnSphere:

Client (React Browser App)
   ↓  HTTP Request (JSON payload)
Express.js Server (Routes → Middleware → Controllers → Services)
   ↓  Mongoose / MongoDB Driver Query (BSON over TCP)
MongoDB Database Server (Reads/Writes Collections & Documents)

When Is MongoDB a Good Choice?
• Content management systems, learning platforms, and catalogs where records naturally contain nested sections, code examples, and arrays.
• Applications built with JavaScript/TypeScript where keeping a unified JSON-like data representation from database to API to frontend reduces data-transformation boilerplate.
• Systems that require horizontal scaling (sharding data across multiple servers) or evolving document attributes.

Limitations and Trade-Offs Compared with Relational (SQL) Databases:
 MongoDB is NOT a silver bullet, and it is not simply "better than SQL." Database selection depends on your data's access patterns:
1. Complex Multi-Table Joins & Analytics: Relational databases (like PostgreSQL) excel at complex ad-hoc analytical queries that join many normalized tables. In MongoDB, joining collections via '$lookup' or '.populate()' is more expensive than reading a self-contained document.
2. Data Duplication if Poorly Modeled: If you embed data that changes frequently in many documents instead of referencing it properly, updating that data requires updating multiple documents.
3. Unconstrained Growth Without Validation: Because MongoDB does not enforce a strict table schema by default, failing to validate inputs in your Node.js layer can lead to inconsistent documents.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Believing "NoSQL" means "No Structure Needed": Just because MongoDB allows flexible documents does not mean you should dump arbitrary, unvalidated objects into a collection. Always design your document structure carefully and validate every field on the backend.
2. Assuming MongoDB is always better (or worse) than SQL: Both relational and document databases power massive production systems. Choose based on how your data is structured and queried.
3. Embedding unbounded arrays inside a single document: A single MongoDB document has a maximum BSON size limit of 16 megabytes. Never store an infinitely growing list (such as millions of log entries or thousands of student enrollments) inside an array on one document—store those as separate documents in their own collection.
4. Confusing JSON text with BSON types: Remember that in MongoDB, '_id' is usually an 'ObjectId' instance and 'createdAt' is a BSON 'Date' object, not plain strings.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Modeling a Course Entity in Relational vs. Document Form:
1. Imagine a Course in LearnSphere that has a 'title', 'category', 'status', an array of 3 'learningObjectives' strings, and a nested 'instructorNotes' object containing 'targetAudience' and 'prerequisites'.
2. Write out how this single course record looks as a MongoDB JSON/BSON document.
3. Next, list how many separate tables you would need in a strict relational database to store the course and its multi-valued 'learningObjectives' list without violating first normal form.
4. Write two sentences explaining why a document model is convenient when loading a single course's overview page, and one scenario where a separate collection (referencing) is still needed (for example, tracking thousands of individual student enrollments).`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• MongoDB is a NoSQL document database that stores records as BSON (Binary JSON) documents inside collections rather than rows and columns in relational tables.
• BSON extends JSON with binary efficiency and rich data types including 'ObjectId' and 'Date'.
• In a Node.js and Express backend, controllers and services communicate with MongoDB to persist and query application data permanently.
• MongoDB is not universally "better than SQL"; it excels at hierarchical, document-centric data and rapid iteration, whereas relational databases excel at heavily normalized multi-table joins and complex relational constraints.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Comparing a Relational Table Row Split vs. a Self-Contained MongoDB Document',
        language: 'javascript',
        code: `// 1. In a Node.js backend, our application data naturally looks like a structured object:
const courseDocument = {
  _id: '6abe9dc2f15c2b4f6008ac1c',
  title: 'Backend Development with Node.js, Express & MongoDB',
  category: 'backend',
  status: 'draft',
  importantPoints: [
    'MongoDB stores data as BSON documents inside collections.',
    'Every document has a unique _id primary key.',
    'Always validate document structure in the backend.'
  ],
  stats: {
    moduleCount: 8,
    topicCount: 73
  },
  createdAt: new Date('2026-10-01T17:52:10.000Z')
};

// 2. Reading nested fields and array items directly in JavaScript:
console.log('Course Title:', courseDocument.title);
console.log('Total Modules:', courseDocument.stats.moduleCount);
console.log('First Revision Point:', courseDocument.importantPoints[0]);

/*
Expected Output:
Course Title: Backend Development with Node.js, Express & MongoDB
Total Modules: 8
First Revision Point: MongoDB stores data as BSON documents inside collections.
*/`,
        explanation:
          'Demonstrates how a single MongoDB document represents key-value fields, an embedded array of strings, and a nested object in a structure that maps directly to a JavaScript object in Node.js.',
      },
    ],
    importantPoints: [
      'MongoDB is a NoSQL document database that stores data in BSON (Binary JSON) documents inside collections.',
      'Each document is a self-contained record made of field-value pairs, nested objects, and arrays, always identified by a unique _id primary key.',
      'BSON provides fast binary encoding and supports rich data types beyond plain JSON, such as ObjectId and Date.',
      'In a backend architecture, Express routes and services query MongoDB to persist data durably across server restarts.',
      'MongoDB is not automatically "better than SQL"—database choice depends on your application data model, relationship patterns, and query requirements.',
    ],
    externalReferences: [
      {
        title: 'MongoDB Manual: Introduction to MongoDB',
        url: 'https://www.mongodb.com/docs/manual/introduction/',
        source: 'MongoDB Official Documentation',
      },
      {
        title: 'MongoDB Manual: Documents and BSON Structure',
        url: 'https://www.mongodb.com/docs/manual/core/document/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Databases, Collections and Documents
  // ID: 6abe9dcef15c2b4f6008ac3c
  // =========================================================================
  {
    topicId: '6abe9dcef15c2b4f6008ac3c',
    title: 'Databases, Collections and Documents',
    content: {
      explanation: `To work effectively with MongoDB, you need a crystal-clear mental model of how data is organized from the top-level server deployment all the way down to an individual data field.

MongoDB organizes data in a strict five-level hierarchy:
MongoDB Server / Database Deployment → Database → Collection → Document → Field

Understanding each level of this hierarchy—along with how MongoDB generates unique '_id' ('ObjectId') values and how BSON represents nested documents and arrays—gives you the exact vocabulary needed to design, query, and debug MongoDB databases.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Trace the complete MongoDB structural hierarchy: MongoDB Server/Deployment → Database → Collection → Document → Field.
2. Define and distinguish Databases, Collections, Documents, and Fields with concrete LearnSphere examples.
3. Explain the purpose of the mandatory '_id' field and how a 12-byte 'ObjectId' (24 hexadecimal characters) is structured.
4. Compare plain text JSON with binary BSON and explain how nested subdocuments and arrays are stored.
5. Apply naming and structural best practices for collections, documents, and fields.`,
        },
        {
          order: 1,
          heading: 'The Complete MongoDB Structural Hierarchy',
          body: `Let us walk step by step from the outermost container to the smallest unit of data:

MongoDB Server / Database Deployment
   ↓  (hosts one or more isolated databases)
Database (e.g., 'learnsphere')
   ↓  (groups related collections by domain entity)
Collection (e.g., 'users', 'courses', 'modules', 'topics')
   ↓  (contains individual records as BSON documents)
Document (e.g., a single topic record for "What Is MongoDB?")
   ↓  (contains individual key-value pairs)
Field (e.g., 'title: "What Is MongoDB?"', 'order: 1')

1. MongoDB Server / Deployment:
The running MongoDB database process ('mongod') or managed cluster that listens for network connections from your Node.js backend. One deployment can host multiple completely isolated databases.

2. Database:
A logical namespace and container for collections. Typically, one application environment uses one database (for example, 'learnsphere_dev' for local development and 'learnsphere_prod' for production).

3. Collection:
A group of related documents stored within a database. Each entity type in your application gets its own collection—such as 'users', 'courses', 'modules', 'topics', and 'enrollments'. By convention, MongoDB collection names are lowercase and plural.

4. Document:
A single record inside a collection. For example, inside the 'courses' collection, each course is stored as one document.

5. Field:
A single key-value pair inside a document, where the key (field name) is a string and the value can be a BSON primitive (String, Number, Boolean, Date, ObjectId, null), a nested object (subdocument), or an array.`,
        },
        {
          order: 2,
          heading: 'The _id Field and MongoDB ObjectId Explained',
          body: `Every single document stored in a MongoDB collection MUST have a field named '_id'.
• '_id' acts as the primary key of the document.
• MongoDB automatically builds a unique index on '_id' for every collection, guaranteeing that no two documents in the same collection can ever share the same '_id' and making lookups by '_id' ('findById') extremely fast.
• '_id' is immutable: once a document is inserted, its '_id' value can never be changed.

What Is an ObjectId?
If you insert a document without specifying an '_id', MongoDB automatically generates a 12-byte 'ObjectId' value. When displayed as a string, those 12 bytes are written as 24 hexadecimal characters (` + '`0-9`' + ` and ` + '`a-f`' + `), such as:
'6abe9dcef15c2b4f6008ac3c'

How the 12 Bytes of an ObjectId Are Built:
• Bytes 1–4 (8 hex chars): A 4-byte UNIX timestamp measuring the exact second the ObjectId was created.
• Bytes 5–9 (10 hex chars): A 5-byte random value unique to the machine and process.
• Bytes 10–12 (6 hex chars): A 3-byte incrementing counter initialized to a random value.

Because of this structure, MongoDB drivers can generate globally unique 'ObjectId' values immediately without waiting for a central auto-increment counter lock! And because a valid 'ObjectId' string is always 24 hexadecimal characters, backend APIs can validate whether a URL parameter like ':courseId' is a valid 'ObjectId' before ever querying the database.`,
        },
        {
          order: 3,
          heading: 'JSON vs. BSON, Nested Documents, and Arrays',
          body: `1. JSON vs. BSON:
• JSON (JavaScript Object Notation) is a human-readable text format used in HTTP request and response bodies. It supports only 6 data types: string, number, boolean, null, array, and object.
• BSON (Binary JSON) is MongoDB's binary storage format. It supports all JSON types plus specialized database types like 'ObjectId', 'Date' ('ISODate'), 'Int32', 'Int64', and 'Decimal128'.

2. Nested Documents (Embedded Subdocuments):
A field inside a MongoDB document can hold another object as its value. For example, in LearnSphere's 'topics' collection, the 'videos' field is a nested document:
"videos": {
  "english": null,
  "telugu": null,
  "hindi": null
}
And the 'content' field is a nested document containing 'explanation' and an array of 'sections'.

3. Arrays in Documents:
A field can also hold an ordered list of values—either primitive values (such as 'importantPoints: ["Point 1", "Point 2"]') or an array of nested subdocuments (such as 'codeExamples: [{ title: "...", language: "javascript", code: "..." }]').`,
        },
        {
          order: 4,
          heading: 'Realistic Example: How LearnSphere Represents a Topic Document',
          body: `Let us inspect a realistic document inside the 'topics' collection of the 'learnsphere' database:

Database: learnsphere
Collection: topics
Document:
{
  "_id": ObjectId("6abe9dcef15c2b4f6008ac3c"),
  "courseId": ObjectId("6abe9dc2f15c2b4f6008ac1c"),
  "moduleId": ObjectId("6abe9dcef15c2b4f6008ac3a"),
  "title": "Databases, Collections and Documents",
  "order": 2,
  "content": {
    "explanation": "MongoDB organizes data in a five-level hierarchy...",
    "sections": [
      {
        "_id": ObjectId("6abe9dd2f15c2b4f6008ac50"),
        "order": 0,
        "heading": "Learning Objectives",
        "body": "By the end of this topic..."
      }
    ]
  },
  "importantPoints": [
    "Hierarchy: Deployment -> Database -> Collection -> Document -> Field",
    "Every document requires a unique _id primary key"
  ],
  "videos": {
    "english": null,
    "telugu": null,
    "hindi": null
  },
  "createdAt": ISODate("2026-10-01T17:52:14.000Z"),
  "updatedAt": ISODate("2026-10-05T12:00:00.000Z")
}

Notice how a single Topic document uses:
• 'ObjectId' fields ('_id', 'courseId', 'moduleId') to identify itself and link to its parent Course and Module.
• Primitive fields ('title' as a String, 'order' as a Number).
• Nested documents ('content', 'videos').
• Arrays of primitives ('importantPoints') and arrays of subdocuments ('content.sections').
• Native BSON 'Date' timestamps ('createdAt', 'updatedAt').`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Confusing a Collection with a Database: A database (like 'learnsphere') is the container for your entire application's data; a collection (like 'users' or 'courses') holds documents of one specific entity type inside that database.
2. Comparing an ObjectId directly with a string using '===' in JavaScript: In Node.js, 'doc._id' is an ObjectId object instance, so 'doc._id === "6abe9dcef15c2b4f6008ac3c"' evaluates to 'false'! Always convert the ObjectId to a string first using 'doc._id.toString() === targetIdString' or 'doc._id.equals(otherId)'.
3. Passing invalid string IDs into ObjectId queries: An ObjectId hex string must be exactly 24 hexadecimal characters. Passing '"123"' or '"abc"' into a MongoDB ObjectId query causes a CastError unless you validate it first.
4. Using inconsistent field naming conventions: Stick to camelCase field names (such as 'courseId', 'createdAt', 'importantPoints') consistently across your documents.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Designing a Collection Document Structure:
1. Suppose you are designing a 'modules' collection for LearnSphere.
2. Write out a complete sample document for "Module 4 — MongoDB and Mongoose" containing:
   • '_id' (a 24-character hex ObjectId string)
   • 'courseId' (referencing the parent course ObjectId)
   • 'title' (String)
   • 'description' (String)
   • 'order' (Number)
   • 'createdAt' and 'updatedAt' (ISO Date strings)
3. Identify each part of the five-level hierarchy for your sample: Deployment → Database → Collection → Document → Field.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• MongoDB organizes data in a clear hierarchy: MongoDB Server/Deployment → Database → Collection → Document → Field.
• A Database groups collections for an application; a Collection groups documents of a specific entity type (such as 'users' or 'topics'); a Document is an individual record; a Field is a key-value pair inside a document.
• Every document has a unique, immutable '_id' field, which by default is a 12-byte 'ObjectId' represented as a 24-character hexadecimal string.
• BSON supports primitive values, nested subdocuments, arrays, 'ObjectId' references, and native 'Date' timestamps.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Inspecting Hierarchy, ObjectId Format, Nested Documents, and Arrays in Node.js',
        language: 'javascript',
        code: `// Validating a 24-character hexadecimal MongoDB ObjectId string
function isValidObjectIdHex(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

// A realistic document structure from the 'topics' collection in the 'learnsphere' database
const topicDoc = {
  _id: '6abe9dcef15c2b4f6008ac3c',
  courseId: '6abe9dc2f15c2b4f6008ac1c',
  moduleId: '6abe9dcef15c2b4f6008ac3a',
  title: 'Databases, Collections and Documents',
  order: 2,
  content: {
    explanation: 'Hierarchy: Deployment -> Database -> Collection -> Document -> Field.',
    sections: [
      { order: 0, heading: 'Learning Objectives', body: 'Understand the 5-level hierarchy.' }
    ]
  },
  importantPoints: [
    'Every document has a unique _id field.',
    'An ObjectId hex string is 24 characters long.'
  ],
  videos: { english: null, telugu: null, hindi: null }
};

console.log('Is _id a valid 24-char hex ObjectId?', isValidObjectIdHex(topicDoc._id));
console.log('Is "course-123" a valid ObjectId?', isValidObjectIdHex('course-123'));
console.log('Nested section heading:', topicDoc.content.sections[0].heading);
console.log('Number of important points:', topicDoc.importantPoints.length);

/*
Expected Output:
Is _id a valid 24-char hex ObjectId? true
Is "course-123" a valid ObjectId? false
Nested section heading: Learning Objectives
Number of important points: 2
*/`,
        explanation:
          'Illustrates how a MongoDB document combines top-level fields, 24-character hex ObjectId strings, nested subdocuments, and arrays, and shows how to validate the 24-character hexadecimal ObjectId format.',
      },
    ],
    importantPoints: [
      'MongoDB data follows the hierarchy: MongoDB Deployment -> Database -> Collection -> Document -> Field.',
      'A Collection (e.g., courses, topics) holds Documents (individual records), and each Document holds Fields (key-value pairs).',
      'Every MongoDB document requires a unique, immutable _id primary key, which defaults to a 12-byte ObjectId (written as 24 hexadecimal characters).',
      'BSON is MongoDB binary serialization format that supports rich types including ObjectId, Date, nested objects, and arrays.',
      'When comparing ObjectIds in JavaScript, always convert them to strings (.toString()) or use .equals() rather than comparing object references with ===.',
    ],
    externalReferences: [
      {
        title: 'MongoDB Manual: Databases and Collections',
        url: 'https://www.mongodb.com/docs/manual/core/databases-and-collections/',
        source: 'MongoDB Official Documentation',
      },
      {
        title: 'MongoDB Manual: ObjectId Reference',
        url: 'https://www.mongodb.com/docs/manual/reference/method/ObjectId/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: MongoDB CRUD Operations
  // ID: 6abe9dcff15c2b4f6008ac3d
  // =========================================================================
  {
    topicId: '6abe9dcff15c2b4f6008ac3d',
    title: 'MongoDB CRUD Operations',
    content: {
      explanation: `Almost every feature in a backend application ultimately boils down to four fundamental database operations known by the acronym CRUD:
• Create — Inserting new documents into a collection.
• Read — Querying and retrieving existing documents from a collection.
• Update — Modifying specific fields in existing documents.
• Delete — Removing documents from a collection.

Before using higher-level Node.js libraries like Mongoose, every backend developer should understand MongoDB's core CRUD methods ('insertOne', 'insertMany', 'find', 'findOne', 'updateOne', 'updateMany', 'deleteOne', and 'deleteMany'), how query filter documents work, and why update operators like '$set' are essential for modifying selected fields safely without wiping out the rest of a document.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain what CRUD (Create, Read, Update, Delete) means in MongoDB.
2. Use 'insertOne' and 'insertMany' to add new documents to a collection.
3. Query documents using 'find' and 'findOne' with filter objects.
4. Modify existing documents safely using 'updateOne' and 'updateMany' with update operators such as '$set', and clearly distinguish updating selected fields from replacing an entire document.
5. Remove documents accurately using 'deleteOne' and 'deleteMany' with explicit filters.`,
        },
        {
          order: 1,
          heading: 'Create Operations: insertOne() and insertMany()',
          body: `To add new documents to a MongoDB collection (such as 'db.courses'), MongoDB provides two methods:

1. insertOne(document):
Inserts a single document into the collection. If you do not supply an '_id' field, MongoDB automatically generates a new unique 'ObjectId' and returns an acknowledgment containing 'insertedId'.

Example in mongosh (MongoDB Shell):
db.courses.insertOne({
  title: "Node.js Backend Essentials",
  category: "backend",
  status: "draft"
})

Expected Result:
{
  acknowledged: true,
  insertedId: ObjectId("6abe9dd5f15c2b4f6008ac70")
}

2. insertMany([doc1, doc2, ...]):
Inserts an array of multiple documents in a single database call, returning an object with 'insertedIds' for every created document.`,
        },
        {
          order: 2,
          heading: 'Read Operations: find() and findOne()',
          body: `To retrieve documents from a collection, you pass a Filter Object (also called a query predicate) specifying which field values must match.

1. find(filter):
Returns a cursor matching ALL documents that satisfy the filter criteria. Passing an empty filter object '{}' matches all documents in the collection.

Example:
// Find all courses where category is "backend" AND status is "published"
db.courses.find({ category: "backend", status: "published" })

2. findOne(filter):
Returns only the FIRST single document that matches the filter criteria, or 'null' if no document matches. 'findOne' is ideal when looking up a unique record such as a user by email or a course by '_id'.

Example:
db.courses.findOne({ _id: ObjectId("6abe9dc2f15c2b4f6008ac1c") })`,
        },
        {
          order: 3,
          heading: 'Update Operations: updateOne(), updateMany(), and $set vs. Replacement',
          body: `Updating documents in MongoDB requires two arguments:
1. A Filter Object (which document(s) to target).
2. An Update Document containing Update Operators (what changes to apply).

The Critical Distinction — Updating Selected Fields ($set) vs. Replacing a Document:
• Updating Selected Fields with '$set':
When you use 'updateOne(filter, { $set: { status: "published" } })', MongoDB modifies ONLY the 'status' field (and creates it if it did not exist) while leaving 'title', 'category', 'description', and all other fields completely untouched!
• Replacing a Document ('replaceOne'):
Replacing a document overwrites the entire existing document (except '_id') with the new object you pass. If you omit 'title' or 'category' during a replacement, those fields are permanently erased!

Common Update Operators:
• '$set': Sets the value of one or more specific fields.
• '$inc': Increments (or decrements) a numeric field by a given amount (e.g., '{ $inc: { viewCount: 1 } }').
• '$push': Appends a new item to an array field.

updateOne vs. updateMany:
• 'updateOne(filter, update)' modifies only the first document that matches the filter.
• 'updateMany(filter, update)' modifies all documents that match the filter. Both return 'matchedCount' (how many documents matched the filter) and 'modifiedCount' (how many documents actually changed).`,
        },
        {
          order: 4,
          heading: 'Delete Operations: deleteOne() and deleteMany()',
          body: `Removing documents from a collection also uses a Filter Object:

1. deleteOne(filter):
Deletes at most ONE document—the first document that matches the filter—and returns '{ acknowledged: true, deletedCount: 1 }' (or 'deletedCount: 0' if nothing matched).
In backend APIs, deleting a specific resource almost always uses 'deleteOne({ _id: targetId, courseCreator: currentUserId })' so at most one verified document can be removed.

2. deleteMany(filter):
Deletes ALL documents that match the filter.
For example, when a Course Creator deletes an entire Module, the backend service uses 'deleteMany({ courseId, moduleId })' to clean up all Topics belonging to that Module.

Safety Warning:
Calling 'deleteMany({})' with an empty filter object deletes EVERY document in the collection! Never pass an unvalidated or empty filter into 'deleteMany' in application code.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting the '$set' operator in 'updateOne': In modern MongoDB drivers, calling 'db.courses.updateOne({ _id }, { status: "published" })' without an atomic operator like '$set' throws an error: "Update document requires atomic operators". Always wrap field updates inside '{ $set: { ... } }'.
2. Using 'updateMany' or 'deleteMany' with an empty filter '{}' by mistake: If a variable is 'undefined' and you build a filter improperly, you might accidentally update or delete more documents than intended. Always validate IDs and required filter fields first.
3. Confusing 'matchedCount' and 'modifiedCount': If a course already has 'status: "draft"' and you run 'updateOne({ _id }, { $set: { status: "draft" } })', 'matchedCount' will be '1' (the document was found) and 'modifiedCount' will be '0' (because the value was already '"draft"'). Check 'matchedCount === 0' to detect 404 Not Found!
4. Building queries from raw, unvalidated client objects: Never pass raw user objects directly into 'find()', 'updateOne()', or 'deleteOne()' without validating primitive types.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing a Complete CRUD Lifecycle in mongosh Syntax:
Write the four MongoDB shell commands to perform the following lifecycle on a 'notes' collection:
1. Create ('insertOne'): Insert a note with 'studentId: "student_101"', 'topicTitle: "MongoDB CRUD Operations"', and 'text: "Remember to use $set when updating fields."'.
2. Read ('findOne'): Find the note where 'studentId' is '"student_101"' and 'topicTitle' is '"MongoDB CRUD Operations"'.
3. Update ('updateOne'): Update ONLY the 'text' field of that note using '$set' to '"Use $set in updateOne so other fields are preserved."' without overwriting 'studentId' or 'topicTitle'.
4. Delete ('deleteOne'): Delete that single note matching 'studentId: "student_101"' and 'topicTitle: "MongoDB CRUD Operations"'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• CRUD stands for Create ('insertOne', 'insertMany'), Read ('find', 'findOne'), Update ('updateOne', 'updateMany'), and Delete ('deleteOne', 'deleteMany').
• 'find()' returns all matching documents (via a cursor), whereas 'findOne()' returns a single matching document or 'null'.
• 'updateOne()' and 'updateMany()' use update operators like '$set' to modify selected fields while preserving the rest of the document, unlike full document replacement.
• 'deleteOne()' removes a single matching document, whereas 'deleteMany()' removes all documents matching the filter; always validate filter fields before executing updates or deletes.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Complete MongoDB CRUD Operations Lifecycle (mongosh / Driver Syntax)',
        language: 'javascript',
        code: `// =========================================================
// 1. CREATE: insertOne & insertMany
// =========================================================
const insertSingleResult = await db.collection('courses').insertOne({
  title: 'Express & MongoDB Fundamentals',
  category: 'backend',
  status: 'draft',
  enrolledCount: 0
});
// Expected: { acknowledged: true, insertedId: ObjectId("...") }

const insertBatchResult = await db.collection('modules').insertMany([
  { courseId: insertSingleResult.insertedId, title: 'Module 1 — Intro', order: 1 },
  { courseId: insertSingleResult.insertedId, title: 'Module 2 — CRUD', order: 2 }
]);
// Expected: { acknowledged: true, insertedCount: 2, insertedIds: { '0': ObjectId(...), '1': ObjectId(...) } }

// =========================================================
// 2. READ: findOne & find
// =========================================================
// Retrieve one course by its unique _id
const singleCourse = await db.collection('courses').findOne({
  _id: insertSingleResult.insertedId
});

// Retrieve all draft backend courses
const draftBackendCourses = await db.collection('courses').find({
  category: 'backend',
  status: 'draft'
}).toArray();

// =========================================================
// 3. UPDATE: updateOne with $set (Selective Field Update)
// =========================================================
const updateResult = await db.collection('courses').updateOne(
  { _id: insertSingleResult.insertedId }, // Filter: which document to update
  {
    $set: { status: 'published' },        // Update only the 'status' field
    $inc: { enrolledCount: 1 }            // Increment 'enrolledCount' by 1
  }
);
// Expected: { acknowledged: true, matchedCount: 1, modifiedCount: 1 }

// =========================================================
// 4. DELETE: deleteOne & deleteMany
// =========================================================
// Delete all modules belonging to this course first
const deleteModulesResult = await db.collection('modules').deleteMany({
  courseId: insertSingleResult.insertedId
});
// Expected: { acknowledged: true, deletedCount: 2 }

// Delete the single course document
const deleteCourseResult = await db.collection('courses').deleteOne({
  _id: insertSingleResult.insertedId
});
// Expected: { acknowledged: true, deletedCount: 1 }`,
        explanation:
          'Demonstrates all eight core MongoDB CRUD operations (insertOne, insertMany, findOne, find, updateOne with $set and $inc, deleteMany, and deleteOne) along with the structure of their return results.',
      },
    ],
    importantPoints: [
      'CRUD represents the four core database operations: Create (insertOne, insertMany), Read (find, findOne), Update (updateOne, updateMany), and Delete (deleteOne, deleteMany).',
      'findOne(filter) returns a single matching document (or null), while find(filter) returns a cursor for all matching documents.',
      'Always use atomic update operators such as $set in updateOne and updateMany to modify selected fields without replacing and erasing the rest of the document.',
      'Check matchedCount on update results to verify whether the target document existed, because modifiedCount can be 0 when the field already had the same value.',
      'Always validate filter values before calling updateMany or deleteMany so an empty or malformed filter never affects unintended documents.',
    ],
    externalReferences: [
      {
        title: 'MongoDB Manual: CRUD Operations Guide',
        url: 'https://www.mongodb.com/docs/manual/crud/',
        source: 'MongoDB Official Documentation',
      },
      {
        title: 'MongoDB Manual: Update Operators ($set, $inc, $push)',
        url: 'https://www.mongodb.com/docs/manual/reference/operator/update/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: Connecting Node.js to MongoDB
  // ID: 6abe9dcff15c2b4f6008ac3e
  // =========================================================================
  {
    topicId: '6abe9dcff15c2b4f6008ac3e',
    title: 'Connecting Node.js to MongoDB',
    content: {
      explanation: `Your Node.js and Express.js code runs in one operating system process, while the MongoDB database runs as a separate server process (either on your local machine or on a cloud database server). Before your Express routes can read or write any data, your Node.js application must establish a network connection to MongoDB.

The connection flow follows this exact path:
Node.js Application → MongoDB Driver / Mongoose → MongoDB Database Server

Establishing this connection safely in a real backend requires understanding three foundational engineering practices:
1. Loading the MongoDB Connection URI from environment variables ('process.env.MONGODB_URI')—never hardcoding credentials in source code or committing them to Git.
2. Connecting asynchronously using 'async/await' because establishing a TCP and authentication handshake over a network takes time.
3. Handling connection startup failures and lifecycle events gracefully, and keeping database configuration cleanly separated in a dedicated module (such as 'server/config/db.js').`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Trace the complete connection flow: Node.js Application → MongoDB Driver / Mongoose → MongoDB Server.
2. Explain what a MongoDB connection URI is and why it must always be stored in environment variables rather than hardcoded in code.
3. Explain why database credentials and '.env' files must never be committed to Git.
4. Write a clean, asynchronous database connection module using 'async/await' and 'try/catch'.
5. Handle startup connection errors, monitor connection lifecycle states, and separate configuration from Express route logic.`,
        },
        {
          order: 1,
          heading: 'The Connection Flow & MongoDB Connection URI Concept',
          body: `How Does Node.js Talk to MongoDB?
Node.js does not speak MongoDB's binary wire protocol natively out of the box. Instead, we install a library—either the official 'mongodb' native driver or 'mongoose' (which uses the official MongoDB driver underneath)—to manage a pool of TCP connections between our Node.js process and the MongoDB server:

Node.js Application (server/config/db.js)
   ↓  calls mongoose.connect(process.env.MONGODB_URI)
Mongoose / MongoDB Node.js Driver (manages connection pool)
   ↓  TCP / TLS Network Handshake & Authentication
MongoDB Database Server

What Is a MongoDB Connection URI?
A Connection URI (Uniform Resource Identifier) is a formatted configuration string that tells the driver where the MongoDB server is located, which database to use, and how to authenticate.

In your '.env.example' template file, you document the required variable safely without any secrets:
MONGODB_URI=<your-mongodb-connection-string>

For a local development database running on your own computer without authentication, a local URI looks like:
MONGODB_URI=mongodb://127.0.0.1:27017/learnsphere`,
        },
        {
          order: 2,
          heading: 'Security Rule: Never Hardcode URIs or Commit Credentials to Git',
          body: `Why Must You Never Hardcode a Connection URI in Source Code?
1. Credential Exposure in Version Control: In production, a MongoDB connection URI contains a database username, password, and cluster hostname. If you paste that string directly into 'db.js' and run 'git commit' and 'git push', anyone who can view the repository (or any leaked backup) immediately gains full read/write access to your database!
2. Environment Portability: Your local computer, your automated test runner, and your production cloud server each connect to different databases. Reading 'process.env.MONGODB_URI' lets the exact same code connect to the right database in every environment without changing a single line of code.
3. Safe Logging: Never log the raw 'process.env.MONGODB_URI' value to the console (for example, never run 'console.log(process.env.MONGODB_URI)'), because connection strings can contain sensitive passwords that would then be leaked into server log files.

How We Protect Database Credentials in LearnSphere:
• Store real environment variables inside '.env' (which is listed in '.gitignore' so Git never tracks it).
• Commit a safe '.env.example' file showing only variable names and placeholder instructions (` + '`MONGODB_URI=<your-mongodb-connection-string>`' + `).
• Load environment variables at application startup using 'import "dotenv/config";' and read 'process.env.MONGODB_URI'.`,
        },
        {
          order: 3,
          heading: 'Asynchronous Connection, Startup Failure, and Lifecycle Events',
          body: `Why Is Connecting to MongoDB Asynchronous?
Connecting to a database involves resolving DNS hostnames, opening TCP sockets, performing TLS encryption handshakes, and verifying authentication credentials over the network. Because network I/O takes milliseconds (or seconds on a slow network), 'mongoose.connect()' returns a Promise that must be awaited with 'async/await'.

Handling Connection Startup Failure:
What should happen if 'process.env.MONGODB_URI' is missing, or if the MongoDB server is unreachable when your backend boots?
• Fail Clearly and Safely: First, check if 'process.env.MONGODB_URI' is defined before calling 'mongoose.connect()'.
• Catch Startup Errors: Wrap 'await mongoose.connect(uri)' inside a 'try/catch' block. Log a clear, safe error message (such as 'err.message' without printing credentials) and either exit the process in strict production mode or mark the database health status as disconnected so health-check endpoints ('GET /api/health') can report the state accurately.

Connection Lifecycle States:
Mongoose tracks the live state of the connection on 'mongoose.connection.readyState':
• '0' = disconnected
• '1' = connected
• '2' = connecting
• '3' = disconnecting
You can also listen to lifecycle events such as 'mongoose.connection.on("disconnected", ...)' and 'mongoose.connection.on("error", ...)' to monitor unexpected network drops after startup.`,
        },
        {
          order: 4,
          heading: 'Separation of Configuration from Application Code',
          body: `In a well-architected Express backend (like LearnSphere), we do NOT scatter 'mongoose.connect()' calls inside route files or controllers. Instead, we separate database configuration into its own dedicated module:

1. 'server/config/db.js':
   • Reads 'process.env.MONGODB_URI'.
   • Exports an asynchronous 'connectDB()' function and a helper 'isDbConnected()' function.
2. 'server/server.js':
   • Calls 'await connectDB()' once during server startup before or alongside 'app.listen()'.
3. Controllers & Services:
   • Simply import Mongoose models ('User', 'Course', 'Module', 'Topic') and run queries using the already-established connection pool.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Hardcoding database connection strings or passwords inside '.js' files: Even in a temporary test script, hardcoding secrets risks accidentally committing them to Git. Always use 'process.env.MONGODB_URI'.
2. Calling 'mongoose.connect()' inside every Express route handler: Opening a brand-new connection pool on every HTTP request will quickly exhaust the database server's connection limit and crash your backend. Connect ONCE at server startup in 'server/config/db.js'.
3. Forgetting 'await' when calling 'connectDB()': If you do not 'await' your database connection before running a startup script, your queries may fail or hang if the connection fails.
4. Printing the raw connection URI in error logs: Never log 'Failed to connect to ' + process.env.MONGODB_URI because that prints the password into your logs! Log only safe status messages.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing a Safe Database Connection Module:
1. Write a '.env.example' snippet defining 'PORT=5000' and 'MONGODB_URI=<your-mongodb-connection-string>'.
2. Write a 'config/db.js' module using ES Modules ('import mongoose from "mongoose"') that exports two functions:
   • 'connectDB()': Verifies 'process.env.MONGODB_URI' exists, awaits 'mongoose.connect(uri)', logs '"Connected to MongoDB database successfully."', and catches any connection error safely without logging the URI.
   • 'isDbConnected()': Returns 'true' when 'mongoose.connection.readyState === 1' and 'false' otherwise.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• A Node.js application connects to MongoDB through the MongoDB driver or Mongoose using a Connection URI ('Node.js Application → Driver/Mongoose → MongoDB').
• Always store the connection URI in an environment variable ('process.env.MONGODB_URI') and never hardcode credentials or commit '.env' files to Git.
• Connecting to MongoDB is an asynchronous network operation that must be handled with 'async/await' and 'try/catch'.
• Keep database connection logic isolated in a dedicated configuration module ('server/config/db.js') and call it once at server startup.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Safe Database Configuration Module (server/config/db.js) and Startup Integration',
        language: 'javascript',
        code: `// ============================================================================
// File 1: .env.example (Safe template committed to Git — NO real secrets!)
// ============================================================================
// PORT=5000
// MONGODB_URI=<your-mongodb-connection-string>

// ============================================================================
// File 2: server/config/db.js (Dedicated Database Connection Module)
// ============================================================================
import mongoose from 'mongoose';

/**
 * Returns true if Mongoose currently has an active connection (readyState === 1).
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Establishes an asynchronous connection to MongoDB using process.env.MONGODB_URI.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('Warning: MONGODB_URI is not defined in environment variables.');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if database server is unreachable
    });
    console.log('Connected to MongoDB database successfully.');
    return true;
  } catch (error) {
    // Log error.message safely — NEVER log the raw URI containing credentials
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

// ============================================================================
// File 3: server/server.js (Connecting once during application startup)
// ============================================================================
// import 'dotenv/config';
// import express from 'express';
// import { connectDB, isDbConnected } from './config/db.js';
//
// const app = express();
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ status: 'ok', database: isDbConnected() ? 'connected' : 'disconnected' });
// });
//
// await connectDB();

/*
Expected Console Output (when MONGODB_URI is configured and MongoDB is reachable):
Connected to MongoDB database successfully.
*/`,
        explanation:
          'Shows how LearnSphere separates database connection management into server/config/db.js, reads process.env.MONGODB_URI safely without hardcoding credentials, handles startup failures with try/catch, and exposes connection health.',
      },
    ],
    importantPoints: [
      'The connection flow is: Node.js Application -> MongoDB Driver / Mongoose -> MongoDB Server.',
      'Always load the MongoDB connection URI from process.env.MONGODB_URI and document it in .env.example as MONGODB_URI=<your-mongodb-connection-string>.',
      'Never hardcode database URIs or credentials in source code, never commit .env files to Git, and never print raw connection strings in logs.',
      'Connecting to MongoDB is an asynchronous network operation that requires async/await and try/catch error handling.',
      'Isolate database connection setup in a dedicated configuration file (such as server/config/db.js) and connect once at application startup.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Official Docs: Connections Guide',
        url: 'https://mongoosejs.com/docs/connections.html',
        source: 'Mongoose Official Documentation',
      },
      {
        title: 'MongoDB Manual: Connection String URI Format',
        url: 'https://www.mongodb.com/docs/manual/reference/connection-string/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: What Is Mongoose?
  // ID: 6abe9dd0f15c2b4f6008ac3f
  // =========================================================================
  {
    topicId: '6abe9dd0f15c2b4f6008ac3f',
    title: 'What Is Mongoose?',
    content: {
      explanation: `When you use the raw MongoDB Node.js driver directly, MongoDB lets you insert almost any object into a collection—even if a document is missing a required 'title', has a number where an email string should be, or contains misspelled field names. In a real backend application like LearnSphere, allowing unstructured or unvalidated documents into the database quickly leads to bugs and security vulnerabilities.

Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It sits on top of the official MongoDB Node.js driver and provides a structured, schema-based layer for modeling your application data.

It is important to be clear: MongoDB itself does NOT require Mongoose. You can use MongoDB with the native driver alone, or from Python, Go, or Java. However, in Node.js and Express backends, Mongoose is widely used because it gives us enforceable Schemas, reusable Models, built-in data validation, type casting, lifecycle middleware (hooks), and clean query chaining.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define Mongoose accurately as an Object Data Modeling (ODM) library for MongoDB and Node.js.
2. Clearly compare the official MongoDB native driver with Mongoose and explain that MongoDB does not require Mongoose.
3. Explain the core features Mongoose provides: Schemas, Models, automatic validation, middleware/hooks, and query builders.
4. Describe why a Node.js and Express backend like LearnSphere uses Mongoose across its service layer.
5. Read and understand a complete, working Mongoose Schema, Model, and query example.`,
        },
        {
          order: 1,
          heading: 'What Does ODM (Object Data Modeling) Mean?',
          body: `In relational (SQL) databases, developers often use an ORM (Object-Relational Mapper) to convert tabular rows into JavaScript objects.
In document (NoSQL) databases like MongoDB, the equivalent tool is called an ODM (Object Data Modeling) library.

What Mongoose Does as an ODM:
Mongoose maps JavaScript classes and objects in your Node.js code to BSON documents in a MongoDB collection, while enforcing a strict blueprint (a Schema) before any document is saved to the database.

Let us trace how Mongoose sits on top of the official MongoDB driver:
Express Controller / Service
   ↓  calls Course.create(...) or Course.find(...)
Mongoose ODM Layer (Validates Schema, runs hooks, builds query)
   ↓  delegates wire-protocol communication
Official MongoDB Node.js Driver
   ↓
MongoDB Database Server

Real-World Analogy — Blank Notebook vs. Pre-Printed Official Application Form:
• Raw MongoDB Collection (via Native Driver): Like handing someone a blank notebook page. They might write their name at the top, or forget their email, or write their age as '"twenty"'.
• Mongoose ODM Layer: Like an official application form with labeled boxes ("Title [Required]", "Status [Must be 'draft' or 'published']"). Before the form can be filed in the cabinet, the clerk (Mongoose) checks every box to make sure it is filled out according to the rules.`,
        },
        {
          order: 2,
          heading: 'Official MongoDB Driver vs. Mongoose',
          body: `Does MongoDB require Mongoose?
No! MongoDB is the database server itself. To communicate with MongoDB from Node.js, you have two main choices:

1. Official MongoDB Node.js Driver ('mongodb' npm package):
• Low-level, direct access to MongoDB collections ('db.collection("courses").insertOne(...)').
• Does not enforce application-level schemas, required fields, or field defaults in Node.js automatically.
• Useful when you intentionally have highly dynamic collections or want zero abstraction overhead.

2. Mongoose ODM ('mongoose' npm package):
• Built on top of the official 'mongodb' driver.
• Enforces a strict Schema in your Node.js code for every collection.
• Automatically validates required fields, data types, string lengths, and allowed enum values before saving.
• Provides Models with convenient methods ('Model.findById()', 'Model.create()', '.populate()') and lifecycle hooks ('pre("save")').`,
        },
        {
          order: 3,
          heading: 'Core Capabilities of Mongoose',
          body: `Why does LearnSphere use Mongoose for 'User', 'Course', 'Module', 'Topic', 'Enrollment', and 'Assessment'?

1. Schemas:
Define the exact fields a document can have, their data types ('String', 'Number', 'Boolean', 'Date', 'ObjectId'), default values, and string modifiers like 'trim: true' and 'lowercase: true'.

2. Models:
Compiled constructors created from a Schema that provide a clean async interface ('User.findOne()', 'Course.findById()', 'Topic.create()') to query and mutate a specific MongoDB collection.

3. Built-In Validation:
Before sending an 'insertOne' or 'save' command to MongoDB, Mongoose checks every rule in the Schema ('required', 'minlength', 'maxlength', 'enum', 'min', 'max'). If any rule fails, Mongoose throws a 'ValidationError' immediately and blocks the invalid data from reaching the database.

4. Middleware (Hooks) at a Conceptual Level:
Mongoose allows you to attach functions (called hooks or middleware) that run automatically before or after certain document events—such as a 'pre("save")' hook on the 'User' model that hashes a modified password with 'bcrypt' before the user document is stored in MongoDB.

5. Reference Population ('.populate()'):
Allows a field storing an 'ObjectId' (like 'course.courseCreator') to automatically look up and attach the referenced document's public fields (such as the creator's 'name' and 'email').`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Thinking Mongoose IS MongoDB: MongoDB is the database engine; Mongoose is a Node.js library ('npm install mongoose') that helps Node.js applications interact with MongoDB using schemas and models.
2. Confusing Express Middleware with Mongoose Middleware:
   • Express Middleware ('(req, res, next) => {}') runs during an HTTP request-response pipeline.
   • Mongoose Middleware ('schema.pre("save", function(next) {})') runs inside your data model before or after a database operation like 'save'.
3. Defining fields in queries or create calls that are NOT in the Schema: By default, Mongoose enforces 'strict: true' on schemas, meaning any undeclared extra fields passed into 'Model.create()' are silently stripped out before saving so arbitrary properties cannot pollute your documents.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Explaining why an ODM is helpful:
1. Suppose a client sends a POST request to create a course with '{ title: "   ", status: "super-secret-status", extraHackerField: true }'.
2. Write three bullet points explaining how a Mongoose Schema with 'title: { type: String, required: true, trim: true }' and 'status: { type: String, enum: ["draft", "published"], default: "draft" }' protects the database from each of those three properties before any document is written to MongoDB.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Mongoose is an Object Data Modeling (ODM) library for Node.js that sits on top of the official MongoDB driver.
• MongoDB itself does not require Mongoose, but Node.js/Express backends use Mongoose to enforce application-level structure and safety.
• Mongoose provides Schemas (structural blueprints), Models (query and persistence constructors), automatic validation, lifecycle hooks, and reference population.
• By default, Mongoose schemas run in strict mode, rejecting invalid values and stripping undeclared fields before data reaches MongoDB.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'A Simple Mongoose Schema, Model, and Query Example',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

// 1. Define a Schema (the structural blueprint and validation rules)
const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [150, 'Module title cannot exceed 150 characters'],
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Module order must be at least 1'],
    },
  },
  { timestamps: true }
);

// 2. Compile the Schema into a Model linked to the 'modules' collection
const Module = mongoose.model('Module', moduleSchema);

// 3. Using the Model in an async service function
async function demonstrateMongooseModel() {
  // Mongoose trims whitespace, validates rules, and attaches _id and timestamps
  const newModule = new Module({
    title: '  Module 4 — MongoDB and Mongoose  ',
    order: 4,
  });

  // Validate the document in memory without needing a live DB call:
  await newModule.validate();

  console.log('Trimmed Title:', newModule.title);
  console.log('Generated _id:', newModule._id.toString());
  console.log('Order:', newModule.order);
}

demonstrateMongooseModel();

/*
Expected Output:
Trimmed Title: Module 4 — MongoDB and Mongoose
Generated _id: 6abe9dcef15c2b4f6008ac3a (a newly generated 24-char hex ObjectId)
Order: 4
*/`,
        explanation:
          'Demonstrates how Mongoose defines a Schema with validation and trimming rules, compiles it into a Model, and automatically normalizes fields, assigns an ObjectId, and validates constraints.',
      },
    ],
    importantPoints: [
      'Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js built on top of the official MongoDB driver.',
      'MongoDB itself does not require Mongoose; Mongoose is an application-layer library chosen for schema enforcement and developer productivity in Node.js.',
      'Mongoose provides Schemas, Models, built-in validation, type casting, pre/post hooks, and reference population.',
      'By default, Mongoose enforces strict schemas (strict: true), stripping out undeclared fields so unexpected properties cannot pollute database documents.',
      'Express middleware processes HTTP requests and responses, whereas Mongoose middleware (hooks) runs before or after database operations such as saving a document.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Official Docs: Quick Start Guide',
        url: 'https://mongoosejs.com/docs/index.html',
        source: 'Mongoose Official Documentation',
      },
      {
        title: 'Mongoose Official Docs: Schemas Overview',
        url: 'https://mongoosejs.com/docs/guide.html',
        source: 'Mongoose Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
