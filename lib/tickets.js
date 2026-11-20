export const DEFAULT_CATEGORIES = [
  { label: "General help", description: "Common questions" },
  { label: "Purchases", description: "Questions about purchases" },
  { label: "Complaints", description: "Complaints about members or staff" },
  { label: "Partnership", description: "Cooperation offers" },
  { label: "Other", description: "Anything that does not fit above" },
];

// Keep identical to TICKET_DEFAULTS in the bot (third_eye.py)
export const DEFAULT_TEXTS = {
  panel_title: "Support Tickets",
  panel_description:
    "`Need help? Create a ticket by pressing the button below.`\n\n**Available categories:**\n{categories}\n\n`Our team will answer as soon as possible.`",
  panel_button: "Create ticket",
  panel_footer: "{server}",
  panel_color: "#5865F2",
  ticket_title: "Ticket - {category}",
  ticket_description:
    "Hello, {user}!\n`Our team will be with you shortly.`\n\n**Category:** `{category}`\n**Reason:**\n```{reason}```",
  ticket_color: "#5865F2",
  btn_close: "Close",
  btn_claim: "Claim",
  btn_unclaim: "Unclaim",
  btn_confirm: "Confirm close",
  btn_deny: "Deny",
  claim_message: "{staff} `took over this ticket.`",
  claim_color: "#57F287",
  unclaim_message: "{staff} `released this ticket.`",
  unclaim_color: "#FEE75C",
  close_title: "Ticket closing",
  close_description:
    "Closed by: {closer}\nReason: `{reason}`\n`The channel will be deleted in {delay} seconds.`",
  close_color: "#ED4245",
  request_title: "Close Request",
  request_description:
    "{staff} asks to close this ticket.\n`Only the ticket creator can confirm or deny.`",
  request_color: "#FEE75C",
  dm_created_title: "Ticket created",
  dm_created: "Your ticket **{category}** was created in **{server}**: {channel}",
  dm_claimed_title: "Ticket claimed",
  dm_claimed: "{staff} took over your ticket in **{server}**.",
  dm_closed_title: "Ticket closed",
  dm_closed: "Your ticket in **{server}** was closed.\n**Reason:** `{reason}`",
};

// [key, label, max length, kind]  kind: "long" | "color" | undefined
export const GROUPS = [
  {
    id: "panel", title: "Ticket panel",
    help: "The message with the button members press to open a ticket. {categories} lists your categories.",
    fields: [["panel_title", "Title", 256], ["panel_description", "Description", 4000, "long"],
      ["panel_button", "Button text", 80], ["panel_footer", "Footer", 200], ["panel_color", "Color", 7, "color"]],
    previews: [["panel_title", "panel_description", "panel_color"]],
  },
  {
    id: "ticket", title: "New ticket message",
    help: "Sent inside every new ticket channel.",
    fields: [["ticket_title", "Title", 256], ["ticket_description", "Description", 4000, "long"],
      ["ticket_color", "Color", 7, "color"]],
    previews: [["ticket_title", "ticket_description", "ticket_color"]],
  },
  {
    id: "buttons", title: "Button labels",
    help: "Text on the buttons inside tickets.",
    fields: [["btn_close", "Close", 80], ["btn_claim", "Claim", 80], ["btn_unclaim", "Unclaim", 80],
      ["btn_confirm", "Confirm close", 80], ["btn_deny", "Deny", 80]],
    previews: [],
  },
  {
    id: "claim", title: "Claim and unclaim messages",
    help: "Posted in the ticket when staff claim or release it.",
    fields: [["claim_message", "Claim message", 2000, "long"], ["claim_color", "Claim color", 7, "color"],
      ["unclaim_message", "Unclaim message", 2000, "long"], ["unclaim_color", "Unclaim color", 7, "color"]],
    previews: [[null, "claim_message", "claim_color"], [null, "unclaim_message", "unclaim_color"]],
  },
  {
    id: "close", title: "Closing messages",
    help: "Shown when a ticket closes and when staff send a close request.",
    fields: [["close_title", "Closing title", 256], ["close_description", "Closing description", 4000, "long"],
      ["close_color", "Closing color", 7, "color"], ["request_title", "Close request title", 256],
      ["request_description", "Close request description", 4000, "long"],
      ["request_color", "Close request color", 7, "color"]],
    previews: [["close_title", "close_description", "close_color"],
      ["request_title", "request_description", "request_color"]],
  },
  {
    id: "dm", title: "Direct messages",
    help: "Private messages sent to the ticket creator (can be switched off in Configuration). Colors follow the ticket, claim and closing colors.",
    fields: [["dm_created_title", "Created - title", 256], ["dm_created", "Created - message", 2000, "long"],
      ["dm_claimed_title", "Claimed - title", 256], ["dm_claimed", "Claimed - message", 2000, "long"],
      ["dm_closed_title", "Closed - title", 256], ["dm_closed", "Closed - message", 2000, "long"]],
    previews: [["dm_created_title", "dm_created", "ticket_color"], ["dm_claimed_title", "dm_claimed", "claim_color"],
      ["dm_closed_title", "dm_closed", "close_color"]],
  },
];

export const TEXT_LIMITS = Object.fromEntries(
  GROUPS.flatMap((g) => g.fields.map(([k, , max, kind]) => [k, { max, kind }]))
);
export const PLACEHOLDERS =
  "{user} {user_name} {staff} {staff_name} {closer} {category} {reason} {channel} {server} {delay} {categories}";
export const HEX = /^#[0-9a-fA-F]{6}$/;

export function fill(text, values) {
  let t = String(text ?? "");
  for (const [k, v] of Object.entries(values)) t = t.split(`{${k}}`).join(v);
  return t;
}
export const slug = (label) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "cat";
export function colorInt(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return Number.isNaN(n) ? 0x5865f2 : n;
}
