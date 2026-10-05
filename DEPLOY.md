# Deploy notes

## Magic-link email (SMTP)

Production sends sign-in mail through Gmail SMTP. Unset SMTP config falls
back to `localhost:25` and `POST /magic_link` returns 500 (`Errno::ECONNREFUSED`).

Set these on the production host (Docker `-e`, compose `environment`, or systemd).
Do not put the Gmail app password in git.

```bash
SMTP_USERNAME=your-gmail-address@gmail.com
SMTP_PASSWORD=your-gmail-app-password
APP_HOST=msb-publishing.srv2019231.hstgr.cloud
# Optional; defaults to SMTP_USERNAME
MAIL_FROM=
```

`APP_HOST` is used for magic-link URLs with `https`. SMTP settings are:

- address: `smtp.gmail.com` (override with `SMTP_ADDRESS`)
- port: `587` (override with `SMTP_PORT`)
- `enable_starttls_auto: true`
- `authentication: plain`

## Local Cursor / laptop

```bash
cp .env.example .env
```

Fill in values you need. If `SMTP_USERNAME` and `SMTP_PASSWORD` are unset,
development keeps Letter Opener and `bin/rails` works without Gmail.

## Cursor cloud agents

Set the same variable names as **secrets in the cloud agent environment**.
Do not paste the app password into the repo, a PR, or chat logs.
