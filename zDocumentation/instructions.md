# Description du projet
Je veux créer une application complète de suivi d’alternance permettant d’enregistrer mes notes quotidiennes, mes tickets, mes difficultés, mes progrès et d’obtenir une vision globale de mon année. L’application doit gérer un calendrier intelligent capable de déterminer automatiquement les jours d’école, d’entreprise et de vacances en fonction d’un notebook d’alternance défini par l’utilisateur. Chaque utilisateur doit pouvoir créer un ou plusieurs notebooks avec une date de début, une date de fin ou une durée, une localisation pour connaître les vacances scolaires, un pattern d’alternance (école ou entreprise par jour), des overrides manuels et des règles spéciales comme le passage en full école ou full entreprise à partir d’une date donnée. L’application doit afficher une page quotidienne intelligente qui reconnaît automatiquement la date actuelle, identifie dans quelle semaine se trouve l’utilisateur et si c’est un jour d’école ou d’entreprise. Cette page doit permettre de prendre
des notes en markdown et d’associer des travaux ou tickets. Ces travaux doivent être personnalisables via des types de travaux définis par l’utilisateur (tickets, missions, cours, etc) avec des champs personnalisés (texte, date, nombre, liste, tags, difficulté, commentaire, temps passé, etc). L’application doit proposer une vue globale avec statistiques, analyses, graphiques simples, répartition par type, affichage du calendrier, résumé des semaines, ainsi qu’une vue gantt des travaux. L’application doit être réutilisable par n’importe qui, permettre plusieurs notebooks, être extensible, professionnelle et structurée proprement.

# Stack technique
Le front est en Angular avec la nouvelle syntaxe à base de @, l'utilisation maximale des Signals et DaisyUI (voir le fichier daisyUI_instructions_llms.md) pour tout le style. DaisyUI est complété par lineicons pour les icônes de base et lordicon pour les icônes animées plus "fancy". Le back est construit en NestJS avec Prisma et une base MySQL. L'architecture backend suit un modèle clair basé sur controller, usecase, service et repository. Prisma doit être utilisé avec un transactionManager pour les opérations critiques. Un système d'authentification avec JWT doit être intégré. Un script de seed doit créer un utilisateur administrateur avec le pseudo ggez et le mot de passe ggez, le mot de passe doit être hashé. À la racine du projet, un dossier /documentation doit contenir un fichier markdown par feature pour expliquer techniquement et professionnellement son fonctionnement.

# Instructions importantes
Le projet doit respecter strictement les principes SOLID, KISS, Clean Architecture et DDD light. Les commentaires sont interdits sauf en cas d’extrême nécessité. Le code doit utiliser uniquement la nouvelle syntaxe Angular avec les décorateurs @ et utiliser les Signals dès qu’ils apportent un avantage. Les noms de fichiers, de classes, de méthodes, de variables et de dossiers doivent être explicites, précis et aussi longs que nécessaire pour éliminer toute ambiguïté. Au niveau du backend, toute fonctionnalité doit suivre une architecture claire : un controller gère les routes et redirige vers un usecase, un usecase correspond toujours à une seule action et ne doit contenir que la logique spécifique à cette action, un service contient la logique métier réutilisable entre plusieurs usecases, un repository contient toutes les interactions Prisma avec la base. Une classe abstraite UseCase doit exister et regrouper un système de transactionManager qui sera utilisé par tous les usecases.
Toutes les opérations nécessitant une cohérence doivent être faites en transaction. Après chaque modification, un typecheck doit être exécuté automatiquement ou sur commande. Dans le front, toute donnée réutilisable doit transiter par un service et un state (Signal) afin de garder une architecture claire. Le style doit être exclusivement basé sur DaisyUI. Les commentaires dans le code sont interdits sauf pour des cas absolument nécessaires liés à la sécurité ou à des limitations techniques. Le dossier /documentation doit contenir un fichier technique par feature, structuré de manière professionnelle et orienté développement. A la fin de chaque ajout, lance le script de typecheck afin de bien s'assurer que tout est correct.
Dès qu'une action dans le front requiert un appel au backend, un indicateur de chargement doit obligatoirement être affiché à l'utilisateur : soit un Loading (spinner), soit un Skeleton de DaisyUI correspondant au composant attendu, afin d'assurer une bonne expérience utilisateur et de clarifier l'état de l'application.
L'application doit être totalement responsive et s'adapter parfaitement à tous les appareils (mobile, tablet, desktop) en utilisant les classes Tailwind CSS responsive (sm:, md:, lg:, xl:, 2xl:).

# Fonctionnalités à réaliser
## 1. Mise en place du système d’authentification JWT

- Implémenter un module d’auth complet incluant login, validation du token, rafraîchissement éventuel, et middleware/guard NestJS.
- Création d’un endpoint de login acceptant pseudo + mot de passe.
- Vérification du mot de passe hashé via Prisma et bcrypt.
- Génération d’un JWT signé contenant l’ID utilisateur + rôle + données essentielles.
- Utilisation d’un AuthGuard côté API pour sécuriser toutes les routes internes.
- Mise en place d’un système de rôle (exemple : admin, user).
- Création d’un script de seed générant un utilisateur admin : pseudo « ggez », mot de passe « ggez » (hashé).
- Stockage sécurisé de la clé JWT dans les variables d’environnement.

