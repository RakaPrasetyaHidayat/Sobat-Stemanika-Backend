module.exports = {
  apps: [
    {
      name: 'stemanika-api',
      script: './server/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: ['server'],
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
      gracefulShutdown: 5000,
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ]
};
