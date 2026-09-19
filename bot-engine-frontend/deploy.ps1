# deploy.ps1 - Script de Deploy para Dynova Frontend
# Uso: .\deploy.ps1
# Este script compila el frontend, sube los archivos a S3 y limpia el cache de CloudFront.

Write-Host "Dynova Deploy - Iniciando..." -ForegroundColor Cyan

# 1. Configurar variable de entorno del backend
$env:VITE_API_URL = "https://saas-bot-9pe5.onrender.com/api"

# 2. Build
Write-Host "Compilando frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el build. Deploy cancelado." -ForegroundColor Red
    exit 1
}

# 3. Subir a S3 (Assets cacheados, index.html NO cacheado)
Write-Host "Subiendo a S3..." -ForegroundColor Yellow
# Primero subimos todo excepto index.html con cache largo (1 año)
aws s3 sync dist/ s3://dynova-frontend --delete --exclude "index.html" --cache-control "public, max-age=31536000, immutable"
# Luego subimos index.html sin cache para que siempre sirva la última versión
aws s3 cp dist/index.html s3://dynova-frontend/index.html --cache-control "no-cache, no-store, must-revalidate"

# 4. Invalidar cache
Write-Host "Limpiando cache de CloudFront..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id E1JT0IXNB6S0GA --paths "/*" | Out-Null

Write-Host ""
Write-Host "Deploy completado exitosamente!" -ForegroundColor Green
Write-Host "URL: https://d1wb64cdogst13.cloudfront.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTA PARA SPA: Asegúrate de tener configurado en CloudFront la respuesta de error" -ForegroundColor Yellow
Write-Host "Error Code: 404 -> Response Page Path: /index.html -> HTTP Response Code: 200" -ForegroundColor Yellow
Write-Host "Error Code: 403 -> Response Page Path: /index.html -> HTTP Response Code: 200" -ForegroundColor Yellow
Write-Host ""
