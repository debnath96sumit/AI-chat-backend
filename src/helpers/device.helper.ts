import { Injectable } from "@nestjs/common";
import { Request } from "express";
import { getClientIp } from "request-ip";
import { lookup } from "geoip-lite";
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
            };

            if (existingDeviceData) {
                await this.userDeviceRepository.saveOrUpdate(
                    deviceInfo,
                    existingDeviceData?._id,
                );
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