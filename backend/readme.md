curl -X POST http://localhost:8000/api/register \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Shova User",
        "email": "shova@example.com",
        "password": "password",
        "password_confirmation": "password"
      }'

curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
        "email": "shova@example.com",
        "password": "password"
      }'

TOKEN="paste-your-token-here"

curl -X GET http://localhost:8000/api/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:8000/api/logout \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
