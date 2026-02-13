import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, PipelineStage, QueryOptions } from "mongoose";
import { BaseRepository } from "src/common/bases/base.repository";
import { Chat, ChatDocument } from "../schemas/chat.schema";
import { IPaginationOptions } from "@common/interfaces/pagination.interface";
import { PaginationResponse } from "@common/types/api-response.type";

@Injectable()
export class ChatRepository extends BaseRepository<ChatDocument> {
    constructor(@InjectModel(Chat.name) private ChatModel: Model<ChatDocument>) {
        super(ChatModel);
    }

    async getAllPaginate(
        options: IPaginationOptions<any>,
    ): Promise<PaginationResponse<ChatDocument>> {
        try {
            const {
                filter = {},
                page = 1,
                limit = 20,
                sort = { updatedAt: -1 },
                search,
            } = options;

            const skip = (page - 1) * limit;

            const conditions = {
                $and: [filter, { isDeleted: false }],
            };

            const countPipeline = [{ $match: conditions }, { $count: "total" }];

            const dataPipeline: PipelineStage[] = [
                { $match: conditions },

                { $sort: sort },

                { $skip: skip },
                { $limit: limit },
            ];

            if (search) {
                dataPipeline.push({
                    $match: {
                        $or: [{ name: { $regex: search, $options: "i" } }],
                    },
                });
            }
            const [countResult, rooms] = await Promise.all([
                this.ChatModel.aggregate(countPipeline),
                this.ChatModel.aggregate(dataPipeline),
            ]);

            const totalDocs = countResult?.[0]?.total || 0;
            const totalPages = Math.ceil(totalDocs / limit);

            return {
                meta: {
                    totalDocs,
                    skip,
                    page,
                    limit,
                    totalPages,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages,
                    prevPage: page > 1 ? page - 1 : null,
                    nextPage: page < totalPages ? page + 1 : null,
                },
                docs: rooms,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                `Chat room pagination failed: ${error.message}`,
            );
        }
    }
}