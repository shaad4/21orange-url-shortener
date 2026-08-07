from django.db import models

class Click(models.Model):
    """
    Model representing a single click event for a short URL.
    Tracks the short_code as a string reference (no foreign key to remain decoupled).
    """
    # Indexed to allow quick lookups when calculating count and last clicked timestamp
    short_code = models.CharField(max_length=6, db_index=True)
    clicked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Code: {self.short_code} clicked at {self.clicked_at}"
