// PM2 ecosystem — SoloFin dev
// Lance backend + frontend de façon persistante (redémarre automatiquement si crash)
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'index.js',
      cwd: 'C:/Users/Rachid/Documents/Claude/Projects/SoloFin/solofin/backend',
      node_args: '--env-file=C:/Users/Rachid/Documents/Claude/Projects/SoloFin/solofin/backend/.env',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      error_file: 'C:/Users/Rachid/Documents/Claude/Projects/SoloFin/backend_err.txt',
      out_file:   'C:/Users/Rachid/Documents/Claude/Projects/SoloFin/backend_out.txt',
    },
    {
      name: 'frontend',
      script: 'npm.cmd',
      args: 'run dev',
      cwd: 'C:/Users/Rachid/Documents/Claude/Projects/SoloFin/solofin/frontend',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      error_file: 'C:/Users/Rachid/Documents/Claude/Projects\SoloFin/frontend_err.txt',
      out_file:   'C:/Users/Rachid/Documents/Claude/Projects/SoloFin/frontend_out.txt',
    }
  ]
};
