import { Injectable, ForbiddenException } from '@nestjs/common';
import { UsageRepository } from './repositories/usage.repository';
import { UsageRecord } from './schemas/usage-record.schema';
import { Types } from 'mongoose';

@Injectable()
export class UsageService {
    constructor(private readonly usageRepo: UsageRepository) { }

    private readonly LIMITS = {
        free: { fileUploads: 1, tokensPerDay: 10000 },
        pro: { fileUploads: 5, tokensPerDay: 30000 },
    };

    async getTodayRecord(userId: string): Promise<UsageRecord> {
        const date = new Date().toISOString().split("T")[0];
        return await this.usageRepo._upsert(
            { userId, date },
            { userId, date, fileUploadsCount: 0, tokenUsage: 0 },
        );
    }

    async canUploadFile(userId: string, tier: "free" | "pro"): Promise<void> {
        const limit = this.LIMITS[tier].fileUploads;
        const record = await this.getTodayRecord(userId);

        if (record.fileUploadsCount >= limit) {
            throw new ForbiddenException(
                `File upload limit reached. ${tier === "free" ? "Upgrade to Pro for more uploads." : "Daily limit reached."}`
            );
        }
    }

    async incrementFileUpload(userId: string): Promise<void> {
        const date = new Date().toISOString().split("T")[0];
        await this.usageRepo.updateWithOperators(
            { userId, date },
            { $inc: { fileUploadsCount: 1 } }
        );
    }

    async canUseTokens(userId: string, tier: "free" | "pro", tokensToAdd: number): Promise<void> {
        const limit = this.LIMITS[tier].tokensPerDay;
        if (!limit) return;
        const record = await this.getTodayRecord(userId);
        if (record.tokenUsage + tokensToAdd > limit) {
            throw new ForbiddenException(`${tier === "free" ? "Upgrade to Pro for more tokens." : "Daily token limit reached."}`);
        }
    }

    async incrementTokenUsage(userId: Types.ObjectId, tokens: number): Promise<void> {
        const date = new Date().toISOString().split("T")[0];
        await this.usageRepo.updateWithOperators(
            { userId, date },
            { $inc: { tokenUsage: tokens } }
        );
    }
}
