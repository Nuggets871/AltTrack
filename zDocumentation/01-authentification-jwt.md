# Authentification JWT - Documentation Technique

## 1. Objectif technique

L'authentification JWT (JSON Web Token) a été mise en place pour sécuriser l'accès aux ressources de l'API AltTrack. Ce système permet une authentification stateless, scalable et performante, conforme aux besoins d'une application moderne.

### Avantages pour l'architecture

- **Stateless** : Aucune session serveur, le token contient toutes les informations nécessaires
- **Scalable** : Facilite la distribution horizontale sans partage de session
- **Sécurisé** : Signature cryptographique empêchant la falsification
- **Performance** : Validation rapide sans requête base de données systématique
- **Standards** : Utilisation du standard OAuth2/JWT largement adopté

## 2. Architecture générale

L'authentification suit une architecture en couches Clean Architecture stricte :

```
Presentation Layer (Controller)
        ↓
Application Layer (UseCase)
        ↓
Domain Layer (Service)
        ↓
Infrastructure Layer (Repository)
```

### Flux de données lors du login

1. **Controller** (`AuthController`) reçoit la requête POST `/auth/login`
2. **Validation** des données via DTOs et `class-validator`
3. **UseCase** (`LoginUseCase`) orchestre la logique applicative
4. **Service** (`AuthService`) vérifie les credentials avec bcrypt
5. **Repository** (`UserRepository`) interroge la base via Prisma
6. **Service** génère le payload JWT
7. **JwtService** signe le token
8. **Controller** retourne le token et les informations utilisateur

### Flux de validation des requêtes authentifiées

1. **Guard** (`JwtAuthGuard`) intercepte toutes les requêtes (sauf `@Public()`)
2. **Strategy** (`JwtStrategy`) extrait et valide le token JWT
3. **Passport** vérifie la signature avec `JWT_SECRET`
4. **Strategy.validate()** transforme le payload en objet user
5. **Request.user** est injecté dans le contexte de la requête
6. **Controller** peut accéder à l'utilisateur via `@CurrentUser()`

## 3. Schéma des entités

### Model User

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // Hash bcrypt
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Enum UserRole

```prisma
enum UserRole {
  ADMIN
  USER
}
```

### Relations futures

- `User` → `Notebook[]` (un utilisateur peut avoir plusieurs notebooks)
- `User` → `WorkItem[]` (historique des travaux créés)
- `User` → `DailyNote[]` (notes quotidiennes)

## 4. UseCases concernés

### LoginUseCase

**Responsabilité unique** : Authentifier un utilisateur et générer un JWT

**Flux d'exécution** :
1. Validation des inputs (username, password)
2. Appel à `AuthService.validateUser()` pour vérifier les credentials
3. Si invalide : exception `UnauthorizedException`
4. Génération du payload via `AuthService.generateJwtPayload()`
5. Signature du token via `JwtService.sign()`
6. Retour du token et des informations utilisateur sanitisées

**Principe SOLID respecté** : Responsabilité unique (Single Responsibility)

### Futurs UseCases

- **RegisterUseCase** : Inscription d'un nouvel utilisateur
- **RefreshTokenUseCase** : Renouvellement du token d'accès
- **LogoutUseCase** : Révocation de token (si implémenté)
- **ChangePasswordUseCase** : Modification du mot de passe
- **ResetPasswordUseCase** : Réinitialisation du mot de passe

## 5. Endpoints

### POST /auth/login

**Authentification d'un utilisateur**

#### Request

```typescript
{
  username: string;  // @IsNotEmpty @IsString
  password: string;  // @IsNotEmpty @IsString
}
```

#### Response Success (200)

```typescript
{
  accessToken: string;
  user: {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
  }
}
```

#### Response Error

- **401 Unauthorized** : Credentials invalides
- **400 Bad Request** : Validation DTO échouée

### Routes protégées par défaut

Toutes les routes sont protégées par `JwtAuthGuard` (APP_GUARD) sauf si marquées `@Public()`.

