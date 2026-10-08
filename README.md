<p align="center"><img src="public/brand/diapason-lockup.svg" alt="Diapasón — La agenda inteligente para profesores de música" width="420"></p>

# Diapasón

**La agenda inteligente para profesores de música.**

Aplicación **local** para profesores de música particulares, conservatorios y escuelas municipales, como Atril y Maestro: funciona sin servidor ni cuentas y los datos se quedan en el dispositivo.

| Dispositivo | Cómo se usa |
|---|---|
| **PC con Windows** | Doble clic en `Abrir en el PC.bat` (abre `Diapason.html`). Sin instalar nada y **sin Internet**. |
| **Android** | App instalable `Diapason.apk` (Capacitor 7), compilada por GitHub. |
| **iPhone / iPad** | Se abre una vez la web en Safari y se añade a la pantalla de inicio; desde entonces funciona **sin conexión**. |

El mismo código sirve para todos: en pantallas grandes muestra un menú lateral y vistas a varias columnas; en el móvil, una barra de navegación inferior.

Cada copia de Diapasón es de **un profesor y una asignatura** (Violonchelo, Piano, Lenguaje Musical…), que se elige en Ajustes. En asignaturas como Lenguaje Musical, cada alumno conserva además su especialidad instrumental y se pueden organizar **clases de grupo**.

Incluye datos de ejemplo de **Violonchelo, Violín, Piano, Flauta y Lenguaje Musical** (10 alumnos, repertorio, tareas, unas 180 clases con asistencia y las notas del curso pasado), generados respecto a la fecha actual para que siempre haya clases hoy y tareas próximas.

---

## ✨ Funcionalidades

| Pantalla | Qué incluye |
|---|---|
| **Inicio** | Próxima clase con cuenta atrás, clases de hoy, alumnos, obras activas, tareas pendientes (y vencidas), obras en marcha y aviso si hace falta una copia de seguridad |
| **Agenda** | Vistas **Día / Semana / Mes**. Cada cita muestra hora, alumno (o grupo), nivel y duración. Una clase individual abre la ficha del alumno; una de grupo, la lista del grupo |
| **Alumnos** | Alta, edición, eliminación y búsqueda. Filtros por grupo, especialidad o nivel. Horario semanal con aviso de solapes (no avisa entre alumnos del mismo grupo) |
| **Ficha de alumno** | Datos personales, asistencia, calificaciones, horario, observaciones, estadísticas, progreso, repertorio (obras, estudios, escalas, ejercicios), tareas, historial, material y notas |
| **Clases** | Fecha, trabajo realizado, observaciones, incidencias, duración, resultado general y **asistencia** (asistió, falta justificada, falta injustificada). Las clases de grupo se registran de una vez, con asistencia y valoración por alumno |
| **Repertorio** | Biblioteca de la asignatura: **Obras**, **Estudios**, **Escalas** y **Técnica** (con categorías propias de cada familia: arco y posiciones en cuerda, pedal en piano, respiración en viento, ritmo y dictado en Lenguaje Musical…) |
| **Progreso** | Estado (*Pendiente → Iniciada → En estudio → Consolidada → Terminada*) y porcentaje 0-100 % con barras de colores e historial de evolución |
| **Tareas para casa** | Completar, fecha límite, prioridad y asociación a una obra o estudio |
| **Material didáctico** | PDF, vídeos, audios y enlaces asociados a un alumno o a una obra |
| **Listados** | **Acta de calificaciones** (1.º, 2.º y 3.er trimestre y final, de 1 a 10, con la media como final propuesta editable), **alumnos y horario** (con rejilla semanal), **clases y asistencia** por trimestre o mes, y **tareas y repertorio** por alumno. Todos se imprimen o guardan en PDF y se exportan a Excel |
| **Estadísticas** | Por profesor (alumnos, clases por semana, clases impartidas, evolución mensual, alumnos por nivel y especialidad, asistencia, estado de las obras, progreso, valoraciones) y por alumno |
| **Ajustes** | Profesor, centro y **asignatura**; fechas de los trimestres; **copia de seguridad .zip** (crear, enviar y restaurar); datos de ejemplo por asignatura |

### Calificaciones

Escala de 1 a 10 en enteros: Insuficiente (1–4), Suficiente (5), Bien (6), Notable (7–8) y Sobresaliente (9–10). Si la final se deja vacía, cuenta la media redondeada de los tres trimestres (marcada con *). El curso va de septiembre a junio y las fechas de cada trimestre se ajustan en Ajustes.

### Pasar datos entre PC, iPad y móvil

