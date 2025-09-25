# Backend Dockerfile
FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y build-essential default-libmysqlclient-dev curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first to leverage caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy source
COPY . /app

# Expose port
EXPOSE 8000

# Env to make Python unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Default start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
