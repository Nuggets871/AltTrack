# Gestion de l'Environnement via JWT

## Objectif

Détecter automatiquement l'environnement (development/production) depuis le token JWT plutôt que depuis l'URL du navigateur, pour une gestion plus fiable et sécurisée.

## Architecture

### Backend (NestJS)

#### 1. JWT Payload Interface
**Fichier**: `back/src/auth/domain/interfaces/jwt-payload.interface.ts`

```typescript
export interface JwtPayloadInterface {
  sub: string;
  username: string;
  role: UserRole;
  environment: 'development' | 'production';  // ✨ NOUVEAU
}
```

#### 2. Auth Service
**Fichier**: `back/src/auth/domain/auth.service.ts`

Le service génère maintenant l'environnement dans le JWT :

```typescript
generateJwtPayload(user: User): JwtPayloadInterface {
  return {
    sub: user.id,
    username: user.username,
    role: user.role,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}
```

### Frontend (Angular)

#### 1. JWT Payload Model
**Fichier**: `front/src/app/core/models/jwt-payload.model.ts`

```typescript
export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  environment: 'development' | 'production';
  iat?: number;
  exp?: number;
}
```

#### 2. JWT Service
**Fichier**: `front/src/app/core/services/jwt.service.ts`

Service pour décoder et extraire les informations du JWT :

**Fonctionnalités** :
- `decodeToken()` : Décode le JWT et met en cache le résultat
- `getEnvironmentFromToken()` : Extrait l'environnement du token
- `isTokenExpired()` : Vérifie si le token est expiré
- `clearCache()` : Nettoie le cache

#### 3. Environment Service
**Fichier**: `front/src/app/core/services/environment.service.ts`

Service central pour gérer l'état de l'environnement :

**Fonctionnalités** :
- Signal réactif pour l'environnement courant
- `isDevelopment` : Computed signal pour vérifier si en développement
- `isProduction` : Computed signal pour vérifier si en production
- `updateFromToken()` : Met à jour l'environnement depuis le JWT

#### 4. Auth Service (Mis à jour)
**Fichier**: `front/src/app/core/services/auth.service.ts`

Intègre l'EnvironmentService et met à jour l'environnement :
- Lors de la connexion (`handleAuthenticationSuccess`)
- Lors du chargement depuis le storage (`loadAuthenticationStateFromStorage`)
- Lors de la déconnexion (`clearAuthenticationState`)

#### 5. Logger Utility (Mis à jour)
**Fichier**: `front/src/app/shared/utils/logger.util.ts`

Le Logger utilise maintenant l'EnvironmentService :

```typescript
static initialize(environmentService: EnvironmentService): void {
  this.environmentService = environmentService;
}

private static isDevelopment(): boolean {
  return this.environmentService?.isDevelopment() ?? false;
}
```

**Format des logs** :
```
[timestamp] [ENVIRONMENT] [LEVEL] [CONTEXT] message
```

#### 6. App Component (Initialisation)
**Fichier**: `front/src/app/app.component.ts`

Initialise le Logger au démarrage de l'application :

```typescript
ngOnInit(): void {
  Logger.initialize(this.environmentService);
  Logger.info('AppComponent', 'Application initialisée', {
    environment: this.environmentService.getEnvironment()
  });
}
```

## Flux de fonctionnement

### 1. Connexion utilisateur

```
1. User se connecte
   ↓
2. Backend génère JWT avec environment
   {
     sub: "user-id",
     username: "john",
     role: "USER",
     environment: "development"  ← Basé sur NODE_ENV
   }
   ↓
3. Frontend reçoit le token
   ↓
4. AuthService appelle environmentService.updateFromToken()
   ↓
5. JwtService décode le token
   ↓
6. EnvironmentService met à jour son signal
   ↓
7. Logger utilise le bon environnement
```

### 2. Rechargement de page

