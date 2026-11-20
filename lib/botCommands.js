export const BOT_COMMANDS = [
  ["Setup", [
    ["/setup", "Private panel: logs, verification, appeal link, chain, anti-spam, anti-raid, leveling", "Administrators"],
    ["/profile edit, reset", "Change the bot's name, bio, avatar and banner in this server", "Administrators"],
    ["!guide, !status", "Setup guide and bot health", "Administrators"],
  ]],
  ["Moderation", [
    ["/warn, /mute, /kick, /ban", "Punish a member. Creates a case and sends a DM with the appeal link", "Chain of command"],
    ["/cases", "A member's case history", "Chain of command"],
  ]],
  ["Staff", [
    ["/staff", "Form: promotion, demotion, warning or dismissal", "Chain of command"],
    ["/promote, /demote", "Quick rank change inside the chain", "Chain of command"],
    ["/staffwarn, /dismiss", "Staff warning (3 = dismissal) and manual dismissal", "Chain of command"],
    ["/staff_history", "Staff record of a member", "Chain of command"],
    ["/staffconfig channel, warn_limit, clear_warns", "Staff announcement channel, warning limit, reset warnings", "Administrators"],
    ["/embed template, preview, reset, placeholders, send", "Customize staff embeds and send custom embeds", "Administrators"],
  ]],
  ["Tickets", [
    ["/tickets setup, panel, toggle", "Configure tickets and post the panel", "Administrators"],
    ["/tickets category_add, category_remove, categories", "Manage ticket categories", "Administrators"],
  ]],
  ["Ranks", [
    ["/rank", "Rank card", "Everyone"],
    ["/leaderboard", "Top members by XP", "Everyone"],
    ["/leveling toggle, channel, reward_add, reward_remove, rewards, xp_give, xp_take, xp_set, reset", "Configure the rank system", "Administrators"],
  ]],
  ["Custom commands", [
    ["/command create, delete, list", "Create your own !commands", "Administrators"],
  ]],
];
