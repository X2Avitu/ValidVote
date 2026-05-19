FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
RUN pip install --no-cache-dir fastapi uvicorn pydantic

# Copy codebase
COPY . .

# Expose port
EXPOSE 8000

# Command to run uvicorn server
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]
