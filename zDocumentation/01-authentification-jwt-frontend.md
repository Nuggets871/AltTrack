# Authentification JWT Frontend - Documentation Technique

## 1. Objectif technique

L'implémentation frontend de l'authentification JWT permet aux utilisateurs de se connecter à l'application AltTrack, de maintenir une session sécurisée et de protéger l'accès aux ressources. Cette implémentation suit les principes Clean Architecture, utilise les Signals Angular pour la gestion d'état réactive et s'intègre parfaitement avec le backend NestJS existant.

### Avantages de l'architecture

- **Réactivité native** : Utilisation des Signals Angular pour une gestion d'état performante
- **Stateless** : Le token JWT est stocké localement et envoyé à chaque requête
- **Séparation des responsabilités** : Architecture en couches (Services, Guards, Interceptors, Components)
- **Type-safety** : TypeScript strict avec interfaces correspondant aux DTOs backend
- **Expérience utilisateur optimale** : Formulaires réactifs, validation en temps réel, feedback visuel

## 2. Architecture générale

L'authentification frontend suit une architecture en couches :

```
Presentation Layer (Components)
        ↓
Application Layer (Services)
        ↓
Infrastructure Layer (Interceptors, Guards)
```

### Flux de connexion utilisateur

1. **Composant Login** : L'utilisateur entre ses credentials (username, password)
2. **Validation** : Validation côté client avec ReactiveFormsModule
3. **AuthService** : Envoi de la requête POST `/auth/login` au backend
4. **Backend** : Validation des credentials et génération du JWT
5. **Réponse** : Réception du token et des informations utilisateur
6. **Storage** : Sauvegarde dans localStorage (token + user)
7. **State Management** : Mise à jour des Signals (currentUser, accessToken, isAuthenticated)
8. **Navigation** : Redirection vers la page d'accueil ou URL initialement demandée

### Flux de requêtes authentifiées

1. **HTTP Request** : Une requête HTTP est envoyée
2. **Interceptor** : L'intercepteur ajoute le header `Authorization: Bearer {token}`
3. **Backend** : Validation du JWT par le JwtAuthGuard
4. **Response** : Retour des données ou erreur 401
5. **Error Handling** : Si 401, déconnexion automatique et redirection vers `/login`

### Protection des routes

1. **Navigation** : L'utilisateur tente d'accéder à une route protégée
2. **Guard** : Le `authGuard` vérifie si l'utilisateur est authentifié
3. **Check** : Vérification du Signal `isAuthenticated()`
4. **Autorisation** : Si authentifié → accès accordé, sinon → redirection `/login`
5. **Query Params** : L'URL demandée est stockée dans `returnUrl`

## 3. Structure des fichiers

```
front/src/app/
├── core/
│   ├── models/
│   │   ├── user-role.enum.ts           # Enum des rôles utilisateur
│   │   ├── user.model.ts                # Interface User
│   │   ├── login-request.model.ts       # Interface LoginRequest
│   │   ├── login-response.model.ts      # Interface LoginResponse
│   │   └── index.ts                     # Barrel export
│   ├── services/
│   │   └── auth.service.ts              # Service d'authentification avec Signals
│   ├── interceptors/
│   │   └── auth.interceptor.ts          # Intercepteur HTTP pour JWT
│   └── guards/
│       └── auth.guard.ts                # Guard de protection des routes
├── features/
│   ├── auth/
│   │   └── login/
│   │       ├── login.component.ts       # Composant de connexion
│   │       ├── login.component.html     # Template avec daisyUI
│   │       └── login.component.css      # Styles (vide, utilise daisyUI)
│   └── home/
│       ├── home.component.ts            # Page d'accueil protégée
│       ├── home.component.html          # Template avec navbar
│       └── home.component.css           # Styles (vide)
├── app.config.ts                        # Configuration providers
└── app.routes.ts                        # Configuration routing
```

## 4. Modèles de données

