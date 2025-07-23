FROM python:3.11-slim

WORKDIR /app

# Set Python path to include the current directory
ENV PYTHONPATH=/app:$PYTHONPATH

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Ensure all directories are properly structured as Python packages
RUN touch functions/__init__.py || true
RUN touch utils/__init__.py || true
RUN touch database/__init__.py || true

EXPOSE 8002

CMD ["python", "langgraph_api.py"]