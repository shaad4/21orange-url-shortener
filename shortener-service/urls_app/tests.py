from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from urls_app.models import Url


class HealthCheckTests(TestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


class ShortenUrlTests(TestCase):
    def test_shorten_creates_url_and_returns_code(self):
        response = self.client.post(
            '/api/shorten/',
            data={"long_url": "https://example.com/some/long/path"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("short_code", data)
        self.assertEqual(len(data["short_code"]), 6)
        self.assertTrue(Url.objects.filter(short_code=data["short_code"]).exists())

    def test_shorten_rejects_invalid_url(self):
        response = self.client.post(
            '/api/shorten/',
            data={"long_url": "not-a-url"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    @patch('urls_app.models.Url.objects.filter')
    def test_generate_unique_code_fails_after_5_attempts(self, mock_filter):
        mock_filter.return_value.exists.return_value = True
        with self.assertRaises(ValueError):
            Url.generate_unique_code()

    @patch('urls_app.models.Url.generate_unique_code')
    def test_shorten_url_handles_value_error(self, mock_generate):
        mock_generate.side_effect = ValueError("Failed to generate a unique short code after 5 attempts.")
        response = self.client.post(
            '/api/shorten/',
            data={"long_url": "https://example.com"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"error": "Failed to generate a unique short code after 5 attempts."})


class UrlDetailTests(TestCase):
    def test_url_detail_returns_404_for_missing_code(self):
        response = self.client.get('/api/urls/zzzzzz/')
        self.assertEqual(response.status_code, 404)

    def test_url_detail_returns_mapping(self):
        url_obj = Url.objects.create(long_url="https://example.com")
        response = self.client.get(f'/api/urls/{url_obj.short_code}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["long_url"], "https://example.com")


class RedirectTests(TestCase):
    def test_redirect_returns_302_to_long_url(self):
        url_obj = Url.objects.create(long_url="https://example.com")
        response = self.client.get(f'/r/{url_obj.short_code}/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "https://example.com")


class UrlModelTests(TestCase):
    def test_url_string_representation(self):
        url_obj = Url(long_url="https://example.com", short_code="abc123")
        self.assertEqual(str(url_obj), "abc123 -> https://example.com")