### UserRole Enum

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
```

### User Interface

```typescript
export interface User {
  id: string;
  username: string;
  role: UserRole;
}
```

### LoginRequest Interface

```typescript
export interface LoginRequest {
  username: string;
  password: string;
}
```

### LoginResponse Interface

```typescript
export interface LoginResponse {
  accessToken: string;
  user: User;
}
```

## 5. Service d'authentification

### Responsabilités

- Gestion de l'état d'authentification avec Signals
- Communication avec l'API backend
- Stockage et récupération du token dans localStorage
- Gestion de la connexion et déconnexion
- Gestion des erreurs d'authentification

### Signals exposés (readonly)

- `currentUser: Signal<User | null>` : L'utilisateur actuellement connecté
- `accessToken: Signal<string | null>` : Le token JWT
- `isAuthenticated: Signal<boolean>` : Statut de connexion (computed)

### Méthodes publiques

- `login(credentials: LoginRequest): Observable<LoginResponse>` : Connexion utilisateur
- `logout(): void` : Déconnexion utilisateur

### Gestion du stockage

- **Token** : `localStorage.setItem('alttrack_access_token', token)`
- **User** : `localStorage.setItem('alttrack_current_user', JSON.stringify(user))`
- **Récupération** : Au démarrage de l'application dans le constructeur
- **Suppression** : Lors de la déconnexion

### Gestion des erreurs

- **401 Unauthorized** : "Identifiants invalides. Veuillez réessayer."
- **0 Network Error** : "Impossible de contacter le serveur. Veuillez vérifier votre connexion."
- **Autres** : Message d'erreur du backend ou message générique

## 6. Intercepteur HTTP

### Fonctionnalité

L'intercepteur `authInterceptor` est une fonction (`HttpInterceptorFn`) qui intercepte automatiquement toutes les requêtes HTTP sortantes.

### Comportement

1. **Récupération du token** : Lecture du Signal `accessToken()`
2. **Ajout du header** : Si token présent → `Authorization: Bearer {token}`
3. **Propagation** : Transmission de la requête modifiée
4. **Gestion erreur 401** : Si réponse 401 et pas endpoint login → déconnexion + redirection

### Configuration

```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

## 7. Guard d'authentification

### Fonctionnalité

Le `authGuard` est une fonction (`CanActivateFn`) qui protège les routes nécessitant une authentification.

### Comportement

1. **Vérification** : Lecture du Signal `isAuthenticated()`
2. **Autorisation** : Si authentifié → `return true`
3. **Redirection** : Si non authentifié → navigation vers `/login`
4. **Query Params** : Sauvegarde de l'URL demandée dans `returnUrl`

### Utilisation dans les routes

```typescript
{
  path: '',
  component: HomeComponent,
  canActivate: [authGuard],
}
```

## 8. Composant Login

### Fonctionnalités

- Formulaire réactif avec validation
- Affichage des erreurs en temps réel
- Loading state pendant la connexion
- Feedback visuel avec daisyUI
- Redirection après connexion réussie
- Affichage des credentials de test

### Validation des champs

- **username** : Requis, minimum 3 caractères
- **password** : Requis, minimum 3 caractères

### Gestion de la soumission

1. Vérification de la validité du formulaire
2. Activation du loading state
3. Appel à `authService.login()`
4. En cas de succès : récupération de `returnUrl` et redirection
5. En cas d'erreur : affichage du message d'erreur

### Design daisyUI

- **Card** : Conteneur principal centré
- **Input** : Champs stylisés avec `input-bordered`
- **Button** : Bouton primaire avec spinner de loading
- **Alert** : Affichage des erreurs en rouge
- **Divider** : Séparation visuelle
- **Info Alert** : Credentials de test affichés

## 9. Composant Home

### Fonctionnalités

- Page d'accueil protégée par le guard
- Navbar avec dropdown utilisateur
- Affichage des informations utilisateur
- Bouton de déconnexion
- Design responsive avec daisyUI

### Éléments d'interface

- **Navbar** : Barre de navigation avec avatar utilisateur
- **Dropdown** : Menu avec profil, paramètres, déconnexion
- **Hero** : Section d'accueil centrée
- **Stats** : Affichage des informations utilisateur

## 10. Configuration du routing

### Routes définies

- `/login` : Page de connexion (publique)
- `/` : Page d'accueil (protégée par authGuard)
- `/**` : Redirection vers `/`

### Stratégie

- Routes standalone avec imports directs
- Protection via `canActivate: [authGuard]`
- Redirection automatique des routes inconnues

## 11. Stratégies de test

### Tests unitaires du service

**AuthService** :
- `login()` : Vérifier l'appel HTTP et la mise à jour des Signals
- `logout()` : Vérifier la suppression des données et la redirection
- `loadAuthenticationStateFromStorage()` : Vérifier la récupération du state
- Gestion des erreurs : Tester différents codes d'erreur HTTP

### Tests du guard

**authGuard** :
- Utilisateur authentifié : Vérifier que `canActivate` retourne `true`
- Utilisateur non authentifié : Vérifier la redirection vers `/login`
- Query params : Vérifier que `returnUrl` est bien passé

### Tests du composant Login

**LoginComponent** :
- Validation du formulaire : Champs requis, longueur minimale
- Soumission : Vérifier l'appel à `authService.login()`
- Redirection : Vérifier la navigation après succès
- Affichage des erreurs : Vérifier les messages d'erreur

### Tests E2E

- Connexion avec credentials valides → accès à la page d'accueil
- Connexion avec credentials invalides → message d'erreur
- Accès à une route protégée sans authentification → redirection login
- Déconnexion → suppression du token et redirection

## 12. Contraintes techniques

### Dépendances Angular

- `@angular/common` : HttpClient, CommonModule
- `@angular/forms` : ReactiveFormsModule, FormBuilder
- `@angular/router` : Router, CanActivateFn
- `@angular/core` : Signals, inject, Injectable

