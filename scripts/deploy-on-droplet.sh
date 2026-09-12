#!/usr/bin/env bash
set -Eeuo pipefail

deploy_sha=${1:?Missing commit SHA}
app_dir=${2:?Missing application directory}
systemd_service=${3:?Missing systemd service name}
app_port=${4:?Missing application port}

cd "$app_dir"
git fetch --prune origin "$deploy_sha"
git checkout --detach "$deploy_sha"
npm ci --registry=https://registry.npmjs.org/
npm run build
sudo systemctl restart "$systemd_service"
sudo systemctl is-active --quiet "$systemd_service"
curl --fail --silent --show-error "http://127.0.0.1:${app_port}/health" > /dev/null