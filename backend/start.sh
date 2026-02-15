#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating admin user..."
python manage.py create_admin || echo "Admin user setup complete"

echo "Seeding data..."
python manage.py seed_data || echo "Seed data may already exist"

echo "Starting Gunicorn..."
exec gunicorn config.wsgi --bind 0.0.0.0:$PORT
