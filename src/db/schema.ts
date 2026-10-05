import { pgTable, serial, text, timestamp, boolean, integer, uuid, numeric, pgEnum } from "drizzle-orm/pg-core";

export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'confirmed', 'declined']);
export const mediaUsageEnum = pgEnum('media_usage', ['cover_both', 'portrait_kelly', 'portrait_kyara', 'gallery', 'share_preview', 'none']);
/** Answer of each family member: 'pending' is shown as "Por definir". */
export const guestRsvpEnum = pgEnum('guest_rsvp', ['pending', 'yes', 'no']);

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull().defaultNow(), // Update with correct default via UI
  receptionDate: timestamp("reception_date", { withTimezone: true }).notNull().defaultNow(),
  deadlineDate: timestamp("deadline_date", { withTimezone: true }),
  contactPhone: text("contact_phone"),
  receptionName: text("reception_name"),
  receptionAddress: text("reception_address").default("Calle 10 A X 31, Col. San Juan, Ticul, Yucatán"),
  receptionMapUrl: text("reception_map_url").default("https://maps.app.goo.gl/AykNL1cFP1HyLVdcA"),
  ceremonyAddress: text("ceremony_address").default("C. 13, Ticul, 97862 Ticul, Yuc."),
  ceremonyMapUrl: text("ceremony_map_url").default("https://maps.app.goo.gl/MgsqCLBZAn3a8kNn7"),
  giftsMode: text("gifts_mode"),
  musicUrl: text("music_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  publicId: text("public_id").notNull(), // For Cloudinary
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  focalX: numeric("focal_x").default("50"),
  focalY: numeric("focal_y").default("50"),
  usage: mediaUsageEnum("usage").default("none"),
  isPublished: boolean("is_published").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * One invitation = one family (or one person) with a single personal link /i/<token>.
 * `name` is the family name, `greeting` the personal message they see and that goes in the WhatsApp.
 * `status`, `maxGuests` and `checkedInAt` are caches derived from the members (guests) and are
 * recalculated on every change: see recalcFamily() in src/lib/families.ts.
 */
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(), // Random short string for URLs
  name: text("name").notNull(),
  greeting: text("greeting"),
  maxGuests: integer("max_guests").notNull().default(1),
  status: invitationStatusEnum("status").default("pending"),
  phone: text("phone"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  /** Song the family asked for (optional, from the RSVP form). */
  songRequest: text("song_request"),
  /** Message from the family to Kelly & Kyara (optional, from the RSVP form). */
  guestMessage: text("guest_message"),
  /** Set when the admin taps "Enviar por WhatsApp" (powers the "Sin enviar" filter). */
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

/** Members of a family, registered in advance by the admin. Guests never type names. */
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").references(() => invitations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dietaryRestrictions: text("dietary_restrictions"),
  // Unused since answers are per member (kept: production migrations are additive only).
  attendingCeremony: boolean("attending_ceremony").default(true),
  attendingReception: boolean("attending_reception").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  rsvp: guestRsvpEnum("rsvp").notNull().default("pending"),
  isChild: boolean("is_child").notNull().default(false),
  /** Entrance registered at the door (per member; the QR is per family). */
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const accessLogs = pgTable("access_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id").references(() => invitations.id, { onDelete: "cascade" }),
  guestId: uuid("guest_id").references(() => guests.id, { onDelete: "cascade" }),
  scannedBy: text("scanned_by"),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).defaultNow(),
  notes: text("notes"),
});

export type Invitation = typeof invitations.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type GuestRsvp = (typeof guestRsvpEnum.enumValues)[number];
export type Media = typeof media.$inferSelect;
