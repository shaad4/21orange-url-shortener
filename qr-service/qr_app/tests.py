from unittest.mock import patch, Mock
from django.test import TestCase


class HealthCheckTests(TestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)


class GenerateQrTests(TestCase):
    @patch('qr_app.views.requests.get')
    def test_generate_qr_returns_404_when_code_missing(self, mock_get):
        mock_get.return_value = Mock(status_code=404)
        response = self.client.get('/api/qr/zzzzzz/')
        self.assertEqual(response.status_code, 404)

    @patch('qr_app.views.requests.get')
    def test_generate_qr_returns_png_when_code_exists(self, mock_get):
        mock_get.return_value = Mock(status_code=200, raise_for_status=lambda: None)
        response = self.client.get('/api/qr/abc123/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'image/png')

    def test_generate_qr_invalid_format(self):
        # Too long
        response = self.client.get('/api/qr/abcdefgh/')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "Invalid short code format"})

        # Special characters
        response = self.client.get('/api/qr/abc-12/')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "Invalid short code format"})

    @patch('qr_app.views.requests.get')
    def test_generate_qr_request_exception(self, mock_get):
        import requests
        mock_get.side_effect = requests.RequestException("Connection error")
        response = self.client.get('/api/qr/abc123/')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"error": "failed to contact shortener service"})