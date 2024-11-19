export const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.6, ease: "easeOut" }
};

export const slideIn = (direction: "left" | "right", delay: number = 0) => ({
  initial: { 
    x: direction === "left" ? -100 : 100,
    opacity: 0 
  },
  animate: { 
    x: 0,
    opacity: 1,
    transition: {
      delay,
      duration: 0.8,
      ease: "easeOut"
    }
  }
}); 