# Plan : Système d'authentification JWT avec architecture Clean

Mise en place complète d'un système d'authentification JWT pour l'application AltTrack suivant les principes Clean Architecture, SOLID, et l'architecture backend controller → usecase → service → repository. Le système inclut le module auth, les guards, le seed admin et la documentation technique.

## Contexte du projet

- **Stack Backend** : NestJS avec Prisma et MySQL
- **Architecture** : Controller → UseCase → Service → Repository
- **Principes** : SOLID, KISS, Clean Architecture, DDD light
- **Contraintes** : Pas de commentaires sauf nécessité absolue, noms explicites et longs si nécessaire, transactions Prisma pour cohérence

## Objectifs de la fonctionnalité 1

- Implémenter un module d'auth complet incluant login, validation du token, rafraîchissement éventuel, et middleware/guard NestJS
- Création d'un endpoint de login acceptant pseudo + mot de passe
- Vérification du mot de passe hashé via Prisma et bcrypt
- Génération d'un JWT signé contenant l'ID utilisateur + rôle + données essentielles
- Utilisation d'un AuthGuard côté API pour sécuriser toutes les routes internes
- Mise en place d'un système de rôle (exemple : admin, user)
- Création d'un script de seed générant un utilisateur admin : pseudo « ggez », mot de passe « ggez » (hashé)
- Stockage sécurisé de la clé JWT dans les variables d'environnement

## Steps détaillés

### 1. Créer le schéma Prisma User

**Fichier** : `back/prisma/schema.prisma`

Ajouter l'entité `User` avec :
- `id` : String @id @default(cuid())
- `username` : String @unique
- `password` : String (hashé)
- `role` : UserRole (enum avec ADMIN et USER)
- `createdAt` : DateTime @default(now())
- `updatedAt` : DateTime @updatedAt

Créer l'enum `UserRole` avec les valeurs :
- ADMIN
- USER

### 2. Installer les dépendances JWT et bcrypt

**Commandes** :
```bash
cd back
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/bcrypt @types/passport-jwt
```

**Dépendances à ajouter** :
- `@nestjs/jwt` : Module JWT pour NestJS
- `@nestjs/passport` : Intégration Passport avec NestJS
- `passport` : Framework d'authentification
- `passport-jwt` : Stratégie JWT pour Passport
- `bcrypt` : Hashing de mots de passe
- `@types/bcrypt` : Types TypeScript pour bcrypt
- `@types/passport-jwt` : Types TypeScript pour passport-jwt

### 3. Créer la classe abstraite UseCase

**Fichier** : `back/src/core/use-case.abstract.ts`

Créer une classe abstraite générique `UseCase<TInput, TOutput>` avec :
- Injection de `PrismaService` dans le constructeur
- Méthode abstraite `execute(input: TInput): Promise<TOutput>`
- Méthode protégée `executeInTransaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T>` qui utilise `prisma.$transaction`

**Fichier** : `back/src/core/prisma.service.ts`

Créer le service Prisma qui étend `PrismaClient` et implémente `OnModuleInit` et `OnModuleDestroy` :
- `onModuleInit()` : appelle `$connect()`
- `onModuleDestroy()` : appelle `$disconnect()`

**Fichier** : `back/src/core/core.module.ts`

Créer le module Core qui exporte `PrismaService` en tant que service global.

### 4. Implémenter le module Auth avec architecture Clean

#### 4.1 Repository Layer

**Fichier** : `back/src/auth/infrastructure/user.repository.ts`

Créer `UserRepository` avec :
- `findByUsername(username: string): Promise<User | null>`
- `findById(id: string): Promise<User | null>`
- `create(data: { username: string; password: string; role: UserRole }): Promise<User>`
- Injection de `PrismaService`

#### 4.2 Service Layer (Domain Logic)

**Fichier** : `back/src/auth/domain/auth.service.ts`

Créer `AuthService` avec :
- `hashPassword(password: string): Promise<string>` : utilise bcrypt avec salt de 10
- `comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>` : utilise bcrypt.compare
- `generateJwtPayload(user: User): JwtPayloadInterface` : crée le payload JWT
- `validateUser(username: string, password: string): Promise<User | null>` : valide les credentials

**Fichier** : `back/src/auth/domain/interfaces/jwt-payload.interface.ts`

