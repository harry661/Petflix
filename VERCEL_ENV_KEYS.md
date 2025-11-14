# Vercel Environment Variable Keys

## Use These DIFFERENT Key Names:

### Development:
- **Key**: `VITE_API_URL_DEV`
- **Value**: `http://localhost:3000`
- **Environments**: Development only

### Preview (Staging):
- **Key**: `VITE_API_URL_STAGING`
- **Value**: `https://your-staging-backend.railway.app`
- **Environments**: Preview only

### Production:
- **Key**: `VITE_API_URL_PROD`
- **Value**: `https://your-production-backend.railway.app`
- **Environments**: Production only

## Code Update Required

The code will need to check which environment variable exists and use the appropriate one.

