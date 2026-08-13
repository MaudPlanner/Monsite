/* Inscrit la visiteuse du Crash Test dans Brevo puis lui envoie l'email
   de confirmation avec le lien vers l'outil.

   Variables d'environnement requises (Netlify → Site configuration →
   Environment variables — jamais commitées dans le dépôt) :

     BREVO_API_KEY             clé API Brevo
     BREVO_LIST_ID             ID de la liste Brevo où atterrissent toutes
                                les inscrites au Crash Test (obligatoire)
     BREVO_LIST_ID_NEWSLETTER  ID d'une liste séparée pour celles qui ont
                                coché la case newsletter (optionnel : si
                                absent, la case newsletter n'ajoute la
                                contact à aucune liste supplémentaire —
                                à créer côté Brevo si Maud veut distinguer
                                les deux finalités par deux listes)
     BREVO_SENDER_EMAIL        adresse expéditrice de l'email de
                                confirmation, doit être validée dans
                                Brevo (Expéditeurs & IP) avant de fonctionner
     BREVO_SENDER_NAME         nom affiché de l'expéditrice (optionnel,
                                "Maud Planner" par défaut)

   Utilise l'attribut de contact Brevo "PRENOM" (existe par défaut sur la
   plupart des comptes Brevo en français ; sinon à créer dans Brevo →
   Contacts → Paramètres → Attributs, ou à renommer ci-dessous). */

const URL_OUTIL = "https://crash-test-de-ta-journee.netlify.app";
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return reponseErreur(405, "Méthode non autorisée.");
    }

    let donnees;
    try {
        donnees = JSON.parse(event.body || "{}");
    } catch (erreur) {
        return reponseErreur(400, "Requête invalide.");
    }

    const email = String(donnees.email || "").trim().toLowerCase();
    const prenom = String(donnees.prenom || "").trim();
    const newsletter = Boolean(donnees.newsletter);
    const leurre = String(donnees.site_web || "").trim();

    // Honeypot : un robot qui remplit tous les champs se fait piéger ici.
    // On répond succès sans rien envoyer, pour ne pas l'aider à s'adapter.
    if (leurre) {
        return reponseSucces();
    }

    if (!email || !REGEX_EMAIL.test(email)) {
        return reponseErreur(400, "Adresse email invalide.");
    }

    const cleApi = process.env.BREVO_API_KEY;
    const idListe = process.env.BREVO_LIST_ID;
    const idListeNewsletter = process.env.BREVO_LIST_ID_NEWSLETTER;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Maud Planner";

    if (!cleApi || !idListe) {
        console.error("Configuration Brevo manquante : BREVO_API_KEY et/ou BREVO_LIST_ID absents des variables d'environnement Netlify.");
        return reponseErreur(500, "Le service est momentanément indisponible.");
    }

    const listIds = [Number(idListe)];
    if (newsletter && idListeNewsletter) {
        listIds.push(Number(idListeNewsletter));
    }

    const attributs = {};
    if (prenom) {
        attributs.PRENOM = prenom;
    }

    try {
        const reponseContact = await fetch("https://api.brevo.com/v3/contacts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "api-key": cleApi
            },
            body: JSON.stringify({
                email: email,
                attributes: attributs,
                listIds: listIds,
                updateEnabled: true
            })
        });

        if (!reponseContact.ok) {
            const detailErreur = await reponseContact.text();
            console.error("Erreur Brevo (contact) :", reponseContact.status, detailErreur);
            return reponseErreur(502, "Impossible d'enregistrer ton inscription pour le moment.");
        }
    } catch (erreur) {
        console.error("Erreur réseau vers Brevo (contact) :", erreur);
        return reponseErreur(502, "Impossible d'enregistrer ton inscription pour le moment.");
    }

    // Email de confirmation envoyé en best-effort : la visiteuse est déjà
    // inscrite, on ne bloque pas sa redirection pour un email qui échoue.
    if (senderEmail) {
        try {
            await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "api-key": cleApi
                },
                body: JSON.stringify({
                    sender: { email: senderEmail, name: senderName },
                    to: [{ email: email, name: prenom || undefined }],
                    subject: "Ton accès au Crash Test de ta journée",
                    htmlContent: construireEmail(prenom)
                })
            });
        } catch (erreur) {
            console.error("Erreur envoi email de confirmation :", erreur);
        }
    } else {
        console.error("BREVO_SENDER_EMAIL absent : email de confirmation non envoyé.");
    }

    return reponseSucces();
};

function reponseSucces() {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true })
    };
}

function reponseErreur(statusCode, message) {
    return {
        statusCode: statusCode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, message: message })
    };
}

function construireEmail(prenom) {
    const bonjour = prenom ? "Bonjour " + prenom + "," : "Bonjour,";
    return (
        '<div style="font-family: Arial, sans-serif; color: #22303f; max-width: 480px; margin: 0 auto;">' +
        "<p>" + bonjour + "</p>" +
        "<p>Voici le lien vers le Crash Test de ta journée, pour y revenir quand tu veux :</p>" +
        '<p style="text-align: center; margin: 1.5rem 0;">' +
        '<a href="' + URL_OUTIL + '" style="background-color: #e18b22; color: #22303f; text-decoration: none; font-weight: bold; padding: 0.9rem 1.75rem; border-radius: 999px; display: inline-block;">Ouvrir le Crash Test</a>' +
        "</p>" +
        "<p>À bientôt,<br>Maud</p>" +
        "</div>"
    );
}
