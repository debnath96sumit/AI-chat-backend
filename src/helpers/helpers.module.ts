import { Global, Module } from "@nestjs/common";
import { DeviceHelper } from "./device.helper";
import { MailerService } from "./mailer.helper";

@Global()
@Module({
    providers: [
        DeviceHelper,
        MailerService
    ],
    exports: [
        DeviceHelper,
        MailerService
    ],
})
export class HelpersModule { }
