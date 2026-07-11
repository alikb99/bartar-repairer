# Project Overview

Build a premium 3D SEO-optimized electronics repair website using Next.js 15 App Router with Static Site Generation (SSG).

This website belongs to an electronics repair company and covers repair services including but not limited to:

* Mobile phone repair
* Laptop repair
* Tablet repair
* Smartwatch repair
* Monitor repair
* TV repair
* Home appliance repair
* Gaming console repair
* Other electronic devices

The final website must feel premium, futuristic, and trustworthy while remaining extremely fast and SEO-friendly.

---

# CRITICAL DATABASE RULES (Highest Priority)

A database file named `bartar.sql` exists.

You MUST:

1. Parse the entire SQL database.
2. Extract ALL pages, categories, subcategories, articles, services, metadata, and URLs.
3. Rebuild the website structure from the database.
4. Preserve ALL content EXACTLY as it exists.
5. Preserve URLs EXACTLY without ANY modifications.
6. Do NOT change:

   * Text
   * Punctuation
   * Persian characters
   * Spaces
   * URLs
   * Meta titles
   * Meta descriptions

Even removing or changing a single character is prohibited because SEO rankings depend on content consistency.

The website content is the source of truth.

If a page exists in the database, it MUST exist on the website.

---

# URL Preservation Rules

SEO is critical.

NEVER:

* Change slugs
* Translate URLs
* Shorten URLs
* Redirect URLs unless absolutely required

Every URL from `bartar.sql` must remain identical.

---

# Dynamic Hierarchical Navigation

Generate an intelligent navigation menu from database categories.

Example hierarchy:

Repair Services
├── Mobile Repair
│      ├── Samsung Repair
│      │      ├── Samsung Battery Replacement
│      │      ├── Samsung LCD Replacement
│      │      └── ...
│      ├── Xiaomi Repair
│      │      ├── Xiaomi LCD Replacement
│      │      └── ...
│      ├── Apple Repair
│      └── Huawei Repair
│
├── Laptop Repair
│      ├── Lenovo Repair
│      ├── Asus Repair
│      └── ...
│
├── Tablet Repair
├── Smartwatch Repair
├── TV Repair
├── Monitor Repair
├── Home Appliance Repair
└── Blog

The menu must support:

* Unlimited nesting
* Mega menus
* Mobile accordion menus
* Breadcrumb generation
* Internal linking

You may improve the structure if a better UX exists.

---

# 3D Design Requirements

Create a premium 3D website experience.

Use:

* Three.js
* React Three Fiber
* Framer Motion
* GSAP (if needed)

Design goals:

* Elegant 3D scenes
* Floating electronic devices
* Interactive depth effects
* Mouse parallax
* Smooth transitions
* Subtle glassmorphism
* Soft shadows
* Realistic lighting
* GPU-friendly animations

Avoid excessive effects that hurt Core Web Vitals.

Performance is mandatory.

---

# Visual Identity

Design language:

* Premium
* Futuristic
* Professional
* Trustworthy

Use only ONE accent color across the entire site.

No generic gradients.

No emoji icons.

Use custom SVG icons or Lucide icons.

---

# UI/UX Requirements

Must be fully responsive:

* Desktop
* Tablet
* Mobile

Requirements:

* Sticky navigation
* Search functionality
* Smart filtering
* Related services
* Related articles
* FAQ accordions
* Call-to-action sections
* Service cards
* Brand pages
* Device pages

Accessibility:

* WCAG compliance
* Keyboard navigation
* Proper aria labels

---

# SEO Requirements (Very High Priority)

Implement enterprise-level SEO.

Every page must include:

* Unique title
* Meta description
* Canonical URL
* Open Graph tags
* Twitter Card
* Robots tags
* Breadcrumb schema
* FAQ schema
* Article schema
* Service schema
* LocalBusiness schema
* Organization schema
* Person schema
* WebSite schema
* SearchAction schema

Generate JSON-LD automatically.

---

# Internal Linking

Automatically create contextual internal links between:

* Brands
* Devices
* Repair services
* Blog articles
* Related pages

Maintain strong topical authority.

---

# Technical SEO

Site-wide:

* app/sitemap.ts
* app/robots.ts
* Canonical URLs
* Open Graph images
* Width/height on images
* Semantic HTML5
* Static export
* Proper viewport settings

Core Web Vitals target:

* LCP < 2.5s
* CLS < 0.1
* INP < 200ms

---

# Image Optimization

Use:

* next/image
* WebP
* Lazy loading
* Blur placeholders

Generate missing OG images automatically.

---

# Voice — read before writing any content

When writing any blog post, service page, or customer-facing copy, read:

* references/voice.md
* references/humour.md
* references/stats.md
* references/stories.md
* references/opinions.md

Content rules:

* Never use AI phrases
* No emojis
* No exclamation marks
* Start with answers
* Use exact numbers
* Maximum one story per page
* Maximum one opinion per page
* Clearly state when customers should NOT use the service

Before publishing:

Re-read:

`references/voice.md -> Tells that it's AI-written`

Remove anything matching AI patterns.

---

# On-page SEO

Read:

`on-page-seo.md`

Required:

* FAQ section
* FAQ schema
* Breadcrumbs
* Breadcrumb schema
* Author schema
* Table of contents
* 3–5 internal links
* 2–3 external authoritative links
* Open Graph
* Twitter Cards
* SERP competitor length analysis

---

# Local SEO

Implement:

* LocalBusiness schema
* Service area schema
* Google Maps integration
* NAP consistency
* Repair center information
* Service locations

---

# Performance Rules

3D effects must degrade gracefully on weaker devices.

Implement:

* Dynamic imports
* Lazy loading
* Code splitting
* Tree shaking

Never sacrifice performance for visuals.

---

# Tech Stack

* TypeScript
* Next.js 15
* App Router
* Tailwind CSS
* Framer Motion
* React Three Fiber
* Three.js
* Static Site Generation
* Vercel deployment

---

# SSG Constraints (DO NOT BREAK)

Forbidden:

* cookies()
* headers()
* searchParams in server components
* force-dynamic
* no-store fetch
* runtime APIs

Required:

* generateStaticParams
* Build-time data generation only
* output: 'export'

---

# Development Rules

Rule 1:
Always read CLAUDE.md first.

Rule 2:
Define architecture before coding.

Rule 3:
Check existing files before creating new files.

Rule 4:
Run:

npm run build

before completion.

Never declare completion if build fails.

---

# Content Storage

Convert database content into static TypeScript content files if necessary.

No runtime database queries.

Everything must be generated during build time.

---

# Testing Checklist

Before completion verify:

✓ npm run build succeeds

✓ Every route is static

✓ View-source contains rendered HTML

✓ JSON-LD exists

✓ Mobile responsive

✓ Lighthouse score > 90

✓ Core Web Vitals optimized

✓ Database content exactly preserved

✓ URLs unchanged

---

# Scope

Only build what is requested.

If anything is unclear:

ASK QUESTIONS FIRST.
