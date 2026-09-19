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

# 3. Subir a S3
Write-Host "Subiendo a S3..." -ForegroundColor Yellow
aws s3 sync dist/ s3://dynova-frontend --delete

# 4. Invalidar cache
Write-Host "Limpiando cache de CloudFront..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id E1JT0IXNB6S0GA --paths "/*" | Out-Null

Write-Host ""
Write-Host "Deploy completado exitosamente!" -ForegroundColor Green
Write-Host "URL: https://d1wb64cdogst13.cloudfront.net" -ForegroundColor Cyan
Write-Host ""
