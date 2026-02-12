import { Global, Module } from "@nestjs/common";
import { DeviceHelper } from "./device.helper";

@Global()
@Module({
    providers: [
        DeviceHelper
    ],
    exports: [
        DeviceHelper
    ],
})
export class HelpersModule { }
