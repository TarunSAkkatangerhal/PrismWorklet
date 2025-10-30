# ETL Migration Script

ETL script to migrate data from `old_data.csv` into a MySQL database (colleges, users, worklets, associations).

## Features

- **Robust CSV encoding detection**: Tries UTF-8, UTF-8-sig, CP1252, Latin-1 with fallback.
- **NaN handling**: Converts pandas NaN values to SQL-compatible `None` (prevents MySQL "nan can not be used" errors).
- **CLI flags**:
  - `--encoding <encoding>`: Force a specific CSV encoding (e.g., `utf-8`, `cp1252`).
  - `--test-parse`: Parse CSV and exit without writing to DB (safe validation).
- **Environment variable support**: Set `OLD_DATA_CSV` to use a custom CSV path.

## Requirements

- Python 3.12+
- pandas
- sqlalchemy
- pymysql

Install dependencies:
```powershell
pip install pandas sqlalchemy pymysql
```

## Usage

### Parse CSV only (no DB writes)
Safe mode to verify CSV encoding and structure:
```powershell
python etl_migration.py --test-parse
```

### Full ETL run (DB writes)
Run the full migration:
```powershell
python etl_migration.py
```

### Force a specific encoding
If you know the CSV encoding, force it:
```powershell
python etl_migration.py --encoding cp1252
```

### Use a custom CSV path
Set the `OLD_DATA_CSV` environment variable:
```powershell
$env:OLD_DATA_CSV = 'D:\path\to\custom.csv'
python etl_migration.py
```

## Common Issues

### UnicodeDecodeError
**Symptom**: `'utf-8' codec can't decode byte 0xff...`

**Cause**: CSV file is not UTF-8 (likely Windows-1252/CP1252 or has BOM).

**Solution**: The script automatically tries multiple encodings. If it fails, force an encoding:
```powershell
python etl_migration.py --encoding cp1252
```

### pymysql.err.ProgrammingError: nan can not be used with MySQL
**Symptom**: MySQL rejects NaN float values.

**Cause**: Pandas NaN values passed directly to SQL parameters.

**Solution**: Already fixed in the script using `nan_to_none()` helper.

### ValueError: The truth value of a Series is ambiguous
**Symptom**: Error when checking `if pd.isna(name)` on a Series.

**Cause**: Passing entire DataFrame column (Series) instead of scalar values.

**Solution**: Already fixed by iterating rows and extracting scalar values with `row.get(...)`.

## Database Schema

The script expects the following tables:
- `colleges` (college_id, college_name)
- `users` (user_id, name, email, password_hash, role, college_id, is_active)
- `Prism_Worklet` (WorkletID, Title, StatusID, CreatedMentorID, CollegeID, StartDate, CreatedOn, RiskStatus, Performance, IsActive)
- `user_worklet_association` (user_id, WorkletID, role_in_worklet)

## Development

To test changes without DB writes, use `--test-parse`:
```powershell
python etl_migration.py --test-parse
```

For detailed error logs, consider adding logging (not yet implemented).

## License

MIT (or your organization's license).
