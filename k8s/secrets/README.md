# Kubernetes Secrets

Real secret values must never be committed to Git.

Create the secrets manually:

```bash
kubectl create secret generic shortener-secrets \
  --from-literal=SECRET_KEY='your-real-shortener-key'

kubectl create secret generic stats-secrets \
  --from-literal=SECRET_KEY='your-real-stats-key'

kubectl create secret generic qr-secrets \
  --from-literal=SECRET_KEY='your-real-qr-key'
