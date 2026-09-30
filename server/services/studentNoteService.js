import mongoose from 'mongoose';
import Note from '../models/Note.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

/**
 * Helper to escape regex special characters for safe keyword searching
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Format clean safe note output
 */
function formatSafeNote(noteDoc) {
  if (!noteDoc) return null;
  const raw = typeof noteDoc.toObject === 'function' ? noteDoc.toObject() : noteDoc;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    userId: raw.userId ? raw.userId.toString() : undefined,
    noteType: raw.noteType || 'standalone',
    title: raw.title || '',
    content: raw.content || '',
    selectedText: raw.selectedText || '',
    courseId: raw.courseId ? raw.courseId.toString() : null,
    moduleId: raw.moduleId ? raw.moduleId.toString() : null,
    topicId: raw.topicId ? raw.topicId.toString() : null,
    courseTitle: raw.courseTitle || '',
    moduleTitle: raw.moduleTitle || '',
    topicTitle: raw.topicTitle || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    color: raw.color || 'default',
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
  };
}

class StudentNoteService {
  /**
   * Creates a new personalized student note (standalone or highlight-based).
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID (server-derived).
   * @param {string} [params.noteType='standalone'] - 'standalone' | 'highlight'
   * @param {string} [params.title=''] - Student note title.
   * @param {string} [params.content=''] - Student explanation / personal commentary.
   * @param {string} [params.selectedText=''] - Plain text highlighted from topic content.
   * @param {string} [params.courseId] - Source Course ID (required for highlight).
   * @param {string} [params.moduleId] - Source Module ID (required for highlight).
   * @param {string} [params.topicId] - Source Topic ID (required for highlight).
   * @param {string[]} [params.tags=[]] - Optional student tags.
   * @param {string} [params.color='default'] - Card accent color.
   * @returns {Promise<Object>} Formatted note.
   */
  async createNote({
    userId,
    noteType = 'standalone',
    title = '',
    content = '',
    selectedText = '',
    courseId = null,
    moduleId = null,
    topicId = null,
    tags = [],
    color = 'default',
  }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const cleanNoteType = noteType === 'highlight' ? 'highlight' : 'standalone';
    const cleanTitle = typeof title === 'string' ? title.trim().slice(0, 200) : '';
    const cleanContent = typeof content === 'string' ? content.trim().slice(0, 10000) : '';
    const cleanSelectedText = typeof selectedText === 'string' ? selectedText.trim().slice(0, 5000) : '';

    let cleanCourseId = null;
    let cleanModuleId = null;
    let cleanTopicId = null;
    let courseTitle = '';
    let moduleTitle = '';
    let topicTitle = '';

    if (cleanNoteType === 'highlight') {
      // 1. Validation for Highlight Note: requires courseId, moduleId, topicId and selectedText
      if (!cleanSelectedText) {
        const err = new Error('Selected text is required for highlight-based notes');
        err.statusCode = 400;
        throw err;
      }

      if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        const err = new Error('Valid Course ID is required for highlight-based notes');
        err.statusCode = 400;
        throw err;
      }

      if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
        const err = new Error('Valid Module ID is required for highlight-based notes');
        err.statusCode = 400;
        throw err;
      }

