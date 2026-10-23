/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Migration Script: Course Creator Role Normalization
 *
 * Migrates existing platform Course Creator user(s) from legacy 'courseCreator'
 * to canonical 'course_creator'.
 *
 * Guarantees:
 * - Zero duplicate users created
 * - Zero modifications to showcase course document
 * - Preserves all 8 modules and 73 topics
 * - Preserves password hash, status, timestamps, and account details
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

export async function migrateCourseCreatorRole() {
  console.log('===================================================================');
  console.log('=== LearnSphere Migration: courseCreator -> course_creator      ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  try {
    // 1. Find all users with legacy role 'courseCreator'
    const legacyCreators = await User.find({ role: 'courseCreator' });
    console.log(`Found ${legacyCreators.length} user(s) with role "courseCreator".`);

    for (const user of legacyCreators) {
      console.log(`Migrating user: ${user.name} (${user.email}, ID: ${user._id})...`);
      // Update directly using findOneAndUpdate to avoid triggering password re-hash
      await User.updateOne({ _id: user._id }, { $set: { role: 'course_creator' } });
      console.log(`  ✓ Updated role to "course_creator".`);
    }

    // 2. Verify all users
    const allUsers = await User.find({}).select('_id name email role status').lean();
    console.log('\n--- Authoritative User Audit Post-Migration ---');
    for (const u of allUsers) {
      console.log(`  User: ${u.email} | Role: "${u.role}" | Status: ${u.status}`);
    }

    // 3. Verify showcase course integrity
    const course = await Course.findOne({
      title: 'Backend Development with Node.js, Express & MongoDB',
    }).populate('courseCreator', 'name email role');

    if (!course) {
      throw new Error('Showcase course not found in database!');
    }

    console.log('\n--- Authoritative Course Audit Post-Migration ---');
    console.log(`  Course Title: "${course.title}" (ID: ${course._id})`);
    console.log(`  Status:       "${course.status}"`);
    console.log(`  Creator:      ${course.courseCreator?.email} (Role: "${course.courseCreator?.role}")`);

    const moduleCount = await Module.countDocuments({ courseId: course._id });
    const topicCount = await Topic.countDocuments({ courseId: course._id });

    console.log(`  Modules in Course: ${moduleCount}`);
    console.log(`  Topics in Course:  ${topicCount}`);

    if (moduleCount !== 8 || topicCount !== 73) {
      throw new Error(`Data integrity violation! Expected 8 modules, 73 topics. Found ${moduleCount} modules, ${topicCount} topics.`);
    }

    console.log('\n✓ Migration verified successfully: All 8 modules and 73 topics preserved.');
    return { success: true, migratedCount: legacyCreators.length };
  } catch (err) {
    console.error('\n✗ Migration failed:', err);
    throw err;
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrateCourseCreatorRole()
    .then(async () => {
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(0);
    })
    .catch(async (err) => {
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    });
}
