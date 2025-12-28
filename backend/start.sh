#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser..."
python manage.py createsuperuser --noinput --email admin@acadworld.com --username admin || echo "Superuser already exists"

echo "Seeding data..."
python manage.py seed_data || echo "Seed data may already exist"

echo "Starting Gunicorn..."
exec gunicorn config.wsgi --bind 0.0.0.0:$PORT
