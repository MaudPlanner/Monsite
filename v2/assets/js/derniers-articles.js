/* Accueil uniquement : va chercher les cartes d'articles directement sur
   /blog/ (source unique de vérité, déjà mise à jour à chaque publication
   via AJOUTER-UN-ARTICLE.md) et les affiche ici. Aucune modification de
   cette page n'est nécessaire quand un nouvel article est publié.
   Si le blog est vide ou la requête échoue, la section reste masquée :
   jamais d'état vide ni d'erreur visible sur l'accueil. */

(function () {
    var conteneur = document.getElementById("derniers-articles");
    var section = document.getElementById("section-derniers-articles");

    if (!conteneur || !section) {
        return;
    }

    fetch("/blog/")
        .then(function (reponse) {
            return reponse.ok ? reponse.text() : Promise.reject();
        })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            var cartes = doc.querySelectorAll(".carte-article");

            if (!cartes.length) {
                return;
            }

            var fragment = document.createDocumentFragment();
            Array.prototype.slice.call(cartes, 0, 3).forEach(function (carte) {
                fragment.appendChild(carte.cloneNode(true));
            });

            conteneur.appendChild(fragment);
            section.hidden = false;
        })
        .catch(function () {});
})();
