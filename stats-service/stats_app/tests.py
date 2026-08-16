from django.test import TestCase
from stats_app.models import Click


class HealthCheckTests(TestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)


class RecordClickTests(TestCase):
    def test_record_click_creates_entry(self):
        response = self.client.post(
            '/api/clicks/',
            data={"short_code": "abc123"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Click.objects.filter(short_code="abc123").count(), 1)

    def test_record_click_requires_short_code(self):
        response = self.client.post(
            '/api/clicks/', data={}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)


class GetStatsTests(TestCase):
    def test_stats_for_unclicked_code(self):
        response = self.client.get('/api/stats/neverclicked/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["click_count"], 0)
        self.assertIsNone(data["last_clicked"])

    def test_stats_counts_clicks(self):
        Click.objects.create(short_code="xyz789")
        Click.objects.create(short_code="xyz789")
        response = self.client.get('/api/stats/xyz789/')
        data = response.json()
        self.assertEqual(data["click_count"], 2)
        self.assertIsNotNone(data["last_clicked"])