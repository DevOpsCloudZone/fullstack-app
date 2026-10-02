# TechCircle

TechCircle is a full-stack web application built with React, FastAPI, PostgreSQL, and Docker Compose.

The application is designed so that each developer can clone the repository and run an independent local environment with their own PostgreSQL database and Docker volume.

---
## Required Software

### - Git
### - Docker
### - Docker Compose

sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
docker-compose version

### - Docker Buildx

mkdir -p ~/.docker/cli-plugins && \
curl -SL https://github.com/docker/buildx/releases/download/v0.17.0/buildx-v0.17.0.linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') \
-o ~/.docker/cli-plugins/docker-buildx && \
chmod +x ~/.docker/cli-plugins/docker-buildx

## Tech Stack

### Frontend
- React
- Vite
- Nginx

### Backend
- Python
- FastAPI
- Uvicorn
- PostgreSQL

### Database
- PostgreSQL 15

### DevOps
- Docker
- Docker Compose
- Git
- GitHub

---

# Project Structure
```
techcircle-fullstack/
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── database/
│   └── init.sql
│
├── docker-compose.yml
├── .env
```


## Environment Files
 The project requires two .env files.
 They have different purposes.
 .env
 backend/.env

Both files contain local configuration and secrets and must NOT be committed to Git.
The repository already contains .env.example as a safe template.
### 1. Root .env
The root .env is used by Docker Compose.
Create it from the project root:
---> cp .env.example .env

--->vim .env
Set your own local PostgreSQL password:
DB_PASSWORD=your_own_password

Example:
DB_PASSWORD=MyLocalPassword123

You can choose your own password.
You do NOT need to use another developer's password.

### 2. Backend .env

The backend also requires its own .env.

Create:
---> vim backend/.env

Add:
DB_HOST=postgres
DB_PORT=5432
DB_NAME=techcircle
DB_USER=techcircle_user
DB_PASSWORD=MyLocalPassword123
COOKIE_SECURE=false

The DB_PASSWORD must be the same password used in the root .env.

For example:
-------------
```text
Root .env
    ↓
DB_PASSWORD=MyLocalPassword123

Backend .env
    ↓
DB_PASSWORD=MyLocalPassword123
```

---------------------------------------------------
--------------------------------------------------

### Why Are There Two .env Files?
They are used by different parts of the application.
#### Root .env
Docker Compose reads:
.env

and uses:
DB_PASSWORD=MyLocalPassword123

for PostgreSQL:
POSTGRES_PASSWORD: ${DB_PASSWORD}

#### Backend .env
FastAPI reads:
backend/.env

uses these values :
DB_HOST=postgres
DB_PORT=5432
DB_NAME=techcircle
DB_USER=techcircle_user
DB_PASSWORD=MyLocalPassword123

to connect to PostgreSQL.

---------------------------------------
---------------------------------------
## Architecture:
```text
                    Browser
                       │
                       ↓
                Frontend / Nginx
                       │
                       │ /api/
                       ↓
                 Backend / FastAPI
                       │
                       │
                       ↓
                PostgreSQL
```
## Start the application
Run:
#### docker-compose up -d --build

Check the containers:
#### docker-compose ps

The services should be running:
frontend
backend
postgres

## Application Access
Open the application in a browser:
http://localhost

If running on an AWS EC2 server, use the server's public IP:
http://<EC2-PUBLIC-IP>


