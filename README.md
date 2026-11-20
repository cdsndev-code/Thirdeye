# Third Eye Protection - dashboard (Vercel)

1. Neon: create a project, copy the connection string. The bot and this site use the SAME database.
   Start the bot once first so it creates the tables.
2. Discord Developer Portal -> your application -> OAuth2:
   - copy the Client Secret
   - add this redirect: https://thirdeyeseciurity.vercel.app/api/auth/callback
3. Vercel: push this folder to GitHub, import it as a new project (framework: Next.js).
4. Add the environment variables from .env.example in Vercel -> Settings -> Environment Variables.
   Set BASE_URL exactly to https://thirdeyeseciurity.vercel.app (no trailing slash, path, query string, or Discord code). Redeploy after setting it.
5. Open the site, log in with Discord, pick a server.

Notes
- Only servers where you are an administrator AND the bot is present are shown.
- Login lasts 8 hours; log in again to refresh your server list.
- Changes saved here reach the bot within about 30 seconds.

Tickets
- Restart the bot once after updating so it creates the ticket tables.
- The bot needs Manage Channels: open the "Add to Discord" link again to grant it.
- Open a server, press "Edit tickets": configuration, categories, every message, button label and
  direct message are editable. "Save and post panel" posts or updates the panel in Discord.

Dashboard layout
- Opening a server shows the Overview tab. The left menu switches between General, Chain of command,
  Staff, Tickets, Cases, Commands, Leveling and Bot profile.
- The website creates every database table itself the first time it runs, so it works even before the bot starts.
- Staff tab: promote, demote, warn or dismiss from the website, edit the staff embeds and the warning limit.
- Tickets tab: close open tickets, edit categories and all messages, post the panel.
