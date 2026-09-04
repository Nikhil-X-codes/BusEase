const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        const statusCode = error.statusCode ||
            (error.name === 'ValidationError' || error.name === 'CastError' ? 400 :
            error.code === 11000 ? 409 : 500);

        // Only log 5xx server errors with full stack trace to prevent polluting logs on expected 4xx client responses
        if (statusCode >= 500) {
            console.error("Error in async handler:", error);
        }

        res.status(statusCode).json({
            message: statusCode === 500 ? "Internal Server Error" : error.message,
            success: false 
        });
    }
}

export default asyncHandler;