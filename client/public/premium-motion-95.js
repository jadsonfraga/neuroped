const Motion95 = {
    spring: {
        stiff: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        apple: "cubic-bezier(0.25, 0.1, 0.25, 1)"
    },
    init() {
        this.applyGlassShimmer();
        this.injectSpringTransitions();
    },
    applyGlassShimmer() {
        const style = document.createElement('style');
        style.textContent = `
            .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
            @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            .np-card, .item, .dtask { transition: transform 0.4s ${this.spring.stiff}, box-shadow 0.4s ${this.spring.smooth}; }
            .np-card:active { transform: scale(0.98); }
        `;
        document.head.appendChild(style);
    },
    injectSpringTransitions() {
        document.querySelectorAll('.np-card, .bk-btn, button').forEach(el => {
            el.style.transition = `transform 0.5s ${this.spring.stiff}`;
        });
    }
};
document.addEventListener('DOMContentLoaded', () => Motion95.init());
