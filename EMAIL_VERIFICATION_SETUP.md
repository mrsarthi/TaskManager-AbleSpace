# Email Verification Setup Guide

## Overview
Email verification has been added to prevent users from using dummy/fake email addresses. Users must verify their email before they can log in.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Add SMTP Credentials to `.env`
Add these lines to your `backend/.env` file:

```env
# Email Configuration (for Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**For Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated app password (not your regular password)

**For Other Email Providers:**
- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port 587
- **Yahoo**: `smtp.mail.yahoo.com`, port 587
- **SendGrid**: Use their SMTP settings
- **AWS SES**: Use their SMTP settings

### 3. Run Database Migration
```bash
npm run prisma:migrate
```
Enter migration name: `add_email_verification`

### 4. Restart Backend Server
```bash
npm run dev
```

## How It Works

### Registration Flow:
1. User registers with email and password
2. System generates a verification token
3. Verification email is sent to user's email
4. User cannot log in until email is verified
5. User clicks link in email to verify
6. After verification, user can log in

### Login Flow:
- If email is not verified, login is blocked with message: "Please verify your email address before logging in"
- User can click "Resend verification email" link

## API Endpoints

### GET `/api/auth/verify-email?token=VERIFICATION_TOKEN`
Verifies user email with token from email link.

### POST `/api/auth/resend-verification`
Resends verification email.
```json
{
  "email": "user@example.com"
}
```

## Frontend Pages

- `/verify-email` - Verifies email when user clicks link
- `/verify-email-sent` - Shown after registration
- `/resend-verification` - Allows user to request new verification email

## Testing

### Without Real Email (Development):
If you don't want to set up SMTP, the system will:
- Still create users
- Log a warning about missing SMTP config
- Allow you to manually verify emails in database (set `emailVerified = true`)

### With Real Email:
1. Register a new account
2. Check your email inbox
3. Click the verification link
4. Try logging in

## Troubleshooting

### Email Not Sending:
- Check SMTP credentials in `.env`
- Verify SMTP_HOST and SMTP_PORT are correct
- For Gmail, ensure you're using an App Password, not regular password
- Check backend console for error messages

### Token Expired:
- Verification tokens expire after 24 hours
- User can request a new verification email from `/resend-verification`

### Email Already Verified:
- If user tries to verify again, they'll get an error
- They can proceed to login normally

