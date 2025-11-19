# Script PowerShell pour vérifier le typecheck sur tout le projet (front + back)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 Vérification TypeScript - Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location ".\back"
$backResult = $?
npm run typecheck
$backSuccess = $?

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 Vérification TypeScript - Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "..\front"
npm run typecheck
$frontSuccess = $?

Set-Location ".."

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Résumé" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backSuccess) {
    Write-Host "✅ Backend: Aucune erreur TypeScript" -ForegroundColor Green
} else {
    Write-Host "❌ Backend: Des erreurs TypeScript ont été détectées" -ForegroundColor Red
}

if ($frontSuccess) {
    Write-Host "✅ Frontend: Aucune erreur TypeScript" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: Des erreurs TypeScript ont été détectées" -ForegroundColor Red
}

Write-Host ""

if ($backSuccess -and $frontSuccess) {
    Write-Host "🎉 Tous les tests de typecheck ont réussi!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ Certains tests de typecheck ont échoué. Veuillez corriger les erreurs." -ForegroundColor Yellow
    exit 1
}

