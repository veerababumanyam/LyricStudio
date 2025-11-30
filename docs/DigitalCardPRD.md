implementation-ready PRD for Public Profile + Sharing (URL, QR, vCard) only.

1. Objective
Enable each user to have a single Public Profile that:

Is viewable by anyone via a public URL.

Is optionally discoverable in the in-app directory and by search engines (opt-in).

Can be shared via copy link, WhatsApp, system share, and QR code.

Allows visitors to save the user as a contact (vCard) on their phone.

No Private/Personal profiles in scope.

2. Public Profile – Functional Requirements
2.1 Public Profile Content
Single-source-of-truth fields (entered once, reused everywhere):

Identity

username (slug, unique, used in URL)

displayName

firstName, lastName

avatarImagePublic (profile photo for public profile)

Professional / Bio

headline / jobTitle

company / organization

profileSummary / bio (short text)

profileTags / skills (list)

Contact & Links

publicEmail (optional, user-controlled)

publicPhone (optional, user-controlled)

businessWebsite / personalWebsite

publicLinks[] (array of { label, url, iconType })

socialProfiles[] (array of { network, handle/url })

Other

languages[]

pronouns (optional)

timezone (optional)

contactPreferences (optional: preferred channel, best time to contact)

All fields are optional except username and displayName.
A simple “Show in public profile” toggle is available for: publicEmail, publicPhone, socialProfiles, websites.

2.2 Public Profile URL
Format: https://app.com/u/{username}

URL is:

Always publicly accessible (no auth required).

Controlled by user’s “Publish public profile” toggle:

If OFF → returns 404/“Profile not published”.

If ON → profile is visible.

2.3 Public Directory & Indexing
App-level flags on user:

public_profile_published (boolean)

public_indexing_opt_in (boolean)

Behavior:

If public_profile_published = true:

Profile URL works.

If public_indexing_opt_in = true:

Profile can appear in in-app public search/directory.

Profile can be included in “public feed”/API for search engines (sitemaps, etc.).

If opt-in is false:

Add noindex meta tags and do not include in any public directory/search.

3. Sharing & QR Code – Functional Requirements
3.1 Share Actions (Owner UI)
In the app, owner sees a “Share Public Profile” panel with:

Display of:

Public URL (read-only with copy icon).

Public avatar + short preview.

Actions:

Copy Link

Uses Clipboard API to copy publicProfileUrl.

Shows toast: “Public profile link copied.”

Share on WhatsApp

Opens https://wa.me/?text={encodedText} where:

encodedText = "Check out my profile: {publicProfileUrl}" (customizable later).

System Share (Web Share API)

If navigator.share is supported:

navigator.share({ title: displayName, text: short message, url: publicProfileUrl })

If not supported:

Fallback message: “Sharing not supported. Use Copy Link or QR Code.”

Show QR Code

Displays a modal with generated QR code image that encodes publicProfileUrl.

Options:

Download PNG/SVG.

Print instructions like “Scan to view my profile”.

3.2 QR Code Scan Behavior (Guest)
QR code content: only the public profile URL.

When scanned on iOS/Android:

Opens the public profile page in browser.

On the public profile page:

Prominent “Save as Contact” button.

When tapped:

Triggers download of a vCard (.vcf) file with:

Full name

Public email (if enabled)

Public phone (if enabled)

Company, jobTitle (if present)

Website(s)

Mobile OS contact app opens, user can save as new contact.

4. Non-Functional & Privacy Requirements
Security

No PII is shown unless user has enabled “Show in public profile”.

Privacy

public_indexing_opt_in must be explicit (checkbox + text).

If user turns off public_profile_published, profile URL returns 404 and is removed from public directory/index feeds.

Performance

Public profile page optimized for mobile (Lighthouse-friendly, fast).

QR code generation cached per user (e.g., regenerated only when URL/username changes).

Analytics

Track events:

share_public_profile (channel: copy, whatsapp, webShare, qrView, qrDownload)

public_profile_view

public_profile_vcard_download

5. API & Data Model (High Level)
5.1 Data Model Additions
users table (add columns):

public_profile_published boolean (default: false)

public_indexing_opt_in boolean (default: false)

public_profile_slug (username or separate slug)

avatar_image_public_url text

public_email, public_phone

languages (jsonb), social_profiles (jsonb), etc.

public_profile_share (optional separate table, or derived):

user_id

public_profile_url

qr_image_url (or computed/stored in object storage)

created_at, updated_at

analytics_events for tracking.

5.2 Key Endpoints
GET /public/u/:username

Returns public profile JSON or renders web page.

Only if public_profile_published = true.

GET /public/u/:username/vcard

Returns vCard (.vcf) file with allowed fields.

GET /me/public-profile/share-info (auth required)

Returns: publicProfileUrl, qrImageUrl, published/indexing flags.

PATCH /me/public-profile/settings

Update publish/indexing flags, profile fields, avatar.

6. UX Acceptance Criteria
User can:

Publish/unpublish public profile with a single toggle.

Opt-in/out of public indexing with a clear explanation.

Share via copy link, WhatsApp, and system share with one click.

Show QR code and download it.

Guest can:

Scan QR, view profile without login.

Tap “Save as Contact” and get a valid, usable contact entry on iOS/Android.

Turning off publish immediately:

Makes profile URL return 404 / “Profile not available