### Configuration requise

- **Backend URL** : `http://localhost:3000` (configurable dans AuthService)
- **Endpoint login** : `POST /auth/login`
- **Token storage** : localStorage avec clés `alttrack_access_token` et `alttrack_current_user`

### Variables de configuration

Actuellement hardcodées dans `AuthService`, futures améliorations :
- Utiliser environment files pour l'URL de l'API
- Configurer la clé de stockage du token
- Configurer le timeout des requêtes

## 13. Sécurité

### Bonnes pratiques implémentées

- ✅ Le token n'est jamais loggé en console
- ✅ Le mot de passe n'est jamais stocké localement
- ✅ Validation des inputs côté client
- ✅ Gestion automatique de l'expiration (401 → logout)
- ✅ Intercepteur global pour toutes les requêtes
- ✅ Protection des routes sensibles avec guard

### Points d'attention

- ⚠️ localStorage est accessible via JavaScript (risque XSS)
- ⚠️ Pas de validation de l'expiration du token côté frontend
- ⚠️ Pas de refresh token implémenté

### Recommandations futures

- Implémenter la vérification de l'expiration du token
- Ajouter un système de refresh token
- Considérer sessionStorage au lieu de localStorage
- Implémenter Content Security Policy (CSP)
- Ajouter un timeout d'inactivité

## 14. Améliorations futures

### Système de refresh token

- Stockage séparé du refresh token
- Endpoint `/auth/refresh` côté backend
- Intercepteur pour rafraîchir automatiquement le token expiré
- Gestion de la file d'attente des requêtes pendant le refresh

### Remember me

- Option "Se souvenir de moi" sur le formulaire de login
- Utilisation de localStorage si activé, sinon sessionStorage
- Expiration configurable du token

### Récupération de mot de passe

- Nouveau composant "Mot de passe oublié"
- Endpoint backend pour réinitialisation
- Email de récupération avec token temporaire

### Double authentification (2FA)

- Activation optionnelle par utilisateur
- QR Code pour configuration TOTP
- Input pour code à 6 chiffres sur le login
- Codes de récupération

### Gestion des sessions multiples

- Liste des sessions actives dans le profil
- Possibilité de déconnecter d'autres appareils
- Affichage des informations de connexion (IP, date, navigateur)

### Amélioration UX

- Animation de transition entre login et home
- Toast notifications pour feedback utilisateur
- Mode sombre/clair avec persistence
- Chargement optimiste des données utilisateur

## 15. Conformité avec les instructions

### Principes respectés

- ✅ **Architecture Clean** : Séparation claire des responsabilités
- ✅ **SOLID** : Single Responsibility, Dependency Injection
- ✅ **KISS** : Code simple et maintenable
- ✅ **Signals** : Utilisation maximale des Signals Angular
- ✅ **daisyUI** : Exclusivement pour le style
- ✅ **Standalone Components** : Nouvelle syntaxe Angular
- ✅ **No Comments** : Code auto-documenté par des noms explicites

### Noms explicites

- `AuthService` : Service clair et descriptif
- `authInterceptor` : Fonction intercepteur HTTP
- `authGuard` : Guard de protection des routes
- `LoginComponent` : Composant de connexion
- `currentUserSignal` : Signal de l'utilisateur actuel
- `handleAuthenticationSuccess` : Méthode explicite

## 16. Intégration avec le backend

### Endpoint utilisé

- **URL** : `POST http://localhost:3000/auth/login`
- **Body** : `{ username: string, password: string }`
- **Response** : `{ accessToken: string, user: { id, username, role } }`
- **Header** : `Content-Type: application/json`

### Token JWT

- **Format** : Bearer token dans header `Authorization`
- **Validation** : Automatique côté backend via `JwtAuthGuard`
- **Expiration** : 24h par défaut (gérée côté backend)

### Synchronisation des types

Les interfaces TypeScript frontend correspondent exactement aux DTOs backend :
- `LoginRequest` ↔ `LoginInputDto`
- `LoginResponse` ↔ `LoginOutputDto`
- `User` ↔ `User` (partial)
- `UserRole` ↔ `UserRole` (enum Prisma)

## 17. Guide d'utilisation

### Pour se connecter

1. Ouvrir l'application : `http://localhost:4200`
2. Si non authentifié, redirection automatique vers `/login`
3. Entrer les credentials de test : `ggez` / `ggez`
4. Cliquer sur "Se connecter"
5. Redirection vers la page d'accueil

### Pour se déconnecter

1. Cliquer sur l'avatar en haut à droite
2. Sélectionner "Déconnexion"
3. Redirection vers `/login`

### Persistance de la session

La session est automatiquement restaurée au rechargement de la page grâce au localStorage.

---

**Version** : 1.0.0  
**Date** : 18/11/2024  
**Auteur** : AltTrack Team  
**Frontend Framework** : Angular 19.2.0  
**UI Library** : daisyUI 5.5.5

