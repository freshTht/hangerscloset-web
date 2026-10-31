# Project Overview: Hanger's Closet Web

## Summary
`hangerscloset-web` is a responsive web application for a clothing rental business — **Hanger's Closet**. It allows customers to browse a curated inventory of rental apparel (dresses, gowns, suits, etc.), view item details and pricing, and check availability status. It is built as a single-page application (SPA) prioritizing mobile usability while delivering a clean desktop experience.

## Technology Stack
- **Framework**: [React 19](https://react.dev/) (with JSX/TSX)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode enabled)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Package Manager**: [pnpm 12](https://pnpm.io/)
- **UI Design System**: [Beer CSS](https://www.beercss.com/) (Material Design 3 semantic CSS framework)
- **Dynamic Theming**: [Material Dynamic Colors](https://github.com/leonardorafael/material-dynamic-colors)
- **Routing**: [React Router v7](https://reactrouter.com/) (`react-router-dom`)
- **Backend / Services**: [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Cloud Storage)
- **Iconography**: Google Material Symbols (Outlined, Rounded, Sharp bundled locally via Beer CSS)

## Environment Modes
The application supports two operating environments via Vite modes:
- **Mock Mode (`--mode mock`)**: Runs entirely in-memory with preloaded stock items from `mockInventory.ts`. No network or Firebase credentials required. Shows the `<ModeBadge />` chip.
- **Firebase Mode (`--mode firebase`)**: Connects to live Firebase backend services (Auth, Firestore, Cloud Storage). Mode badge is hidden.

## Core Philosophy
1. **Mobile-First**: Optimized for phones and handheld touch interactions with large touch targets ($\ge 48\text{px}$) and responsive layout adapters.
2. **Class-Light & Semantic UI**: Leverage Beer CSS's semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`) and utility classes rather than heavy custom CSS or external component runtimes.
3. **Seamless Dynamic Theming**: Built-in light/dark theme switching adhering to Material Design 3 surface, primary, and contrast color specifications.
4. **Roadmap Backlog**: Feature specifications and RFCs are maintained in [`.context/pending-features/`](../../.context/pending-features/README.md).
