module.exports = {
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql', 
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,        // Keep 10 connections ready
      min: 2,         // Never close all connections (keep 2 warm)
      acquire: 30000, // Wait 30s before giving up
      idle: 10000     // Keep connection alive for 10s of silence
    },
    logging: false
  }
};