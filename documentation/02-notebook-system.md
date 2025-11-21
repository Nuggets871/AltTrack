# Système de Notebooks d'Alternance

## Objectif Technique

Le système de notebooks d'alternance permet aux utilisateurs de créer et gérer plusieurs carnets d'apprentissage pour suivre leur alternance. Chaque notebook contient une configuration détaillée incluant un pattern hebdomadaire, des règles spéciales, des exceptions et des périodes personnalisées. Ce système constitue la base pour la génération du calendrier intelligent (fonctionnalité 3).

## Architecture Générale

L'implémentation suit une architecture en couches conforme aux principes SOLID et Clean Architecture:

**Backend (NestJS + Prisma)**
- **Presentation Layer**: `NotebookController` gère les routes REST
- **Application Layer**: UseCases (Create, Update, Delete, GetById, GetByUser)
- **Domain Layer**: `NotebookService` contient la logique métier de validation
- **Infrastructure Layer**: `NotebookRepository` gère les interactions Prisma

**Frontend (Angular + Signals)**
- **Services**: `NotebookService` avec gestion d'état via Signals
- **Components**: NotebookList, NotebookForm, NotebookDetail
- **Models**: Interfaces TypeScript reflétant les entités backend

## Schéma des Entités Prisma

### Notebook
```prisma
model Notebook {
  id              String             @id @default(cuid())
  name            String
  startDate       DateTime
  endDate         DateTime?
  durationInWeeks Int?
  locationZone    String
  weekPatternJson Json
  userId          String
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialRules    SpecialRule[]
  overrides       NotebookOverride[]
  specialPeriods  SpecialPeriod[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}
```

### SpecialRule
Règles spéciales permettant le basculement en "full école" ou "full entreprise" à partir d'une date donnée.

```prisma
model SpecialRule {
  id         String          @id @default(cuid())
  type       SpecialRuleType
  startDate  DateTime
  notebookId String
  notebook   Notebook        @relation(fields: [notebookId], references: [id], onDelete: Cascade)
}

enum SpecialRuleType {
  FULL_SCHOOL
  FULL_COMPANY
}
```

### NotebookOverride
Exceptions permettant de modifier le type d'un jour spécifique, avec priorité maximale sur toutes les autres règles.

```prisma
model NotebookOverride {
  id         String   @id @default(cuid())
  date       DateTime
  dayType    DayType
  notebookId String
  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  
  @@unique([notebookId, date])
}
```

### SpecialPeriod
Périodes spéciales définissant un type de jour particulier sur une plage de dates (ex: stage intensif, semaine bloquée).

```prisma
model SpecialPeriod {
  id         String   @id @default(cuid())
  name       String
  startDate  DateTime
  endDate    DateTime
  type       DayType
  notebookId String
  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
}
```

### SchoolHoliday
Table pré-remplie des vacances scolaires françaises par zone (A, B, C) pour 2024-2026.

```prisma
model SchoolHoliday {
  id                String   @id @default(cuid())
  zone              String
  name              String
  startDate         DateTime
  endDate           DateTime
  isNationalHoliday Boolean  @default(false)
  
  @@index([zone, startDate, endDate])
}

enum DayType {
  SCHOOL
  COMPANY
  OFF
}
```

## UseCases Implémentés

### CreateNotebookUseCase
- **Input**: CreateNotebookInputDto + userId
- **Output**: NotebookOutputDto
- **Logique**: 
  1. Validation complète via `NotebookService.validateNotebookData()`
  2. Création en transaction avec toutes les relations
  3. Retour du notebook créé avec relations incluses

### UpdateNotebookUseCase
- **Input**: UpdateNotebookInputDto + notebookId + userId
- **Output**: NotebookOutputDto
- **Logique**:
  1. Vérification existence + permissions
  2. Fusion des données existantes avec les modifications
  3. Validation complète des données fusionnées
  4. Suppression puis recréation des relations modifiées
  5. Update en transaction

### DeleteNotebookUseCase
- **Input**: notebookId + userId
- **Output**: void
- **Logique**:
  1. Vérification existence + permissions
  2. Suppression en cascade (Prisma gère les relations)

### GetNotebooksByUserUseCase
- **Input**: userId
- **Output**: NotebookOutputDto[]
- **Logique**: Récupération de tous les notebooks de l'utilisateur avec relations, triés par date de création DESC

### GetNotebookByIdUseCase
- **Input**: notebookId + userId
- **Output**: NotebookOutputDto
- **Logique**: Récupération d'un notebook spécifique avec vérification des permissions

## Endpoints REST

