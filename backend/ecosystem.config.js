require('dotenv').config({ path: __dirname + '/.env' });

module.exports = {
  apps: [
    {
      name: 'minut-booking',
      script: 'dist/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT,
        MONGODB_URI: process.env.MONGODB_URI,
        SECRET_KEY: process.env.SECRET_KEY,
        ORIGIN: process.env.ORIGIN,
        CREDENTIALS: process.env.CREDENTIALS,
        LOG_FORMAT: process.env.LOG_FORMAT,
        LOG_DIR: process.env.LOG_DIR,
        AWS_REGION: process.env.AWS_REGION,
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      },
    },
  ],
};