Diapasón guarda los datos en el propio dispositivo; no hay servidor ni cuentas, así que los datos de los alumnos no salen de los equipos del profesor. Para cambiar de dispositivo:

1. **Ajustes → Crear copia .zip** (en iPad/móvil, **Enviar copia…** abre AirDrop, correo, Drive…).
2. Lleva el `.zip` al otro dispositivo.
3. **Ajustes → Restaurar una copia**. Sustituye los datos por los de la copia, incluidos los archivos adjuntos.

### En el iPhone o el iPad

Apple solo permite instalar apps nativas desde la App Store o TestFlight, lo que exige una cuenta de desarrollador de pago y un Mac. Por eso en iPhone/iPad Diapasón se instala como web: se abre una vez `https://TU_USUARIO.github.io/diapason/` en **Safari** y se pulsa **Compartir → Añadir a pantalla de inicio**. Queda como una app a pantalla completa y, gracias a su *service worker*, **funciona sin conexión**; solo necesita Internet para recibir las versiones nuevas. Los datos se guardan en el propio dispositivo.

## 🧱 Tecnología

- [React 18](https://react.dev) + [Vite 5](https://vitejs.dev)
- [Tailwind CSS 3](https://tailwindcss.com) (diseño, animaciones y transiciones)
- [React Router 6](https://reactrouter.com) (`HashRouter`, compatible con GitHub Pages)
- [Recharts](https://recharts.org) (gráficos interactivos)
- [Lucide](https://lucide.dev) (iconos) y [JSZip](https://stuk.github.io/jszip/) (copias .zip)
- [Capacitor 7](https://capacitorjs.com) (app Android, con los plugins Filesystem y Share) y [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (web sin conexión)
- Tipografías *Instrument Serif* e *Instrument Sans* incluidas en la app ([Fontsource](https://fontsource.org)): no se descarga nada de Internet.
- Persistencia local: `localStorage` para los datos e `IndexedDB` para los archivos adjuntos. **No necesita servidor ni base de datos.**

## 🖥️ PC con Windows

Como en Atril: doble clic en **`Abrir en el PC.bat`**, que abre **`Diapason.html`** en el navegador (Chrome o Edge). Es un único archivo con todo dentro (código, estilos, tipografías e icono), así que no necesita servidor ni conexión.

- **Paquete para el profesor** (`Diapason-PC.zip`, en Releases › *ultima*): `Diapason.html` + `Abrir en el PC.bat` + `LEEME.txt`. Se descomprime y listo.
- **Carpeta del código fuente**: si falta `Diapason.html` o has cambiado el código, el `.bat` lo compila solo (`npm run build:pc`, necesita Node.js) y después lo abre.

Los datos se guardan en el navegador del PC: usa siempre el mismo navegador.

## 🤖 Android

App `es.diapason.agenda` hecha con **Capacitor 7** (proyecto en `android/`). GitHub la compila en cada subida y publica **`Diapason.apk`** en Releases › *ultima*. Se firma con una clave de pruebas fija (`android/firma/`), de modo que cada versión se instala encima de la anterior sin perder datos.

En Android, «Crear copia .zip», «Excel» y abrir un adjunto usan el menú **Compartir** (Drive, correo, WhatsApp, Descargas, otras apps). Imprimir no está disponible en la app: usa el Excel o imprime desde el PC.

Para compilarlo en tu PC (opcional): `npm run android` y abre la carpeta `android/` con Android Studio.

## ⚙️ Compilación automática en GitHub

Cada vez que se suben cambios a `main`, GitHub Actions (`.github/workflows/deploy.yml`) compila todo sin necesitar nada en tu PC:

1. **`Diapason.apk`** (Android).
2. **`Diapason-PC.zip`** y **`Diapason.html`** (PC).
3. La **web** en GitHub Pages (iPhone/iPad), que funciona sin conexión después de la primera visita.

El APK y el paquete para PC quedan en **Releases › «ultima»**, con enlaces fijos:

- `https://github.com/TU_USUARIO/diapason/releases/download/ultima/Diapason.apk`
- `https://github.com/TU_USUARIO/diapason/releases/download/ultima/Diapason-PC.zip`

## 🚀 Instalación para desarrollo

Requisitos: **Node.js 18 o superior** (recomendado 20 LTS) y npm.

```bash
npm install
npm run dev
```

Se abrirá automáticamente `http://localhost:5173`. Para verla en el móvil dentro de la misma red Wi-Fi:

```bash
npm run dev -- --host
```

y abre en el teléfono la dirección `Network:` que muestra la consola.

### Otros comandos

| Comando | Descripción |
|---|---|
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run build:pc` | Crea `Diapason.html` (un solo archivo para el PC) |
| `npm run paquete-pc` | Crea `release/Diapason-PC.zip` (GitHub ya lo hace solo) |
| `npm run android` | Compila la web y la copia al proyecto Android (`npx cap sync android`) |

## 📁 Estructura de carpetas

```
diapason/
├── .github/workflows/deploy.yml   # Publicación automática en GitHub Pages
├── Abrir en el PC.bat             # Doble clic: abre Diapason.html (y lo compila si hace falta)
├── android/                       # Proyecto Android (Capacitor 7), icono, pantalla de arranque y firma fija
├── capacitor.config.json
├── pc/                            # compilar-si-hace-falta.ps1 y LEEME.txt del paquete para el PC
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest       # Instalable en el móvil como app
│   └── brand/                     # Logotipo, versión negativa, monocromo, marca e iconos
├── scripts/
│   ├── brand/                     # Generador del logotipo (ver su README)
│   ├── html-unico.mjs             # Convierte la compilación en un único Diapason.html
│   └── paquete-pc.mjs             # Crea release/Diapason-PC.zip
├── index.html
├── package.json
├── tailwind.config.js             # Paleta (ink, brass, paper), fuentes y animaciones
├── vite.config.js
└── src/
    ├── main.jsx                   # Punto de entrada (Router + Store)
    ├── App.jsx                    # Rutas
    ├── config.js                  # Autoría («Creado por…») y versión
    ├── index.css                  # Estilos base y componentes Tailwind
    ├── data/
    │   ├── library.js             # Biblioteca: obras, estudios, escalas, técnica
    │   └── seed.js                # Alumnos, asignaciones, tareas, notas, material, historial
    ├── store/
    │   └── StoreContext.jsx       # Estado global (useReducer) + persistencia + acciones
    ├── utils/
    │   ├── constants.js           # Instrumentos, niveles, estados, colores, prioridades…
    │   ├── dates.js               # Utilidades de fechas en español
    │   ├── selectors.js           # Agenda, estadísticas y cálculos derivados
    │   ├── files.js               # Archivos adjuntos en IndexedDB
    │   ├── backup.js              # Copia de seguridad .zip
    │   ├── courses.js             # Curso académico, trimestres y nota final
    │   ├── csv.js                 # Exportación a Excel (CSV)
    │   ├── platform.js            # PC / web / Android: descargar o compartir archivos
    │   └── navigation.js          # Navegación "volver" segura
    ├── components/
    │   ├── brand/                 # Logo.jsx (logotipo vectorial), Splash.jsx, logoData.js
    │   ├── layout/                # AppLayout, Sidebar (PC/iPad), BottomNav (móvil)
    │   ├── ui/                    # Avatar, Badges, ProgressBar, Sheet, StatCard, Segmented…
    │   ├── agenda/                # AppointmentCard
    │   ├── students/              # StudentCard
    │   ├── lessons/               # LessonCard
    │   ├── repertoire/            # AssignmentCard/Sheet, AssignSheet, ItemFormSheet, ItemIcon
    │   ├── tasks/                 # TaskItem, TaskFormSheet
    │   ├── materials/             # MaterialList, MaterialFormSheet
    │   └── grades/                # GradeSelect, GradeSheet, GradesCard
    └── pages/
        ├── Dashboard.jsx          # Inicio
        ├── Agenda.jsx             # Día / Semana / Mes
        ├── Students.jsx           # Listado y búsqueda
        ├── StudentForm.jsx        # Alta / edición
        ├── StudentDetail.jsx      # Ficha completa
        ├── LessonHistory.jsx      # Historial de clases
        ├── LessonForm.jsx         # Registrar / editar clase
        ├── Repertoire.jsx         # Biblioteca
        ├── RepertoireDetail.jsx   # Detalle de obra/estudio/escala/técnica
        ├── Tasks.jsx              # Tareas para casa
        ├── Listados.jsx           # Acta, alumnos y horario, asistencia, tareas y repertorio
        ├── Statistics.jsx         # Estadísticas
        └── Settings.jsx           # Ajustes y copia de seguridad
```

## 🗺️ Rutas

| Ruta | Pantalla |
|---|---|
| `#/` | Inicio |
| `#/agenda?vista=dia\|semana\|mes&fecha=AAAA-MM-DD` | Agenda |
| `#/alumnos`, `#/alumnos/nuevo`, `#/alumnos/:id`, `#/alumnos/:id/editar` | Alumnos |
| `#/clases`, `#/clases/nueva`, `#/clases/:id` | Historial de clases |
| `#/repertorio?tipo=obra\|estudio\|escala\|tecnica`, `#/repertorio/:id` | Repertorio |
| `#/tareas` | Tareas para casa |
| `#/listados?lista=notas\|alumnos\|asistencia\|tareas` | Listados |
| `#/estadisticas?vista=profesor\|alumno` | Estadísticas |
| `#/ajustes` | Ajustes |

## 💾 Datos

- La primera vez se cargan los datos de ejemplo. Todo lo que crees o edites se guarda automáticamente en el navegador.
- **Ajustes → Crear copia .zip** guarda datos y archivos adjuntos; **Restaurar una copia** la recupera (también acepta los `.json` de la versión 1.0).
- **Ajustes → Datos de ejemplo** carga la demo de la asignatura elegida.
- La agenda se genera a partir del **horario semanal** de cada alumno; registrar una clase la añade al historial y la cita aparece como registrada (✓).

## 🐙 Subir a GitHub

1. Crea un repositorio vacío en GitHub (sin README), por ejemplo `diapason`.
2. En la carpeta del proyecto:

   ```bash
   git init
   git add .
   git commit -m "Diapasón v1.2.2"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/diapason.git
   git push -u origin main
   ```

   Con GitHub CLI puedes hacerlo en un paso: `gh repo create diapason --public --source=. --push`

3. `node_modules/` y `dist/` están excluidos por `.gitignore`.

### Subir sin Git (desde la web de GitHub)

Si no tienes Git instalado: en el repositorio vacío, pulsa **«uploading an existing file»**, arrastra todo el contenido de la carpeta **menos `node_modules`, `dist` y `release`** (incluida la carpeta `.github`) y pulsa **Commit changes**. Para versiones nuevas, **Add file → Upload files** con los archivos cambiados.

### Publicar en GitHub Pages

El proyecto incluye el workflow `.github/workflows/deploy.yml`.

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Haz `git push` a `main` (o lanza el workflow desde la pestaña **Actions**).
3. La app quedará en `https://TU_USUARIO.github.io/diapason/`.

Al usar `HashRouter` y `base: './'`, funciona con cualquier nombre de repositorio sin configuración adicional.

## 🎼 Identidad visual

El logotipo es la palabra **Diapasón** en *Instrument Serif* con la «i» sustituida por un diapasón: el fuste de la i es el mango y las púas se elevan por encima de la palabra. El diapasón está dibujado con las proporciones reales de uno de **La 440 Hz** (120 mm: mango 31 mm, curva 10 mm, púas 79 mm de Ø 5 mm), por lo que mide unas seis veces más de largo que de ancho.

| Archivo (`public/brand/`) | Uso |
|---|---|
| `diapason-logo.svg` | Logotipo en color (fondos claros) |
| `diapason-logo-negativo.svg` | Sobre fondos oscuros |
| `diapason-logo-mono.svg` | Una sola tinta |
| `diapason-lockup.svg` / `-negativo.svg` | Logotipo con el eslogan |
| `diapason-marca.svg` | Solo el diapasón |
| `diapason-icono.svg`, `icon-*.png`, `apple-touch-icon.png` | Iconos de app y favicon |

Colores: azul tinta `#141A2C`, dorado latón `#B07F30` (sobre oscuro `#DBB66A`), papel `#F7F4EE`.

En la app se usa el componente `<Logo variant="logo|lockup|mark" tone="color|negativo|mono" />`. Al abrir la app y al pulsar el logotipo, el diapasón «vibra» (se desactiva si el sistema tiene activada la reducción de movimiento).

Se puede instalar en el móvil como una app más (Añadir a pantalla de inicio) con el nombre y el icono de Diapasón.

## 🔧 Personalización rápida

- **Autoría y versión que aparecen en Ajustes:** `src/config.js` (`APP_CREDIT`, `APP_VERSION`).

- **Instrumentos y colores:** `src/utils/constants.js` (`INSTRUMENTS`, `INSTRUMENT_STYLE`).
- **Niveles, estados, articulaciones, categorías técnicas:** `src/utils/constants.js`.
- **Paleta y tipografía:** `tailwind.config.js` (colores `ink`, `brass`, `paper`; fuentes *Instrument Serif* e *Instrument Sans*).
- **Datos de ejemplo:** `src/data/library.js` y `src/data/seed.js`.

## 📄 Licencia

MIT — úsalo y adáptalo libremente.
