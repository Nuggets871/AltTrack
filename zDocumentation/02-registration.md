# Registration - Documentation Technique

## Objectif

Implémenter un système d'inscription sécurisé permettant aux nouveaux utilisateurs de créer un compte dans l'application AltTrack. Le système doit valider les données, hasher le mot de passe, vérifier l'unicité du nom d'utilisateur et créer l'utilisateur en base de données dans une transaction.

## Architecture Générale

### Backend (NestJS)

L'implémentation suit strictement l'architecture en couches définie dans le projet :

```
auth/
├── application/
│   ├── dto/
│   │   ├── register-input.dto.ts
│   │   └── register-output.dto.ts
│   └── use-cases/
│       └── register.use-case.ts
├── domain/
│   └── auth.service.ts (réutilisé)
├── infrastructure/
│   └── user.repository.ts (réutilisé)
└── presentation/
    └── auth.controller.ts (étendu)
```

### Frontend (Angular)

```
core/
├── models/
│   ├── register-request.model.ts
│   └── register-response.model.ts
└── services/
    └── auth.service.ts (étendu)

features/
└── auth/
    └── register/
        ├── register.component.ts
        ├── register.component.html
        └── register.component.css
```

## Schéma des Entités

### User (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  ADMIN
  USER
}
```

## Use Case : RegisterUseCase

### Responsabilité

Le `RegisterUseCase` est responsable de l'inscription d'un nouvel utilisateur. Il gère une seule action : créer un compte utilisateur de manière sécurisée.

### Flux d'Exécution

1. **Réception des données** : Username et password
2. **Vérification de l'unicité** : Vérifie que le username n'existe pas déjà
3. **Hashage du mot de passe** : Utilise bcrypt avec un salt de 10 rounds via `AuthService`
4. **Création de l'utilisateur** : Création en base avec le rôle USER par défaut
5. **Retour des données** : Retourne les informations de l'utilisateur créé (sans le mot de passe)

### Transaction

L'opération complète est exécutée dans une transaction via `executeInTransaction()` pour garantir la cohérence des données. Si une erreur survient à n'importe quelle étape, la transaction est rollback.

### Gestion des Erreurs

- **ConflictException (409)** : Si le username existe déjà
- **Les validations DTO** sont appliquées automatiquement par le ValidationPipe global

## Endpoints API

### POST /auth/register

Crée un nouveau compte utilisateur.

**Requête :**

```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Validations :**

- `username` : 
  - Requis
  - String
  - Entre 3 et 50 caractères
  - Ne peut contenir que des lettres, chiffres, underscores et tirets
- `password` :
  - Requis
  - String
  - Entre 4 et 100 caractères

**Réponse Success (201) :**

```json
{
  "id": "clx1234567890",
  "username": "johndoe",
  "role": "USER",
  "createdAt": "2025-11-18T10:30:00.000Z"
}
```

**Réponses Erreur :**

- **400 Bad Request** : Validation échouée
```json
{
  "statusCode": 400,
  "message": ["username must be longer than or equal to 3 characters"],
  "error": "Bad Request"
}
```

- **409 Conflict** : Username déjà pris
```json
{
  "statusCode": 409,
  "message": "Username already exists",
  "error": "Conflict"
}
```

## Services Réutilisés

### AuthService

Méthodes utilisées :
- `hashPassword(password: string): Promise<string>` - Hash le mot de passe avec bcrypt

### UserRepository

Méthodes utilisées :
- `findByUsername(username: string): Promise<User | null>` - Vérifie l'existence du username
- `create(data): Promise<User>` - Crée l'utilisateur en base

## Frontend

### RegisterComponent

Composant standalone utilisant les Signals Angular pour la réactivité.

**Signals :**
- `username` : Nom d'utilisateur saisi
- `password` : Mot de passe saisi
- `confirmPassword` : Confirmation du mot de passe
- `errorMessage` : Message d'erreur affiché
- `isLoading` : État de chargement

**Validations Frontend :**
- Tous les champs requis
- Username : minimum 3 caractères, format alphanumérique avec _ et -
- Password : minimum 4 caractères
- Les mots de passe doivent correspondre

**Flux d'Utilisation :**
1. L'utilisateur remplit le formulaire
2. Validation côté client avant soumission
3. Appel au service AuthService
4. En cas de succès : redirection vers /login
5. En cas d'erreur : affichage du message d'erreur

### AuthService (extension)

Nouvelle méthode ajoutée :

```typescript
register(credentials: RegisterRequest): Observable<RegisterResponse>
```

