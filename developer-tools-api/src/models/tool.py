from src.models.user import db
import json

class DeveloperTool(db.Model):
    __tablename__ = 'developer_tools'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(500), nullable=True)
    
    # JSON fields for arrays
    frameworks = db.Column(db.Text, nullable=True)  # JSON array
    supported_languages = db.Column(db.Text, nullable=True)  # JSON array
    features = db.Column(db.Text, nullable=True)  # JSON array
    native_integrations = db.Column(db.Text, nullable=True)  # JSON array
    verified_integrations = db.Column(db.Text, nullable=True)  # JSON array
    notable_strengths = db.Column(db.Text, nullable=True)  # JSON array
    known_limitations = db.Column(db.Text, nullable=True)  # JSON array
    
    # Scoring fields
    maturity_score = db.Column(db.Integer, nullable=True)  # 1-10
    popularity_score = db.Column(db.Integer, nullable=True)  # 1-10
    
    # Additional fields for enhanced data
    pricing = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __repr__(self):
        return f'<DeveloperTool {self.name}>'

    def _parse_json_field(self, field_value):
        """Helper method to parse JSON fields safely"""
        if field_value is None or field_value == "Not specified":
            return []
        try:
            if isinstance(field_value, str):
                return json.loads(field_value)
            return field_value if isinstance(field_value, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def _serialize_json_field(self, field_value):
        """Helper method to serialize arrays to JSON"""
        if field_value is None:
            return None
        if isinstance(field_value, list):
            return json.dumps(field_value)
        return field_value

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'url': self.url,
            'frameworks': self._parse_json_field(self.frameworks),
            'supported_languages': self._parse_json_field(self.supported_languages),
            'features': self._parse_json_field(self.features),
            'native_integrations': self._parse_json_field(self.native_integrations),
            'verified_integrations': self._parse_json_field(self.verified_integrations),
            'notable_strengths': self._parse_json_field(self.notable_strengths),
            'known_limitations': self._parse_json_field(self.known_limitations),
            'maturity_score': self.maturity_score,
            'popularity_score': self.popularity_score,
            'pricing': self.pricing,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_summary_dict(self):
        """Returns a condensed version for list endpoints"""
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'url': self.url,
            'maturity_score': self.maturity_score,
            'popularity_score': self.popularity_score
        }

    @classmethod
    def from_dict(cls, data):
        """Create a DeveloperTool instance from a dictionary"""
        tool = cls()
        tool.name = data.get('name')
        tool.category = data.get('category')
        tool.description = data.get('description')
        tool.url = data.get('url')
        tool.frameworks = tool._serialize_json_field(data.get('frameworks'))
        tool.supported_languages = tool._serialize_json_field(data.get('supported_languages'))
        tool.features = tool._serialize_json_field(data.get('features'))
        tool.native_integrations = tool._serialize_json_field(data.get('native_integrations'))
        tool.verified_integrations = tool._serialize_json_field(data.get('verified_integrations'))
        tool.notable_strengths = tool._serialize_json_field(data.get('notable_strengths'))
        tool.known_limitations = tool._serialize_json_field(data.get('known_limitations'))
        tool.maturity_score = data.get('maturity_score')
        tool.popularity_score = data.get('popularity_score')
        tool.pricing = data.get('pricing')
        return tool