Créer l'interface `JwtPayloadInterface` avec :
- `sub` : string (userId)
- `username` : string
- `role` : UserRole

#### 4.3 UseCase Layer

**Fichier** : `back/src/auth/application/use-cases/login.use-case.ts`

Créer `LoginUseCase` qui étend `UseCase<LoginInputDto, LoginOutputDto>` avec :
- Injection de `AuthService`, `UserRepository`, et `JwtService`
- Méthode `execute(input: LoginInputDto)` qui :
  1. Valide l'utilisateur via `AuthService.validateUser`
  2. Génère le payload JWT via `AuthService.generateJwtPayload`
  3. Signe le token via `JwtService.sign`
  4. Retourne le token et les infos utilisateur

**Fichier** : `back/src/auth/application/dto/login-input.dto.ts`

Créer `LoginInputDto` avec validation :
- `username` : string, @IsString(), @IsNotEmpty()
- `password` : string, @IsString(), @IsNotEmpty()

**Fichier** : `back/src/auth/application/dto/login-output.dto.ts`

Créer `LoginOutputDto` avec :
- `accessToken` : string
- `user` : { id: string, username: string, role: UserRole }

#### 4.4 Controller Layer

**Fichier** : `back/src/auth/presentation/auth.controller.ts`

Créer `AuthController` avec :
- Route POST `/auth/login` utilisant `@Body()` avec `LoginInputDto`
- Injection de `LoginUseCase`
- Décorateur `@Public()` custom pour exclure du guard JWT
- Retourne `LoginOutputDto`

#### 4.5 Guards et Strategy

**Fichier** : `back/src/auth/infrastructure/strategies/jwt.strategy.ts`

Créer `JwtStrategy` qui étend `PassportStrategy(Strategy)` avec :
- Configuration depuis `ConfigService` (JWT_SECRET)
- `validate(payload: JwtPayloadInterface)` retourne l'objet user

**Fichier** : `back/src/auth/infrastructure/guards/jwt-auth.guard.ts`

Créer `JwtAuthGuard` qui étend `AuthGuard('jwt')` avec :
- Gestion du décorateur `@Public()` via `Reflector`
- Override de `canActivate` pour vérifier la métadonnée `isPublic`

**Fichier** : `back/src/auth/infrastructure/decorators/public.decorator.ts`

Créer le décorateur `@Public()` utilisant `SetMetadata('isPublic', true)`.

**Fichier** : `back/src/auth/infrastructure/decorators/current-user.decorator.ts`

Créer le décorateur `@CurrentUser()` pour extraire l'utilisateur de la request.

#### 4.6 Module Configuration

**Fichier** : `back/src/auth/auth.module.ts`

Créer `AuthModule` avec :
- Import de `JwtModule.registerAsync` configuré avec `ConfigService`
- Import de `PassportModule`
- Import de `CoreModule`
- Providers : `AuthService`, `UserRepository`, `LoginUseCase`, `JwtStrategy`
- Controllers : `AuthController`
- Exports : `AuthService`, `UserRepository`, `JwtStrategy`

**Fichier** : `back/src/app.module.ts`

- Importer `ConfigModule.forRoot()` (global)
- Importer `CoreModule`
- Importer `AuthModule`
- Configurer `APP_GUARD` avec `JwtAuthGuard` pour sécuriser toutes les routes par défaut

### 5. Créer le script seed

**Fichier** : `back/prisma/seed.ts`

Créer le script avec :
- Import de `PrismaClient` et `bcrypt`
- Fonction `main()` qui :
  1. Hash le mot de passe "ggez"
  2. Utilise `upsert` pour créer/mettre à jour l'utilisateur admin
  3. Username : "ggez"
  4. Role : ADMIN
- Gestion des erreurs et déconnexion Prisma

**Fichier** : `back/package.json`

Ajouter la section :
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

Ajouter `ts-node` si non présent dans devDependencies.

### 6. Configuration des variables d'environnement

**Fichier** : `back/.env.example`

Créer avec :
```
DATABASE_URL="mysql://user:password@localhost:3306/alttrack"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"
PORT=3000
```

**Fichier** : `back/.env`

Créer avec les vraies valeurs (ne pas committer).

**Fichier** : `back/.gitignore`

Vérifier que `.env` est bien présent.

