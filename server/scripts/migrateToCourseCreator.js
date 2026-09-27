import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Migration Script: Migrate course ownership and user roles to canonical 'courseCreator'
 */
export async function runMigration() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log('--- STARTING CANONICAL COURSE CREATOR MIGRATION ---');

  // 1. Inspect and Migrate Course Collection
  const coursesCollection = db.collection('courses');
  const allCourses = await coursesCollection.find({}).toArray();
  console.log(`Found ${allCourses.length} course documents to check.`);

  let migratedCourses = 0;
  let skippedCourses = 0;
  const conflicts = [];

  for (const course of allCourses) {
    const hasCreator = Boolean(course.courseCreator);
    const hasInstructor = Boolean(course.instructor);

    if (hasCreator && hasInstructor) {
      const creatorStr = course.courseCreator.toString();
      const instructorStr = course.instructor.toString();

      if (creatorStr !== instructorStr) {
        conflicts.push({
          courseId: course._id.toString(),
          title: course.title,
          courseCreator: creatorStr,
          instructor: instructorStr,
        });
        continue;
      }

      // Safe to unset instructor
      await coursesCollection.updateOne(
        { _id: course._id },
        { $unset: { instructor: '' } }
      );
      migratedCourses++;
    } else if (!hasCreator && hasInstructor) {
      // Migrate legacy instructor ownership to courseCreator
      await coursesCollection.updateOne(
        { _id: course._id },
        {
          $set: { courseCreator: course.instructor },
          $unset: { instructor: '' },
        }
      );
      migratedCourses++;
    } else {
      // Only courseCreator exists (or neither)
      if (hasInstructor) {
        await coursesCollection.updateOne(
          { _id: course._id },
          { $unset: { instructor: '' } }
        );
        migratedCourses++;
      } else {
        skippedCourses++;
      }
    }
  }

  if (conflicts.length > 0) {
    console.error('FATAL CONFLICTS DETECTED DURING MIGRATION:');
    console.error(JSON.stringify(conflicts, null, 2));
    throw new Error(`Migration aborted: ${conflicts.length} courses have conflicting ownership between courseCreator and instructor.`);
  }

  console.log(`Course migration complete. Migrated: ${migratedCourses}, Skipped (already clean): ${skippedCourses}`);

  // 2. Drop obsolete instructor index if present
  try {
    const indexes = await coursesCollection.indexes();
    const instructorIndex = indexes.find((idx) => idx.key && idx.key.instructor !== undefined);
    if (instructorIndex) {
      console.log(`Dropping obsolete instructor index: ${instructorIndex.name}...`);
      await coursesCollection.dropIndex(instructorIndex.name);
      console.log('Obsolete instructor index dropped successfully.');
    } else {
      console.log('No instructor index found on courses collection.');
    }
  } catch (err) {
    console.warn('Note on index check:', err.message);
  }

  // 3. Inspect and Migrate User roles ('course_creator' -> 'courseCreator')
  const usersCollection = db.collection('users');
  const legacyRoleUsers = await usersCollection.find({ role: 'course_creator' }).toArray();
  console.log(`Found ${legacyRoleUsers.length} users with legacy role 'course_creator'.`);

  if (legacyRoleUsers.length > 0) {
    const roleResult = await usersCollection.updateMany(
      { role: 'course_creator' },
      { $set: { role: 'courseCreator' } }
    );
    console.log(`Migrated ${roleResult.modifiedCount} users to canonical role 'courseCreator'.`);
  }

  console.log('--- CANONICAL COURSE CREATOR MIGRATION FINISHED SUCCESSFULLY ---');
}

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
