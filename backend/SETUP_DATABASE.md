# Database Setup Instructions

## Quick Setup

### Step 1: Create the MySQL Database

**Option A: Using MySQL Command Line**
```bash
# Connect to MySQL (enter your password when prompted)
mysql -u root -p

# Create the database
CREATE DATABASE taskmanager;

# Exit MySQL
exit
```

**Option B: One-line command**
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS taskmanager;"
```

**Option C: Using the SQL script**
```bash
mysql -u root -p < setup-database.sql
```

### Step 2: Update .env File

Make sure your `backend/.env` file has the correct MySQL connection string:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/taskmanager"
```

Replace `YOUR_PASSWORD` with your actual MySQL root password.

### Step 3: Generate Prisma Client and Run Migrations

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations (this will create all tables)
npm run prisma:migrate
```

When prompted for a migration name, you can use: `init`

### Step 4: Verify Setup

You can verify the tables were created by:

```bash
# Open Prisma Studio to view your database
npm run prisma:studio
```

Or connect to MySQL and check:

```bash
mysql -u root -p taskmanager

# List all tables
SHOW TABLES;

# View a specific table structure
DESCRIBE User;
DESCRIBE Task;
```

## Troubleshooting

### If you get "Access denied" error:
- Make sure MySQL is running
- Check your username and password
- Try: `mysql -u root -p` and enter password manually

### If you get "Database already exists" error:
- That's fine! The database is already created
- Skip to Step 3

### If Prisma migration fails:
- Make sure the database exists
- Check your DATABASE_URL in .env file
- Ensure MySQL is running: `mysql -u root -p -e "SELECT 1;"`

