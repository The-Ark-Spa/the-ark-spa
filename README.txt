THE ARK SPA & SALON — v2.6.6

Purpose
This build is a surgical cleanup of the Admin Panel and the public website based on the approved Ark reference and the latest requirements.

ADMIN — intentionally simple
- Rates: Category -> item -> actual rate. No service/therapy editor.
- Offers: Percentage Discount and Special Offer. Category -> item(s) -> value -> Save/Activate.
- Gallery: Add images / Remove images only. Gallery is the source for Home preview + Full Gallery.
- Logo: Upload new custom logo or remove custom logo. Removing custom logo restores the permanent Ark default logo everywhere, including Admin Login.
- Contact: Phone, WhatsApp, Address.
- Social Media: paste links and Save. Linked platforms become clickable icons on the website. WhatsApp is tied to the centralized WhatsApp number.
- Booking: one mode only — Both / WhatsApp Only / Website Appointment Only / Off.
- Appointments: view, confirm, cancel, CSV export.
- Recovery: JSON backup, section resets, approved-state restore.

PUBLIC WEBSITE
- Approved first Ark homepage visual direction: green/gold/cream, original Ark logo and Buddha visual.
- Welcome/Hero uses the Buddha background across the full section; no white block and no green circle covering Buddha.
- Mobile hamburger works.
- Mobile sizing is responsive instead of oversized.
- Top Services and Gallery open separate pages.
- Home menu uses the four approved categories and the full source menu list.
- Menu details popup contains menu details only; Services page is information-only and has no rates/durations.
- Home Gallery preview uses first 3 images from the Gallery source; Full Gallery has portfolio + lightbox.
- Active offers appear only when active. Percentage discounts are calculated from current actual rates; no manual discounted prices.
- Appointment offer filtering follows active offer applicability.
- Header Book Appointment opens the correct booking choice/route according to Booking Mode.
- Footer social icons appear below the address and become clickable when links are saved.
- About, Contact, Terms and Privacy are separate pages.

SOURCE MENU RECONSTRUCTION
The menu in this build uses the supplied menu reference images as the source for the four categories and their entries. Tamarind Skin Exfoliation intentionally has no invented rate.

SUPABASE BACKEND
- Existing project configuration retained.
- Admin uses Supabase Authentication with LOCAL persistence so a successful login remains active until Logout.
- Public pages use Realtime Database for siteContent.
- Gallery/logo uploads use Supabase Storage.

IMPORTANT
This package uses Supabase as the single backend for Auth, Database, Realtime and Storage.


PATCHED IN v2.6.1 — ONLY REQUESTED FIXES
- Admin sections now start closed after login; view resets cleanly on login/logout.
- Booking Mode moved inside Appointments.
- Appointments and Recovery no longer expose other Main Control sections underneath.
- Logout hides the entire dashboard/admin controls and returns to the centered Login screen.
- Percentage Discount now has category/item selection, a 1%-100% ready-made selector, and Save / Apply / Deactivate controls.
- Special Offer now has optional name, fixed price, ready-made duration, category/item selection, and Save / Apply / Deactivate controls.
- Offer save/apply/deactivate operations now report actual Supabase errors instead of silently appearing to work.
- Welcome hero now shows Contact Now and WhatsApp Now without displaying the phone number as text.
- Existing Buddha hero image is only repositioned/scaled so the top of the Buddha is not cropped.
- Footer social icons use a larger, consistent premium icon treatment.
- Admin Login card is pinned/centered so it does not drift downward.
- No unrelated site sections, content, branding, or functionality were intentionally changed.

VERIFICATION NOTE
- HTML structure and inline JavaScript syntax were checked locally. Supabase live write permissions could not be network-verified from this environment.

PATCHED IN v2.6.6 — FINAL REQUESTED FIXES
- Home Our Services remains the approved v2.6.1 photo-card section.
- Follow Us appears only once on Home, below the address in the footer.
- WhatsApp was removed from the Social Media icon set; WhatsApp booking/contact remains separate.
- Instagram, Facebook, YouTube and X icons are always visible; once an Admin link is saved, that icon becomes clickable to the saved URL.
- Percentage Discount and Special Offer Save / Apply / Deactivate now store each offer under its own Supabase path.
- Public website offer rendering reads those same records, so Admin offer changes are the source used by Home, Menu, Offers and booking pricing.
- Buddha hero keeps the wide image at natural aspect ratio; responsive positioning is adjusted without stretching the image.
- No unrelated design/content sections were intentionally changed.
