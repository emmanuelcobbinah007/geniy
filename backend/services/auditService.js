const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
    /**
     * Logs an activity to the database.
     * @param {Object} params
     * @param {string} params.userId - ID of the user performing the action (optional for system actions)
     * @param {string} params.workspaceId - Workspace ID involved
     * @param {string} params.action - Action name (e.g. 'CONTEXT_VIEW', 'CONTEXT_UPDATE')
     * @param {Object} params.metadata - Additional details (optional)
     * @param {string} params.campaignId - Optional
     * @param {string} params.surveyId - Optional
     */
    async log(params) {
        try {
            const { userId, workspaceId, action, metadata, campaignId, surveyId } = params;

            await prisma.activityLog.create({
                data: {
                    userId,
                    workspaceId,
                    action,
                    metadata: metadata ? metadata : undefined,
                    campaignId,
                    surveyId
                }
            });

            // Console log for debug/dev (can be removed in prod)
            console.log(`[AUDIT] ${action} by ${userId || 'SYSTEM'} in ${workspaceId || 'GLOBAL'}`);

        } catch (error) {
            console.error("Audit Log Failure:", error);
            // We do not throw here to avoid failing the main request just because logging failed
        }
    }
}

module.exports = new AuditService();
