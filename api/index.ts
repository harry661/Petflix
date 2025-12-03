// Vercel serverless function entry point
// Vercel requires serverless functions to be in root api/ directory
// This file re-exports from backend/api/index.ts to keep all code in backend/

export { default } from '../backend/api/index';
module.exports = require('../backend/api/index');

