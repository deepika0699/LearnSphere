import studentNoteService from '../services/studentNoteService.js';

/**
 * POST /api/student/notes
 * Creates a personal note (standalone or highlight-based).
 */
export async function createNoteHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const {
      noteType,
      title,
      content,
      selectedText,
      courseId,
      moduleId,
      topicId,
      tags,
      color,
    } = req.body;

    const note = await studentNoteService.createNote({
      userId,
      noteType,
      title,
      content,
      selectedText,
      courseId,
      moduleId,
      topicId,
      tags,
      color,
    });

    res.status(201).json({
      status: 'success',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/student/notes
 * Retrieves all notes owned by authenticated student, with optional query filters.
 */
export async function getNotesHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { courseId, topicId, noteType, search, page, limit, sort } = req.query;

    const result = await studentNoteService.getNotes({
      userId,
      courseId,
      topicId,
      noteType,
      search,
      page,
      limit,
      sort,
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/student/notes/stats
 * Retrieves note count and distribution statistics for the student.
 */
export async function getNotesStatsHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const stats = await studentNoteService.getNotesStats({ userId });

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/student/notes/:id
 * Retrieves a single note by ID with strict student ownership enforcement.
 */
export async function getNoteByIdHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id: noteId } = req.params;

    const note = await studentNoteService.getNoteById({ userId, noteId });

    res.status(200).json({
      status: 'success',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/student/notes/:id
 * Updates note commentary, title, tags, or color.
 */
export async function updateNoteHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id: noteId } = req.params;
    const { title, content, tags, color } = req.body;

    const note = await studentNoteService.updateNote({
      userId,
      noteId,
      title,
      content,
      tags,
      color,
    });

    res.status(200).json({
      status: 'success',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/student/notes/:id
 * Deletes a note owned by the student.
 */
export async function deleteNoteHandler(req, res, next) {
  try {
    const userId = req.user.userId;
    const { id: noteId } = req.params;

    const result = await studentNoteService.deleteNote({ userId, noteId });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
