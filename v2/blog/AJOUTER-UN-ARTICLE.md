# Ajouter un article au blog

Un article = un fichier HTML dans le dossier `blog/`. Rien d'autre à toucher sur le site.

## Les 5 étapes

1. **Dupliquer le template** : copier `_template-article.html` et renommer la copie avec le slug de l'article, en minuscules avec des tirets. Exemple : `dire-non-sans-culpabiliser.html`.

2. **Remplacer tout ce qui est entre [CROCHETS]** dans le fichier :
   - `<title>` et meta description (uniques pour chaque article) ;
   - le slug dans l'URL canonique et dans le bloc JSON-LD (deux endroits) ;
   - les dates de publication au format `AAAA-MM-JJ` (JSON-LD et balise `<time>`) ;
   - le fil d'Ariane, le titre `<h1>`, le contenu, le CTA de fin.

3. **Supprimer la ligne** `<meta name="robots" content="noindex">` (elle empêche Google d'indexer le template ; un vrai article doit l'être).

4. **Ajouter la carte de l'article** dans `blog/index.html` : un bloc de carte prêt à copier se trouve en commentaire dans la section "Les articles" (article le plus récent en premier). Au premier article publié, supprimer aussi le bloc "état vide" (marqué d'un commentaire).

5. **Ajouter l'URL dans `sitemap.xml`** (à la racine du site) : une ligne `<url><loc>https://www.maudplanner.com/blog/slug-de-l-article</loc></url>` sur le modèle des lignes existantes.

## Règles de contenu (rappel du CLAUDE.md)

- Un seul `<h1>` par article, intertitres en `<h2>` puis `<h3>`.
- Ton du site : tutoiement soigné, écriture inclusive avec (e), pas de vocabulaire Instagram ni d'injonctions de productivité.
- Le CTA de fin d'article s'adapte au sujet (Crash Test par défaut, autre freebie ou offre si plus pertinent).
