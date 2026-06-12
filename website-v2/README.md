# Object Detect Album Website v2

A Vite + React frontend for the AWS Object Detect Album backend.

## Features

- Email/password login with Amazon Cognito
- Google OAuth login through Cognito Hosted UI
- Image upload with client-side limits
- Automatic object-tag display
- Tag search, image-based similar search, edit tags, delete images
- Empty album onboarding state

## Backend Contract

This frontend expects the existing backend:

- `GET /file`
- `POST /file`
- `PUT /file`
- `DELETE /file`
- `POST /tag/search`
- `POST /image/search`

Current config is in `src/config.ts`.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to S3 + CloudFront

Vite outputs to `dist/`, not `build/`.

```bash
npm run build
aws s3 sync dist/ s3://shiki-od-album-website-live4 --delete
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

## Demo Limits

- One image per upload
- JPG / PNG only
- Max image size: 5MB
- Album quota should also be enforced by the backend
