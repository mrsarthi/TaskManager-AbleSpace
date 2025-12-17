# How to Reset/Recover MySQL Password

## Option 1: Check Your .env File

Your MySQL password might be stored in `backend/.env` file. Look for:
```
DATABASE_URL="mysql://username:password@localhost:3306/taskmanager"
```

The password is between the colon `:` and the `@` symbol.

## Option 2: Reset MySQL Root Password (Windows)

### Method A: Using MySQL Command Line (if you have access)

1. **Stop MySQL service:**
   ```powershell
   net stop MySQL80
   ```
   (Replace `MySQL80` with your MySQL service name - check with `Get-Service | Where-Object {$_.Name -like "*mysql*"}`)

2. **Start MySQL in safe mode (skip grant tables):**
   ```powershell
   mysqld --skip-grant-tables --skip-networking
   ```

3. **Open a new terminal and connect:**
   ```bash
   mysql -u root
   ```

4. **Reset the password:**
   ```sql
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('newpassword') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Restart MySQL service normally:**
   ```powershell
   net start MySQL80
   ```

### Method B: Using MySQL Installer (Easier)

1. Open **MySQL Installer** (search in Start menu)
2. Click **Reconfigure** on your MySQL Server
3. Go through the configuration wizard
4. When prompted, set a new root password
5. Complete the configuration

### Method C: Using MySQL Workbench

1. Open **MySQL Workbench**
2. Try to connect - if it fails, you'll see connection options
3. Use "Reset Password" option if available

## Option 3: Check Common Default Passwords

Try these common defaults:
- Empty password (just press Enter)
- `root`
- `password`
- `admin`

## Option 4: Create a New MySQL User (if you have root access)

If you can access MySQL with another account:

```sql
CREATE USER 'taskmanager'@'localhost' IDENTIFIED BY 'your_new_password';
GRANT ALL PRIVILEGES ON taskmanager.* TO 'taskmanager'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env`:
```
DATABASE_URL="mysql://taskmanager:your_new_password@localhost:3306/taskmanager"
```

## Option 5: Reinstall MySQL (Last Resort)

If nothing works, you can reinstall MySQL:
1. Uninstall MySQL from Control Panel
2. Delete MySQL data folder (usually `C:\ProgramData\MySQL`)
3. Reinstall MySQL and set a new password during installation

## Quick Check Commands

Try connecting with different common passwords:
```bash
mysql -u root -p
# Try: (empty), root, password, admin
```

Check MySQL service status:
```powershell
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

