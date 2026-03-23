import { Injectable } from "@nestjs/common";
import { Request } from "express";
import { getClientIp } from "request-ip";
import { lookup } from "geoip-lite";
import { UAParser } from "ua-parser-js";
import { UserDeviceRepository } from "src/modules/user-devices/repository/user-device.repository";

interface UserDevice {
    ip: string;
    ip_lat: string;
    ip_long: string;
    last_active: number;
    state: string;
    country: string;
    city: string;
    timezone: string;
    user_id: string;
    accessToken: string;
    deviceToken: string;
    deviceType: string;
    browserInfo: { name: string; version: string };
    deviceInfo: { vendor: string; model: string; type: string };
    operatingSystem: { name: string; version: string };
}

@Injectable()
export class DeviceHelper {
    constructor(private readonly userDeviceRepository: UserDeviceRepository) { }

    async saveOrUpdateDeviceInfo(
        req: Request,
        userId: string,
        accessToken: string,
        deviceToken?: string,
    ): Promise<void> {
        try {
            const ip = getClientIp(req);
            const geoIpInfo = ip ? lookup(ip) : null;
            const userAgent = req.headers["user-agent"];
            const parser = new UAParser(userAgent);
            const uaResult = parser.getResult();

            if (!ip) return;

            const existingDeviceData = await this.userDeviceRepository.getByField({
                accessToken,
            });

            const { ll, region, country, city, timezone } = geoIpInfo ?? {};

            const deviceInfo: Partial<UserDevice> = {
                ip,
                ip_lat: ll?.[0]?.toString() || "",
                ip_long: ll?.[1]?.toString() || "",
                last_active: Date.now(),
                state: region || "",
                country: country || "",
                city: city || "",
                timezone: timezone || "",
                user_id: userId,
                accessToken,
                deviceToken: deviceToken ?? "",
                deviceType: uaResult.device.type || "Web",
                browserInfo: {
                    name: uaResult.browser.name || "",
                    version: uaResult.browser.version || "",
                },
                deviceInfo: {
                    vendor: uaResult.device.vendor || "",
                    model: uaResult.device.model || "",
                    type: uaResult.device.type || "desktop",
                },
                operatingSystem: {
                    name: uaResult.os.name || "",
                    version: uaResult.os.version || "",
                },
            };

            if (existingDeviceData?._id) {
                await this.userDeviceRepository.saveOrUpdate(
                    deviceInfo,
                    existingDeviceData._id,
                );
            } else {
                await this.userDeviceRepository.save(deviceInfo);
            }
        } catch (err) {
            const stackTrace = (err as Error)?.stack
                ?.split("\n")
                ?.reverse()
                ?.slice(0, -2)
                ?.reverse()
                ?.join("\n");
            console.error(stackTrace, "DeviceHelper.saveOrUpdateDeviceInfo");
        }
    }
}