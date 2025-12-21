
/**
 * Utility to convert technical errors into user-friendly messages.
 * Prevents raw stack traces or database errors from being shown to users.
 */
export function userFriendlyError(error: any): string {
    const rawMessage = error?.message || error?.error || String(error);

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
