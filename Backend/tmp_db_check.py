from app.core.config import settings
from sqlalchemy import create_engine, text
import traceback
print('URL=', settings.database_url)
try:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('OK')
except Exception as ex:
    print(type(ex).__name__, ex)
    traceback.print_exc()
