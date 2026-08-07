import random
import string
from django.db import models

class Url(models.Model):
    """
    Model storing the mapping between a generated 6-character short code
    and the target long URL.
    """
    long_url = models.URLField(max_length=2048)
    short_code = models.CharField(max_length=6, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Generate a short code if it doesn't already exist
        if not self.short_code:
            self.short_code = self.generate_unique_code()
        super().save(*args, **kwargs)

    @classmethod
    def generate_unique_code(cls):
        """
        Generates a 6-character short code. If it collides, retries up to 5 times.
        """
        characters = string.ascii_letters + string.digits
        for _ in range(5):
            code = ''.join(random.choices(characters, k=6))
            if not cls.objects.filter(short_code=code).exists():
                return code
        raise ValueError("Failed to generate a unique short code after 5 attempts.")

    def __str__(self):
        return f"{self.short_code} -> {self.long_url}"
