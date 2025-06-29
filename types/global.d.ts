declare global {
    type ErrorWithMessage = {
        message: string;
        name?: string;
    };

    interface APIError {
        error: string;
        details?: string;
        originalError?: string;
        resetError?: string;
    }

    interface APIResponse<T = any> {
        success: boolean;
        data?: T;
        error?: string;
        details?: string;
    }
}

export { }; 