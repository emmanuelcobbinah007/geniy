
/**
 * Utility to convert technical errors into user-friendly messages.
 * Prevents raw stack traces or database errors from being shown to users.
 */

// Special prefix to identify gated errors
export const GATED_ERROR_PREFIX = "UPGRADE_REQUIRED:";

/**
 * Check if an error response is a gating error
 */
export function isGatedError(error: any): boolean {
    if (error?.gated) return true;
    if (error?.response?.data?.gated) return true;
    const message = error?.message || error?.error || String(error);
    return message.includes(GATED_ERROR_PREFIX) || message.includes("requires") && message.includes("plan");
}

/**
 * Extract gating info from error
 */
export function getGatingInfo(error: any): { feature?: string; requiredTier?: string; currentTier?: string } | null {
    const data = error?.response?.data || error;
    if (!data?.gated) return null;
    return {
        feature: data.feature,
        requiredTier: data.requiredTier,
        currentTier: data.currentTier
    };
}

export function userFriendlyError(error: any): string {
    const rawMessage = error?.message || error?.error || String(error);
    const responseData = error?.response?.data;

    // 0. Gated/Upgrade Required Errors
    if (responseData?.gated || error?.gated) {
        const feature = responseData?.feature || error?.feature || 'This feature';
        const requiredTier = responseData?.requiredTier || error?.requiredTier || 'a paid plan';
        return `${GATED_ERROR_PREFIX}${feature} requires ${requiredTier} or higher. Upgrade to unlock.`;
    }
    if (rawMessage.includes("limit") && (rawMessage.includes("reached") || rawMessage.includes("exceeded"))) {
        return `${GATED_ERROR_PREFIX}${rawMessage}`;
    }

    // 1. Prisma / Database Connection Errors
    if (rawMessage.includes("Can't reach database server") || rawMessage.includes("PrismaClientInitializationError")) {
        return "Service temporarily unavailable. Please try again later. (DB_CONN)";
    }
    if (rawMessage.includes("Unique constraint failed")) {
        return "This record already exists. Please check your data.";
    }

    // 2. Authentication Errors
    if (rawMessage.includes("Google authentication failed")) {
        if (rawMessage.includes("UserLookup")) {
             return "Unable to verify account. Please try signing up again. (AUTH_USER_LOOKUP)";
        }
        return "Google sign-in failed. Please try again.";
    }
    if (rawMessage.includes("Invalid token") || rawMessage.includes("jwt")) {
        return "Session expired. Please sign in again.";
    }

    // 3. Network / Server Errors
    if (rawMessage.includes("Network Error") || rawMessage.includes("fetch failed")) {
        return "Connection lost. Please check your internet.";
    }
    if (rawMessage.includes("500") || rawMessage.includes("Internal Server Error")) {
        return "Something went wrong on our end. We're looking into it.";
    }

    // 4. Fallback (Sanitize length)
    if (rawMessage.length > 100) {
        // If it's a long technical string we don't recognize, hide it
        console.error("Hid long error from user:", rawMessage);
        return "An unexpected error occurred. Please try again.";
    }

    return rawMessage;
}