**Exemples de routes futures protégées** :
- `GET /notebooks`
- `POST /notebooks`
- `GET /daily-notes/:date`
- `POST /work-items`

## 6. Stratégies de sécurité

### Hashing bcrypt

- **Algorithme** : bcrypt avec salt de 10 rounds
- **Fonction** : `AuthService.hashPassword()`
- **Validation** : `AuthService.comparePassword()`
- **Sécurité** : Résistant aux attaques rainbow table et brute force

### Structure du JWT

**Header** :
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** :
```json
{
  "sub": "user-id-cuid",
  "username": "ggez",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Signature** : HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)

### Expiration

- **Durée par défaut** : 24 heures (configurable via `JWT_EXPIRATION`)
- **Gestion** : Automatique via `@nestjs/jwt`
- **Erreur** : 401 Unauthorized si token expiré

### Validation du token

1. Extraction depuis le header `Authorization: Bearer <token>`
2. Vérification de la signature avec `JWT_SECRET`
3. Vérification de l'expiration
4. Extraction du payload
5. Injection dans `request.user`

### Gestion du décorateur @Public()

Le décorateur `@Public()` utilise les métadonnées NestJS pour marquer une route comme publique :

```typescript
export const Public = () => SetMetadata('isPublic', true);
```

Le `JwtAuthGuard` vérifie cette métadonnée avant de valider le token :

```typescript
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
  context.getHandler(),
  context.getClass(),
]);

if (isPublic) {
  return true;
}
```

### Bonnes pratiques

- ✅ Ne JAMAIS logger les mots de passe en clair
- ✅ Stocker `JWT_SECRET` dans les variables d'environnement
- ✅ Utiliser HTTPS en production
- ✅ Définir une expiration raisonnable du token
- ✅ Sanitiser les réponses (ne pas retourner le password)
- ✅ Valider les inputs avec `class-validator`
- ❌ Ne PAS stocker d'informations sensibles dans le JWT
- ❌ Ne PAS réutiliser le même `JWT_SECRET` entre environnements

## 7. Contraintes techniques

### Dépendances requises

```json
{
  "@nestjs/jwt": "^11.0.1",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/config": "^4.0.2",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^6.0.0",
  "class-validator": "^0.14.2",
  "class-transformer": "^0.5.1",
  "@prisma/client": "latest",
  "@types/bcrypt": "^6.0.0",
  "@types/passport-jwt": "^4.0.1"
}
```

### Variables d'environnement

**Obligatoires** :
- `JWT_SECRET` : Clé secrète pour signer les JWT (min 32 caractères recommandés)
- `DATABASE_URL` : URL de connexion MySQL

**Optionnelles** :
- `JWT_EXPIRATION` : Durée d'expiration (défaut: "24h")
- `PORT` : Port du serveur (défaut: 3000)

### Configuration Passport et JWT

Le module JWT est configuré de manière asynchrone pour accéder au `ConfigService` :

```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h',
    },
  }),
  inject: [ConfigService],
})
```

### Utilisation du TransactionManager

Bien que le login ne nécessite pas de transaction, la classe abstraite `UseCase` est prête pour les opérations futures nécessitant la cohérence des données :

```typescript
protected async executeInTransaction<T>(
  callback: (prisma: PrismaService) => Promise<T>,
): Promise<T> {
  return this.prismaService.$transaction(async (prisma) => {
    return callback(prisma as PrismaService);
  });
}
```

## 8. Détails d'implémentation Backend

### Structure des dossiers

```
src/
├── core/
│   ├── prisma.service.ts          // Service Prisma global
│   ├── use-case.abstract.ts       // Classe abstraite UseCase
│   └── core.module.ts              // Module Core global
├── auth/
│   ├── application/
│   │   ├── dto/
│   │   │   ├── login-input.dto.ts
│   │   │   └── login-output.dto.ts
│   │   └── use-cases/
│   │       └── login.use-case.ts
│   ├── domain/
│   │   ├── auth.service.ts
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
│   ├── infrastructure/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── user.repository.ts
│   ├── presentation/
│   │   └── auth.controller.ts
│   └── auth.module.ts
```

### Responsabilité de chaque couche

#### Presentation (Controller)
- Réception des requêtes HTTP
- Validation des DTOs
- Appel des UseCases
- Formatage des réponses

#### Application (UseCase)
- Orchestration de la logique métier
- Coordination entre services et repositories
- Gestion des transactions
- Une action = un UseCase

#### Domain (Service)
- Logique métier réutilisable
- Opérations sans dépendance à l'infrastructure
- Business rules

#### Infrastructure (Repository, Strategy, Guards)
- Accès aux données (Prisma)
- Intégration Passport
- Guards et décorateurs

### Gestion des erreurs

- `UnauthorizedException` : Credentials invalides
- `ValidationException` : Inputs invalides (automatique via `class-validator`)
- `InternalServerErrorException` : Erreurs inattendues

### Validation des DTOs

Activation globale via `APP_PIPE` :

```typescript
{
  provide: APP_PIPE,
  useClass: ValidationPipe,
}
```

Chaque DTO utilise les décorateurs `class-validator` :
- `@IsNotEmpty()` : Champ requis
- `@IsString()` : Type string
- `@IsEmail()` : Format email (futur)
- `@MinLength()` : Longueur minimale (futur)

## 9. Stratégies de test

### Tests unitaires des services

**AuthService** :
- `hashPassword()` : Vérifier que le hash est différent du mot de passe
- `comparePassword()` : Vérifier la comparaison correcte
- `generateJwtPayload()` : Vérifier la structure du payload
- `validateUser()` : Tester les cas valides et invalides

**UserRepository** :
- Mock de `PrismaService`
- Test des méthodes `findByUsername()`, `findById()`, `create()`

### Tests d'intégration du UseCase

**LoginUseCase** :
- Test du flux complet de login
- Vérification de la génération du token
- Test des erreurs (user inexistant, mot de passe invalide)
- Mock des dépendances (AuthService, UserRepository, JwtService)

### Tests E2E de l'endpoint login

```typescript
it('POST /auth/login - success', async () => {
  return request(app.getHttpServer())
    .post('/auth/login')
    .send({ username: 'ggez', password: 'ggez' })
    .expect(200)
    .expect((res) => {
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.username).toBe('ggez');
      expect(res.body.user.role).toBe('ADMIN');
    });
});

