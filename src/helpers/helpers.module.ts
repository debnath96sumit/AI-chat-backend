import { Global, Module } from "@nestjs/common";
import { DeviceHelper } from "./device.helper";
import { MailerService } from "./mailer.helper";
import { StripeHelper } from "./stripe.helper";

@Global()
@Module({
    providers: [
        DeviceHelper,
        MailerService,
        StripeHelper
    ],
    exports: [
        DeviceHelper,
        MailerService,
        StripeHelper
    ],
})
export class HelpersModule { }
