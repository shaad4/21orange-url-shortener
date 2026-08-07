from rest_framework import serializers
from urls_app.models import Url

class UrlSerializer(serializers.ModelSerializer):
    """
    Serializer to validate target long URL inputs and present code details.
    """
    class Meta:
        model = Url
        fields = ['id', 'long_url', 'short_code', 'created_at']
        read_only_fields = ['id', 'short_code', 'created_at']
