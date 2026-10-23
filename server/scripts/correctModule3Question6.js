/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Correction Script: Update Module 3 Question 6 via Course Creator API
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 3 Assessment: 6acd018dfdf30e469e01ca9f
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const ASSESSMENT_ID = '6acd018dfdf30e469e01ca9f';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

const CORRECTED_Q6_EXPLANATION =
  'Express detects error-handling middleware by inspecting JavaScript function arity (fn.length === 4), conventionally declared as (err, req, res, next). When an error is forwarded via next(err), Express skips standard three-argument middleware (fn.length === 3) and searches the pipeline for the next registered four-argument error handler. Because standard middleware functions only receive requests during normal processing, omitting the fourth parameter prevents Express from recognizing the function as an error handler during error dispatch.';

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

async function run() {
  console.log('===================================================================');
  console.log('=== Updating Module 3 Question 6 via Course Creator API          ===');
  console.log('===================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Authenticate as Course Creator
  console.log('1. Authenticating as Course Creator...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
  });

  const creatorToken = loginRes.data?.data?.accessToken || loginRes.data?.data?.tokens?.accessToken;
  if (loginRes.status !== 200 || !creatorToken) {
    console.error('Creator login failed:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  console.log('✓ Course Creator authenticated successfully');

  try {
    // 2. Fetch current assessment
    console.log(`2. Fetching assessment ${ASSESSMENT_ID}...`);
    const getRes = await request(
      `/api/creator/courses/${COURSE_ID}/assessments/${ASSESSMENT_ID}`,
      {},
      creatorToken
    );

    if (getRes.status !== 200 || !getRes.data?.data?.assessment) {
      console.error('Failed to fetch assessment:', getRes.status, getRes.data);
      process.exit(1);
    }

    const currentAssessment = getRes.data.data.assessment;
    console.log(`✓ Retrieved assessment: "${currentAssessment.title}"`);
    console.log(`  Current questions count: ${currentAssessment.questions.length}`);

    // Find Question 6 (order 5)
    const q6 = currentAssessment.questions.find((q) => q.order === 5);
    if (!q6) {
      console.error('Question 6 (order 5) not found');
      process.exit(1);
    }

    console.log('\n--- Current Question 6 ---');
    console.log(`Prompt: ${q6.prompt}`);
    console.log(`Current Explanation: ${q6.explanation}`);

    // Build updated questions array preserving all IDs and structure
    const updatedQuestions = currentAssessment.questions.map((q) => {
      const qDoc = {
        _id: q.id,
        prompt: q.prompt,
        codeSnippet: q.codeSnippet || '',
        order: q.order,
        options: q.options.map((o) => ({
          _id: o.id,
          text: o.text,
          order: o.order,
        })),
        correctOptionId: q.correctOptionId,
        explanation: q.order === 5 ? CORRECTED_Q6_EXPLANATION : q.explanation,
      };
      return qDoc;
    });

    // 3. Send PUT request through Creator API
    console.log('\n3. Sending PUT request to update assessment via Creator API...');
    const updateRes = await request(
      `/api/creator/courses/${COURSE_ID}/assessments/${ASSESSMENT_ID}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: currentAssessment.title,
          description: currentAssessment.description,
          status: currentAssessment.status,
          passingScore: currentAssessment.passingScore,
          timeLimitMinutes: currentAssessment.timeLimitMinutes,
          maxAttempts: currentAssessment.maxAttempts,
          questions: updatedQuestions,
        }),
      },
      creatorToken
    );

    if (updateRes.status !== 200) {
      console.error('PUT request failed:', updateRes.status, updateRes.data);
      process.exit(1);
    }

    console.log(`✓ PUT /api/creator/courses/:courseId/assessments/:assessmentId returned ${updateRes.status} OK`);
    console.log(`  Message: ${updateRes.data.message}`);

    const updatedQ6 = updateRes.data.data.assessment.questions.find((q) => q.order === 5);
    console.log('\n--- Verified Updated Question 6 via API ---');
    console.log(`Prompt: ${updatedQ6.prompt}`);
    console.log(`New Explanation: ${updatedQ6.explanation}`);

    // Verify in database
    const dbAssessment = await Assessment.findById(ASSESSMENT_ID);
    const dbQ6 = dbAssessment.questions.find((q) => q.order === 5);
    if (dbQ6.explanation !== CORRECTED_Q6_EXPLANATION) {
      throw new Error('Database record does not match expected corrected explanation');
    }
    console.log('✓ Confirmed in MongoDB: Question 6 explanation successfully updated in database record.');

  } finally {
    // 4. Clean up temporary refresh sessions
    await RefreshSession.deleteMany({});
  }
}

run().then(() => {
  console.log('\nCorrection script completed successfully.');
  process.exit(0);
}).catch((err) => {
  console.error('\nCorrection script failed:', err.message);
  process.exit(1);
});
