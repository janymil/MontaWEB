# MontaWeb

Professional website for MontaWeb - Web design services for small businesses and entrepreneurs in Peru.

## 🚀 Features

- Modern, responsive design
- Dark mode support
- Contact form with EmailJS integration
- SEO optimized
- Cache busting implementation
- Dropdown navigation menus
- Mobile-friendly

## 📁 Project Structure

```
├── index.html              # Homepage
├── servicios.html          # Services page
├── ejemplos.html           # Portfolio/Examples page
├── contacto.html           # Contact page
├── gracias.html            # Thank you page
├── 404.html               # 404 error page
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   ├── main.js            # Main JavaScript file
│   └── emailjs-contact-fixed.js  # EmailJS integration
├── images/                # Image assets
├── ejemplos/              # Portfolio images
└── attached_assets/       # Additional resources
```

## 🛠️ Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- EmailJS for contact form
- Font Awesome icons
- Google Fonts (Montserrat)

## 🔧 Setup & Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/montaweb.git
```

2. No build process required - this is a static HTML site
3. Open `index.html` in your browser or deploy to any static hosting service

## 📦 Deployment

### Hostinger Deployment

1. Upload all files to your Hostinger hosting
2. Include the `.htaccess` file for proper cache control
3. Update version numbers in HTML files when making changes

### Cache Busting

To update cache versions:
1. Manually update version parameters in HTML files (e.g., `?v=2`)
2. Or run the Python script locally before deployment:
   ```bash
   python3 update-cache-version.py
   ```

## 🔗 External Services

- **EmailJS**: Configure your EmailJS service for the contact form
- **WhatsApp**: Update WhatsApp links with your business number

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🎨 Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary: 0 70% 47%;     /* Peru red */
    --secondary: 0 0% 100%;   /* White */
    --accent: 51 100% 50%;    /* Gold */
}
```

### Content
- Update text content directly in HTML files
- Replace images in `/images` and `/ejemplos` directories
- Modify services and pricing in respective HTML files

## 📄 License

All rights reserved © 2026 MontaWeb (Semantika TECH — RUC 20616806981)

## 👥 Contact

- Website: https://MontaWeb.com
- WhatsApp: +51 965 403 196
- Email: info@MontaWeb.com
