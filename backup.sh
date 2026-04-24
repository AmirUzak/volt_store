#!/bin/bash

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/volt_db_$DATE.sql"
KEEP_DAYS=7

mkdir -p $BACKUP_DIR

echo "[$DATE] Starting backup..."
docker exec volt-postgres pg_dump -U volt_app volt_db > $BACKUP_FILE

if [ $? -eq 0 ]; then
    gzip $BACKUP_FILE
    echo "[$DATE] Backup saved: $BACKUP_FILE.gz"
else
    echo "[$DATE] Backup FAILED!"
    exit 1
fi

# Удалить старые бэкапы
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$DATE] Old backups cleaned (older than $KEEP_DAYS days)"
