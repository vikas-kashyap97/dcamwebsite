'use strict';
const serverless = require('serverless-http');
const app = require('../../server');

// Netlify functions have a 10s timeout by default, 
// and the filesystem is read-only.
// SQLite will work for reading if the DB file is included in the deployment.
module.exports.handler = serverless(app);