Gestion des erreurs spécifiques :
- 409 : Username déjà pris
- 400 : Données invalides
- 0 : Serveur inaccessible

## Routing

**Route ajoutée :**

```typescript
{
  path: 'register',
  loadComponent: () =>
    import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
}
```

La route est publique et accessible sans authentification.

## Sécurité

### Backend

1. **Hashage sécurisé** : Utilisation de bcrypt avec salt de 10 rounds
2. **Validation stricte** : DTO avec class-validator
3. **Transaction atomique** : Garantit la cohérence des données
4. **Pas de fuite d'information** : Le mot de passe n'est jamais retourné dans les réponses
5. **Route publique** : Marquée avec `@Public()` pour permettre l'accès sans token

### Frontend

1. **Validation client** : Validation des données avant envoi
2. **Messages d'erreur clairs** : Sans révéler d'informations sensibles
3. **Gestion des états** : Loading et error states
4. **Confirmation du mot de passe** : Double saisie obligatoire

## Stratégies de Test

### Backend

**Tests unitaires (RegisterUseCase) :**
- ✓ Création réussie d'un utilisateur avec données valides
- ✓ Erreur 409 si username existe déjà
- ✓ Hashage correct du mot de passe
- ✓ Attribution du rôle USER par défaut
- ✓ Rollback de transaction en cas d'erreur
- ✓ Validation des DTOs

**Tests d'intégration :**
- ✓ Endpoint POST /auth/register avec données valides
- ✓ Endpoint avec username existant
- ✓ Endpoint avec données invalides
- ✓ Vérification de la présence en base après création

### Frontend

**Tests unitaires (RegisterComponent) :**
- ✓ Affichage du formulaire
- ✓ Validation des champs requis
- ✓ Validation de la longueur du username
- ✓ Validation de la longueur du password
- ✓ Vérification de la correspondance des mots de passe
- ✓ Appel au service avec bonnes données
- ✓ Redirection vers /login en cas de succès
- ✓ Affichage du message d'erreur en cas d'échec

**Tests e2e :**
- ✓ Parcours complet d'inscription
- ✓ Tentative avec username existant
- ✓ Navigation vers /login après inscription

## Contraintes Techniques

### Backend

- NestJS avec architecture controller → usecase → service → repository
- Prisma avec TransactionManager pour opérations atomiques
- Validation automatique via ValidationPipe global
- Bcrypt pour le hashage des mots de passe
- CORS configuré pour le frontend

### Frontend

- Angular standalone components
- Utilisation exclusive des Signals pour la réactivité
- DaisyUI pour tout le style (aucun CSS custom)
- RouterModule pour la navigation
- FormsModule pour le template-driven form
- HttpClient pour les appels API

## Détails d'Implémentation

### RegisterInputDto

```typescript
class RegisterInputDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password: string;
}
```

### RegisterOutputDto

```typescript
class RegisterOutputDto {
  id: string;
  username: string;
  role: string;
  createdAt: Date;
}
```

### RegisterUseCase - Méthode execute

```typescript
async execute(input: RegisterInputDto): Promise<RegisterOutputDto> {
  return this.executeInTransaction(async () => {
    // Vérification unicité
    const existingUser = await this.userRepository.findByUsername(input.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hashage
    const hashedPassword = await this.authService.hashPassword(input.password);

    // Création
    const newUser = await this.userRepository.create({
      username: input.username,
      password: hashedPassword,
      role: UserRole.USER,
    });

    // Retour
    return {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  });
}
```

## Extensions Futures

1. **Validation email** : Ajouter un champ email avec vérification
2. **Confirmation email** : Envoi d'un email de confirmation
3. **Captcha** : Protection anti-bot
4. **Critères de mot de passe** : Renforcement des exigences de sécurité
5. **Rate limiting** : Protection contre les abus
6. **Double authentification** : Option 2FA

## Liens avec Autres Features

- **Authentication JWT** : Utilise les mêmes modèles User et services
- **Login** : Redirection vers login après inscription réussie
- **Auth Guard** : Les routes protégées restent inaccessibles sans login

## Notes de Développement

- Le mot de passe n'est jamais stocké en clair
- Le rôle par défaut est USER (seul le seed crée des ADMIN)
- La transaction garantit qu'aucun utilisateur n'est créé si une erreur survient
- Le composant register utilise les Signals pour une réactivité optimale
- Tous les styles utilisent exclusivement DaisyUI
- Aucun commentaire dans le code sauf nécessité absolue
- Architecture respectant SOLID, KISS et Clean Architecture

