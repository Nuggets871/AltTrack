# 🎨 Composant Shared LottieIcon - Documentation

## Date : 20/11/2025

---

## 📦 Vue d'ensemble

Composant Angular standalone réutilisable pour afficher des animations Lottie (JSON).
Utilise `lottie-web` et charge les animations depuis le backend via le service `LordiconService`.

---

## 🏗️ Architecture

### Structure des fichiers

```
front/src/app/
├── shared/
│   └── components/
│       ├── index.ts                      # Export du composant
│       └── lottie-icon/
│           ├── index.ts                  # Re-export
│           └── lottie-icon.component.ts  # Composant principal
```

### Alias TypeScript

```json
{
  "@shared/*": ["app/shared/*"]
}
```

**Import** :
```typescript
import { LottieIconComponent } from '@shared/components/lottie-icon';
```

---

## 🎯 Fonctionnalités

### Inputs

| Input | Type | Défaut | Description |
|-------|------|--------|-------------|
| `iconName` | `string` | `''` | Nom de l'icône à charger (ex: 'sun', 'moon') |
| `width` | `number` | `24` | Largeur en pixels |
| `height` | `number` | `24` | Hauteur en pixels |
| `loop` | `boolean` | `false` | Lecture en boucle |
| `autoplay` | `boolean` | `false` | Lecture automatique au chargement |

### Méthodes publiques

| Méthode | Description |
|---------|-------------|
| `play()` | Lance l'animation |
| `stop()` | Arrête et revient au début |
| `pause()` | Met en pause |
| `replay()` | Rejoue depuis le début |

---

## 💻 Utilisation

### Exemple de base

```html
<app-lottie-icon
  iconName="sun"
  [width]="32"
  [height]="32"
  [loop]="false"
  [autoplay]="false">
</app-lottie-icon>
```

### Avec ViewChild et contrôle manuel

```typescript
import { Component, ViewChild } from '@angular/core';
import { LottieIconComponent } from '@shared/components/lottie-icon';

@Component({
  template: `
    <app-lottie-icon
      #myIcon
      iconName="sun"
      [width]="24"
      [height]="24">
    </app-lottie-icon>
    <button (click)="playIcon()">Play</button>
  `
})
export class MyComponent {
  @ViewChild('myIcon') icon?: LottieIconComponent;

  playIcon() {
    this.icon?.play();
  }
}
```

### Dans les composants login et register

```html
<div class="fixed top-4 right-4 sm:top-8 sm:right-8 z-50">
  <label class="flex cursor-pointer gap-2 sm:gap-3 items-center">
    <app-lottie-icon
      #sunIcon
      iconName="sun"
      [width]="24"
      [height]="24"
      [loop]="false"
      [autoplay]="false"
      class="cursor-pointer">
    </app-lottie-icon>
    
    <input
      type="checkbox"
      class="toggle"
      [checked]="isDarkMode()"
      (change)="onThemeChange($event)" />
    
    <app-lottie-icon
      #moonIcon
      iconName="moon"
      [width]="24"
      [height]="24"
      [loop]="false"
      [autoplay]="false"
      class="cursor-pointer">
    </app-lottie-icon>
  </label>
</div>
```

```typescript
@Component({...})
export class LoginComponent {
  @ViewChild('sunIcon') sunIcon?: LottieIconComponent;
  @ViewChild('moonIcon') moonIcon?: LottieIconComponent;

  private triggerLordiconAnimation(): void {
    this.sunIcon?.play();
    this.moonIcon?.play();
  }

  protected onThemeChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isDark = checkbox.checked;
    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
    this.triggerLordiconAnimation(); // Déclenche l'animation
  }
}
```

---

## 🔄 Workflow de chargement

```
1. Component init
       ↓
2. ngAfterViewInit()
       ↓
3. loadAnimation()
       ↓
4. LordiconService.getLordiconData(iconName)
       ↓
5. Backend: GET /assets/lordicons/:iconName
       ↓
6. Response: JSON Lottie data
       ↓
7. lottie.loadAnimation(animationData)
       ↓
8. Animation prête ✓
```

---

## 🎨 Personnalisation CSS

Le composant expose une classe `.lottie-container` :

```css
/* Styles dans le composant */
:host {
  display: inline-block;
}

.lottie-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Personnalisation externe** :

```css
app-lottie-icon {
  border-radius: 50%;
  background: rgba(0,0,0,0.1);
  padding: 8px;
}
```

---

## 📦 Dépendances

### NPM Packages

```json
{
  "dependencies": {
    "lottie-web": "^5.x.x"
  }
}
```

### Installation

```bash
npm install lottie-web --save
```

---

## 🔧 Configuration

### Import dans un composant standalone

```typescript
import { LottieIconComponent } from '@shared/components/lottie-icon';

@Component({
  imports: [LottieIconComponent], // Ajouter ici
  // ...
})
```

### Pas besoin de module global

Le composant est **standalone**, donc :
- ✅ Pas besoin de `NgModule`
- ✅ Import direct dans les composants
- ✅ Tree-shakeable

---

## 🐛 Gestion des erreurs

### Console warnings

```typescript
// Si iconName ou container manquant
console.warn('Impossible de charger l\'animation - iconName ou container manquant');

// Si erreur de chargement
console.error('❌ Erreur Lottie - iconName:', this.iconName, 'Erreur:', error);

