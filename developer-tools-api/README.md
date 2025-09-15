# Developer Tools API

A comprehensive REST API providing up-to-date information about modern development tools, including AI coding assistants, frameworks, databases, design tools, and more.

## 🚀 Features

- **Comprehensive Database**: 59+ developer tools with detailed information
- **Advanced Search**: Filter by category, features, frameworks, and more
- **RESTful API**: Clean, intuitive endpoints with JSON responses
- **Pagination**: Efficient data retrieval with pagination support
- **CORS Enabled**: Ready for frontend integration
- **Detailed Documentation**: Complete API documentation and OpenAPI spec
- **Deployment Ready**: Configured for Vercel and Render deployment

## 📊 Data Coverage

Our API includes detailed information about:
- **AI Coding Assistants**: GitHub Copilot, Cursor, Cody, Tabnine, etc.
- **Frameworks & Libraries**: React, Vue, Angular, Django, Flask, etc.
- **Databases & Backend**: Supabase, Firebase, PocketBase, etc.
- **Design Tools**: Figma, Balsamiq, Uizard, etc.
- **Payment Platforms**: Stripe, Plaid, etc.
- **Development Environments**: VS Code, Zed, JetBrains IDEs, etc.

## 🛠️ Quick Start

### Prerequisites
- Python 3.11+
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd developer-tools-api
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python src/main.py
   ```

The API will be available at `http://localhost:5001/api`

### Testing the API

Run the test script to verify everything is working:
```bash
python test_api.py
```

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:5001/api`
- **Production**: `https://your-domain.com/api`

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tools` | Get all tools with pagination and filtering |
| GET | `/tools/{id}` | Get specific tool by ID |
| GET | `/tools/categories` | Get all available categories |
| GET | `/tools/search` | Advanced search with multiple filters |
| GET | `/tools/stats` | Get API statistics |

### Example Requests

**Get all AI tools:**
```bash
curl "http://localhost:5001/api/tools/search?q=AI&category=Coding"
```

**Get tools with pagination:**
```bash
curl "http://localhost:5001/api/tools?page=1&per_page=10&summary=true"
```

**Get tool categories:**
```bash
curl "http://localhost:5001/api/tools/categories"
```

### Response Format

All responses are in JSON format:

```json
{
  "tools": [
    {
      "id": 1,
      "name": "GitHub Copilot",
      "category": "AI Coding Assistant",
      "description": "AI pair programmer...",
      "url": "https://github.com/features/copilot",
      "frameworks": ["React", "Vue", "Angular"],
      "features": ["Code completion", "Function generation"],
      "maturity_score": 9,
      "popularity_score": 10,
      "pricing": "$10/month individual"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 59,
    "has_next": true
  }
}
```

## 🏗️ Project Structure

```
developer-tools-api/
├── src/
│   ├── models/
│   │   ├── user.py          # User model (template)
│   │   └── tool.py          # Developer tool model
│   ├── routes/
│   │   ├── user.py          # User routes (template)
│   │   └── tools.py         # Tool API routes
│   ├── static/              # Static files
│   ├── database/
│   │   └── app.db          # SQLite database
│   ├── main.py             # Flask application entry point
│   └── import_data.py      # Data import script
├── docs/
│   ├── api_documentation.md # Comprehensive API docs
│   └── openapi.yaml        # OpenAPI specification
├── test_api.py             # API testing script
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel deployment config
├── render.yaml            # Render deployment config
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## 🚀 Deployment

The API is configured for deployment on multiple platforms:

### Vercel (Serverless)
```bash
npm install -g vercel
vercel
```

### Render (Traditional Hosting)
1. Connect your Git repository to Render
2. Use the provided `render.yaml` configuration
3. Deploy with one click

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🔧 Configuration

### Environment Variables
- `FLASK_ENV`: Set to "production" for production deployments
- `DATABASE_URL`: External database connection string (optional)
- `SECRET_KEY`: Flask secret key for production

### Database
- **Development**: SQLite (included)
- **Production**: PostgreSQL, MySQL, or serverless databases

## 📈 Data Sources

The API data is curated from multiple sources:
- Official tool documentation and websites
- Community feedback and reviews
- Market research and analysis
- Regular updates from tool maintainers

All data includes:
- **Basic Info**: Name, category, description, URL
- **Technical Details**: Frameworks, languages, features
- **Integrations**: Native and verified third-party integrations
- **Analysis**: Strengths, limitations, maturity/popularity scores
- **Pricing**: Current pricing information

## 🧪 Testing

### Automated Testing
```bash
python test_api.py
```

### Manual Testing
Use curl, Postman, or any HTTP client:
```bash
# Get API statistics
curl http://localhost:5001/api/tools/stats

# Search for React tools
curl "http://localhost:5001/api/tools/search?frameworks=React"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Adding New Tools
To add new tools to the database:
1. Update the CSV file with new tool information
2. Run the import script: `python src/import_data.py`
3. Test the API to ensure data is properly imported

## 📄 API Documentation

- **Markdown Documentation**: [api_documentation.md](api_documentation.md)
- **OpenAPI Specification**: [openapi.yaml](openapi.yaml)
- **Interactive Docs**: Available when API is running at `/docs` (if Swagger UI is enabled)

## 🔒 Security

- CORS enabled for cross-origin requests
- Input validation on all endpoints
- SQL injection protection via SQLAlchemy ORM
- Rate limiting recommended for production

## 📊 Performance

- Efficient database queries with proper indexing
- Pagination to handle large datasets
- JSON responses optimized for size
- Caching recommendations for production

## 🐛 Troubleshooting

### Common Issues

**Import Errors**
```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Database Issues**
```bash
# Reimport data if database is corrupted
python src/import_data.py
```

**Port Conflicts**
```bash
# Change port in src/main.py if 5001 is in use
app.run(host='0.0.0.0', port=5002, debug=True)
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Flask and SQLAlchemy communities
- All the amazing tool creators whose products are featured
- Contributors and maintainers

## 📞 Support

For questions, bug reports, or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ for the developer community**

