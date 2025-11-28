# Stop any running node processes if needed (optional)
# taskkill /F /IM node.exe

# Reset the database and push the schema
npx prisma db push --force-reset

echo "Database reset complete!"
