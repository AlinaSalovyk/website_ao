# Production Admin Invitation & RBAC System Documentation

## 1. Overview
This document describes the Admin Invitation, Role-Based Access Control (RBAC), and Email Delivery System for the Admin Panel.

---

## 2. Admin Roles

The system supports three administrative roles:

### `super_admin`
- **Full system privileges.**
- Access to News CMS, Chatbot Admin, Analytics, Knowledge Base, Prompts, Settings, Audit Logs, Admin User Management, and Invitations.
- Only `super_admin` can manage administrators, assign roles, send/resend/revoke invitations, or enable/disable accounts.
- **Invariant**: The system must always retain at least one active `super_admin`.

### `news_editor`
- **News CMS access only.**
- Can manage articles, categories, drafts, previews, publishing, media covers, galleries, embedded videos, rich text, translations (UK -> EN), and SEO.
- **Forbidden**: Cannot access Chatbot Admin, Analytics, Knowledge Base, Prompts, Audit Logs, or Admin Management.

### `chatbot_admin`
- **Chatbot Admin functionality only.**
- Can access Chatbot Dashboard, Analytics, Document indexing (Knowledge Base), Prompts A/B testing, User Queries, and Bot Settings.
- **Forbidden**: Cannot access News CMS, Audit Logs, or Admin Management.

---

## 3. Bootstrap & Invitation Flow (Google OAuth Only)

### Initial System Bootstrap:
- On a fresh database (0 admin users in `admin_users` table), any user with a verified Google email listed in `BOOTSTRAP_SUPER_ADMIN_EMAILS` (or fallback `ADMIN_ALLOWED_EMAILS`) is auto-promoted to `super_admin`.
- **BOOTSTRAP ONLY Semantics**: Once an initial `super_admin` exists in the database, presence in `BOOTSTRAP_SUPER_ADMIN_EMAILS` / `ADMIN_ALLOWED_EMAILS` will NOT grant admin access or mint new super admins. Subsequent admins MUST be created via the invitation system.

### Invitation Lifecycle:
1. **Invitation Generation**:
   - `super_admin` creates an invitation specifying target `email` and `role`.
   - System generates a 256-bit secure token using `crypto/rand`.
   - The **SHA-256 hash** of the token is saved in the database (`admin_invitations` table); raw tokens are never stored.
   - Expiration timestamp is computed (`ADMIN_INVITATION_TTL`, default 48h).

2. **Email Delivery**:
   - Branded HTML invitation email is sent via `MailerService` with invitation link (`${ADMIN_PUBLIC_BASE_URL}/admin/invite/accept?token=...`).

3. **Acceptance & Account Activation (Google OAuth Binding)**:
   - Recipient opens invitation link and clicks "Authenticate with Google".
   - Backend Google OAuth callback exchanges token, fetches verified Google profile email, and verifies `invitation.email == google_user.email` (case-insensitive normalized).
   - If emails match, invitation is marked accepted (`accepted_at = now()`), `AdminUser` record is created/activated with the assigned role, and JWT session tokens are issued.
   - Password authentication is removed to avoid duplicate credential lifecycles.

---

## 4. Environment Configuration

All environment configuration is fail-fast validated at application startup.

| Variable | Description | Required | Example |
|---|---|---|---|
| `BOOTSTRAP_SUPER_ADMIN_EMAILS` | Bootstrap super admin email whitelist (fresh DB only) | Optional | `nazarii.voitiuk@oa.edu.ua` |
| `ADMIN_ALLOWED_EMAILS` | Deprecated alias for `BOOTSTRAP_SUPER_ADMIN_EMAILS` | Optional | `nazarii.voitiuk@oa.edu.ua` |
| `LEGACY_ADMIN_TOKEN_ENABLED` | Feature flag to enable static `X-Admin-Token` auth | Optional (Default `false`) | `false` |
| `ADMIN_PUBLIC_BASE_URL` | Public base URL used for invitation links | **REQUIRED** | `http://localhost:4321` or `https://admin.example.edu.ua` |
| `ADMIN_INVITATION_TTL` | Invitation validity duration | **REQUIRED** | `48h` |
| `MAILER_DRIVER` | Mailer driver | **REQUIRED** | `smtp` |
| `SMTP_HOST` | SMTP hostname | **REQUIRED** | `mailpit` or `smtp.provider.com` |
| `SMTP_PORT` | SMTP port | **REQUIRED** | `1025` or `587` or `465` |
| `SMTP_SECURITY` | Encryption mode (`none` \| `starttls` \| `tls`) | **REQUIRED** | `none` or `starttls` |
| `SMTP_AUTH_MODE` | Authentication mode (`none` \| `plain`) | **REQUIRED** | `none` or `plain` |
| `SMTP_USERNAME` | SMTP authentication identity | Required if `SMTP_AUTH_MODE=plain` | `smtp_user@provider.com` |
| `SMTP_PASSWORD` | SMTP authentication secret | Required if `SMTP_AUTH_MODE=plain` | `<password>` |
| `SMTP_FROM_EMAIL` | Sender email address (`From:` header & `MAIL FROM`) | **REQUIRED** | `nazarii.voitiuk@oa.edu.ua` |
| `SMTP_FROM_NAME` | Sender display name | **REQUIRED** | `"Адміністративна панель"` |
| `SMTP_TIMEOUT` | Connection timeout duration (e.g. `10s`) | **REQUIRED** | `10s` |
| `PUBLIC_API_URL` | API Base URL (empty string indicates same-origin deployment) | Optional | `http://localhost:8280` |

---

## 5. Local Testing with Mailpit

Run Mailpit in Docker Compose:
```bash
docker compose up -d mailpit
```
- Web UI: [http://localhost:8025](http://localhost:8025)
- SMTP Port: `1025`

Set environment variables in `.env` for local testing:
```env
ADMIN_ALLOWED_EMAILS=nazarii.voitiuk@oa.edu.ua
BOOTSTRAP_SUPER_ADMIN_EMAILS=nazarii.voitiuk@oa.edu.ua
LEGACY_ADMIN_TOKEN_ENABLED=false

ADMIN_PUBLIC_BASE_URL=http://localhost:4321
ADMIN_INVITATION_TTL=48h

MAILER_DRIVER=smtp
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURITY=none
SMTP_AUTH_MODE=none
SMTP_FROM_EMAIL=nazarii.voitiuk@oa.edu.ua
SMTP_FROM_NAME="Адміністративна панель"
SMTP_TIMEOUT=10s
```
Send an invite from the Admin Panel, open `http://localhost:8025`, click the link, and complete account activation.
