/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 4 Content Population Script (Phase 11I-C4)
 *
 * Populates all 9 topics of Module 4 ("Module 4 — MongoDB and Mongoose") using the
 * authoritative Course Creator API:
 *   PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
 */

import 'dotenv/config';
import { module4TopicsPart1 } from './module4TopicsPart1.js';
import { module4TopicsPart2 } from './module4TopicsPart2.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_4_ID = '6abe9dcef15c2b4f6008ac3a';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

export const module4TopicsContent = [...module4TopicsPart1, ...module4TopicsPart2];

async function populateModule4() {
  console.log('===================================================================');
  console.log('=== LearnSphere: Populating Module 4 Educational Content        ===');
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

  // Step 2: Verify existing Module 4 topics via Course Creator API before populating
  const listTopicsRes = await fetch(
    `${BASE_URL}/api/creator/courses/${COURSE_ID}/modules/${MODULE_4_ID}/topics`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listTopicsRes.ok) {
    throw new Error(`Failed to list Module 4 topics (${listTopicsRes.status})`);
  }

  const listTopicsData = await listTopicsRes.json();
  const existingTopics = listTopicsData.data?.topics || [];
  if (existingTopics.length !== 9) {
    throw new Error(`Expected 9 existing topics in Module 4, found ${existingTopics.length}`);
  }
  console.log(`✓ Verified Module 4 (${MODULE_4_ID}) contains ${existingTopics.length} existing topics.`);

  // Step 3: Loop over each topic and update content via Course Creator API
  console.log(`\nBeginning content population for ${module4TopicsContent.length} topics in Module 4...`);

  let successCount = 0;

  for (const topicData of module4TopicsContent) {
    const { topicId, title, content, codeExamples, importantPoints, externalReferences, videos, images } = topicData;
    console.log(`\nUpdating Topic: "${title}" (ID: ${topicId})...`);

    const updateUrl = `${BASE_URL}/api/creator/courses/${COURSE_ID}/modules/${MODULE_4_ID}/topics/${topicId}/content`;
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

    if (!hasExplanation || sectionsCount < 6 || pointsCount < 5 || examplesCount < 1 || refsCount < 2) {
      throw new Error(`Persisted content validation failed for "${title}"`);
    }

    successCount++;
  }

  console.log(`\n===================================================================`);
  console.log(`✓ Completed: Successfully populated and verified all ${successCount}/${module4TopicsContent.length} topics in Module 4!`);
  console.log(`===================================================================`);
}

populateModule4()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during Module 4 content population:', err);
    process.exit(1);
  });
