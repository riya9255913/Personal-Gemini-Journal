# Personal Gemini Journal

A production-grade, secure, and resilient personal reflective journaling application powered by Google Cloud Run and the Gemini API via `@google/genai`. Features an automated model fallback ladder, owner-bound data isolation, and deep emotional synthesis.

---

## Architecture & Security Highlights

- **Resilient Gemini Model Fallback Ladder**: Automatically executes content generation across a prioritized model cascade (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`), automatically recovering from transient `503`, `429`, or `404` errors.
- **OWASP LLM01 / LLM02 Defenses**: Indirect prompt injection mitigation with strict schema bounding tags (`<user_journal_entry>`), parameterization, and sanitized payload ingestion.
- **Zero Insecure Defaults & Owner-Bound Isolation**: Firestore rules restrict read/write access strictly to authenticated document owners (`request.auth.uid == userId`).
- **Zero-Hardcoding Hygiene**: All operational keys are provisioned server-side via Google Cloud Secret Manager or environment variables. No credentials exist in browser bundles.

---

## 1. Environment & Prerequisites

Ensure the following tools are installed and authenticated:
- **Google Cloud SDK (`gcloud` CLI)**: [Install Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- **Node.js**: v20+ and npm

### Enable Required Google Cloud APIs

```bash
# Set your active GCP project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"
gcloud config set project $PROJECT_ID

# Enable required Google Cloud services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup

Provision your Gemini API key in Google Cloud Secret Manager and grant the Cloud Run runtime service account permission to access it.

```bash
# 1. Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Identify your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 3. Grant the default Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

1. Provision Cloud Firestore in Native Mode:
```bash
gcloud firestore databases create --location=$REGION --type=firestore-native
```

2. Deploy the owner-bound security rules (`firestore.rules`):
```bash
firebase deploy --only firestore:rules
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/insights/{insightId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Local Development

Install dependencies and start the full-stack dev server:

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

The application runs on `http://localhost:3000` with the Express API proxy and Vite frontend bundled seamlessly.

---

## 5. Cloud Run Deployment Flow

Build and deploy directly from source to Cloud Run:

```bash
# Build & Deploy to Google Cloud Run
gcloud run deploy personal-gemini-journal \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 6. Required Campaign Verification Binding

To register the Cloud Run deployment for challenge verification, apply the mandatory campaign label:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 7. Automated Model Resilience Verification

The backend routes implement `generateContentWithFallback`, executing the following fallback ladder upon transient failures:

1. **Primary**: `gemini-3.6-flash`
2. **High-Availability Fallback**: `gemini-3.1-flash-lite`
3. **Dynamic Alias**: `gemini-flash-latest`
4. **Deep Reasoning Fallback**: `gemini-3.7-flash`

All journal writes undergo recursive `undefined` property stripping before persistence to protect database transaction integrity.
