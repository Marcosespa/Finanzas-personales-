# 🐘 Configuración de PostgreSQL para Finanzas Personales

## ✅ Respuesta a tu pregunta

**SÍ, puedes crear múltiples bases de datos en el mismo contenedor PostgreSQL.** No necesitas crear otra imagen de PostgreSQL.

## 📊 Estado Actual

Ya se creó la base de datos `finanzaspersonales_db` en el mismo contenedor que `satrack_db`:

- **Contenedor PostgreSQL**: `satrack_db` (postgres:15-alpine)
- **Base de datos satrack**: `satrack_db`
- **Base de datos finanzaspersonales**: `finanzaspersonales_db` ✨ (NUEVA)

### Credenciales de PostgreSQL para Finanzas Personales:

- **Usuario**: `finanzas_user`
- **Contraseña**: `Finanzas2026!`
- **Base de datos**: `finanzaspersonales_db`
- **Host**: `localhost` (desde el host) o `satrack_db` (desde otro contenedor)
- **Puerto**: `5432`

## 🔧 Configuración

### Opción 1: Usar PostgreSQL (Recomendado para producción)

1. **Instalar la dependencia de PostgreSQL**:
   ```bash
   cd backend
   source venv/bin/activate
   pip install psycopg2-binary
   ```
   *(Ya se agregó al requirements.txt)*

2. **Crear archivo `.env` en la carpeta `backend/`**:
   ```bash
   cd backend
   cp ../env.example .env
   ```

3. **Editar `backend/.env` y cambiar la línea DATABASE_URL**:
   ```env
   DATABASE_URL=postgresql://finanzas_user:Finanzas2026!@localhost:5432/finanzaspersonales_db
   ```

4. **Aplicar las migraciones**:
   ```bash
   cd backend
   source venv/bin/activate
   flask db upgrade
   ```

### Opción 2: Usar SQLite (Por defecto, desarrollo)

Si prefieres seguir usando SQLite, no necesitas hacer nada. La aplicación usará SQLite por defecto.

## 🐳 Configuración con Docker

### Si usas docker-compose:

El `docker-compose.yml` ya está preparado. Para usar PostgreSQL:

1. **Crear archivo `.env` en la raíz del proyecto**:
   ```env
   DATABASE_URL=postgresql://finanzas_user:Finanzas2026!@host.docker.internal:5432/finanzaspersonales_db
   JWT_SECRET_KEY=tu-clave-secreta-aqui
   ```

2. **Reconstruir el contenedor**:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

3. **Aplicar migraciones dentro del contenedor**:
   ```bash
   docker exec -it finanzas-backend flask db upgrade
   ```

## 🔍 Verificar la Configuración

### Ver bases de datos disponibles:
```bash
docker exec satrack_db psql -U satrack_user -d postgres -c "\l"
```

### Probar conexión desde el host:
```bash
psql -h localhost -p 5432 -U finanzas_user -d finanzaspersonales_db
# Contraseña: Finanzas2026!
```

### Probar conexión desde el contenedor:
```bash
docker exec -it finanzas-backend python -c "from app import create_app; app = create_app(); print('✅ Conexión exitosa' if app.config['SQLALCHEMY_DATABASE_URI'] else '❌ Error')"
```

## 📝 Ventajas de usar el mismo contenedor PostgreSQL

✅ **Ventajas:**
- Ahorra recursos (un solo contenedor)
- Más fácil de gestionar
- Las bases de datos están completamente aisladas (no pueden acceder entre sí)
- Mismo rendimiento que tener contenedores separados

❌ **Cuándo usar contenedores separados:**
- Si necesitas diferentes versiones de PostgreSQL
- Si necesitas diferentes configuraciones (puertos, recursos, etc.)
- Si necesitas máximo aislamiento de seguridad

## 🛠️ Comandos Útiles

### Ver todas las bases de datos:
```bash
docker exec satrack_db psql -U satrack_user -d postgres -c "\l"
```

### Ver tablas de finanzaspersonales_db:
```bash
docker exec satrack_db psql -U finanzas_user -d finanzaspersonales_db -c "\dt"
```

### Backup de la base de datos:
```bash
docker exec satrack_db pg_dump -U finanzas_user finanzaspersonales_db > backup_finanzas_$(date +%Y%m%d).sql
```

### Restaurar backup:
```bash
docker exec -i satrack_db psql -U finanzas_user finanzaspersonales_db < backup_finanzas_20260107.sql
```

## ⚠️ Notas Importantes

1. **Seguridad**: Cambia la contraseña `Finanzas2026!` en producción
2. **Backups**: Configura backups automáticos para tus bases de datos
3. **Red Docker**: Si ambos proyectos necesitan comunicarse, considera usar la misma red Docker (`webscrapper_satrack_network`)

## 🆘 Solución de Problemas

### Error: "could not connect to server"
- Verifica que el contenedor esté corriendo: `docker ps | grep satrack_db`
- Verifica que el puerto 5432 esté accesible: `netstat -tuln | grep 5432`

### Error: "password authentication failed"
- Verifica las credenciales en el archivo `.env`
- Prueba conectarte manualmente con `psql`

### Error: "database does not exist"
- Verifica que la base de datos exista: `docker exec satrack_db psql -U satrack_user -d postgres -c "\l"`