// Si erreur d'initialisation Lottie
console.error('❌ Erreur lors du chargement de l\'animation Lottie:', error);
```

---

## ⚡ Performance

### Optimisations intégrées

1. **Lazy loading** : Les animations sont chargées uniquement quand nécessaire
2. **Cleanup** : `ngOnDestroy()` détruit proprement l'instance Lottie
3. **Progressive load** : `rendererSettings.progressiveLoad: true`
4. **Aspect ratio** : `preserveAspectRatio: 'xMidYMid meet'`
5. **Délai d'initialisation** : `setTimeout(50ms)` pour éviter les conflits de lifecycle

---

## 🆚 Comparaison avec l'ancienne approche

### ❌ Avant (lord-icon)

```html
<lord-icon
  #sunIcon
  src="assets/lordicons/sun.json"
  trigger="morph">
</lord-icon>
```

**Problèmes** :
- ❌ Fichiers exposés publiquement
- ❌ Dépendance à `@lordicon/element`
- ❌ CUSTOM_ELEMENTS_SCHEMA requis
- ❌ Gestion manuelle des Blob URLs
- ❌ Code complexe dans chaque composant

### ✅ Après (LottieIconComponent)

```html
<app-lottie-icon
  #sunIcon
  iconName="sun"
  [width]="24"
  [height]="24">
</app-lottie-icon>
```

**Avantages** :
- ✅ Fichiers sécurisés dans le backend
- ✅ Composant réutilisable
- ✅ API propre et simple
- ✅ TypeScript complet
- ✅ Moins de code dans les composants
- ✅ Gestion automatique du lifecycle

---

## 📚 Exemples d'utilisation avancés

### Animation en boucle

```html
<app-lottie-icon
  iconName="loading"
  [width]="48"
  [height]="48"
  [loop]="true"
  [autoplay]="true">
</app-lottie-icon>
```

### Animation déclenchée par un événement

```typescript
@Component({
  template: `
    <button (mouseenter)="onHover()">
      <app-lottie-icon #icon iconName="heart"></app-lottie-icon>
      Like
    </button>
  `
})
export class ButtonComponent {
  @ViewChild('icon') icon?: LottieIconComponent;

  onHover() {
    this.icon?.play();
  }
}
```

### Plusieurs tailles

```html
<!-- Petite -->
<app-lottie-icon iconName="check" [width]="16" [height]="16"></app-lottie-icon>

<!-- Moyenne -->
<app-lottie-icon iconName="check" [width]="24" [height]="24"></app-lottie-icon>

<!-- Grande -->
<app-lottie-icon iconName="check" [width]="48" [height]="48"></app-lottie-icon>
```

---

## 🔒 Sécurité

### Validation backend

Le backend valide les noms d'icônes (whitelist) :

```typescript
const allowedIcons = ['sun', 'moon'];
const cleanIconName = iconName.replace(/[^a-z0-9-]/gi, '');

if (!allowedIcons.includes(cleanIconName)) {
  throw new Error(`Icône non autorisée: ${cleanIconName}`);
}
```

### Protection

- ✅ Pas d'accès direct aux fichiers
- ✅ Validation des noms
- ✅ Nettoyage des caractères spéciaux
- ✅ Path traversal bloqué

---

## 🧪 Tests

### Test d'intégration

1. Ouvrir `http://localhost:4200/login`
2. Vérifier que les icônes s'affichent
3. Cliquer sur le toggle
4. Les icônes doivent s'animer

### Console

Aucune erreur attendue :
- ✅ Pas de "HttpErrorResponse"
- ✅ Pas de "parsing error"
- ✅ Animations chargées correctement

---

## 📝 Migration depuis lord-icon

### Étapes

1. **Supprimer @lordicon/element**
   ```bash
   npm uninstall @lordicon/element
   ```

2. **Installer lottie-web**
   ```bash
   npm install lottie-web
   ```

3. **Supprimer l'import dans main.ts**
   ```typescript
   // ❌ Supprimer
   import '@lordicon/element';
   ```

4. **Remplacer dans les composants**
   ```typescript
   // ❌ Avant
   schemas: [CUSTOM_ELEMENTS_SCHEMA]
   
   // ✅ Après
   imports: [LottieIconComponent]
   ```

5. **Mettre à jour les templates**
   ```html
   <!-- ❌ Avant -->
   <lord-icon #icon src="..."></lord-icon>
   
   <!-- ✅ Après -->
   <app-lottie-icon #icon iconName="sun"></app-lottie-icon>
   ```

6. **Simplifier le code TypeScript**
   - Supprimer `loadLordicons()`
   - Supprimer `updateIconSrc()`
   - Supprimer les signals `sunIconData`, `moonIconData`
   - Changer `ViewChild<ElementRef>` en `ViewChild<LottieIconComponent>`
   - Simplifier `triggerAnimation()` : `this.icon?.play()`

---

## ✅ Checklist de mise en œuvre

- [x] Installer lottie-web
- [x] Créer le composant LottieIconComponent
- [x] Ajouter l'alias @shared dans tsconfig
- [x] Mettre à jour login.component
- [x] Mettre à jour register.component
- [x] Supprimer @lordicon/element
- [x] Tester la compilation
- [x] Documentation créée

---

**Status** : ✅ IMPLÉMENTÉ ET TESTÉ
**Version** : 1.0.0
**Date** : 20/11/2025

