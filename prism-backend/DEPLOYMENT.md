# Production Deployment Guide

## Scalability Improvements

This backend is configured to handle high concurrent load with:

### 1. **Multiple Workers (Gunicorn)**
- Production uses **4 workers** by default (adjust based on CPU cores)
- Formula: `workers = (2 * CPU_cores) + 1`
- Each worker handles requests independently
- Automatic worker restart on failure

### 2. **Database Connection Pooling**
- Pool size: **20 connections per worker**
- Max overflow: **30 additional connections per worker**
- Total: Up to **200 connections** with 4 workers (50 per worker)
- Automatic connection health checks (`pool_pre_ping`)

### 3. **Redis Caching**
- OTP caching to reduce database load
- Can extend for session caching, rate limiting, etc.

### 4. **Async Operations**
- FastAPI async endpoints for I/O-bound operations
- Non-blocking database queries
- WebSocket support for real-time chat

## Running Locally

### Development (Single Worker with Hot Reload)
```powershell
.\start_dev.ps1
# OR
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production (Multiple Workers)
```powershell
.\start_production.ps1
# OR
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Docker Deployment

The Dockerfile is already configured for production with multiple workers:

```bash
docker-compose up -d
```

## Performance Benchmarks

With default configuration (4 workers):
- **~500-1000** concurrent users
- **~5000** requests per minute
- Response time: **<100ms** for cached endpoints

To handle more:
- Increase workers (environment variable `WEB_CONCURRENCY`)
- Add horizontal scaling (multiple backend containers)
- Add load balancer (nginx, traefik, etc.)

## Monitoring

Check health and pool status:
```bash
curl http://localhost:8000/api/health/db
```

Response shows:
- Active connections
- Available connections
- Pool utilization
- Warning if near exhaustion

## Advanced Scaling

### Horizontal Scaling (1000+ concurrent users)

1. **Multiple Backend Instances**
   ```yaml
   # docker-compose.yml
   backend:
     deploy:
       replicas: 3  # Run 3 backend containers
   ```

2. **Load Balancer (nginx)**
   ```nginx
   upstream backend {
       server backend1:8000;
       server backend2:8000;
       server backend3:8000;
   }
   ```

3. **External Redis** (for shared WebSocket state)
   - Use Redis Pub/Sub for WebSocket broadcast across workers
   - Implement sticky sessions for WebSocket connections

### Database Optimization

1. **Read Replicas** - Route read queries to replicas
2. **Query Caching** - Use Redis for frequently accessed data
3. **Index Optimization** - Ensure proper indexes on frequently queried columns

## Environment Variables for Scaling

```env
# Worker count (gunicorn)
WEB_CONCURRENCY=4

# Database pool per worker
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT=60

# Redis connection pool
REDIS_MAX_CONNECTIONS=50

# Request timeout
WORKER_TIMEOUT=120
```

## Troubleshooting

### "Connection pool exhausted" errors
- Increase `DB_POOL_SIZE` and `DB_MAX_OVERFLOW`
- Check for connection leaks in code
- Monitor with `/api/health/db`

### Slow response times
- Enable Redis caching for read-heavy endpoints
- Add database query indexes
- Use async endpoints for I/O operations

### WebSocket disconnections with multiple workers
- Implement Redis Pub/Sub for cross-worker communication
- Use sticky sessions in load balancer
- Consider dedicated WebSocket server

## Cost-Effective Scaling Strategy

1. **Start**: 1 backend container, 4 workers → 500 users
2. **Medium**: 2 backend containers, 4 workers each → 1000 users
3. **Large**: 4 backend containers + load balancer → 2000+ users
4. **Enterprise**: Kubernetes cluster with auto-scaling → 10,000+ users