```
1. App démarre
   ↓
2. Logger.initialize() dans AppComponent
   ↓
3. AuthService charge le token du localStorage
   ↓
4. EnvironmentService met à jour l'environnement depuis le token
   ↓
5. Logger affiche les logs avec le bon environnement
```

### 3. Déconnexion

```
1. User se déconnecte
   ↓
2. AuthService.clearAuthenticationState()
   ↓
3. environmentService.updateFromToken(null)
   ↓
4. Environnement revient à 'production' par défaut
```

## Exemples de logs

### En développement
```
[2025-11-21T15:30:00.123Z] [DEVELOPMENT] [INFO] [AppComponent] Application initialisée
[2025-11-21T15:30:01.456Z] [DEVELOPMENT] [DEBUG] [LottieIconComponent] Chargement de l'icône: sun
[2025-11-21T15:30:02.789Z] [DEVELOPMENT] [INFO] [AuthService] Connexion réussie
```

### En production
```
[2025-11-21T15:30:00.123Z] [PRODUCTION] [INFO] [AppComponent] Application initialisée
[2025-11-21T15:30:02.789Z] [PRODUCTION] [INFO] [AuthService] Connexion réussie
```
(Pas de logs DEBUG en production)

## Avantages de cette approche

✅ **Fiabilité** : L'environnement vient du serveur, pas de l'URL
✅ **Sécurité** : Impossible de falsifier l'environnement côté client
✅ **Cohérence** : Un seul environnement par session utilisateur
✅ **Simplicité** : Pas besoin de vérifier l'URL ou le domaine
✅ **Centralisation** : Une seule source de vérité (le JWT)
✅ **Réactivité** : Utilisation de signals Angular pour la réactivité
✅ **Cache** : JwtService met en cache le décodage pour les performances

## Configuration backend

### Variables d'environnement

**.env.development**
```env
NODE_ENV=development
```

**.env.production**
```env
NODE_ENV=production
```

Le champ `environment` dans le JWT sera automatiquement défini en fonction de `NODE_ENV`.

## Tests

### Test en développement
1. Démarrer le backend avec `NODE_ENV=development`
2. Se connecter dans le frontend
3. Ouvrir la console : les logs DEBUG doivent être visibles
4. Le prefix doit afficher `[DEVELOPMENT]`

### Test en production
1. Démarrer le backend avec `NODE_ENV=production`
2. Se connecter dans le frontend
3. Ouvrir la console : les logs DEBUG ne doivent PAS être visibles
4. Le prefix doit afficher `[PRODUCTION]`

## Migration depuis l'ancienne méthode

### Avant (basé sur URL)
```typescript
private static readonly isDevelopment = !window.location.hostname.includes('prod');
```

❌ Problèmes :
- Dépend du nom de domaine
- Peut être incohérent avec le backend
- Facile à contourner

### Après (basé sur JWT)
```typescript
private static isDevelopment(): boolean {
  return this.environmentService?.isDevelopment() ?? false;
}
```

✅ Avantages :
- Source de vérité unique (backend)
- Cohérence garantie backend/frontend
- Sécurisé et fiable

## Fichiers créés/modifiés

### Backend
- ✅ `jwt-payload.interface.ts` - Ajout du champ `environment`
- ✅ `auth.service.ts` - Génération de l'environment dans le JWT

### Frontend
- ✨ `jwt-payload.model.ts` - Nouveau modèle
- ✨ `jwt.service.ts` - Nouveau service de décodage JWT
- ✨ `environment.service.ts` - Nouveau service de gestion d'environnement
- ♻️ `auth.service.ts` - Intégration EnvironmentService
- ♻️ `logger.util.ts` - Utilisation EnvironmentService
- ♻️ `app.component.ts` - Initialisation du Logger
- ✅ `models/index.ts` - Export du nouveau modèle

## Conclusion

Cette implémentation offre une gestion robuste et fiable de l'environnement, en s'appuyant sur le JWT comme source de vérité unique, garantissant la cohérence entre le backend et le frontend.

