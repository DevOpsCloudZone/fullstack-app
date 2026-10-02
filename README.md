# TechCircle

TechCircle is a full-stack web application built with React, FastAPI, PostgreSQL, and Docker Compose.

The application is designed so that each developer can clone the repository and run an independent local environment with their own PostgreSQL database and Docker volume.

---

1. Install prerequisites
2. Clone repository
3. Create `.env`
4. Create `backend/.env`
5. Choose your local PostgreSQL password
6. Run `docker-compose up -d --build`
7. Open the application

   
## Required Software

### - Git
```bash
sudo yum install git -y
```
### - Docker
```bash
sudo yum install docker -y
sudo syatemctl start docker
sudo systemctl enable docker
sudo systemctl status docker 
```
### - Docker Compose

```bash
sudo mkdir -p /usr/libexec/docker/cli-plugins

sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

docker-compose version
```

### - Docker Buildx
```bash
mkdir -p ~/.docker/cli-plugins && \
curl -SL https://github.com/docker/buildx/releases/download/v0.17.0/buildx-v0.17.0.linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') \
-o ~/.docker/cli-plugins/docker-buildx && \
chmod +x ~/.docker/cli-plugins/docker-buildx
```
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
 `.env`
 `backend/.env`

Both files contain local configuration and secrets and must NOT be committed to Git.
The repository already contains .env.example as a safe template.
### 1. Root `.env`
The root .env is used by Docker Compose.
Create it from the project root:
```bash
 cp .env.example .env
```

```bash
 vim .env
```

Set your own local PostgreSQL password:
DB_PASSWORD = your_own_password

Example:
DB_PASSWORD = MyLocalPassword123

You can choose your own password.
You do NOT need to use another developer's password.

### 2. Backend .env

The backend also requires its own .env.

Create:
```bash
vim backend/.env
```
Add:

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=techcircle
DB_USER=techcircle_user
DB_PASSWORD=your_own_password
COOKIE_SECURE=false
```

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

--------------------------------------------------

Why Are There Two .env Files?
The project uses two .env files for different purposes.  
- Root .env — Docker Compose reads this file for PostgreSQL configuration.
- It provides DB_PASSWORD, which is passed to PostgreSQL as POSTGRES_PASSWORD.
- Backend .env — FastAPI reads this file for its database connection settings.
- It contains DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.
- The DB_PASSWORD must be the same in both files so the backend can connect to PostgreSQL.
- Both .env files are ignored by Git because they contain environment-specific configuration and secrets.

Use the same password that you configured in the root `.env`.

FastAPI uses these values to connect to PostgreSQL.

----------------------------------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------------
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
```bash
docker-compose up -d --build
```
Check the containers:
```bash
docker-compose ps
```
The services should be running:
frontend
backend
postgres


## Application Access
Open the application in a browser:
http://localhost


If running on an AWS EC2 server, use the server's public IP:
```bash
http://<EC2-PUBLIC-IP>:80
```

## Verify Database Initialization

Run:

```bash
docker-compose exec postgres psql -U techcircle_user -d techcircle -c "\dt"
```

## Verify Database library details
```bash
SELECT * FROM users;
```
```bash
SELECT * FROM user_library;
```
For a more detailed view showing the user's name and email along with saved library items, create a database view:
```sql
CREATE OR REPLACE VIEW library AS
SELECT
    ul.id,
    ul.user_id,
    u.full_name,
    u.email,
    ul.item_id,
    ul.item_type,
    ul.saved_at
FROM user_library ul
JOIN users u ON ul.user_id = u.id;
```

After creating the view, you can retrieve the combined data using:

```sql
SELECT * FROM library;
```


### Sign Out & Session Verification

When a user clicks **Sign Out**, the current login session is removed.  
The user account and saved library items are **not deleted** from the database.

```sql
SELECT * FROM user_sessions;
```

The user account and library data remain in the database; only the active session is removed.


## Project Status

TechCircle is a full-stack application built with:

- React + Vite
- FastAPI
- PostgreSQL
- Docker & Docker Compose
- Nginx

The application supports user authentication, protected content, and database-backed My Library functionality.

The project is currently being developed and will continue to evolve with additional DevOps practices such as CI/CD, container image management, security improvements, Terraform and Kubernetes deployment.

---

## Author

**Umesh Aveti**  
DevOps & Cloud Engineer

GitHub: `https://github.com/DevOpsCloudZone`




