/* Maud Planner V2 — animations sobres au scroll.
   Sans JS ou avec prefers-reduced-motion : tout reste visible, aucun effet. */

(function () {
    var reduitLeMouvement = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduitLeMouvement || typeof gsap === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

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
    gsap.from(".hero .anim-hero", {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.15
    });

    /* Sections : fade + léger translate au scroll */
    document.querySelectorAll(".anim-apparition").forEach(function (element) {
        gsap.from(element, {
            opacity: 0,
            y: 28,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                once: true
            }
        });
    });
})();