### 7. Rédiger la documentation technique

**Fichier** : `documentation/01-authentification-jwt.md`

Créer la documentation complète avec les sections :

1. **Objectif technique**
   - Pourquoi l'authentification JWT
   - Avantages pour l'architecture
   
2. **Architecture générale**
   - Schéma des couches (Controller → UseCase → Service → Repository)
   - Flux de données lors du login
   - Flux de validation des requêtes authentifiées

3. **Schéma des entités**
   - Modèle User avec tous les champs
   - Enum UserRole
   - Relations futures

4. **UseCases concernés**
   - LoginUseCase : description détaillée
   - Futurs usecases (RegisterUseCase, RefreshTokenUseCase, etc.)

5. **Endpoints**
   - POST /auth/login : input, output, codes d'erreur
   - Liste des routes protégées par défaut

6. **Stratégies de sécurité**
   - Hashing bcrypt avec salt
   - Structure du JWT et expiration
   - Validation du token
   - Gestion du décorateur @Public()
   - Bonnes pratiques (ne pas logger les passwords, etc.)

7. **Contraintes techniques**
   - Dépendances requises
   - Variables d'environnement
   - Configuration Passport et JWT
   - Utilisation du TransactionManager (si nécessaire)

8. **Détails d'implémentation Backend**
   - Structure des dossiers
   - Responsabilité de chaque couche
   - Gestion des erreurs
   - Validation des DTOs

9. **Stratégies de test**
   - Tests unitaires des services
   - Tests d'intégration du UseCase
   - Tests E2E de l'endpoint login

10. **Améliorations futures**
    - Refresh tokens
    - Révocation de tokens
    - Rate limiting
    - 2FA

### 8. Commandes d'exécution

Après implémentation, exécuter :

```bash
cd back
npm install
npx prisma generate
npx prisma migrate dev --name add-user-and-auth
npx prisma db seed
npm run start:dev
```

Tester l'endpoint :
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ggez","password":"ggez"}'
```

### 9. Validation finale

- Exécuter `npm run build` pour vérifier la compilation TypeScript
- Vérifier qu'aucune erreur de lint n'est présente
- Tester le login avec les credentials du seed
- Vérifier que les routes non-publiques retournent 401 sans token
- Vérifier que les routes non-publiques fonctionnent avec un token valide

## Points d'attention

1. **Nommage explicite** : Tous les fichiers, classes et méthodes doivent avoir des noms longs et explicites conformément aux instructions
2. **Pas de commentaires** : Aucun commentaire dans le code sauf extrême nécessité liée à la sécurité
3. **SOLID** : Chaque classe a une responsabilité unique et claire
4. **Transaction Manager** : Même si le login n'en a pas strictement besoin, la classe abstraite UseCase doit être prête pour les futures fonctionnalités
5. **Validation** : Utiliser class-validator pour tous les DTOs
6. **Sécurité** : 
   - Ne jamais logger les mots de passe
   - Utiliser des variables d'environnement pour JWT_SECRET
   - Salt bcrypt approprié (10 rounds minimum)
7. **Architecture** : Respecter strictement Controller → UseCase → Service → Repository

## Dépendances entre les steps

- Step 1 doit être terminé avant Step 3 (Prisma doit être configuré)
- Step 2 peut être fait en parallèle
- Step 3 doit être terminé avant Step 4 (UseCase abstrait requis)
- Step 4 est le cœur et doit être fait dans l'ordre des sous-steps
- Step 5 dépend de Step 1 et Step 4.2 (schema + AuthService pour le hash)
- Step 6 peut être fait à tout moment
- Step 7 doit être fait en dernier (documentation finale)
- Step 8 et 9 sont les validations finales

## Résultat attendu

À la fin de cette fonctionnalité, le système doit :
- ✅ Avoir une architecture backend complète et clean pour l'authentification
- ✅ Permettre le login avec username/password
- ✅ Générer et valider des JWT
- ✅ Protéger automatiquement toutes les routes sauf celles marquées @Public()
- ✅ Avoir un utilisateur admin seedé (ggez/ggez)
- ✅ Avoir une documentation technique complète
- ✅ Respecter tous les principes SOLID et Clean Architecture
- ✅ Être prêt pour l'ajout des fonctionnalités suivantes (notebooks, etc.)

