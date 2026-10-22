# Sistema de Informes Médicos — Electrofisiología

Aplicación web 100% estática (sin servidor, sin base de datos) para registrar
procedimientos de electrofisiología y generar informes con formato.

- **Abre `index.html`** y trabaja: formulario por pestañas o asistente paso a paso.
- **Vista Previa** genera el informe; **Copiar Informe** lo deja en el portapapeles
  con formato (elástico para pegar en Medicap conservando colores y tablas).
- **Imprimir** usa el menú del navegador (formato carta).

## Persistencia y privacidad

- Todo se guarda **localmente en el navegador** (`localStorage`): datos comunes,
  procedimientos, personal, plantillas y el informe en curso.
- **Ninguna información viaja a un servidor** y ningún dato de paciente se
  ingresa: el informe final se pega en el sistema institucional, que cuenta con
  los estándares de seguridad correspondientes.
- **Respaldo**: botón "Respaldar datos" (guardar JSON) e "Importar" para
  restaurar. Se sugiere respaldar al menos una vez por semana.

## Versiones

- Versión publicada: https://pages.github.io/ (ver rama `main`)
- La copia local funciona sin internet abriendo `index.html` directo.

## Técnico

- Vanilla JS (16 módulos `js/` cargados en orden), Tailwind CSS y Font Awesome
  incluidos localmente en `vendor/` (no requiere internet).
- Catálogos base editables en `data.json`.
