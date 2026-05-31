module.exports = {
  apps: [
    {
      name: "finsim-api",
      cwd: "/root/finsim/backend",
      script: "server.js",

      // Zero-downtime friendly
      exec_mode: "cluster",
      instances: 2,

      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,

      // Wait until app sends "ready"
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 10000,

      env: {
        NODE_ENV: "production",
        PORT: 8081,
      },

      // Keep only if you're actually using this pattern
      dot_env: "/root/finsim/backend/.env",
    },
  ],
};