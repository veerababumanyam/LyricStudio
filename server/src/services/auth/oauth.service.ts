import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { UserRepository } from '../../database/repositories/UserRepository.js';

export function configureGoogleOAuth() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
        console.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in .env');
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID,
                clientSecret,
                callbackURL
            },
            async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
                try {
                    const email = profile.emails?.[0]?.value;

                    if (!email) {
                        return done(new Error('No email found in Google profile'));
                    }

                    // Check if user exists by Google ID
                    let user = UserRepository.findByGoogleId(profile.id);

                    if (!user) {
                        // Check if user exists by email (link accounts)
                        user = UserRepository.findByEmail(email);

                        if (user) {
                            // Link Google account to existing user
                            user = UserRepository.updateUser(user.id, {
                                email_verified: 1
                            });
                        } else {
                            // Create new user
                            user = UserRepository.createUser({
                                email,
                                display_name: profile.displayName || email.split('@')[0],
                                avatar_url: profile.photos?.[0]?.value,
                                auth_provider: 'google',
                                google_id: profile.id,
                                email_verified: 1
                            });
                        }
                    }

                    done(null, user);
                } catch (error) {
                    done(error as Error);
                }
            }
        )
    );

    console.log('✅ Google OAuth configured');
}
