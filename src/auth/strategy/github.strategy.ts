import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(config: ConfigService) {
        super({
            clientID: config.getOrThrow('GITHUB_CLIENT_ID'),
            clientSecret: config.getOrThrow('GITHUB_CLIENT_SECRET'),
            callbackURL: config.getOrThrow('GITHUB_CALLBACK_URL'),
            scope: ['user:email'],  // request email access
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ) {
        // GitHub profile shape:
        // profile.id, profile.username, profile.displayName
        // profile.emails[0].value, profile.photos[0].value

        const user = {
            githubId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            firstName: profile.displayName?.split(' ')[0] ?? profile.username,
            lastName: profile.displayName?.split(' ').slice(1).join(' ') ?? '',
            profileImage: profile.photos?.[0]?.value ?? '',
            accessToken,
        };

        done(null, user);
    }
}