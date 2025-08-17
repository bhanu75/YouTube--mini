
const Note = require('../models/Note');
const { Logger } = require('../utils/logger');
const { YouTubeService } = require('../config/youtube');

class NoteController {

  // Get all notes for user
  static async getAllNotes(req, res) {
    try {
      const user = req.user;
      const {
        page = 1,
        limit = 20,
        status = 'active',
        category,
        priority,
        tags,
        videoId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = { userId: user._id };

      if (status && status !== 'all') {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (priority) {
        query.priority = priority;
      }

      if (videoId) {
        query.videoId = videoId;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        query.tags = { $in: tagArray };
      }

      // Handle search
      if (search) {
        query.$text = { $search: search };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build sort object
      const sortObj = {};
      if (search) {
        sortObj.score = { $meta: 'textScore' };
      }
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [notes, totalCount] = await Promise.all([
        Note.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Note.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      // Log notes fetch
      await Logger.logActivity(
        user._id,
        'NOTE_SEARCH',
        `Fetched ${notes.length} notes`,
        {
          query: req.query,
          resultCount: notes.length,
          totalCount
        }
      );

      res.json({
        success: true,
        notes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching notes:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getAllNotes',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch notes'
      });
    }
  }

  // Get note by ID
  static async getNoteById(req, res) {
    try {
      const { noteId } = req.params;
      const user = req.user;

      const note = await Note.findOne({
        _id: noteId,
        userId: user._id
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      // Increment view count
      await note.incrementViewCount();

      // Log note view
      await Logger.logNoteOperation(
        user._id,
        'VIEW',
        note._id,
        note.title,
        {
          videoId: note.videoId,
          category: note.category,
          viewCount: note.metadata.viewCount
        }
      );

      res.json({
        success: true,
        note
      });

    } catch (error) {
      console.error('Error fetching note:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getNoteById',
        noteId: req.params.noteId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch note'
      });
    }
  }

  // Create new note
  static async createNote(req, res) {
    try {
      const user = req.user;
      const {
        videoId,
        videoTitle,
        title,
        content,
        tags = [],
        category = 'general',
        priority = 'medium',
        color = 'yellow',
        reminderDate
      } = req.body;

      // Validate required fields
      if (!videoId || !title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Video ID, title, and content are required'
        });
      }

      // Validate title and content length
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title must be 200 characters or less'
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Content must be 5000 characters or less'
        });
      }

      // Validate and clean tags
      const cleanTags = Array.isArray(tags) 
        ? tags.filter(tag => tag && tag.trim()).map(tag => tag.trim().toLowerCase()).slice(0, 10)
        : [];

      // Get video title if not provided
      let finalVideoTitle = videoTitle;
      if (!finalVideoTitle && req.oauth2Client) {
        try {
          YouTubeService.setCredentials(req.oauth2Client.credentials);
          const videoDetails = await YouTubeService.getVideoDetails(videoId);
          finalVideoTitle = videoDetails.snippet.title;
        } catch (videoError) {
          console.warn('Could not fetch video title:', videoError.message);
          finalVideoTitle = 'Unknown Video';
        }
      }

      // Create note
      const note = new Note({
        userId: user._id,
        videoId,
        videoTitle: finalVideoTitle || 'Unknown Video',
        title: title.trim(),
        content: content.trim(),
        tags: cleanTags,
        category,
        priority,
        color,
        reminderDate: reminderDate ? new Date(reminderDate) : null
      });

      await note.save();

      // Log note creation
      await Logger.logNoteOperation(
        user._id,
        'CREATE',
        note._id,
        note.title,
        {
          videoId: note.videoId,
          category: note.category,
          priority: note.priority,
          contentLength: note.content.length,
          tagCount: note.tags.length
        }
      );

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        note
      });

    } catch (error) {
      console.error('Error creating note:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'createNote',
        noteData: { ...req.body, content: req.body.content?.substring(0, 100) }
      });

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create note'
      });
    }
  }

  // Update note
  static async updateNote(req, res) {
    try {
      const { noteId } = req.params;
      const user = req.user;
      const updateData = req.body;

      // Find note
      const note = await Note.findOne({
        _id: noteId,
        userId: user._id
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      // Track what fields are being updated
      const updatedFields = [];

      // Update allowed fields
      const allowedUpdates = [
        'title', 'content', 'tags', 'category', 'priority', 'color', 
        'status', 'reminderDate', 'isBookmarked'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'tags' && Array.isArray(updateData[field])) {
            note[field] = updateData[field]
              .filter(tag => tag && tag.trim())
              .map(tag => tag.trim().toLowerCase())
              .slice(0, 10);
          } else if (field === 'reminderDate') {
            note[field] = updateData[field] ? new Date(updateData[field]) : null;
          } else {
            note[field] = updateData[field];
          }
          updatedFields.push(field);
        }
      });

      // Validate updated content
      if (note.title && note.title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title must be 200 characters or less'
        });
      }

      if (note.content && note.content.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Content must be 5000 characters or less'
        });
      }

      await note.save();

      // Log note update
      await Logger.logNoteOperation(
        user._id,
        'UPDATE',
        note._id,
        note.title,
        {
          videoId: note.videoId,
          updatedFields,
          category: note.category,
          priority: note.priority
        }
      );

      res.json({
        success: true,
        message: 'Note updated successfully',
        note
      });

    } catch (error) {
      console.error('Error updating note:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'updateNote',
        noteId: req.params.noteId,
        updateData: req.body
      });

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update note'
      });
    }
  }

  // Delete note
  static async deleteNote(req, res) {
    try {
      const { noteId } = req.params;
      const user = req.user;
      const { permanent = false } = req.query;

      // Find note
      const note = await Note.findOne({
        _id: noteId,
        userId: user._id
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      let operation;
      if (permanent === 'true' || note.status === 'archived') {
        // Permanently delete
        await Note.findByIdAndDelete(noteId);
        operation = 'DELETE_PERMANENT';
      } else {
        // Soft delete (archive)
        note.status = 'archived';
        await note.save();
        operation = 'DELETE_SOFT';
      }

      // Log note deletion
      await Logger.logNoteOperation(
        user._id,
        operation,
        note._id,
        note.title,
        {
          videoId: note.videoId,
          permanent: permanent === 'true',
          category: note.category
        }
      );

      res.json({
        success: true,
        message: permanent === 'true' 
          ? 'Note permanently deleted' 
          : 'Note moved to archive'
      });

    } catch (error) {
      console.error('Error deleting note:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'deleteNote',
        noteId: req.params.noteId,
        permanent: req.query.permanent
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete note'
      });
    }
  }

  // Get notes by video ID
  static async getNotesByVideo(req, res) {
    try {
      const { videoId } = req.params;
      const user = req.user;
      const { status = 'active', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const query = {
        userId: user._id,
        videoId
      };

      if (status !== 'all') {
        query.status = status;
      }

      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const notes = await Note.find(query).sort(sortObj);

      res.json({
        success: true,
        notes,
        count: notes.length
      });

    } catch (error) {
      console.error('Error fetching notes by video:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getNotesByVideo',
        videoId: req.params.videoId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch notes for video'
      });
    }
  }

  // Search notes
  static async searchNotes(req, res) {
    try {
      const user = req.user;
      const { 
        query: searchQuery, 
        category, 
        status, 
        priority, 
        tags,
        limit = 50 
      } = req.query;

      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const filters = {
        category,
        status,
        priority,
        tags: tags ? tags.split(',') : undefined,
        limit: parseInt(limit)
      };

      const notes = await Note.searchNotes(user._id, searchQuery, filters);

      // Log search
      await Logger.logActivity(
        user._id,
        'NOTE_SEARCH',
        `Searched notes: "${searchQuery}"`,
        {
          searchQuery,
          filters,
          resultCount: notes.length
        }
      );

      res.json({
        success: true,
        notes,
        searchQuery,
        resultCount: notes.length
      });

    } catch (error) {
      console.error('Error searching notes:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'searchNotes',
        searchQuery: req.query.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search notes'
      });
    }
  }

  // Get note statistics
  static async getNoteStats(req, res) {
    try {
      const user = req.user;

      const stats = await Note.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
            totalWords: { $sum: '$metadata.wordCount' },
            avgWordsPerNote: { $avg: '$metadata.wordCount' },
            totalViewCount: { $sum: '$metadata.viewCount' }
          }
        }
      ]);

      const categoryStats = await Note.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const priorityStats = await Note.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentActivity = await Note.find({
        userId: user._id
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title videoTitle category status updatedAt');

      const formattedStats = {
        overview: stats[0] || {
          total: 0,
          active: 0,
          completed: 0,
          archived: 0,
          totalWords: 0,
          avgWordsPerNote: 0,
          totalViewCount: 0
        },
        byCategory: categoryStats,
        byPriority: priorityStats,
        recentActivity
      };

      res.json({
        success: true,
        stats: formattedStats
      });

    } catch (error) {
      console.error('Error fetching note stats:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getNoteStats'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch note statistics'
      });
    }
  }

  // Bulk operations on notes
  static async bulkOperation(req, res) {
    try {
      const user = req.user;
      const { operation, noteIds, updateData } = req.body;

      if (!operation || !Array.isArray(noteIds) || noteIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Operation type and note IDs are required'
        });
      }

      if (noteIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Cannot process more than 100 notes at once'
        });
      }

      let result;
      const validNoteIds = noteIds.filter(id => id && typeof id === 'string');

      switch (operation) {
        case 'delete':
          result = await Note.updateMany(
            { _id: { $in: validNoteIds }, userId: user._id },
            { status: 'archived' }
          );
          break;

        case 'delete_permanent':
          result = await Note.deleteMany(
            { _id: { $in: validNoteIds }, userId: user._id }
          );
          break;

        case 'restore':
          result = await Note.updateMany(
            { _id: { $in: validNoteIds }, userId: user._id },
            { status: 'active' }
          );
          break;

        case 'update_status':
          if (!updateData?.status) {
            return res.status(400).json({
              success: false,
              message: 'Status is required for update operation'
            });
          }
          result = await Note.updateMany(
            { _id: { $in: validNoteIds }, userId: user._id },
            { status: updateData.status }
          );
          break;

        case 'update_category':
          if (!updateData?.category) {
            return res.status(400).json({
              success: false,
              message: 'Category is required for update operation'
            });
          }
          result = await Note.updateMany(
            { _id: { $in: validNoteIds }, userId: user._id },
            { category: updateData.category }
          );
          break;

        case 'update_priority':
          if (!updateData?.priority) {
            return res.status(400).json({
              success: false,
              message: 'Priority is required for update operation'
            });
          }
          result = await Note.updateMany(
            { _id: { $in: validNoteIds }, userId: user._id },
            { priority: updateData.priority }
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid operation type'
          });
      }

      // Log bulk operation
      await Logger.logActivity(
        user._id,
        'NOTE_BULK_OPERATION',
        `Bulk ${operation} on ${result.modifiedCount} notes`,
        {
          operation,
          noteIds: validNoteIds,
          updateData,
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        }
      );

      res.json({
        success: true,
        message: `Bulk ${operation} completed successfully`,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      });

    } catch (error) {
      console.error('Error performing bulk operation:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'bulkOperation',
        requestBody: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation'
      });
    }
  }

  // Get unique tags
  static async getTags(req, res) {
    try {
      const user = req.user;

      const tags = await Note.aggregate([
        { $match: { userId: user._id, status: { $ne: 'archived' } } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 100 }
      ]);

      const formattedTags = tags.map(tag => ({
        name: tag._id,
        count: tag.count
      }));

      res.json({
        success: true,
        tags: formattedTags
      });

    } catch (error) {
      console.error('Error fetching tags:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch tags'
      });
    }
  }
}

module.exports = NoteController;
