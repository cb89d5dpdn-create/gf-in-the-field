#!/bin/bash
# Create test users in Supabase Auth

SUPABASE_URL="https://ivbhxhhxldqdgkbltywy.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Ymh4aGh4bGRxZGdrYmx0eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4NDA3MSwiZXhwIjoyMDk0NzYwMDcxfQ.jmaagSwUhXw4E5skfr3zqV2t__hLXodXw8YsiCP3moM"

echo "Creating test users..."

# Admin
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gfinthefield.com.au","password":"Admin1234!","email_confirm":true,"user_metadata":{"name":"Ben Voigt","role":"admin"}}'

echo ""

# FSM NSW
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"fsm.nsw@test.com","password":"Test1234!","email_confirm":true,"user_metadata":{"name":"Sarah Mitchell","role":"fsm"}}'

echo ""

# FSM VIC
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"fsm.vic@test.com","password":"Test1234!","email_confirm":true,"user_metadata":{"name":"James Thornton","role":"fsm"}}'

echo ""

# FSM QLD
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"fsm.qld@test.com","password":"Test1234!","email_confirm":true,"user_metadata":{"name":"Kylie Brennan","role":"fsm"}}'

echo ""

# FSM WA
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"fsm.wa@test.com","password":"Test1234!","email_confirm":true,"user_metadata":{"name":"Mark Paterson","role":"fsm"}}'

echo ""

# FSM SA/NT
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"fsm.sant@test.com","password":"Test1234!","email_confirm":true,"user_metadata":{"name":"Donna Clarke","role":"fsm"}}'

echo ""
echo "Done creating users!"
