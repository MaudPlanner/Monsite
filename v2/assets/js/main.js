/* Maud Planner V2 — animations sobres au scroll.
   GSAP pour les tweens, IntersectionObserver natif pour le déclenchement
   (plus léger que ScrollTrigger, même rendu).
   Sans JS ou avec prefers-reduced-motion : tout reste visible, aucun effet. */

(function () {
    var reduitLeMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduitLeMouvement || typeof gsap === "undefined") {
        return;
    }

    /* Écrans du parcours : transition courte à l'arrivée (300 ms max) */
    if (document.querySelector(".anim-ecran")) {
        gsap.from(".anim-ecran", {
            opacity: 0,
            y: 16,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    /* Hero : apparition douce à l'arrivée sur la page */
    if (document.querySelector(".hero .anim-hero")) {
        gsap.from(".hero .anim-hero", {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.15
        });
    }

    /* Sections : fade + léger translate à l'entrée dans le viewport */
    var elements = document.querySelectorAll(".anim-apparition");

    if (!elements.length || !("IntersectionObserver" in window)) {
        return;
    }

    var observateur = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            if (entree.isIntersecting) {
                observateur.unobserve(entree.target);
                gsap.to(entree.target, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "power2.out"
                });
            }
        });
    }, { rootMargin: "0px 0px -10% 0px" });

    elements.forEach(function (element) {
        gsap.set(element, { opacity: 0, y: 28 });
        observateur.observe(element);
    });
})();
