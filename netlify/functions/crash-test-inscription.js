/* Envoie l'email de confirmation avec le lien vers l'outil du Crash Test,
   via Resend (déjà utilisé par Maud pour les emails de connexion/accès
   de ses autres produits).

   L'inscription à une liste de diffusion (Brevo, newsletter) n'est PAS
   encore branchée : Maud n'a pas encore de compte Brevo (décidé le
   13/08/2026, voir mémoire "Intégration Brevo Monsite"). Cette fonction
   se contente d'envoyer l'email d'accès ; aucune adresse n'est conservée
   dans une liste pour l'instant, seulement dans l'historique d'envoi
   Resend. À enrichir plus tard pour ajouter aussi le contact à Brevo.

   Variables d'environnement requises (Netlify → Site configuration →
   Environment variables — jamais commitées dans le dépôt) :
     RESEND_API_KEY       clé API Resend
     RESEND_SENDER_EMAIL  adresse expéditrice, validée dans Resend
     RESEND_SENDER_NAME   nom affiché de l'expéditrice (optionnel,
                           "Maud Planner" par défaut)
*/

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
    const leurre = String(donnees.site_web || "").trim();

    // Honeypot : un robot qui remplit tous les champs se fait piéger ici.
    // On répond succès sans rien envoyer, pour ne pas l'aider à s'adapter.
    if (leurre) {
        return reponseSucces();
    }

    if (!email || !REGEX_EMAIL.test(email)) {
        return reponseErreur(400, "Adresse email invalide.");
    }

    const cleApi = process.env.RESEND_API_KEY;
    const senderEmail = process.env.RESEND_SENDER_EMAIL;
    const senderName = process.env.RESEND_SENDER_NAME || "Maud Planner";

    if (!cleApi || !senderEmail) {
        console.error("Configuration Resend manquante : RESEND_API_KEY et/ou RESEND_SENDER_EMAIL absents des variables d'environnement Netlify.");
        return reponseErreur(500, "Le service est momentanément indisponible.");
    }

    try {
        const reponseEnvoi = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + cleApi
            },
            body: JSON.stringify({
                from: senderName + " <" + senderEmail + ">",
                to: [email],
                subject: "Ton accès au Crash Test de ta journée",
                html: construireEmail(prenom)
            })
        });

        if (!reponseEnvoi.ok) {
            const detailErreur = await reponseEnvoi.text();
            console.error("Erreur Resend :", reponseEnvoi.status, detailErreur);
            return reponseErreur(502, "Impossible d'envoyer ton accès pour le moment.");
        }
    } catch (erreur) {
        console.error("Erreur réseau vers Resend :", erreur);
        return reponseErreur(502, "Impossible d'envoyer ton accès pour le moment.");
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