      if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
        const err = new Error('Valid Topic ID is required for highlight-based notes');
        err.statusCode = 400;
        throw err;
      }

      cleanCourseId = new mongoose.Types.ObjectId(courseId);
      cleanModuleId = new mongoose.Types.ObjectId(moduleId);
      cleanTopicId = new mongoose.Types.ObjectId(topicId);

      // 2. Strict Hierarchy Verification: Verify Course, Module, Topic exist and match hierarchy
      const course = await Course.findById(cleanCourseId).select('_id title status');
      if (!course) {
        const err = new Error('Referenced course not found');
        err.statusCode = 404;
        throw err;
      }

      if (course.status !== 'published') {
        const err = new Error('Notes can only be attached to published courses');
        err.statusCode = 400;
        throw err;
      }

      const courseModule = await Module.findById(cleanModuleId).select('_id courseId title');
      if (!courseModule) {
        const err = new Error('Referenced module not found');
        err.statusCode = 404;
        throw err;
      }

      if (courseModule.courseId.toString() !== cleanCourseId.toString()) {
        const err = new Error('Module does not belong to the specified course');
        err.statusCode = 400;
        throw err;
      }

      const topic = await Topic.findById(cleanTopicId).select('_id courseId moduleId title');
      if (!topic) {
        const err = new Error('Referenced topic not found');
        err.statusCode = 404;
        throw err;
      }

      if (topic.courseId.toString() !== cleanCourseId.toString()) {
        const err = new Error('Topic does not belong to the specified course');
        err.statusCode = 400;
        throw err;
      }

      if (topic.moduleId.toString() !== cleanModuleId.toString()) {
        const err = new Error('Topic does not belong to the specified module');
        err.statusCode = 400;
        throw err;
      }

      // Snapshot titles for display in revision lists
      courseTitle = course.title;
      moduleTitle = courseModule.title;
      topicTitle = topic.title;
    } else {
      // Standalone Note: must have either title or content
      if (!cleanTitle && !cleanContent) {
        const err = new Error('Standalone note must have either a title or note content');
        err.statusCode = 400;
        throw err;
      }
    }

    // Sanitize tags
    const cleanTags = Array.isArray(tags)
      ? Array.from(
          new Set(
            tags
              .filter((t) => typeof t === 'string' && t.trim().length > 0)
              .map((t) => t.trim().slice(0, 50))
          )
        ).slice(0, 10)
      : [];

    // Sanitize color
    const validColors = ['default', 'amber', 'emerald', 'sky', 'indigo', 'rose', 'purple'];
    const cleanColor = validColors.includes(color) ? color : 'default';

    // Auto-generate title if none provided for highlight note
    const finalTitle =
      cleanTitle ||
      (cleanNoteType === 'highlight'
        ? topicTitle
          ? `Note: ${topicTitle}`
          : cleanSelectedText.slice(0, 60)
        : 'Personal Note');

    const note = new Note({
      userId: userObjId,
      noteType: cleanNoteType,
      title: finalTitle,
      content: cleanContent,
      selectedText: cleanSelectedText,
      courseId: cleanCourseId,
      moduleId: cleanModuleId,
      topicId: cleanTopicId,
      courseTitle,
      moduleTitle,
      topicTitle,
      tags: cleanTags,
      color: cleanColor,
    });

    const saved = await note.save();
    return formatSafeNote(saved);
  }

  /**
   * Retrieves notes owned by the authenticated student with optional filters, search, and pagination.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId
   * @param {string} [params.courseId]
   * @param {string} [params.topicId]
   * @param {string} [params.noteType]
   * @param {string} [params.search]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.sort='newest']
   * @returns {Promise<Object>} { notes, pagination }
   */
  async getNotes({
    userId,
    courseId = null,
    topicId = null,
    noteType = null,
    search = '',
    page = 1,
    limit = 20,
    sort = 'newest',
  }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const query = { userId: userObjId };

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
      query.topicId = new mongoose.Types.ObjectId(topicId);
    }

    if (noteType === 'standalone' || noteType === 'highlight') {
      query.noteType = noteType;
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const safeKeyword = escapeRegex(search.trim().slice(0, 100));
      const searchRegex = new RegExp(safeKeyword, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { selectedText: searchRegex },
        { topicTitle: searchRegex },
        { courseTitle: searchRegex },
        { tags: searchRegex },
      ];
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    let sortObj = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'updated':
        sortObj = { updatedAt: -1 };
        break;
      case 'title_asc':
        sortObj = { title: 1 };
        break;
      case 'title_desc':
        sortObj = { title: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const [total, noteDocs] = await Promise.all([
      Note.countDocuments(query),
      Note.find(query).sort(sortObj).skip(skip).limit(parsedLimit).lean(),
    ]);

    return {
      notes: noteDocs.map(formatSafeNote),
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1,
      },
    };
  }

  /**
   * Retrieves a single student note by ID with strict ownership enforcement.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId
   * @param {string|mongoose.Types.ObjectId} params.noteId
   * @returns {Promise<Object>}
   */
  async getNoteById({ userId, noteId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      const err = new Error('Invalid note ID format');
      err.statusCode = 400;
      throw err;
    }

    const note = await Note.findOne({
      _id: new mongoose.Types.ObjectId(noteId),
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!note) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }

    return formatSafeNote(note);
  }

  /**
   * Updates student commentary, title, tags, or color on an existing note.
   * Source references (Course, Module, Topic, SelectedText) remain immutable to preserve provenance.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId
   * @param {string|mongoose.Types.ObjectId} params.noteId
   * @param {string} [params.title]
   * @param {string} [params.content]
   * @param {string[]} [params.tags]
   * @param {string} [params.color]
   * @returns {Promise<Object>} Updated note.
   */
  async updateNote({ userId, noteId, title, content, tags, color }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      const err = new Error('Invalid note ID format');
      err.statusCode = 400;
      throw err;
    }

    const note = await Note.findOne({
      _id: new mongoose.Types.ObjectId(noteId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!note) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }

    if (title !== undefined) {
      note.title = typeof title === 'string' ? title.trim().slice(0, 200) : note.title;
    }

    if (content !== undefined) {
      note.content = typeof content === 'string' ? content.trim().slice(0, 10000) : note.content;
    }

    // Standalone note must not end up completely blank
    if (note.noteType === 'standalone' && !note.title.trim() && !note.content.trim()) {
      const err = new Error('Standalone note must retain either a title or content');
      err.statusCode = 400;
      throw err;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      note.tags = Array.from(
        new Set(
          tags
            .filter((t) => typeof t === 'string' && t.trim().length > 0)
            .map((t) => t.trim().slice(0, 50))
        )
      ).slice(0, 10);
    }

    if (color !== undefined) {
      const validColors = ['default', 'amber', 'emerald', 'sky', 'indigo', 'rose', 'purple'];
      if (validColors.includes(color)) {
        note.color = color;
      }
    }

    const updated = await note.save();
    return formatSafeNote(updated);
  }

  /**
   * Deletes a student note with strict ownership enforcement.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId
   * @param {string|mongoose.Types.ObjectId} params.noteId
   * @returns {Promise<Object>} { success: true, deletedId: string }
   */
  async deleteNote({ userId, noteId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      const err = new Error('Invalid note ID format');
      err.statusCode = 400;
      throw err;
    }

    const deleted = await Note.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(noteId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      success: true,
      deletedId: noteId.toString(),
    };
  }

  /**
   * Retrieves summary statistics of notes owned by the student.
   * Useful for student dashboard, revision overview, and course counters.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId
   * @returns {Promise<Object>}
   */
  async getNotesStats({ userId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    const [totalNotes, standaloneNotes, highlightNotes, distinctCourses] = await Promise.all([
      Note.countDocuments({ userId: userObjId }),
      Note.countDocuments({ userId: userObjId, noteType: 'standalone' }),
      Note.countDocuments({ userId: userObjId, noteType: 'highlight' }),
      Note.distinct('courseId', { userId: userObjId, courseId: { $ne: null } }),
    ]);

    return {
      totalNotes,
      standaloneNotes,
      highlightNotes,
      coursesWithNotesCount: distinctCourses.length,
    };
  }
}

const studentNoteService = new StudentNoteService();
export default studentNoteService;
