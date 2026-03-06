from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    columns_to_add = [
        ('record_id', 'INTEGER'),
        ('remarks', 'VARCHAR'),
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            # Check if column exists
            result = conn.execute(text(f"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='{col_name}'"))
            exists = result.scalar() > 0
            
            if not exists:
                # Add the column
                conn.execute(text(f'ALTER TABLE audit_logs ADD COLUMN {col_name} {col_type}'))
                conn.commit()
                print(f'✓ {col_name} column added to audit_logs table')
            else:
                print(f'✓ {col_name} column already exists')
        except Exception as e:
            print(f'Error adding {col_name}: {e}')
