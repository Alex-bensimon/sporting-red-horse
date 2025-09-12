#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/deploy-cloud-run.sh <gcp-project-id> [region] [service-name] [repository]
# Requires: gcloud CLI, Docker (Buildx), authenticated to GCP (gcloud auth login)

PROJECT_ID=${1:-sporting-red-horse}
REGION=${2:-europe-west1}
SERVICE=${3:-srh-web}
REPO=${4:-containers}

if [[ -z "$PROJECT_ID" ]]; then
  echo "Project ID required. Usage: scripts/deploy-cloud-run.sh <gcp-project-id> [region] [service-name] [repository]" >&2
  exit 1
fi

HOST="${REGION}-docker.pkg.dev"
IMAGE_PATH="${HOST}/${PROJECT_ID}/${REPO}/${SERVICE}"
TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE="${IMAGE_PATH}:${TAG}"

echo "-> Ensuring required services are enabled (idempotent)"
gcloud services enable artifactregistry.googleapis.com run.googleapis.com --project "$PROJECT_ID" >/dev/null

echo "-> Ensuring Artifact Registry repo '${REPO}' exists in ${REGION}"
if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="SRH containers" \
    --project="$PROJECT_ID"
fi

echo "-> Configuring Docker to authenticate with ${HOST}"
gcloud auth configure-docker "$HOST" --quiet

echo "-> Building image for Cloud Run (linux/amd64)"
docker buildx create --use --name srh_builder >/dev/null 2>&1 || true
docker buildx build \
  --platform linux/amd64 \
  -t "$IMAGE" \
  --push \
  .

ENV_FLAG=()
if [[ -f scripts/env.cloudrun.yaml ]]; then
  echo "-> Using YAML env file: scripts/env.cloudrun.yaml"
  ENV_FLAG=(--env-vars-file scripts/env.cloudrun.yaml)
elif [[ -f scripts/env.cloudrun.env ]]; then
  echo "-> Using .env file: scripts/env.cloudrun.env"
  # Build comma-separated KEY=VALUE list, ignoring comments and empty lines
  VARS=$(grep -vE '^(#|\s*$)' scripts/env.cloudrun.env | tr '\n' ',' | sed 's/,$//')
  if [[ -n "$VARS" ]]; then
    ENV_FLAG=(--set-env-vars "$VARS")
  fi
fi

echo "-> Deploying to Cloud Run: $SERVICE in $REGION"
gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --ingress=all \
  --port=8080 \
  --min-instances=0 \
  --max-instances=5 \
  --cpu=1 \
  --memory=256Mi \
  "${ENV_FLAG[@]}"

echo "-> Done. Service URL:"
gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)'

