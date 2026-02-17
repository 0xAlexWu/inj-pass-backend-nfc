# Backend Features Documentation

## Overview

The INJ Pass backend now includes two major new modules:

1. **Proxy Module** - Bypasses X-Frame-Options to allow iframe embedding
2. **Web3 Module** - Handles transaction signing and RPC requests

---

## 1. Proxy Module

### Purpose
Many DApps (like Helix and INJ Hub) set `X-Frame-Options: DENY` or `SAMEORIGIN` headers, which prevent them from being embedded in iframes. The Proxy Module solves this by:

- Fetching the DApp content on the server side
- Removing restrictive headers
- Serving the content to the frontend iframe

### API Endpoints

#### GET `/api/proxy`

Proxy a URL and remove iframe restrictions.

**Query Parameters:**
- `url` (required): The URL to proxy

**Example:**
```bash
curl "http://localhost:3001/api/proxy?url=https://helixapp.com"
```

**Response:**
Returns the HTML content with X-Frame-Options removed.

---

#### GET `/api/proxy/iframe-url`

Get a proxy URL for use in iframes.

**Query Parameters:**
- `url` (required): The original URL

**Example:**
```bash
curl "http://localhost:3001/api/proxy/iframe-url?url=https://helixapp.com"
```

**Response:**
```json
{
  "proxyUrl": "http://localhost:3001/api/proxy?url=https%3A%2F%2Fhelixapp.com"
}
```

---

## 2. Web3 Module

### Purpose
Handles all Web3-related operations including transaction signing, message signing, and RPC passthrough.

### API Endpoints

#### POST `/api/web3/sign-transaction`

Sign a transaction using the user's private key.

**Request Body:**
```json
{
  "privateKey": "0x...",
  "transaction": {
    "to": "0x...",
    "value": "0.1",
    "data": "0x...",
    "gas": "21000",
    "gasPrice": "20000000000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x...",
  "txHash": "0x..."
}
```

---

#### POST `/api/web3/sign-message`

Sign a message using personal_sign.

**Request Body:**
```json
{
  "privateKey": "0x...",
  "message": "Hello World"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x..."
}
```

---

#### POST `/api/web3/sign-typed-data`

Sign typed data (EIP-712).

**Request Body:**
```json
{
  "privateKey": "0x...",
  "message": "{\"domain\":{...},\"types\":{...},\"message\":{...}}"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x..."
}
```

---

#### POST `/api/web3/rpc`

Forward RPC requests to Injective EVM node.

**Request Body:**
```json
{
  "method": "eth_getBalance",
  "params": ["0x...", "latest"]
}
```

**Response:**
```json
{
  "success": true,
  "result": "0x..."
}
```

---

#### POST `/api/web3/estimate-gas`

Estimate gas for a transaction.

**Request Body:**
```json
{
  "transaction": {
    "from": "0x...",
    "to": "0x...",
    "value": "0x...",
    "data": "0x..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "gasEstimate": "0x5208"
}
```

---

#### POST `/api/web3/get-receipt`

Get transaction receipt.

**Request Body:**
```json
{
  "txHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "receipt": {
    "transactionHash": "0x...",
    "status": "0x1",
    ...
  }
}
```

---

## Installation

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

New dependencies added:
- `@nestjs/axios` - HTTP client for NestJS
- `axios` - Promise-based HTTP client
- `viem` - Ethereum library for TypeScript

### 2. Environment Variables

Add to `.env`:

```env
# Backend URL (for proxy URL generation)
BACKEND_URL=http://localhost:3001

# Injective EVM RPC URL
INJECTIVE_RPC_URL=https://evm-rpc.injective.network

# Existing variables
DATABASE_URL=...
REDIS_URL=...
ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

### 3. Run Backend

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

---

## Frontend Integration

### 1. Environment Variables

Add to frontend `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 2. DApp Browser Component

The `DAppBrowser` component now:

1. Fetches proxy URL from backend
2. Uses proxy URL in iframe
3. Signs transactions via backend API
4. Signs messages via backend API

### 3. Usage Example

```typescript
import DAppBrowser from '@/components/DAppBrowser';

// Open DApp in browser
<DAppBrowser
  url="https://helixapp.com"
  name="Helix"
  onClose={() => setSelectedDApp(null)}
/>
```

---

## Security Considerations

### Proxy Module

**Risks:**
- Server-side rendering of untrusted content
- Potential XSS if content is not properly sanitized

**Mitigations:**
- Iframe sandboxing (`sandbox` attribute)
- Content-Security-Policy headers
- Rate limiting (TODO)

### Web3 Module

**Risks:**
- Private key transmitted to backend
- Man-in-the-middle attacks

**Mitigations:**
- **HTTPS only** in production
- Private key should be encrypted in transit
- Consider using hardware wallet or Passkey signing instead
- Rate limiting on signing endpoints (TODO)

---

## Future Improvements

### Short Term
- [ ] Add rate limiting to proxy and signing endpoints
- [ ] Implement request caching for proxy
- [ ] Add wallet locking after transaction
- [ ] Add transaction history storage

### Medium Term
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] Passkey-based transaction signing
- [ ] Multi-sig support
- [ ] Gas price optimization

### Long Term
- [ ] WalletConnect integration
- [ ] Cross-chain support
- [ ] DApp permission management
- [ ] Transaction simulation before signing

---

## Troubleshooting

### Proxy Issues

**Problem**: DApp still showing "Connection refused"

**Solutions:**
1. Check backend is running: `curl http://localhost:3001/api/proxy/iframe-url?url=https://helixapp.com`
2. Check CORS settings in backend
3. Check `BACKEND_URL` environment variable
4. Try clearing browser cache

---

### Signing Issues

**Problem**: Transaction signing fails

**Solutions:**
1. Check private key format (should be hex string)
2. Check Injective RPC is accessible
3. Check gas estimate is sufficient
4. Check network connection

---

### RPC Issues

**Problem**: RPC requests failing

**Solutions:**
1. Check `INJECTIVE_RPC_URL` environment variable
2. Test RPC directly: `curl https://evm-rpc.injective.network`
3. Check rate limiting on RPC node
4. Try alternative RPC endpoints

---

## Testing

### Test Proxy

```bash
# Test proxy endpoint
curl "http://localhost:3001/api/proxy?url=https://helixapp.com"

# Test proxy URL generation
curl "http://localhost:3001/api/proxy/iframe-url?url=https://helixapp.com"
```

### Test Web3

```bash
# Test RPC
curl -X POST http://localhost:3001/api/web3/rpc \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[]}'

# Test estimate gas
curl -X POST http://localhost:3001/api/web3/estimate-gas \
  -H "Content-Type: application/json" \
  -d '{"transaction":{"from":"0x...","to":"0x...","value":"0x0"}}'
```

---

## API Reference

Full API documentation: [Swagger UI](http://localhost:3001/api)

(TODO: Add Swagger/OpenAPI documentation)
