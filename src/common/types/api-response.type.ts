export type ApiResponse = {
    statusCode: number;
    message: string;
    data?: Record<string, any> | Record<string, any>[];
};