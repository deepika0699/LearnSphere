/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 7 Content Population Script (Phase 11I-C7)
 *
 * Dynamically resolves the existing Module 7 ID from the Course Creator API
 * and populates all 10 topics of Module 7 ("Module 7 — Backend Security") using:
 *   PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
 */

import 'dotenv/config';
import { module7TopicsPart1 } from './module7TopicsPart1.js';
import { module7TopicsPart2 } from './module7TopicsPart2.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

export const module7TopicsContent = [...module7TopicsPart1, ...module7TopicsPart2];

async function populateModule7() {
  console.log('===================================================================');
  console.log('=== LearnSphere: Populating Module 7 Educational Content        ===');
  console.log('===================================================================\n');

  // Step 1: Log in as Course Creator
  console.log(`Authenticating as Course Creator (${CREATOR_EMAIL})...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
  });

  if (!loginRes.ok) {
    const errorBody = await loginRes.text();
    throw new Error(`Course Creator authentication failed (${loginRes.status}): ${errorBody}`);
  }

  const loginData = await loginRes.json();
  const accessToken = loginData.data?.accessToken;
  const userRole = loginData.data?.user?.role;
  console.log(`✓ Authenticated successfully. User role: "${userRole}"`);

  if (userRole !== 'course_creator') {
    throw new Error(`Expected role 'course_creator', received '${userRole}'`);
  }

  // Step 2: Dynamically look up Module 7 from the database via the Course Creator API
  const modulesRes = await fetch(`${BASE_URL}/api/creator/courses/${COURSE_ID}/modules`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!modulesRes.ok) {
    throw new Error(`Failed to list course modules (${modulesRes.status})`);
  }

  const modulesData = await modulesRes.json();
  const modulesList = modulesData.data?.modules || [];
  const module7 = modulesList.find((m) => m.order === 7);

  if (!module7) {
    throw new Error('Could not find Module 7 (order === 7) in showcase course');
  }

  const module7Id = module7.id || module7._id;
  console.log(`✓ Resolved Module 7 dynamically: "${module7.title}" (ID: ${module7Id})`);

  // Step 3: Verify existing Module 7 topics via Course Creator API before populating
  const listTopicsRes = await fetch(
    `${BASE_URL}/api/creator/courses/${COURSE_ID}/modules/${module7Id}/topics`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listTopicsRes.ok) {
    throw new Error(`Failed to list Module 7 topics (${listTopicsRes.status})`);
  }

  const listTopicsData = await listTopicsRes.json();
  const existingTopics = listTopicsData.data?.topics || [];
  if (existingTopics.length !== 10) {
    throw new Error(`Expected 10 existing topics in Module 7, found ${existingTopics.length}`);
  }
  console.log(`✓ Verified Module 7 (${module7Id}) contains ${existingTopics.length} existing topics.`);

  // Step 4: Loop over each topic and update content via Course Creator API
  console.log(`\nBeginning content population for ${module7TopicsContent.length} topics in Module 7...`);

  let successCount = 0;

  for (const topicData of module7TopicsContent) {
    const { topicId, title, content, codeExamples, importantPoints, externalReferences, videos, images } = topicData;
    console.log(`\nUpdating Topic: "${title}" (ID: ${topicId})...`);

    const updateUrl = `${BASE_URL}/api/creator/courses/${COURSE_ID}/modules/${module7Id}/topics/${topicId}/content`;
    const payload = {
      content,
      codeExamples,
      importantPoints,
      externalReferences,
      videos: videos || { english: null, telugu: null, hindi: null },
      images: images || [],
    };

    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error(`✗ Failed to update Topic "${title}" (Status ${updateRes.status}): ${errText}`);
      throw new Error(`Topic update failed for "${title}"`);
    }

    console.log(`  ✓ Successfully updated topic content via PATCH endpoint (HTTP ${updateRes.status})`);

    // Verify by reading back the content via GET /content
    const verifyRes = await fetch(updateUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!verifyRes.ok) {
      throw new Error(`Failed to verify topic content via GET (Status ${verifyRes.status})`);
    }

    const verifyData = await verifyRes.json();
    const retrieved = verifyData.data?.content;

    const hasExplanation = Boolean(retrieved?.content?.explanation?.length > 200);
    const sectionsCount = retrieved?.content?.sections?.length || 0;
    const examplesCount = retrieved?.codeExamples?.length || 0;
    const pointsCount = retrieved?.importantPoints?.length || 0;
    const refsCount = retrieved?.externalReferences?.length || 0;

    console.log(`  ✓ Verified persisted content:`);
    console.log(`    - Explanation length: ${retrieved?.content?.explanation?.length} chars`);
    console.log(`    - Sections count:     ${sectionsCount}`);
    console.log(`    - Code examples:      ${examplesCount}`);
    console.log(`    - Important points:   ${pointsCount}`);
    console.log(`    - External references:${refsCount}`);

    if (!hasExplanation || sectionsCount < 7 || pointsCount < 5 || examplesCount < 1 || refsCount < 2) {
      throw new Error(`Persisted content validation failed for "${title}"`);
    }

    successCount++;
  }

  console.log(`\n===================================================================`);
  console.log(`✓ Completed: Successfully populated and verified all ${successCount}/${module7TopicsContent.length} topics in Module 7!`);
  console.log(`===================================================================`);
}

populateModule7()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during Module 7 content population:', err);
    process.exit(1);
  });
