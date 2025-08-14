const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("Error in async handler:", error);
        res.status(500).json({ 
        message: error.message || "Internal Server Error" ,
        success: false });
    }
}

export default asyncHandler;