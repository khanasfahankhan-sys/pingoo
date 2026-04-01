web: cd backend && python manage.py migrate && gunicorn pingoo_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --log-file -
