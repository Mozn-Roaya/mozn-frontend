module.exports = {
  apps: [
    {
      name: "mozn-public",
      cwd: "/home/tarek/mozn-frontend/mozn-public/frontend",
      script: "npm",
      args: "start",
      env: { PORT: 3000 },
    },
    {
      name: "mozn-dashboard",
      cwd: "/home/tarek/mozn-frontend/mozn-dashboard/web",
      script: "npm",
      args: "start",
      env: { PORT: 3001 },
    },
  ],
};
