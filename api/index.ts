// Vercel serverless function entry point
// This file re-exports from backend/api/index.ts to satisfy Vercel's requirement
// that serverless functions be in the root api/ directory
// The actual implementation remains in backend/api/index.ts

import backendApi from '../backend/api/index';

export default backendApi;
module.exports = backendApi;

