const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const getSupabase = require('./supabase');

function getBaseUrl() {
  return (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${getBaseUrl()}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          picture: profile.photos?.[0]?.value || '',
        };
        try {
          await getSupabase()
            .from('users')
            .upsert(
              {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                last_login_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
        } catch (err) {
          console.error('User upsert failed:', err.message);
        }
        done(null, user);
      }
    )
  );
}

module.exports = { configurePassport, getBaseUrl, getOAuthCallbackUrl: () => `${getBaseUrl()}/auth/google/callback` };
