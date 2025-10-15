#!/bin/bash
# Quick test runner for Storage-related tests

echo "========================================="
echo "Running AccessStorage & AddStorage Tests"
echo "========================================="
echo ""

cd /Users/calvinhemington/Desktop/boombox-workspace/boombox-11.0

echo "Testing AccessStorage components..."
npm test -- --testPathPatterns="AccessStorage" --passWithNoTests 2>&1 | grep -E "(PASS|FAIL|Tests:|Test Suites:)" | tail -5

echo ""
echo "Testing AddStorage components..."
npm test -- --testPathPatterns="AddStorage" --passWithNoTests 2>&1 | grep -E "(PASS|FAIL|Tests:|Test Suites:)" | tail -5

echo ""
echo "========================================="
echo "Test run complete!"
echo "========================================="

