export const PROJECT_MODES = {
  frontend: {
    id: "frontend",
    label: "Frontend",
    stack: [
      "HTML5",
      "CSS3",
      "Vanilla JavaScript"
    ],
    allowedProjectTypes: [
      "portfolio",
      "landing-page"
    ],
    forbiddenTechnologies: [
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "Python",
      "PHP",
      "Java",
      "Vue",
      "Angular",
      "Next.js"
    ]
  },
  fullstack: {
    id: "fullstack",
    label: "Fullstack",
    stack: [
      "React",
      "TypeScript",
      "Node.js"
    ],
    allowedProjectTypes: [
      "fullstack-application"
    ],
    forbiddenTechnologies: [
      "PHP",
      "Python",
      "Java",
      "Vue",
      "Angular"
    ]
  }
};
