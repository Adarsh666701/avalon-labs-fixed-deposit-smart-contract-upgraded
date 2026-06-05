#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "To start the development server, run: npm run dev"
    echo "To start the production server, run: npm start"
else
    echo "❌ Build failed!"
    exit 1
fi