it('POST /auth/login - invalid credentials', async () => {
  return request(app.getHttpServer())
    .post('/auth/login')
    .send({ username: 'ggez', password: 'wrong' })
    .expect(401);
});
```

## 10. Améliorations futures

### Refresh tokens

Implémentation d'un système de refresh token pour renouveler l'access token sans redemander les credentials :

- Stockage des refresh tokens en base de données
- Endpoint `/auth/refresh`
- Expiration différente (7-30 jours)
- Révocation possible

### Révocation de tokens

Système de blacklist ou whitelist pour révoquer des tokens avant expiration :

- Table `RevokedToken` ou `ActiveToken`
- Vérification lors de la validation
- Gestion du logout

### Rate limiting

Protection contre les attaques brute force :

- Limitation des tentatives de login par IP
- Throttling sur l'endpoint `/auth/login`
- Utilisation de `@nestjs/throttler`

### 2FA (Two-Factor Authentication)

Ajout d'une couche de sécurité supplémentaire :

- TOTP (Time-based One-Time Password)
- QR Code pour configuration
- Codes de récupération
- Champ `twoFactorEnabled` dans User

### Autres améliorations

- **Email verification** : Vérification de l'email lors de l'inscription
- **Password reset** : Réinitialisation par email
- **Session monitoring** : Liste des sessions actives
- **Security events log** : Historique des connexions
- **OAuth2/OpenID** : Intégration SSO (Google, GitHub, etc.)

---

**Version** : 1.0.0  
**Date** : 18/11/2024  
**Auteur** : AltTrack Team

