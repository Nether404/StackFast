from flask import Blueprint, jsonify, request
from src.models.tool import DeveloperTool, db
from sqlalchemy import or_, and_

tools_bp = Blueprint('tools', __name__)

@tools_bp.route('/tools', methods=['GET'])
def get_tools():
    """
    Get all tools with optional filtering and pagination
    Query parameters:
    - category: Filter by category
    - search: Search in name, description, and features
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - summary: Return summary view (true/false)
    """
    # Get query parameters
    category = request.args.get('category')
    search = request.args.get('search')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    summary = request.args.get('summary', 'false').lower() == 'true'
    
    # Build query
    query = DeveloperTool.query
    
    # Apply filters
    if category:
        query = query.filter(DeveloperTool.category.ilike(f'%{category}%'))
    
    if search:
        search_filter = or_(
            DeveloperTool.name.ilike(f'%{search}%'),
            DeveloperTool.description.ilike(f'%{search}%'),
            DeveloperTool.features.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    # Get paginated results
    pagination = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    tools = pagination.items
    
    # Choose serialization method
    if summary:
        tools_data = [tool.to_summary_dict() for tool in tools]
    else:
        tools_data = [tool.to_dict() for tool in tools]
    
    return jsonify({
        'tools': tools_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })

@tools_bp.route('/tools/<int:tool_id>', methods=['GET'])
def get_tool(tool_id):
    """Get a specific tool by ID"""
    tool = DeveloperTool.query.get_or_404(tool_id)
    return jsonify(tool.to_dict())

@tools_bp.route('/tools/categories', methods=['GET'])
def get_categories():
    """Get all unique categories"""
    categories = db.session.query(DeveloperTool.category).distinct().all()
    categories_list = [cat[0] for cat in categories if cat[0]]
    return jsonify({
        'categories': sorted(categories_list)
    })

@tools_bp.route('/tools/search', methods=['GET'])
def search_tools():
    """
    Advanced search endpoint
    Query parameters:
    - q: Search query
    - category: Filter by category
    - min_maturity: Minimum maturity score
    - min_popularity: Minimum popularity score
    - frameworks: Comma-separated list of frameworks
    - languages: Comma-separated list of languages
    """
    query_text = request.args.get('q', '')
    category = request.args.get('category')
    min_maturity = request.args.get('min_maturity', type=int)
    min_popularity = request.args.get('min_popularity', type=int)
    frameworks = request.args.get('frameworks', '').split(',') if request.args.get('frameworks') else []
    languages = request.args.get('languages', '').split(',') if request.args.get('languages') else []
    
    # Build query
    query = DeveloperTool.query
    
    # Text search
    if query_text:
        search_filter = or_(
            DeveloperTool.name.ilike(f'%{query_text}%'),
            DeveloperTool.description.ilike(f'%{query_text}%'),
            DeveloperTool.features.ilike(f'%{query_text}%')
        )
        query = query.filter(search_filter)
    
    # Category filter
    if category:
        query = query.filter(DeveloperTool.category.ilike(f'%{category}%'))
    
    # Score filters
    if min_maturity:
        query = query.filter(DeveloperTool.maturity_score >= min_maturity)
    
    if min_popularity:
        query = query.filter(DeveloperTool.popularity_score >= min_popularity)
    
    # Framework filters
    if frameworks:
        framework_filters = []
        for framework in frameworks:
            if framework.strip():
                framework_filters.append(DeveloperTool.frameworks.ilike(f'%{framework.strip()}%'))
        if framework_filters:
            query = query.filter(or_(*framework_filters))
    
    # Language filters
    if languages:
        language_filters = []
        for language in languages:
            if language.strip():
                language_filters.append(DeveloperTool.supported_languages.ilike(f'%{language.strip()}%'))
        if language_filters:
            query = query.filter(or_(*language_filters))
    
    tools = query.all()
    return jsonify({
        'tools': [tool.to_dict() for tool in tools],
        'count': len(tools)
    })

@tools_bp.route('/tools', methods=['POST'])
def create_tool():
    """Create a new tool (for admin use)"""
    data = request.json
    
    # Validate required fields
    if not data.get('name') or not data.get('category'):
        return jsonify({'error': 'Name and category are required'}), 400
    
    # Check if tool already exists
    existing_tool = DeveloperTool.query.filter_by(name=data['name']).first()
    if existing_tool:
        return jsonify({'error': 'Tool with this name already exists'}), 409
    
    tool = DeveloperTool.from_dict(data)
    db.session.add(tool)
    db.session.commit()
    
    return jsonify(tool.to_dict()), 201

@tools_bp.route('/tools/<int:tool_id>', methods=['PUT'])
def update_tool(tool_id):
    """Update a tool (for admin use)"""
    tool = DeveloperTool.query.get_or_404(tool_id)
    data = request.json
    
    # Update fields
    if 'name' in data:
        tool.name = data['name']
    if 'category' in data:
        tool.category = data['category']
    if 'description' in data:
        tool.description = data['description']
    if 'url' in data:
        tool.url = data['url']
    if 'frameworks' in data:
        tool.frameworks = tool._serialize_json_field(data['frameworks'])
    if 'supported_languages' in data:
        tool.supported_languages = tool._serialize_json_field(data['supported_languages'])
    if 'features' in data:
        tool.features = tool._serialize_json_field(data['features'])
    if 'native_integrations' in data:
        tool.native_integrations = tool._serialize_json_field(data['native_integrations'])
    if 'verified_integrations' in data:
        tool.verified_integrations = tool._serialize_json_field(data['verified_integrations'])
    if 'notable_strengths' in data:
        tool.notable_strengths = tool._serialize_json_field(data['notable_strengths'])
    if 'known_limitations' in data:
        tool.known_limitations = tool._serialize_json_field(data['known_limitations'])
    if 'maturity_score' in data:
        tool.maturity_score = data['maturity_score']
    if 'popularity_score' in data:
        tool.popularity_score = data['popularity_score']
    if 'pricing' in data:
        tool.pricing = data['pricing']
    
    db.session.commit()
    return jsonify(tool.to_dict())

@tools_bp.route('/tools/<int:tool_id>', methods=['DELETE'])
def delete_tool(tool_id):
    """Delete a tool (for admin use)"""
    tool = DeveloperTool.query.get_or_404(tool_id)
    db.session.delete(tool)
    db.session.commit()
    return '', 204

@tools_bp.route('/tools/stats', methods=['GET'])
def get_stats():
    """Get API statistics"""
    total_tools = DeveloperTool.query.count()
    categories = db.session.query(DeveloperTool.category).distinct().count()
    
    # Category breakdown
    category_stats = db.session.query(
        DeveloperTool.category, 
        db.func.count(DeveloperTool.id)
    ).group_by(DeveloperTool.category).all()
    
    return jsonify({
        'total_tools': total_tools,
        'total_categories': categories,
        'category_breakdown': {cat: count for cat, count in category_stats}
    })

