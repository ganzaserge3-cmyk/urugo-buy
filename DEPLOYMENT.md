# Deployment Checklist

## Core

- Set `NODE_ENV=production`
- Set `PORT` if your host requires it
- Set `APP_URL` and `PUBLIC_APP_URL` to your public site URL
- Set `DATABASE_URL` to your production Postgres database
- Set `JWT_SECRET` and `SESSION_SECRET` to strong random values
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to production-safe credentials

## Email

- Create a Resend account
- Verify your sending domain
- Set `RESEND_API_KEY`
- Set `RESEND_FROM` or `EMAIL_FROM`
- Optional: set `RESEND_FROM_EMAIL` for verification-code emails

## Payments

- Set `PAYPAL_CLIENT_ID`
- Set `PAYPAL_CLIENT_SECRET`
- Set `PAYPAL_WEBHOOK_ID`
- Set `PAYPAL_API_BASE=https://api-m.paypal.com` for live PayPal

## SMS

- Set `TWILIO_ACCOUNT_SID`
- Set `TWILIO_AUTH_TOKEN`
- Set `TWILIO_FROM`
- Optional: set `TWILIO_TO` for internal notification testing

## Frontend

- Set the public Firebase values:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

## Start Commands

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run start
```

## Notes

- Do not commit real secrets to source control
- Use sandbox PayPal keys in staging and live keys only in production
- Email and SMS features degrade safely when provider credentials are missing, but delivery will not occur
