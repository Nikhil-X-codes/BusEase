class ApiError extends Error {
    constructor(
        statusCode,
        message = "Internal Server Error",
        isOperational = true,
        stack = "",
        errors = []
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;

