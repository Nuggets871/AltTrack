# Script de test pour la fonctionnalité Register

Write-Host "=== Test de la fonctionnalité Register ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Vérifier que le backend est démarré
Write-Host "Test 1: Vérification du serveur backend..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendRunning) {
    Write-Host "✅ Backend accessible sur le port 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend non accessible. Démarrez-le avec: cd back; npm run start:dev" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Tester l'endpoint register avec des données valides
Write-Host "Test 2: Création d'un nouvel utilisateur..." -ForegroundColor Yellow
$username = "testuser_$(Get-Random -Minimum 1000 -Maximum 9999)"
$body = @{
    username = $username
    password = "test1234"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/auth/register' -Method POST -Body $body -ContentType 'application/json' -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Utilisateur créé avec succès" -ForegroundColor Green
    Write-Host "   ID: $($result.id)" -ForegroundColor Gray
    Write-Host "   Username: $($result.username)" -ForegroundColor Gray
    Write-Host "   Role: $($result.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur lors de la création: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Tester avec un username déjà existant (devrait échouer avec 409)
Write-Host "Test 3: Tentative avec username existant (doit échouer)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/auth/register' -Method POST -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host "❌ L'API aurait dû rejeter le username existant" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Erreur 409 Conflict correctement retournée" -ForegroundColor Green
    } else {
        Write-Host "❌ Code d'erreur incorrect: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Test 4: Tester avec des données invalides
Write-Host "Test 4: Tentative avec username trop court (doit échouer)..." -ForegroundColor Yellow
$invalidBody = @{
    username = "ab"
    password = "test1234"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/auth/register' -Method POST -Body $invalidBody -ContentType 'application/json' -ErrorAction Stop
    Write-Host "❌ L'API aurait dû rejeter le username trop court" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Erreur 400 Bad Request correctement retournée" -ForegroundColor Green
    } else {
        Write-Host "❌ Code d'erreur incorrect: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Test 5: Tester qu'on peut se connecter avec le compte créé
Write-Host "Test 5: Test de connexion avec le compte créé..." -ForegroundColor Yellow
$loginBody = @{
    username = $username
    password = "test1234"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/auth/login' -Method POST -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    $loginResult = $response.Content | ConvertFrom-Json
    Write-Host "✅ Connexion réussie avec le compte créé" -ForegroundColor Green
    Write-Host "   Token reçu: $($loginResult.accessToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur lors de la connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== ✅ Tous les tests sont passés avec succès ! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant tester l'interface web:" -ForegroundColor Cyan
Write-Host "  1. Démarrez le frontend: cd front; npm start" -ForegroundColor Gray
Write-Host "  2. Accédez à http://localhost:4200/register" -ForegroundColor Gray
Write-Host "  3. Créez un compte et testez le flux complet" -ForegroundColor Gray