### POST /notebooks
Création d'un nouveau notebook
```json
{
  "name": "Mon Alternance 2024-2025",
  "startDate": "2024-09-01",
  "endDate": "2025-08-31",
  "locationZone": "A",
  "weekPatternJson": ["SCHOOL", "SCHOOL", "COMPANY", "COMPANY", "COMPANY", "OFF", "OFF"],
  "specialRules": [
    {
      "type": "FULL_COMPANY",
      "startDate": "2025-05-01"
    }
  ],
  "overrides": [
    {
      "date": "2024-12-25",
      "dayType": "OFF"
    }
  ],
  "specialPeriods": [
    {
      "name": "Stage intensif",
      "startDate": "2025-03-01",
      "endDate": "2025-03-15",
      "type": "COMPANY"
    }
  ]
}
```

### GET /notebooks
Liste tous les notebooks de l'utilisateur connecté

### GET /notebooks/:id
Récupère un notebook spécifique avec toutes ses relations

### PUT /notebooks/:id
Met à jour un notebook (tous les champs optionnels)

### DELETE /notebooks/:id
Supprime un notebook et toutes ses relations

## Structure du weekPatternJson

Le `weekPatternJson` est un tableau de 7 éléments (lundi à dimanche) contenant des valeurs `DayType`:
```typescript
["SCHOOL", "SCHOOL", "COMPANY", "COMPANY", "COMPANY", "OFF", "OFF"]
// Index 0 = Lundi, Index 6 = Dimanche
```

Valeurs possibles:
- `SCHOOL`: Jour d'école/formation
- `COMPANY`: Jour en entreprise
- `OFF`: Jour de repos

## Logique de Validation

Le `NotebookService` effectue une validation immédiate et exhaustive:

### Validation du weekPattern
- Doit être un array de 7 éléments
- Chaque élément doit être un DayType valide

### Validation des dates
- startDate requis
- Soit endDate soit durationInWeeks requis (pas les deux)
- startDate < endDate si endDate fourni
- durationInWeeks > 0 si fourni

### Validation de la locationZone
- La zone doit exister dans la table SchoolHoliday
- Zones disponibles: A, B, C

### Validation des SpecialRules
- Type valide (FULL_SCHOOL ou FULL_COMPANY)
- startDate dans la plage du notebook
- Pas de règles consécutives du même type

### Validation des Overrides
- dayType valide
- date dans la plage du notebook
- Pas de dates dupliquées

### Validation des SpecialPeriods
- type valide
- startDate < endDate
- Plage comprise dans le notebook

## Détails Frontend

### NotebookService (Angular)
Gestion d'état centralisée avec Signals:
```typescript
private notebooksSignal = signal<Notebook[]>([]);
private selectedNotebookSignal = signal<Notebook | null>(null);
private loadingSignal = signal<boolean>(false);
private errorSignal = signal<string | null>(null);

readonly notebooks = this.notebooksSignal.asReadonly();
readonly hasNotebooks = computed(() => this.notebooksSignal().length > 0);
```

### NotebookListComponent
- Affichage responsive en grille (1/2/3 colonnes selon taille d'écran)
- Skeleton loading pendant les chargements
- Modal pour la création de notebook
- Badges affichant le nombre de règles/exceptions

### NotebookFormComponent
- Formulaire réactif avec validation
- Interface visuelle pour le weekPattern (boutons cliquables)
- Sections repliables (collapse) pour la config avancée
- FormArrays pour les règles/exceptions/périodes dynamiques

### NotebookDetailComponent
- Affichage complet des informations du notebook
- Grille responsive pour les sections
- Pattern hebdomadaire visuel avec emojis
- Liste des règles et exceptions groupées

## Responsive Design

Tous les composants utilisent les classes Tailwind responsive:
- Mobile (défaut): 1 colonne, navigation simplifiée
- Tablet (md:): 2 colonnes pour les grilles
- Desktop (lg:): 3 colonnes, espacements augmentés

## Stratégies de Test

### Tests Backend (à implémenter)
- Tests unitaires des services de validation
- Tests d'intégration des repositories
- Tests E2E des endpoints avec authentification

### Tests Frontend (à implémenter)
- Tests unitaires des services avec Signals
- Tests de composants avec TestBed
- Tests E2E avec Cypress

## Contraintes Techniques

### Backend
- Toutes les opérations de création/modification en transaction
- Validation immédiate avant persistance
- Soft delete non implémenté (cascade delete)
- JWT requis sur tous les endpoints

### Frontend
- HttpClient avec interceptor d'authentification
- Gestion des erreurs centralisée dans le service
- Loading states obligatoires pour toutes les opérations async
- Aucune dépendance externe (DaisyUI uniquement)

## Évolutions Futures

- Import/Export de notebooks en JSON
- Templates de notebooks pré-configurés
- Duplication de notebooks
- Partage de notebooks entre utilisateurs
- Notifications de conflits de dates
- Vue calendrier intégrée (fonctionnalité 3)

