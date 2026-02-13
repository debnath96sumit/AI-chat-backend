import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage } from "mongoose";
import { BaseRepository } from "src/common/bases/base.repository";
import { Message, MessageDocument } from "../schemas/message.schema";
import { IPaginationOptions } from "@common/interfaces/pagination.interface";
import { PaginationResponse } from "@common/types/api-response.type";

@Injectable()
export class MessageRepository extends BaseRepository<MessageDocument> {
    constructor(@InjectModel(Message.name) private readonly MessageModel: Model<MessageDocument>) {
        super(MessageModel);
    }

    async getMessageHistory(chatId: string): Promise<MessageDocument[]> {
        return await this.MessageModel
            .find({ chatId: chatId })
            .sort({ createdAt: 1 })
            .limit(15);
    }

    async getAllPaginate(
        options: IPaginationOptions<any>,
    ): Promise<PaginationResponse<MessageDocument>> {
        try {
            const {
                filter = {},
                page = 1,
                limit = 20,
                sort = { createdAt: -1 },
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
                        $or: [{ content: { $regex: search, $options: "i" } }],
                    },
                });
            }
            const [countResult, messages] = await Promise.all([
                this.MessageModel.aggregate(countPipeline),
                this.MessageModel.aggregate(dataPipeline),
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
                docs: messages,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                `Chat room pagination failed: ${error.message}`,
            );
        }
    }
}