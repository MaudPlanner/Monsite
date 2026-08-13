/* Maud Planner V2 — formulaire de capture email du Crash Test.
   Envoie la demande à la fonction Netlify qui envoie l'email d'accès à
   l'outil (via Resend), puis redirige vers l'outil. Sans JS, le
   formulaire reste visible mais ne peut pas être soumis : l'outil
   lui-même est une application qui nécessite déjà JavaScript pour
   fonctionner. */

(function () {
    var formulaire = document.getElementById("form-crash-test");

    if (!formulaire) {
        return;
    }

    var URL_OUTIL = "https://crash-test-de-ta-journee.netlify.app";
    var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var message = document.getElementById("form-crash-test-message");
    var bouton = formulaire.querySelector("button[type='submit']");
    var texteBoutonInitial = bouton.textContent;

    function afficherMessage(texte, type) {
        message.textContent = texte;
        message.className = "form-crash-test__message" + (type ? " form-crash-test__message--" + type : "");
    }

    formulaire.addEventListener("submit", function (evenement) {
        evenement.preventDefault();
        afficherMessage("", "");

        var email = formulaire.email.value.trim();
        var prenom = formulaire.prenom.value.trim();
        var leurre = formulaire.site_web.value.trim();

        // Honeypot : une visiteuse ne remplit jamais ce champ, un robot si.
        if (leurre) {
            return;
        }

        if (!REGEX_EMAIL.test(email)) {
            afficherMessage("Indique une adresse email valide pour continuer.", "erreur");
            formulaire.email.focus();
            return;
        }

        bouton.disabled = true;
        bouton.textContent = "Ça part...";

        fetch("/.netlify/functions/crash-test-inscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                prenom: prenom,
                site_web: leurre
            })
        })
            .then(function (reponse) {
                // Si le serveur ne répond pas en JSON (page d'erreur HTML,
                // fonction indisponible...), on ne le fait jamais remonter
                // tel quel à l'écran : message générique dans ce cas.
                return reponse
                    .json()
                    .catch(function () {
                        return null;
                    })
                    .then(function (donnees) {
                        if (!reponse.ok || !donnees || !donnees.ok) {
                            var erreurReponse = new Error();
                            erreurReponse.messageServeur = donnees && donnees.message;
                            throw erreurReponse;
                        }
                    });
            })
            .then(function () {
                afficherMessage("C'est parti, tu es redirigé(e) vers l'outil...", "succes");
                // Email (+ prénom s'il est renseigné) dans le fragment (#),
                // jamais en paramètre de requête : un fragment n'est jamais
                // transmis à un serveur (ni logs, ni en-tête Referer),
                // contrairement à un "?...". L'outil le lit une fois puis
                // nettoie l'URL.
                var fragment = "#e=" + encodeURIComponent(email);
                if (prenom) {
                    fragment += "&p=" + encodeURIComponent(prenom);
                }
                window.location.href = URL_OUTIL + fragment;
            })
            .catch(function (erreur) {
                bouton.disabled = false;
                bouton.textContent = texteBoutonInitial;
                afficherMessage((erreur && erreur.messageServeur) || "Un souci technique empêche l'envoi pour le moment. Réessaie dans un instant.", "erreur");
            });
    });
})();