## 2. Création du système de notebooks d’alternance

- Développer une entité Notebook avec les champs : nom, date de début, date de fin (ou durée), localisation, paramètres d’alternance.
- Permettre la création de notebooks multiples par utilisateur.
- Gestion d’une configuration avancée :
  - pattern hebdomadaire (jour par jour : école/entreprise/autre),
  - règles spéciales comme “full école” ou “full entreprise” à partir d’une date,
  - périodes spéciales répétées,
  - overrides permettant de modifier n’importe quel jour.
- Validation poussée des données (cohérence dates, patterns valides, absence de conflits entre règles).
- Endpoints CRUD complets.

## 3. Génération automatique du calendrier intelligent

- À partir d’un Notebook, générer dynamiquement chaque jour avec un typage automatique : école, entreprise, vacances, override appliqué.
- Calculer et stocker le numéro de semaine relatif au début du notebook.
- Intégration des vacances selon la localisation (données récupérées ou préconfigurées).
- Gestion des règles spéciales : basculement automatique en full école/entreprise dès une date donnée.
- Application d’overrides avec priorité maximale.
- Mise en cache ou pré-calcul pour performances optimales.
- Endpoints pour :
  - récupérer un mois, une semaine, une période,
  - rafraîchir le calendrier si la config est modifiée,
  - obtenir le jour actuel avec tous les détails.

## 4. Implémentation du système de notes quotidiennes markdown

- Création d’une entité DailyNote : date, contenu markdown, notebookId, userId.
- Un seul contenu par jour et par notebook.
- Éditeur markdown dans le front (avec rendu temps réel).
- Fonctionnalités de sauvegarde automatique (debounce + signal).
- Historique minimal ou versionnage optionnel.
- Endpoints CRUD complets.

## 5. Création du système de travaux personnalisables

- Système de WorkItemType permettant de définir des types de travaux (ex : ticket, mission, cours).
- Chaque type peut contenir des champs personnalisés : texte, nombre, date, booléen, tag, liste déroulante, durée, difficulté.
- Implémentation d’une entité WorkItem utilisant ces types dynamiques.
- Gestion des champs dynamiques via un modèle clé → valeur, liés aux définitions de champs.
- Association d’un WorkItem à une ou plusieurs dates du calendrier.
- Gestion des dates de début et de fin pour une future vue gantt.
- Endpoints permettant de créer, éditer, supprimer et lister les WorkItems avec leurs champs dynamiques.

## 6. Ajout de la vue calendrier complète

- Vue mensuelle/hebdomadaire avec couleurs selon type de jour.
- Affichage des travaux du jour sous forme de badges ou étiquettes.
- Navigation mois ⇄ mois et semaine ⇄ semaine.
- Basée uniquement sur DaisyUI et Signals Angular.
- Optimisations visuelles : transitions douces, affichage responsive, prise en charge mobile.
- Endpoint permettant de récupérer le calendrier d’une période donnée.

## 7. Développement du tableau de bord et statistiques

- Création d’une vue globale récapitulative du notebook :
  - total des jours école/entreprise,
  - total de notes, total de travaux,
  - répartition par type de travaux,
  - temps passé (si champ défini),
  - difficulté moyenne,
  - graphiques simples basés sur des divs/daisyUI (pas de libs externes si possible).
- Filtrage par période, par type, par tag, par difficulté.
- Endpoints pour calculer les statistiques.

## 8. Implémentation de la vue Gantt des travaux

- Affichage d’une timeline des WorkItems selon leur date de début et date de fin.
- Utilisation de composants DaisyUI (cartes, badges, barres horizontales).
- Gestion du scroll horizontal, de la sélection d’une période, du zoom éventuel.
- Filtrage par type de travail, tag ou difficulté.
- Endpoint pour récupérer tous les WorkItems d’un notebook avec plages temporelles.

## 9. Conception de la page quotidienne intelligente

- Détermination automatique du jour actuel à l’ouverture.
- Affichage du type de jour (école/entreprise/vacances), de la semaine relative, et résumé des règles actives.
- Affichage en direct de la note markdown.
- Affichage des travaux associés au jour.
- Liens rapides : créer un travail, passer au jour précédent/suivant, revenir à aujourd’hui.
- Composants full Signals avec states persistés.

## 10. Gestion multi-notebooks

- Interface permettant de gérer plusieurs notebooks.
- Sélection active stockée en Signal global.
- Permissions par user.
- Endpoints pour tout gérer proprement.
- Mise en place d’un routeur Angular multi-contextes (notebookId dans le path).

## 11. Création de la documentation technique professionnelle

- À la racine du projet, créer un dossier /documentation.
- Produire un fichier markdown par feature.
- Chaque fichier doit contenir :
  - objectif technique,
  - architecture générale,
  - schéma des entités,
  - usecases concernés,
  - endpoints,
  - stratégies de test,
  - contraintes techniques,
  - détails spécifiques backend et frontend.
- Documentation de niveau professionnel, exhaustive, propre et claire.
