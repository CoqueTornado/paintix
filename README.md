# Paintix 0.1 Beta

Una aplicación de dibujo web creada por Coque Tornado.

## Despliegue en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Subir a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/paintix.git
   git push -u origin main
   ```

2. **Desplegar en Vercel:**
   - Ve a [vercel.com](https://vercel.com) y conecta tu GitHub
   - Click "New Project" → selecciona tu repo
   - Vercel detectará Create React App automáticamente
   - Click "Deploy"

### Opción 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Estructura del proyecto:
```
paintix-deploy/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   └── index.css
└── package.json
```

La app estará disponible en una URL como `paintix-tu-usuario.vercel.app` en ~2 minutos.

## Características
- 4 herramientas: lápiz, lápiz fino, spray, borrador
- 8 colores fluorescentes
- Controles de tamaño y opacidad
- Atajos de teclado
- Canvas SVG responsivo
