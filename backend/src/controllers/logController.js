
const EventLog = require('../models/EventLog');
const { Logger } = require('../utils/logger');

class LogController {

  // Get user activity logs
  static async getUserLogs(req, res) {
    try {
      const user = req.user;
      const {
        page = 1,
        limit = 50,
        eventType,
        severity,
        resourceType,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      // Build query options
      const options = {
        eventType,
        severity,
        resourceType,
        startDate,
        endDate,
        limit: Math.min(parseInt(limit), 100), // Max 100 logs per request
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      // Get logs using model method
      const logs = await EventLog.getUserLogs(user._id, options);

      // Get total count for pagination
      const query = { userId: user._id };
      if (eventType) query.eventType = eventType;
      if (severity) query.severity = severity;
      if (resourceType) query.resourceType = resourceType;
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const totalCount = await EventLog.countDocuments(query);
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      // Format logs for response
      const formattedLogs = logs.map(log => log.formatForDisplay());

      res.json({
        success: true,
        logs: formattedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching user logs:', error);

      // Log the error
      await Logger.logError(req.user._id, error, {
        operation: 'getUserLogs',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity logs'
      });
    }
  }

  // Get activity statistics
  static async getActivityStats(req, res) {
    try {
      const user = req.user;
      const { days = 30 } = req.query;

      // Validate days parameter
      const daysNum = Math.min(Math.max(parseInt(days), 1), 365); // Between 1-365 days

      // Get activity statistics
      const activityStats = await EventLog.getActivityStats(user._id, daysNum);

      // Get daily activity breakdown
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      const dailyActivity = await EventLog.aggregate([
        {
          $match: {
            userId: user._id,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 },
            errors: {
              $sum: {
                $cond: [{ $eq: ['$severity', 'error'] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      // Get event type breakdown
      const eventTypeBreakdown = await EventLog.aggregate([
        {
          $match: {
            userId: user._id,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            lastOccurrence: { $max: '$timestamp' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 20
        }
      ]);

      // Get resource type breakdown
      const resourceTypeBreakdown = await EventLog.aggregate([
        {
          $match: {
            userId: user._id,
            timestamp: { $gte: startDate },
            resourceType: { $ne: 'system' }
          }
        },
        {
          $group: {
            _id: '$resourceType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Calculate summary statistics
      const totalLogs = await EventLog.countDocuments({
        userId: user._id,
        timestamp: { $gte: startDate }
      });

      const errorCount = await EventLog.countDocuments({
        userId: user._id,
        timestamp: { $gte: startDate },
        severity: 'error'
      });

      const mostActiveDay = dailyActivity.reduce((max, day) => 
        day.count > (max?.count || 0) ? day : max, null);

      const stats = {
        summary: {
          totalActivities: totalLogs,
          errorCount,
          errorRate: totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(2) : 0,
          averagePerDay: (totalLogs / daysNum).toFixed(1),
          periodDays: daysNum,
          mostActiveDay: mostActiveDay ? {
            date: `${mostActiveDay._id.year}-${String(mostActiveDay._id.month).padStart(2, '0')}-${String(mostActiveDay._id.day).padStart(2, '0')}`,
            count: mostActiveDay.count
          } : null
        },
        byEventType: eventTypeBreakdown,
        byResourceType: resourceTypeBreakdown,
        dailyBreakdown: dailyActivity.map(day => ({
          date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
          count: day.count,
          errors: day.errors
        })),
        topActivities: activityStats.slice(0, 10)
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error fetching activity stats:', error);

      // Log the error
      await Logger.logError(req.user._id, error, {
        operation: 'getActivityStats',
        days: req.query.days
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity statistics'
      });
    }
  }

  // Get logs by event type
  static async getLogsByEventType(req, res) {
    try {
      const user = req.user;
      const { eventType } = req.params;
      const { 
        limit = 20, 
        page = 1,
        startDate,
        endDate 
      } = req.query;

      if (!eventType) {
        return res.status(400).json({
          success: false,
          message: 'Event type is required'
        });
      }

      // Build query
      const query = {
        userId: user._id,
        eventType
      };

      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Fetch logs
      const [logs, totalCount] = await Promise.all([
        EventLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        EventLog.countDocuments(query)
      ]);

      // Format logs
      const formattedLogs = logs.map(log => ({
        id: log._id,
        description: log.description,
        timestamp: log.timestamp,
        severity: log.severity,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        metadata: {
          videoTitle: log.metadata?.videoTitle,
          noteTitle: log.metadata?.noteTitle,
          statusCode: log.metadata?.statusCode,
          duration: log.metadata?.duration
        }
      }));

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        success: true,
        eventType,
        logs: formattedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching logs by event type:', error);

      // Log the error
      await Logger.logError(req.user._id, error, {
        operation: 'getLogsByEventType',
        eventType: req.params.eventType,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch logs by event type'
      });
    }
  }

  // Get error logs
  static async getErrorLogs(req, res) {
    try {
      const user = req.user;
      const { 
        limit = 20, 
        page = 1,
        startDate,
        endDate,
        severity = 'error'
      } = req.query;

      // Build query for error logs
      const query = {
        userId: user._id,
        severity: { $in: ['error', 'critical'] }
      };

      if (severity !== 'all') {
        query.severity = severity;
      }

      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Fetch error logs
      const [errorLogs, totalCount] = await Promise.all([
        EventLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        EventLog.countDocuments(query)
      ]);

      // Format error logs with more details
      const formattedLogs = errorLogs.map(log => ({
        id: log._id,
        eventType: log.eventType,
        description: log.description,
        timestamp: log.timestamp,
        severity: log.severity,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        errorDetails: {
          errorCode: log.metadata?.errorCode,
          errorMessage: log.metadata?.errorMessage,
          statusCode: log.metadata?.statusCode,
          apiEndpoint: log.metadata?.apiEndpoint,
          httpMethod: log.metadata?.httpMethod
        },
        context: {
          userAgent: log.metadata?.userAgent,
          ipAddress: log.metadata?.ipAddress,
          sessionId: log.sessionId
        }
      }));

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      // Get error summary
      const errorSummary = await EventLog.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            latestError: { $max: '$timestamp' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      res.json({
        success: true,
        logs: formattedLogs,
        summary: errorSummary,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching error logs:', error);

      // Log the error (avoid infinite loop by checking if this is already an error log request)
      if (req.originalUrl !== '/api/logs/errors') {
        await Logger.logError(req.user._id, error, {
          operation: 'getErrorLogs',
          query: req.query
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch error logs'
      });
    }
  }

  // Clear old logs (admin function)
  static async clearOldLogs(req, res) {
    try {
      const user = req.user;
      const { days = 90, confirm = false } = req.body;

      if (!confirm) {
        return res.status(400).json({
          success: false,
          message: 'Confirmation required for log deletion'
        });
      }

      // Validate days parameter
      const daysNum = Math.min(Math.max(parseInt(days), 30), 365); // Between 30-365 days

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNum);

      // Delete old logs
      const deleteResult = await EventLog.deleteMany({
        userId: user._id,
        timestamp: { $lt: cutoffDate },
        severity: { $nin: ['error', 'critical'] } // Keep error logs
      });

      // Log the cleanup operation
      await Logger.logActivity(
        user._id,
        'LOG_CLEANUP',
        `Cleared ${deleteResult.deletedCount} old activity logs`,
        {
          daysKept: daysNum,
          deletedCount: deleteResult.deletedCount,
          cutoffDate: cutoffDate.toISOString()
        }
      );

      res.json({
        success: true,
        message: `Successfully cleared ${deleteResult.deletedCount} old logs`,
        deletedCount: deleteResult.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });

    } catch (error) {
      console.error('Error clearing old logs:', error);

      // Log the error
      await Logger.logError(req.user._id, error, {
        operation: 'clearOldLogs',
        requestBody: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to clear old logs'
      });
    }
  }

  // Export logs (for backup or analysis)
  static async exportLogs(req, res) {
    try {
      const user = req.user;
      const { 
        format = 'json',
        startDate,
        endDate,
        eventTypes,
        includeMetadata = true
      } = req.query;

      // Build query
      const query = { userId: user._id };

      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      if (eventTypes) {
        const eventTypeArray = Array.isArray(eventTypes) ? eventTypes : eventTypes.split(',');
        query.eventType = { $in: eventTypeArray };
      }

      // Limit export to prevent memory issues
      const logs = await EventLog.find(query)
        .sort({ timestamp: -1 })
        .limit(10000) // Max 10k logs
        .lean();

      // Format logs for export
      const exportData = logs.map(log => {
        const exportLog = {
          id: log._id,
          timestamp: log.timestamp,
          eventType: log.eventType,
          description: log.description,
          severity: log.severity,
          resourceType: log.resourceType,
          resourceId: log.resourceId
        };

        if (includeMetadata === 'true') {
          exportLog.metadata = log.metadata;
        }

        return exportLog;
      });

      // Set response headers for file download
      const filename = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (format === 'csv') {
        // Convert to CSV format
        const csv = [
          'timestamp,eventType,description,severity,resourceType,resourceId',
          ...exportData.map(log => 
            `"${log.timestamp}","${log.eventType}","${log.description}","${log.severity}","${log.resourceType}","${log.resourceId}"`
          )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      } else {
        // Default to JSON
        res.setHeader('Content-Type', 'application/json');
        res.json({
          exportDate: new Date().toISOString(),
          totalRecords: exportData.length,
          query: req.query,
          logs: exportData
        });
      }

      // Log the export operation
      await Logger.logActivity(
        user._id,
        'LOG_EXPORT',
        `Exported ${exportData.length} activity logs`,
        {
          format,
          recordCount: exportData.length,
          query: req.query
        }
      );

    } catch (error) {
      console.error('Error exporting logs:', error);

      // Log the error
      await Logger.logError(req.user._id, error, {
        operation: 'exportLogs',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to export logs'
      });
    }
  }
}

module.exports = LogController;

