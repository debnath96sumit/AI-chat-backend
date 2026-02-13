export type ApiResponse = {
    statusCode: number;
    message: string;
    data?: Record<string, any> | Record<string, any>[];
};

type PaginationMeta = {
    totalDocs: number;
    skip: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
};

export type PaginationResponse<T> = {
    meta: PaginationMeta;
    docs: T[];
};