#!/bin/bash

# Function to cleanup background processes on script exit
cleanup() {
    echo "Shutting down services..."
    kill $(jobs -p)
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT SIGINT SIGTERM

# Start Firebase emulators in the background
firebase emulators:start --only functions,auth,firestore &

# Wait for emulators to start
echo "Waiting for emulators to start..."
sleep 10

# Start Angular development server in the background
ng serve --configuration development &

# Wait for Angular server to start
echo "Waiting for Angular server to start..."
sleep 10

# Run the data generation script (now using plain node)
node scripts/generate-test-data.js

# Wait for any background process to exit
wait