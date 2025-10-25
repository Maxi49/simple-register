# 🗂️ AplicacionRegistrador Colaborativa para Hogar de Cristo Rio Cuarto 

Aplicación móvil desarrollada con **React Native (Expo)** y **TypeScript**, creada para digitalizar el registro de datos en una organización comunitaria que realiza donaciones, actividades y acompañamiento a personas en situación de vulnerabilidad.

---

## 🚀 Funcionalidad principal

* Registro de **alumnos, familias, jóvenes, donaciones y ropa**.
* Gestión de **actividades** y asistencia.
* **Pantalla “Datos”** para visualizar todos los registros.
* **Importación y exportación** de datos a **Excel** (una hoja por tabla).
* **Botón de actualización manual** para sincronizar con la base de datos.
* **Validaciones básicas** para evitar campos vacíos o datos inválidos.
* Manejo de errores simple ante cortes de conexión.

---

## ⚙️ Tecnologías utilizadas

* **TypeScript**
* **React Native + Expo**
* **Supabase (PostgreSQL)** para persistencia en la nube
* **Visual Studio Code** como entorno de desarrollo

## ☁️ Base de datos

La base de datos se aloja en **Supabase**.
Incluye tablas como `alumnos`, `familias`, `donaciones`, `ropa`, `actividades`, `jovenes`, y registros de asistencia.
Con el plan gratuito (500 MB) se estiman entre **1,5 y 2 millones de filas** de capacidad, más que suficiente para el uso previsto.

---

## 🧩 Instalación y ejecución local

> ⚠️ Este proyecto no requiere builds nativos (funciona directamente en Expo).

```bash
# Clonar el repositorio
git clone https://github.com/<tu_usuario>/simple-register.git
cd simple-register

# Instalar dependencias
npm install

# Iniciar el proyecto
npx expo start
```

Luego escaneá el QR con **Expo Go** en tu celular.

---

## 🔒 Uso interno

La aplicación está pensada para uso **interno** por parte del personal de la organización (2–3 personas).
No requiere autenticación ni permisos especiales.
Todos los datos se guardan en la base de datos compartida en la nube.

---

## 🧠 Autor

Desarrollado por **Maximiliano Gimenez**
📍 Universidad Católica de Córdoba – Ingeniería Informática
💬 Proyecto colaborativo ODS – Innovación y Comunidad
