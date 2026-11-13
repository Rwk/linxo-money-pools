# Metal Integral 2027 — Backlog du constructeur éditorial

**Statut :** suivi fonctionnel ; ce document ne constitue pas une décision d'architecture.
**Référence :** `docs/EDITOR.md`.
**Mise à jour :** 9 novembre 2026.

## Retour de recette — prototype V1

Le prototype GridStack + Quill est fonctionnel en local. L'utilisateur a validé : création et suppression de modules texte/image/YouTube, mise en page et redimensionnement horizontal et vertical (y compris un bloc 6/12 à gauche et deux blocs 6/12 empilés à droite), édition, persistance, prévisualisation et empilement mobile. L'expérience générale est fluide et intuitive. Ces acquis sont à préserver dans les itérations suivantes.

## Améliorations UX proches — V1.1

### UX-01 — Échanger deux blocs

**Constat :** déposer un module à la place d'un autre pousse les voisins et crée des espaces vides, obligeant à réordonner la page.
**Attendu :** proposer un échange de positions intuitif et stable, sans déplacements en cascade injustifiés ; ne jamais perdre le contenu des modules.
**À tester :** blocs de tailles différentes, blocs de hauteurs différentes, grille partiellement occupée ; vérifier que l'échange ne crée pas de chevauchement.

### UX-02 — Agrandir sans chasser un voisin lorsqu'il reste de la place

**Constat :** pour deux modules 4/12 côte à côte, agrandir le premier à 6/12 repousse le second en dessous alors que 6 + 4 <= 12.
**Attendu :** maintenir les modules sur la même rangée quand leur largeur combinée permet un agencement valide ; déplacer le voisin si nécessaire vers l'espace libre.
**À tester :** largeur 4→6 ; mouvements adjacents ; hauteur des modules ; absence de perte de contenu.

### UX-03 — Zones d'insertion contextuelles

**Besoin :** éviter de revenir en haut de page pour ajouter un module et faciliter le placement sans glisser-déposer.
**Attendu :** présenter en mode édition des zones d'ajout pointillées aux endroits disponibles, notamment sous un module pleine largeur et à droite d'un module plus étroit, ainsi qu'en dessous. Cliquer ouvre le choix du type : texte, image, YouTube.
**Règles :** emplacement d'insertion proposé seulement si réellement utilisable ; aucune zone d'insertion ne fait partie du JSON enregistré ni du rendu public ; compatibilité avec une grille de 12 unités, sans imbrication ; conserver le déplacement libre déjà fonctionnel.

## Évolution ultérieure — Templates personnels d'auteur (hors prototype V1.1 / hors MVP immédiat)

### EDITOR-FUTURE-01 — Bibliothèque de modèles de mise en page par auteur

**Vision métier :** à terme, chroniques, articles, galeries, couvertures de festivals et autres contenus partagent un même mécanisme de rédaction, d'édition et de cycle de vie. Leur type métier les distingue, mais le constructeur et le workflow sous-jacents sont communs. Cette convergence est une orientation produit à étudier lors de la modélisation des contenus, et non une refonte à effectuer dans le prototype.

**Besoin :** chaque auteur peut constituer et gérer sa propre bibliothèque de templates. Exemple : Pumpkin-T prépare une trame de chronique d'album avec un module spécifique en haut à droite, puis un module texte et une vidéo YouTube, à des tailles et positions choisies.

**Parcours attendu :** lors de la création d'un contenu, choisir soit « Page vierge », soit « Partir d'un de mes templates ». Le constructeur s'ouvre avec les modules, leur type, leur ordre et leurs dimensions prépositionnés. L'auteur remplit alors les contenus et peut ajouter, supprimer ou déplacer des modules librement.

**Sémantique :** un template représente la **structure** d'une page (types de blocs, positions, tailles et configuration non éditoriale nécessaire) ; il ne préremplit pas les textes, images ou vidéos propres à une chronique, sauf besoin futur expressément validé. Charger un template crée une **copie indépendante** ; éditer ou supprimer ensuite le modèle ne modifie pas les contenus déjà créés.

**Pistes à explorer plus tard :** créer un template à partir d'une page vierge ou de la structure d'un contenu existant ; nommer, lister, renommer et supprimer ses modèles ; contrôle d'accès propriétaire ; compatibilité des modèles avec les différents types de contenus ; évolution du schéma JSON et des futurs types de modules.

**Non décidé à ce stade :** partage de templates entre auteurs, modèles globaux administrateurs, compatibilité entre tous types métier, détails du schéma et de la persistance. Ne pas les implémenter par anticipation.

## Ordre proposé

1. Conserver un commit de référence de la V1 fonctionnelle.
2. Corriger UX-02 et UX-01 en préservant les fonctionnalités déjà validées.
3. Ajouter UX-03 (insertion guidée).
4. Refaire une recette manuelle avant de poursuivre les travaux de migration historique.
5. Reprendre EDITOR-FUTURE-01 à l'étape de conception du modèle de contenu éditorial commun, après le prototype.

