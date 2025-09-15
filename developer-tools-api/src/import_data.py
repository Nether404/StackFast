#!/usr/bin/env python3
"""
Data import script for Developer Tools API
This script imports data from the CSV file and populates the database
"""

import os
import sys
import csv
import json

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import after path setup
os.environ['FLASK_ENV'] = 'development'

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Create Flask app and database
app = Flask(__name__)
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define the model directly here to avoid import issues
class DeveloperTool(db.Model):
    __tablename__ = 'developer_tools'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(500), nullable=True)
    
    # JSON fields for arrays
    frameworks = db.Column(db.Text, nullable=True)
    supported_languages = db.Column(db.Text, nullable=True)
    features = db.Column(db.Text, nullable=True)
    native_integrations = db.Column(db.Text, nullable=True)
    verified_integrations = db.Column(db.Text, nullable=True)
    notable_strengths = db.Column(db.Text, nullable=True)
    known_limitations = db.Column(db.Text, nullable=True)
    
    # Scoring fields
    maturity_score = db.Column(db.Integer, nullable=True)
    popularity_score = db.Column(db.Integer, nullable=True)
    
    # Additional fields
    pricing = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

def parse_array_field(field_value):
    """Parse array fields from CSV (comma-separated values)"""
    if not field_value or field_value.strip() == "Not specified":
        return []
    
    # Split by comma and clean up
    items = [item.strip() for item in field_value.split(',') if item.strip()]
    return items

def parse_score_field(field_value):
    """Parse score fields, handling 'Not specified' values"""
    if not field_value or field_value.strip() == "Not specified":
        return None
    
    try:
        score = int(field_value)
        return score if 1 <= score <= 10 else None
    except (ValueError, TypeError):
        return None

def import_tools_from_csv(csv_file_path):
    """Import tools from CSV file"""
    
    if not os.path.exists(csv_file_path):
        print(f"Error: CSV file not found at {csv_file_path}")
        return False
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Clear existing data (optional)
        print("Clearing existing tools...")
        DeveloperTool.query.delete()
        db.session.commit()
        
        print(f"Importing tools from {csv_file_path}...")
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            tools_imported = 0
            
            for row in reader:
                try:
                    # Create new tool instance
                    tool = DeveloperTool()
                    
                    # Basic fields
                    tool.name = row.get('Name', '').strip()
                    tool.category = row.get('Categories', '').strip()  # Note: CSV uses 'Categories'
                    tool.description = row.get('Description', '').strip()
                    tool.url = row.get('URL', '').strip()
                    tool.pricing = row.get('Pricing', '').strip()
                    
                    # Skip if no name
                    if not tool.name:
                        continue
                    
                    # Array fields - using correct CSV column names
                    tool.frameworks = json.dumps(parse_array_field(row.get('Frameworks', '')))
                    tool.supported_languages = json.dumps(parse_array_field(row.get('Supported_Languages', '')))  # This might not exist in CSV
                    tool.features = json.dumps(parse_array_field(row.get('Features', '')))
                    tool.native_integrations = json.dumps(parse_array_field(row.get('Native Integrations', '')))  # Note: space in name
                    tool.verified_integrations = json.dumps(parse_array_field(row.get('Verified Integrations', '')))  # Note: space in name
                    tool.notable_strengths = json.dumps(parse_array_field(row.get('Notable Strengths', '')))  # Note: space in name
                    tool.known_limitations = json.dumps(parse_array_field(row.get('Known Limitations', '')))  # Note: space in name
                    
                    # Score fields - using correct CSV column names
                    tool.maturity_score = parse_score_field(row.get('Maturity Score', ''))  # Note: space in name
                    tool.popularity_score = parse_score_field(row.get('Popularity Score', ''))  # Note: space in name
                    
                    # Add to database
                    db.session.add(tool)
                    tools_imported += 1
                    
                    if tools_imported % 10 == 0:
                        print(f"Imported {tools_imported} tools...")
                        
                except Exception as e:
                    print(f"Error importing tool {row.get('Name', 'Unknown')}: {e}")
                    continue
            
            # Commit all changes
            db.session.commit()
            print(f"Successfully imported {tools_imported} tools!")
            
            return True

def add_enhanced_data():
    """Add the enhanced data we collected during our research"""
    
    enhanced_data = {
        "Cody": {
            "pricing": "Free for hobbyists, Pro at $9/user/month, Enterprise starts at $19/user/month",
            "verified_integrations": ["VS Code", "JetBrains", "Visual Studio", "GitHub", "GitLab", "Bitbucket", "Jira", "Slack", "Notion"],
            "notable_strengths": ["Enterprise-focused security", "Deep codebase context", "Saves 5-6 hours per week", "Trusted by major companies"],
            "known_limitations": ["Context selection issues", "Subscription cost for advanced features"]
        },
        "Claude": {
            "pricing": "Free tier available, Pro at $20/month, Team at $30/user/month, API pay-as-you-go",
            "known_limitations": ["Usage limits even on paid plans", "Limited world knowledge", "Struggles with nuance and sarcasm"]
        },
        "AI2sql": {
            "pricing": "Free trial, paid plans from $7-24/month depending on database support",
            "verified_integrations": ["MySQL", "PostgreSQL", "SQL Server", "MongoDB", "BigQuery", "Redshift", "VS Code"],
            "notable_strengths": ["Accessible for non-experts", "Reduces SQL query errors", "Broad database support"],
        },
        "Devin": {
            "pricing": "Core plan pay-as-you-go starting at $20, Team plan $500/month, Enterprise custom pricing",
            "verified_integrations": ["VS Code", "Slack"],
            "notable_strengths": ["High autonomy for full development tasks", "Task automation", "Scalability"],
            "known_limitations": ["Lacks human nuance", "Inconsistent performance", "High cost"]
        },
        "Cursor": {
            "pricing": "Hobby free, Pro $20/month, Teams $40/user/month, Enterprise custom",
            "verified_integrations": ["OpenAI GPT-4o", "Anthropic Claude 3.5 Sonnet", "Google Gemini 2.5 Pro"],
            "notable_strengths": ["Multi-model support", "Strong documentation", "Contextual awareness"],
            "known_limitations": ["Performance issues with large codebases", "Context forgetfulness", "Limited support for niche languages"]
        }
    }
    
    with app.app_context():
        for tool_name, enhancements in enhanced_data.items():
            tool = DeveloperTool.query.filter_by(name=tool_name).first()
            if tool:
                if 'pricing' in enhancements:
                    tool.pricing = enhancements['pricing']
                if 'verified_integrations' in enhancements:
                    tool.verified_integrations = json.dumps(enhancements['verified_integrations'])
                if 'notable_strengths' in enhancements:
                    tool.notable_strengths = json.dumps(enhancements['notable_strengths'])
                if 'known_limitations' in enhancements:
                    tool.known_limitations = json.dumps(enhancements['known_limitations'])
                
                print(f"Enhanced data for {tool_name}")
        
        db.session.commit()
        print("Enhanced data added successfully!")

if __name__ == "__main__":
    # Path to the CSV file
    csv_path = "/home/ubuntu/upload/Codingtoolprofiledatabasesetup.csv"
    
    print("Starting data import...")
    
    if import_tools_from_csv(csv_path):
        print("Adding enhanced research data...")
        add_enhanced_data()
        print("Data import completed successfully!")
    else:
        print("Data import failed!")

