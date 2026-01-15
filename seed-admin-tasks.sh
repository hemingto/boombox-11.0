#!/bin/bash

# Admin Tasks Seed Runner
# This script seeds the database with test data for all admin task types

echo "🌱 Seeding Admin Tasks Test Data..."
echo ""
echo "📋 This will create:"
echo "   • 11 different admin task types"
echo "   • 3 test customers"
echo "   • 2 test drivers"  
echo "   • 1 moving partner"
echo "   • 5 storage units"
echo "   • 3 packing supply products"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from boombox-11.0 directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

# Run the seed
echo "🚀 Running seed script..."
npm run db:seed

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Seeding completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Start the dev server: npm run dev"
    echo "   2. Navigate to: http://localhost:3000/admin/tasks"
    echo "   3. You should see 11 tasks ready to test!"
    echo ""
    echo "📚 For more info, see:"
    echo "   • ADMIN_TASKS_TESTING_GUIDE.md"
    echo "   • prisma/seeds/SEED_DATA_SUMMARY.md"
    echo ""
else
    echo ""
    echo "❌ Seeding failed!"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   • Make sure your database is running"
    echo "   • Try: npm run db:reset"
    echo "   • Check DATABASE_URL in .env"
    echo ""
    exit 1
fi

