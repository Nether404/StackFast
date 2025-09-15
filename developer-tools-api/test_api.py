#!/usr/bin/env python3
"""
Test script for Developer Tools API
This script tests the API endpoints to ensure they work correctly
"""

import os
import sys
import json

# Add the project root to the path
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app

def test_api_endpoints():
    """Test various API endpoints"""
    
    with app.test_client() as client:
        print("Testing Developer Tools API...")
        print("=" * 50)
        
        # Test 1: Get API stats
        print("\n1. Testing /api/tools/stats")
        response = client.get('/api/tools/stats')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"Total Tools: {data.get('total_tools')}")
            print(f"Total Categories: {data.get('total_categories')}")
            print("Category Breakdown:")
            for category, count in data.get('category_breakdown', {}).items():
                print(f"  - {category}: {count}")
        else:
            print(f"Error: {response.data}")
        
        # Test 2: Get all tools (first page, summary)
        print("\n2. Testing /api/tools?summary=true&per_page=5")
        response = client.get('/api/tools?summary=true&per_page=5')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"Tools returned: {len(data.get('tools', []))}")
            print(f"Total tools: {data.get('pagination', {}).get('total')}")
            print("Sample tools:")
            for tool in data.get('tools', [])[:3]:
                print(f"  - {tool.get('name')} ({tool.get('category')})")
        else:
            print(f"Error: {response.data}")
        
        # Test 3: Get categories
        print("\n3. Testing /api/tools/categories")
        response = client.get('/api/tools/categories')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            categories = data.get('categories', [])
            print(f"Categories found: {len(categories)}")
            print("Categories:", ", ".join(categories[:5]) + ("..." if len(categories) > 5 else ""))
        else:
            print(f"Error: {response.data}")
        
        # Test 4: Search for AI tools
        print("\n4. Testing /api/tools/search?q=AI&category=AI")
        response = client.get('/api/tools/search?q=AI&category=AI')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"AI tools found: {data.get('count')}")
            print("Sample AI tools:")
            for tool in data.get('tools', [])[:3]:
                print(f"  - {tool.get('name')}: {tool.get('description', 'No description')[:100]}...")
        else:
            print(f"Error: {response.data}")
        
        # Test 5: Get a specific tool
        print("\n5. Testing /api/tools/1")
        response = client.get('/api/tools/1')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"Tool: {data.get('name')}")
            print(f"Category: {data.get('category')}")
            print(f"URL: {data.get('url')}")
            print(f"Maturity Score: {data.get('maturity_score')}")
            print(f"Popularity Score: {data.get('popularity_score')}")
            print(f"Features: {len(data.get('features', []))} features")
            print(f"Integrations: {len(data.get('verified_integrations', []))} integrations")
        else:
            print(f"Error: {response.data}")
        
        print("\n" + "=" * 50)
        print("API testing completed!")

if __name__ == "__main__":
    test_api_endpoints()

