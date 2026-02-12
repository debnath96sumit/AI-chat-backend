import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { existsSync } from 'node:fs';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: (() => {
                const env = process.env.NODE_ENV;
                let envFile = ".env";
                if (env) {
                    envFile = `.env.${env}`;
                    Logger.log(
                        `Using environment-specific file: ${envFile}`,
                        "ConfigModule",
                    );
                } else {
                    envFile = ".env.production";
                    Logger.log(
                        `No NODE_ENV set, defaulting to: ${envFile}`,
                        "ConfigModule",
                    );
                }
                Logger.log(`Checking if file exists: ${envFile}`, "ConfigModule");
                if (!existsSync(envFile)) {
                    Logger.error(
                        `Environment file '${envFile}' not found. Please create the file or set NODE_ENV to a valid environment.`,
                        "ConfigModule",
                    );
                    process.exit(1);
                }
                Logger.log(
                    `Environment file '${envFile}' loaded successfully`,
                    "ConfigModule",
                );
                return envFile;
            })(),
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                uri: configService.getOrThrow<string>("MONGO_URI"),
                dbName: configService.getOrThrow<string>("DB_DATABASE"),
            }),
            inject: [ConfigService],
        }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ],
    providers: [
        Logger,
    ]
})
export class ApiConfigModule { }