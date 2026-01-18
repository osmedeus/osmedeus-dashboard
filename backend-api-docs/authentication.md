# Authentication

Most API endpoints require JWT authentication. First, obtain a token via the login endpoint, then include it in subsequent requests.

## Login

Authenticate and obtain a JWT token.

```bash
curl -X POST http://localhost:8002/osm/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "osmedeus", "password": "admin"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Using the Token

Include the token in subsequent requests using the `Authorization: Bearer <token>` header:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:8002/osm/api/workflows \
  -H "Authorization: Bearer $TOKEN"
```
