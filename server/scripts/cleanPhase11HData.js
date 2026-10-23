/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Phase 11H: Complete Test Data Purge & Clean LMS State
 *
 * Explicit one-time cleanup script to purge all application test/demo data,
 * accounts, courses, curriculum, assessments, attempts, notes, certificates,
 * and sessions from MongoDB while preserving schemas, indexes, and infrastructure.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';

// Import all application models
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
import Note from '../models/Note.js';
import Certificate from '../models/Certificate.js';
import RefreshSession from '../models/RefreshSession.js';

async function cleanPhase11HData() {
  console.log('===================================================================');
  console.log('=== LearnSphere Phase 11H: Application Test Data Purge ===');
  console.log('===================================================================\n');

  try {
    // 1. Establish DB Connection using existing config
    await connectDB();
    if (!isDbConnected()) {
      console.error('ERROR: Could not establish connection to database.');
      process.exit(1);
    }

    const models = [
      { name: 'Users', model: User },
      { name: 'Courses', model: Course },
      { name: 'Modules', model: Module },
      { name: 'Topics', model: Topic },
      { name: 'Assessments', model: Assessment },
      { name: 'AssessmentAttempts', model: AssessmentAttempt },
      { name: 'Enrollments', model: Enrollment },
      { name: 'TopicProgress', model: TopicProgress },
      { name: 'Notes', model: Note },
      { name: 'Certificates', model: Certificate },
      { name: 'RefreshSessions', model: RefreshSession },
    ];

    // 2. Query document counts BEFORE purge
    console.log('--- Document Counts BEFORE Cleanup ---');
    const beforeCounts = {};
    for (const { name, model } of models) {
      const count = await model.countDocuments();
      beforeCounts[name] = count;
      console.log(`  ${name.padEnd(20)}: ${count}`);
    }

    // 3. Purge all application data documents from collections
    console.log('\n--- Purging Application Data Documents ---');
    for (const { name, model } of models) {
      const result = await model.deleteMany({});
      console.log(`  Purged ${name}: ${result.deletedCount} documents removed.`);
    }

    // 4. Query document counts AFTER purge
    console.log('\n--- Document Counts AFTER Cleanup ---');
    const afterCounts = {};
    let allEmpty = true;
    for (const { name, model } of models) {
      const count = await model.countDocuments();
      afterCounts[name] = count;
      console.log(`  ${name.padEnd(20)}: ${count}`);
      if (count !== 0) {
        allEmpty = false;
      }
    }

    if (allEmpty) {
      console.log('\n✓ SUCCESS: All application data collections are verified completely empty (0 documents).');
      console.log('✓ All schemas, indexes, and collection structures remain fully intact.');
    } else {
      console.error('\n✗ WARNING: One or more collections still contain documents!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Phase 11H data purge:', err.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Database connection closed cleanly.');
    } catch {}
  }
}

cleanPhase11HData();
