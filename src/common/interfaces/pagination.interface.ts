export interface IPaginationOptions<TFilter = any> {
    filter?: TFilter;
    page?: number;
    limit?: number;
    sort?: any;
    search?: string;
    projection?: any;
    populate?: string[] | any[];
}