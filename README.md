# 💰 Manejador de Finanzas - Guía de Inicio Rápido

Aplicación web completa para gestión de finanzas personales, diseñada especialmente para estudiantes con funcionalidades para preparar viajes internacionales (Praga 2026).

## 🚀 Inicio Rápido (Servidor Local)

### Prerrequisitos

- **Python 3.12+** (o 3.8+)
- **Node.js 18+** y npm
- **Git** (opcional)

### Paso 1: Configurar el Backend (Flask)

```bash
# Navegar a la carpeta del backend
cd backend

# Activar el entorno virtual (si ya existe)
source venv/bin/activate  # En macOS/Linux
# O en Windows:
# venv\Scripts\activate

# Si no tienes venv, créalo:
# python3 -m venv venv
# source venv/bin/activate

# Instalar dependencias (si no están instaladas)
pip install -r requirements.txt

# Verificar que la base de datos existe
# Si no existe, Flask la creará automáticamente al iniciar
```

### Paso 2: Iniciar el Backend

```bash
# Asegúrate de estar en la carpeta backend con venv activado
flask run
# O directamente:
python app.py

# El servidor debería iniciar en: http://127.0.0.1:5000
```

**✅ Verificación:** Abre http://127.0.0.1:5000/api/auth/health en tu navegador. Deberías ver:
```json
{"status": "healthy", "service": "finanzas-api"}
```

### Paso 3: Configurar el Frontend (React)

```bash
# Abre una nueva terminal
# Navegar a la carpeta del frontend
cd frontend

# Instalar dependencias (si no están instaladas)
npm install

# El frontend ya está configurado para usar http://127.0.0.1:5000 por defecto
# No necesitas crear archivo .env a menos que quieras cambiar la URL
```

### Paso 4: Iniciar el Frontend

```bash
# Asegúrate de estar en la carpeta frontend
npm run dev

# El servidor debería iniciar en: http://localhost:5173 (o puerto similar)
```

### Paso 5: Acceder a la Aplicación

1. Abre tu navegador en: **http://localhost:5173**
2. Crea una cuenta nueva en "Registrarse"
3. ¡Listo! Ya puedes usar la aplicación

---

## 📋 Configuración Opcional

### Variables de Entorno (Opcional)

Si quieres personalizar la configuración, crea un archivo `.env` en la carpeta `backend`:

```bash
# backend/.env
JWT_SECRET_KEY=tu-clave-secreta-super-segura
DATABASE_URL=sqlite:///instance/finance.db
```

Y en `frontend/.env` (opcional):
```bash
VITE_API_URL=http://localhost:5000
```

**Nota:** La aplicación funciona sin estos archivos usando valores por defecto.

---

## 🔧 Solución de Problemas

### Error: "Module not found" en Backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Error: "Cannot find module" en Frontend

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error de CORS

El backend ya tiene CORS configurado para permitir todas las peticiones en desarrollo. Si tienes problemas:

1. Verifica que el backend esté corriendo en el puerto 5000
2. Verifica que el frontend esté usando `http://127.0.0.1:5000` o `http://localhost:5000`

### Error: "Database not found"

La base de datos se crea automáticamente. Si hay problemas:

```bash
cd backend
source venv/bin/activate
flask db upgrade
```

### El frontend no se conecta al backend

1. Verifica que el backend esté corriendo: http://127.0.0.1:5000/api/auth/health
2. Verifica la consola del navegador (F12) para ver errores
3. Asegúrate de que ambos servidores estén corriendo

---

## 📁 Estructura del Proyecto

```
ManejadorFinanzas/
├── backend/              # API Flask
│   ├── api/             # Endpoints
│   ├── models.py        # Modelos de base de datos
│   ├── app.py           # Aplicación principal
│   ├── config.py        # Configuración
│   └── requirements.txt # Dependencias Python
│
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── pages/      # Páginas principales
│   │   ├── components/ # Componentes reutilizables
│   │   └── services/   # Servicios API
│   └── package.json    # Dependencias Node
│
└── README.md           # Este archivo
```

---

## 🎯 Funcionalidades Principales

- ✅ **Dashboard** - Vista general de finanzas
- ✅ **Cuentas** - Gestión de cuentas bancarias, efectivo, crédito
- ✅ **Transacciones** - Registro de ingresos y gastos
- ✅ **Presupuestos** - Control de gastos por categoría
- ✅ **Inversiones** - Seguimiento de portfolio
- ✅ **Reportes** - Análisis financiero detallado
- ✅ **Auditoría** - Historial completo de transacciones
- ✅ **Countdown Praga** - Meta de ahorro para viaje
- ✅ **Conversor de Monedas** - COP, CZK, EUR, USD

---

## 🛠️ Comandos Útiles

### Backend

```bash
# Iniciar servidor
flask run

# Crear migración de base de datos
flask db migrate -m "Descripción"

# Aplicar migraciones
flask db upgrade

# Ver rutas disponibles
flask routes
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linter
npm run lint
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE para Producción:**

1. Cambia `JWT_SECRET_KEY` en producción
2. Usa HTTPS
3. Configura CORS específicamente para tu dominio
4. No uses SQLite en producción (usa PostgreSQL)
5. Configura variables de entorno seguras

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12)
2. Revisa los logs del backend en la terminal
3. Verifica que todas las dependencias estén instaladas
4. Asegúrate de que ambos servidores estén corriendo

---

## ✅ Checklist de Verificación

Antes de usar la aplicación, verifica:

- [ ] Backend corriendo en http://127.0.0.1:5000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Health check del backend responde correctamente
- [ ] Puedes acceder a la página de login
- [ ] Puedes crear una cuenta nueva
- [ ] Puedes iniciar sesión

---

## 🎉 ¡Listo!

Si todos los pasos anteriores funcionaron, tu aplicación está lista para usar en tu servidor local.

**URLs importantes:**
- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:5000
- Health Check: http://127.0.0.1:5000/api/auth/health

¡Disfruta gestionando tus finanzas! 💰
