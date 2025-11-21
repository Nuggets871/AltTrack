# Système de Logging Professionnel

## Vue d'ensemble

Le système de logging a été implémenté de manière professionnelle pour faciliter le debugging et le monitoring de l'application.

## Structure des fichiers

### Frontend
```
front/src/app/
├── shared/
│   ├── utils/
│   │   └── logger.util.ts                    # Utilitaire de logging avec niveaux
│   └── components/
│       └── lottie-icon/
│           ├── lottie-icon.component.ts       # Composant principal
│           ├── lottie-icon.config.ts          # Configuration
│           ├── lottie-animation.manager.ts    # Gestionnaire d'animations
│           └── index.ts                       # Exports
└── core/
    └── services/
        └── lordicon.service.ts                # Service API avec logging
```

### Backend
```
back/src/
└── assets/
    ├── assets.module.ts                       # Module NestJS
    ├── assets.controller.ts                   # Contrôleur HTTP
    └── assets.service.ts                      # Service métier
```

## Niveaux de logging

### DEBUG (Gris)
- **Usage**: Informations détaillées pour le debugging
- **Exemple**: Nettoyage du conteneur, paramètres de configuration
- **Visibilité**: Uniquement en développement

### INFO (Bleu)
- **Usage**: Informations importantes sur le flux d'exécution
- **Exemple**: Chargement d'icône, animation réussie
- **Visibilité**: Développement et production

### WARN (Orange)
- **Usage**: Situations anormales mais non critiques
- **Exemple**: Conteneur non prêt, animation manquante
- **Visibilité**: Développement et production

### ERROR (Rouge)
- **Usage**: Erreurs nécessitant une attention
- **Exemple**: Échec de chargement, erreur HTTP
- **Visibilité**: Développement et production

## Utilisation

### Dans un composant
```typescript
import { Logger } from '@shared/utils/logger.util';

export class MyComponent {
  private static readonly CONTEXT = 'MyComponent';

  ngOnInit(): void {
    Logger.info(MyComponent.CONTEXT, 'Initialisation du composant');
    Logger.debug(MyComponent.CONTEXT, 'Données chargées', { data });
  }

  handleError(error: Error): void {
    Logger.error(MyComponent.CONTEXT, 'Erreur lors du traitement', { error });
  }
}
```

### Dans un service
```typescript
import { Logger } from '@shared/utils/logger.util';

@Injectable()
export class MyService {
  private static readonly CONTEXT = 'MyService';

  getData(): Observable<any> {
    Logger.debug(MyService.CONTEXT, 'Requête API démarrée');
    return this.http.get(url).pipe(
      tap(() => Logger.info(MyService.CONTEXT, 'Données reçues')),
      catchError(err => {
        Logger.error(MyService.CONTEXT, 'Erreur API', err);
        return throwError(() => err);
      })
    );
  }
}
```

## Exemple de logs dans la console

```
[2025-11-21T10:30:15.123Z] [INFO] [LottieIconComponent] Chargement de l'icône: sun
[2025-11-21T10:30:15.125Z] [DEBUG] [LottieIconComponent] Conteneur nettoyé
[2025-11-21T10:30:15.130Z] [DEBUG] [LordiconService] Requête pour l'icône: sun
[2025-11-21T10:30:15.245Z] [INFO] [LordiconService] Icône récupérée avec succès: sun
[2025-11-21T10:30:15.250Z] [INFO] [LottieIconComponent] Données d'animation reçues pour: sun
[2025-11-21T10:30:15.255Z] [DEBUG] [LottieIconComponent] Rendu de l'animation Lottie
[2025-11-21T10:30:15.280Z] [INFO] [LottieIconComponent] Animation sun chargée avec succès
```

## Avantages

✅ **Contexte clair**: Chaque log indique son origine
✅ **Horodatage précis**: Tracking temporel des événements
✅ **Couleurs distinctives**: Identification rapide du niveau
✅ **Données structurées**: Objets loggés pour inspection
✅ **Production-ready**: Logs DEBUG désactivés en production
✅ **Debugging facilité**: Suivi complet du flux d'exécution

## Séparation des responsabilités

### LottieIconComponent
- Gestion du cycle de vie Angular
- Validation des inputs
- Orchestration du chargement

### LottieAnimationManager
- Contrôle de l'animation (play, pause, stop, replay)
- Gestion de l'instance Lottie
- Destruction propre

### LordiconService
- Communication HTTP avec le backend
- Gestion des erreurs réseau
- Logging des requêtes API

### Logger Utility
- Centralisation du logging
- Formatage cohérent
- Gestion des niveaux de log

