#!/usr/bin/env node
/**
 * build.js — Zero-maintenance static site builder
 *
 * Scans content/ → renders HTML via Nunjucks templates → outputs public/
 *
 * Content conventions (all optional — missing sections are silently skipped):
 *   content/home.{en,zh}.md          → public/index.html
 *   content/about.{en,zh}.md         → public/about/index.html
 *   content/courses/<slug>/*.md      → public/courses/...
 *   content/projects/<slug>/*.md     → public/projects/...
 *   content/blog/*.md                → public/blog/...
 *
 * Bilingual:  foo.en.md + foo.zh.md  → one page, both languages, JS toggle
 * Monolingual: foo.md                → one page, single language (lang="" attr)
 *
 * Metadata priority: frontmatter > courses.json/projects.json > derived
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';
import nunjucks from 'nunjucks';

// ─── Paths ───────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'content');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const STATIC_DIR = path.join(__dirname, 'static');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ─── Configuration ───────────────────────────────────────────────────────────
const SITE_CONFIG = {
  baseUrl: (process.env.BASE_URL || '').replace(/\/+$/, ''),
  title: 'Wang Hanhan',
  description: 'Personal knowledge base — courses, projects & blog',
  lang: 'zh-CN',
  nav: [
    { href: '/', label: '首页', i18nKey: 'nav.home' },
    { href: '/courses/', label: '课程', i18nKey: 'nav.courses' },
    { href: '/projects/', label: '项目', i18nKey: 'nav.projects' },
    { href: '/blog/', label: '博客', i18nKey: 'nav.blog' },
    { href: '/about/', label: '关于', i18nKey: 'nav.about' },
  ],
  footer: {
    text: '© {{ year }} Hanhan Wang. Built with ❤️ and Markdown.',
    socialLinks: [
      { href: 'https://github.com/NPU-HanhanWang', icon: 'github', label: 'GitHub' },
    ],
  },
  dateFormat: { year: 'numeric', month: 'long', day: 'numeric' },
};

// ─── Marked setup ────────────────────────────────────────────────────────────
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false,
});

// ─── Nunjucks setup ──────────────────────────────────────────────────────────
const nunjucksEnv = nunjucks.configure(TEMPLATES_DIR, {
  autoescape: true,
  trimBlocks: true,
  lstripBlocks: true,
  noCache: true,
});

// Add utility filters
nunjucksEnv.addFilter('baseUrl', (p) => SITE_CONFIG.baseUrl + p);
nunjucksEnv.addFilter('json', (v) => JSON.stringify(v, null, 2));
nunjucksEnv.addFilter('keys', (obj) => Object.keys(obj));
nunjucksEnv.addFilter('dump', (v) => {
  console.log('DUMP:', JSON.stringify(v, null, 2));
  return '';
});

// Date formatting filter: {{ d | date('D') }}, {{ d | date('MMM YYYY') }}, {{ d | date('longDate') }}
nunjucksEnv.addFilter('date', (val, fmt) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  switch (fmt) {
    case 'D': return String(d.getDate());
    case 'MMM YYYY': return `${months[d.getMonth()]} ${d.getFullYear()}`;
    case 'longDate': return `${longMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    default: return d.toISOString().split('T')[0];
  }
});

// String truncation: {{ str | truncate(120) }}
nunjucksEnv.addFilter('truncate', (str, len) => {
  if (!str) return '';
  const s = String(str);
  if (s.length <= len) return s;
  return s.slice(0, len) + '…';
});

// Strip HTML tags: {{ str | striptags }}
nunjucksEnv.addFilter('striptags', (str) => {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '');
});

// sprintf-style format: {{ '%02d' | format(num) }}
nunjucksEnv.addFilter('format', (fmt, ...args) => {
  // Only supports simple %d, %02d, %s cases
  let i = 0;
  return fmt.replace(/%(\d+)?([ds])/g, (_, pad, type) => {
    let val = args[i++];
    if (val == null) val = '';
    if (pad) val = String(val).padStart(parseInt(pad, 10), '0');
    return String(val);
  });
});

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** Normalise a slug: lowercase, replace spaces/special-chars with hyphens */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-.一-鿿]+/g, '-')  // keep Chinese characters
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Extract the first # heading from rendered HTML or raw markdown */
function extractFirstHeading(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/** Extract the first meaningful paragraph (skip headings, code blocks, empty) */
function extractFirstParagraph(md) {
  // Remove frontmatter if present
  const body = md.replace(/^---[\s\S]*?---\n*/, '');
  // Remove headings, code blocks, images, links
  const cleaned = body
    .replace(/^#+\s+.+$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/\|.*\|/g, '')
    .replace(/^[-*]\s/gm, '')
    .trim();
  // Find first non-empty paragraph
  const match = cleaned.match(/^([^#\n].+?)(?:\n\n|\n$|$)/m);
  if (match) {
    let p = match[1].trim();
    if (p.length > 200) p = p.slice(0, 200) + '…';
    return p;
  }
  return null;
}

/** Try to parse a numeric prefix from filename like "01-intro" → 1 */
function numericPrefix(filename) {
  const match = path.basename(filename, path.extname(filename)).match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse a bilingual markdown cluster.
 * Given a path like "content/courses/foo/index.en.md", finds and reads its
 * language siblings (index.zh.md, index.md) and returns:
 *   { en: { raw, frontmatter, html }, zh: { raw, frontmatter, html }, fallback }
 */
function parseBilingualContent(filePath) {
  const dir = path.dirname(filePath);
  // Base name without language suffix, e.g. "index" from "index.en.md"
  const fullName = path.basename(filePath);
  // Match basename + optional .lang + .md
  const langMatch = fullName.match(/^(.+?)\.(en|zh)\.md$/);
  const baseName = langMatch ? langMatch[1] : fullName.replace(/\.md$/, '');

  const readFile = (suffix) => {
    const p = path.join(dir, suffix);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    return null;
  };

  const result = { en: null, zh: null, fallback: null };

  // Try language-specific files
  const enRaw = readFile(`${baseName}.en.md`);
  const zhRaw = readFile(`${baseName}.zh.md`);
  // Try plain file (no language suffix)
  const plainRaw = readFile(`${baseName}.md`);

  const parseOne = (raw) => {
    if (!raw) return null;
    const parsed = matter(raw);
    return {
      raw: parsed.content,
      frontmatter: parsed.data,
      html: marked.parse(parsed.content),
    };
  };

  result.en = parseOne(enRaw);
  result.zh = parseOne(zhRaw);

  // Fallback: if no .en or .zh, use plain .md
  if (!result.en && !result.zh && plainRaw) {
    result.fallback = parseOne(plainRaw);
  }

  // If only one language file exists, use it for both; mark as single-lang
  if (result.en && !result.zh) result.fallback = result.en;
  if (result.zh && !result.en) result.fallback = result.zh;

  return result;
}

/**
 * Derive a bilingual title object from parsed content.
 * Priority: frontmatter.title > first # heading > filename
 */
function deriveBilingualTitle(biContent, defaultTitle) {
  const title = { en: '', zh: '' };

  // Try frontmatter from each language
  if (biContent.en?.frontmatter?.title) title.en = biContent.en.frontmatter.title;
  if (biContent.zh?.frontmatter?.title) title.zh = biContent.zh.frontmatter.title;

  // Try first heading from rendered HTML
  if (!title.en && biContent.en?.raw) {
    title.en = extractFirstHeading(biContent.en.raw) || '';
  }
  if (!title.zh && biContent.zh?.raw) {
    title.zh = extractFirstHeading(biContent.zh.raw) || '';
  }
  // Try fallback
  if (!title.en && biContent.fallback?.raw) {
    title.en = extractFirstHeading(biContent.fallback.raw) || '';
  }
  if (!title.zh && biContent.fallback?.raw) {
    title.zh = extractFirstHeading(biContent.fallback.raw) || '';
  }

  // Use defaultTitle as last resort
  if (!title.en) title.en = defaultTitle;
  if (!title.zh) title.zh = defaultTitle;

  return title;
}

/**
 * Derive description from content.
 */
function deriveBilingualDescription(biContent) {
  const desc = { en: '', zh: '' };
  if (biContent.en?.frontmatter?.description) desc.en = biContent.en.frontmatter.description;
  if (biContent.zh?.frontmatter?.description) desc.zh = biContent.zh.frontmatter.description;

  if (!desc.en && biContent.en?.raw) {
    desc.en = extractFirstParagraph(biContent.en.raw) || '';
  }
  if (!desc.zh && biContent.zh?.raw) {
    desc.zh = extractFirstParagraph(biContent.zh.raw) || '';
  }
  if (!desc.en && biContent.fallback?.raw) {
    desc.en = extractFirstParagraph(biContent.fallback.raw) || '';
  }
  if (!desc.zh && biContent.fallback?.raw) {
    desc.zh = extractFirstParagraph(biContent.fallback.raw) || '';
  }
  return desc;
}

/**
 * Determine if this content is truly bilingual (has both .en and .zh)
 */
function isBilingual(biContent) {
  return !!(biContent.en && biContent.zh);
}

// ─── Sorting helpers ─────────────────────────────────────────────────────────

/**
 * Sort items by: frontmatter.order > numeric prefix in filename > alphabetical by filename
 */
function sortByOrder(items, getFilename) {
  return [...items].sort((a, b) => {
    const fa = getFilename ? getFilename(a) : a.filename || '';
    const fb = getFilename ? getFilename(b) : b.filename || '';

    const orderA = a.order ?? numericPrefix(fa);
    const orderB = b.order ?? numericPrefix(fb);

    if (orderA != null && orderB != null) return orderA - orderB;
    if (orderA != null) return -1;
    if (orderB != null) return 1;
    return fa.localeCompare(fb, undefined, { numeric: true });
  });
}

// ─── Content scanners ────────────────────────────────────────────────────────

/**
 * Scan all content/ and build the site data model.
 */
async function scanAllContent() {
  const data = {
    home: null,       // { bi, title, description }
    about: null,      // { bi, title, description }
    courses: [],      // [{ slug, title:{en,zh}, description:{en,zh}, tags, order, featured, chapters: [...] }]
    projects: [],     // [{ slug, title:{en,zh}, description:{en,zh}, tags, order, featured, links, subpages: [...] }]
    blog: [],         // [{ slug, title:{en,zh}, description:{en,zh}, date, tags }]
  };

  // ── Optional JSON metadata files (used as fallback enrichment) ──
  let coursesJson = null;
  let projectsJson = null;
  try {
    const cjPath = path.join(CONTENT_DIR, 'courses.json');
    if (fs.existsSync(cjPath)) coursesJson = JSON.parse(fs.readFileSync(cjPath, 'utf-8'));
  } catch (_) { /* ignore */ }
  try {
    const pjPath = path.join(CONTENT_DIR, 'projects.json');
    if (fs.existsSync(pjPath)) projectsJson = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
  } catch (_) { /* ignore */ }

  // ── Home ──
  const homeBi = scanBilingualContent(CONTENT_DIR, 'home');
  if (homeBi) {
    data.home = {
      bi: homeBi,
      title: deriveBilingualTitle(homeBi, 'Home'),
      description: deriveBilingualDescription(homeBi),
      isBilingual: isBilingual(homeBi),
    };
  }

  // ── About ──
  const aboutBi = scanBilingualContent(CONTENT_DIR, 'about');
  if (aboutBi) {
    data.about = {
      bi: aboutBi,
      title: deriveBilingualTitle(aboutBi, 'About'),
      description: deriveBilingualDescription(aboutBi),
      isBilingual: isBilingual(aboutBi),
    };
  }

  // ── Courses ──
  const coursesDir = path.join(CONTENT_DIR, 'courses');
  if (fs.existsSync(coursesDir)) {
    const entries = await fs.readdir(coursesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const courseSlug = entry.name;
      const courseDir = path.join(coursesDir, courseSlug);

      // Look for index.{en,zh}.md in the course directory
      const indexBi = scanBilingualContent(courseDir, 'index');

      // Enrich with JSON metadata if available
      let jsonMeta = null;
      if (coursesJson?.courses) {
        jsonMeta = coursesJson.courses.find(c => c.slug === courseSlug);
      }

      // Derive metadata
      const title = indexBi
        ? deriveBilingualTitle(indexBi, courseSlug)
        : (jsonMeta?.title || { en: courseSlug, zh: courseSlug });

      const description = indexBi
        ? deriveBilingualDescription(indexBi)
        : (jsonMeta?.shortDesc || jsonMeta?.description || { en: '', zh: '' });

      const tags = indexBi?.en?.frontmatter?.tags
        || indexBi?.zh?.frontmatter?.tags
        || jsonMeta?.tags || [];

      const order = indexBi?.en?.frontmatter?.order
        ?? indexBi?.zh?.frontmatter?.order
        ?? jsonMeta?.order;

      // Scan chapters (non-index .md files)
      const chapterFiles = await fs.readdir(courseDir);
      const chapterMap = new Map(); // baseName → { en, zh }

      for (const f of chapterFiles) {
        if (!f.endsWith('.md')) continue;
        if (f.startsWith('index.')) continue;
        if (f === 'index.md') continue;
        // Group by base name (file.en.md + file.zh.md = one chapter)
        const langMatch = f.match(/^(.+?)\.(en|zh)\.md$/);
        const baseName = langMatch ? langMatch[1] : f.replace(/\.md$/, '');
        if (!chapterMap.has(baseName)) chapterMap.set(baseName, {});
        const group = chapterMap.get(baseName);
        if (langMatch) {
          group[langMatch[2]] = f;
        } else {
          group.plain = f;
        }
      }

      const chapters = [];
      for (const [chBase, group] of chapterMap) {
        let chBi = null;
        // Try to read the bilingual pair
        const enFile = group.en ? path.join(courseDir, group.en) : null;
        const zhFile = group.zh ? path.join(courseDir, group.zh) : null;
        const plainFile = group.plain ? path.join(courseDir, group.plain) : null;

        if (enFile || zhFile) {
          // Use the first available file to trigger parseBilingualContent
          const refFile = enFile || zhFile;
          chBi = parseBilingualContent(refFile);
        } else if (plainFile) {
          chBi = parseBilingualContent(plainFile);
        }

        // Try JSON chapter metadata
        let jsonChMeta = null;
        if (jsonMeta?.chapters) {
          jsonChMeta = jsonMeta.chapters.find(
            c => c.slug === chBase || c.filename === chBase
          );
        }

        const chTitle = chBi
          ? deriveBilingualTitle(chBi, chBase)
          : (jsonChMeta?.title || { en: chBase, zh: chBase });

        const chOrder = chBi?.en?.frontmatter?.order
          ?? chBi?.zh?.frontmatter?.order
          ?? jsonChMeta?.order;

        chapters.push({
          slug: slugify(chBase),
          filename: chBase,
          title: chTitle,
          order: chOrder,
          bi: chBi,
          isBilingual: chBi ? isBilingual(chBi) : false,
        });
      }

      sortByOrder(chapters, c => c.filename);

      data.courses.push({
        slug: slugify(courseSlug),
        title,
        description,
        tags,
        order,
        bi: indexBi,
        isBilingual: indexBi ? isBilingual(indexBi) : false,
        chapters,
      });
    }

    sortByOrder(data.courses, c => c.slug);
  }

  // ── Projects ──
  const projectsDir = path.join(CONTENT_DIR, 'projects');
  if (fs.existsSync(projectsDir)) {
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const projSlug = entry.name;
      const projDir = path.join(projectsDir, projSlug);

      const indexBi = scanBilingualContent(projDir, 'index');

      let jsonMeta = null;
      if (projectsJson?.projects) {
        jsonMeta = projectsJson.projects.find(p => p.slug === projSlug);
      }

      const title = indexBi
        ? deriveBilingualTitle(indexBi, projSlug)
        : (jsonMeta?.title || { en: projSlug, zh: projSlug });

      const description = indexBi
        ? deriveBilingualDescription(indexBi)
        : (jsonMeta?.shortDesc || jsonMeta?.description || { en: '', zh: '' });

      const tags = indexBi?.en?.frontmatter?.tags
        || indexBi?.zh?.frontmatter?.tags
        || jsonMeta?.tags || [];

      const order = indexBi?.en?.frontmatter?.order
        ?? indexBi?.zh?.frontmatter?.order
        ?? jsonMeta?.order;

      const featured = indexBi?.en?.frontmatter?.featured
        ?? indexBi?.zh?.frontmatter?.featured
        ?? jsonMeta?.featured
        ?? false;

      const links = indexBi?.en?.frontmatter?.links
        || indexBi?.zh?.frontmatter?.links
        || jsonMeta?.links || {};

      // Scan subpages (non-index .md files)
      const subFiles = await fs.readdir(projDir);
      const subMap = new Map();

      for (const f of subFiles) {
        if (!f.endsWith('.md')) continue;
        if (f.startsWith('index.')) continue;
        if (f === 'index.md') continue;
        const langMatch = f.match(/^(.+?)\.(en|zh)\.md$/);
        const baseName = langMatch ? langMatch[1] : f.replace(/\.md$/, '');
        if (!subMap.has(baseName)) subMap.set(baseName, {});
        const group = subMap.get(baseName);
        if (langMatch) {
          group[langMatch[2]] = f;
        } else {
          group.plain = f;
        }
      }

      const subpages = [];
      for (const [subBase, group] of subMap) {
        let subBi = null;
        const enFile = group.en ? path.join(projDir, group.en) : null;
        const zhFile = group.zh ? path.join(projDir, group.zh) : null;
        const plainFile = group.plain ? path.join(projDir, group.plain) : null;

        if (enFile || zhFile) {
          subBi = parseBilingualContent(enFile || zhFile);
        } else if (plainFile) {
          subBi = parseBilingualContent(plainFile);
        }

        const subTitle = subBi
          ? deriveBilingualTitle(subBi, subBase)
          : { en: subBase, zh: subBase };

        subpages.push({
          slug: slugify(subBase),
          filename: subBase,
          title: subTitle,
          bi: subBi,
          isBilingual: subBi ? isBilingual(subBi) : false,
        });
      }

      sortByOrder(subpages, s => s.filename);

      data.projects.push({
        slug: slugify(projSlug),
        title,
        description,
        tags,
        order,
        featured,
        links,
        bi: indexBi,
        isBilingual: indexBi ? isBilingual(indexBi) : false,
        subpages,
      });
    }

    sortByOrder(data.projects, p => p.slug);
  }

  // ── Blog ──
  const blogDir = path.join(CONTENT_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    const blogFiles = await fs.readdir(blogDir);
    const blogMap = new Map();

    for (const f of blogFiles) {
      if (!f.endsWith('.md')) continue;
      const langMatch = f.match(/^(.+?)\.(en|zh)\.md$/);
      const baseName = langMatch ? langMatch[1] : f.replace(/\.md$/, '');
      if (!blogMap.has(baseName)) blogMap.set(baseName, {});
      const group = blogMap.get(baseName);
      if (langMatch) {
        group[langMatch[2]] = f;
      } else {
        group.plain = f;
      }
    }

    for (const [postBase, group] of blogMap) {
      let postBi = null;
      const enFile = group.en ? path.join(blogDir, group.en) : null;
      const zhFile = group.zh ? path.join(blogDir, group.zh) : null;
      const plainFile = group.plain ? path.join(blogDir, group.plain) : null;

      if (enFile || zhFile) {
        postBi = parseBilingualContent(enFile || zhFile);
      } else if (plainFile) {
        postBi = parseBilingualContent(plainFile);
      }
      if (!postBi) continue;

      const title = deriveBilingualTitle(postBi, postBase);
      const description = deriveBilingualDescription(postBi);

      // Date from frontmatter (English first, then Chinese, then fallback)
      let date = postBi.en?.frontmatter?.date
        || postBi.zh?.frontmatter?.date
        || postBi.fallback?.frontmatter?.date
        || null;

      // Normalize date
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) date = d.toISOString();
        else date = null;
      }

      const tags = postBi.en?.frontmatter?.tags
        || postBi.zh?.frontmatter?.tags
        || postBi.fallback?.frontmatter?.tags
        || [];

      data.blog.push({
        slug: slugify(postBase),
        title,
        description,
        date,
        tags,
        bi: postBi,
        isBilingual: postBi ? isBilingual(postBi) : false,
      });
    }

    // Sort blog by date descending, then by title
    data.blog.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.slug.localeCompare(b.slug);
    });
  }

  return data;
}

/**
 * Helper: scan for bilingual content with a given base filename in a directory.
 * Returns the result of parseBilingualContent() or null if nothing found.
 *
 * Tries: <base>.en.md, <base>.zh.md, <base>.md (in that order to find at least one)
 */
function scanBilingualContent(dir, baseName) {
  const candidates = [
    `${baseName}.en.md`,
    `${baseName}.zh.md`,
    `${baseName}.md`,
  ];
  for (const cand of candidates) {
    const full = path.join(dir, cand);
    if (fs.existsSync(full)) return parseBilingualContent(full);
  }
  return null;
}

// ─── Page builders ───────────────────────────────────────────────────────────

/**
 * Render a template to a file, creating parent directories as needed.
 */
function renderPage(templateName, data, outputPath) {
  const html = nunjucksEnv.render(templateName, {
    ...data,
    SITE: SITE_CONFIG,
    currentYear: new Date().getFullYear(),
  });
  const outFile = path.join(PUBLIC_DIR, outputPath);
  fs.ensureDirSync(path.dirname(outFile));
  fs.writeFileSync(outFile, html, 'utf-8');
  console.log(`  ✓ ${outputPath}`);
}

/**
 * Build all pages from scanned content.
 */
async function buildAll(content) {
  // Clean output directory
  fs.emptyDirSync(PUBLIC_DIR);

  // Copy static assets
  if (fs.existsSync(STATIC_DIR)) {
    fs.copySync(STATIC_DIR, PUBLIC_DIR, { overwrite: true });
    console.log('  ✓ static/ → public/');
  }

  // Copy content/ static assets (images, etc.) if present
  const contentAssets = path.join(CONTENT_DIR, 'assets');
  if (fs.existsSync(contentAssets)) {
    fs.copySync(contentAssets, path.join(PUBLIC_DIR, 'assets'), { overwrite: true });
    console.log('  ✓ content/assets/ → public/assets/');
  }

  // ── Home ──
  if (content.home) {
    renderPage('home.html', { page: content.home, pageType: 'home' }, 'index.html');
  }

  // ── About ──
  if (content.about) {
    renderPage('about.html', { page: content.about, pageType: 'about' }, 'about/index.html');
  }

  // ── Courses ──
  if (content.courses.length > 0) {
    // Courses list page
    renderPage('courses-list.html', {
      pageType: 'courses-list',
      page: { title: { en: 'Courses', zh: '课程' }, courses: content.courses },
    }, 'courses/index.html');

    for (const course of content.courses) {
      // Course home page
      renderPage('course-home.html', {
        pageType: 'course',
        page: course,
        breadcrumbs: [
          { href: '/courses/', label: { en: 'Courses', zh: '课程' } },
          { href: null, label: course.title },
        ],
      }, `courses/${course.slug}/index.html`);

      // Chapter pages
      for (let i = 0; i < course.chapters.length; i++) {
        const ch = course.chapters[i];
        const prev = i > 0 ? course.chapters[i - 1] : null;
        const next = i < course.chapters.length - 1 ? course.chapters[i + 1] : null;

        renderPage('course-chapter.html', {
          pageType: 'chapter',
          page: ch,
          course,
          prev,
          next,
          breadcrumbs: [
            { href: '/courses/', label: { en: 'Courses', zh: '课程' } },
            { href: `/courses/${course.slug}/`, label: course.title },
            { href: null, label: ch.title },
          ],
        }, `courses/${course.slug}/${ch.slug}.html`);
      }
    }
  }

  // ── Projects ──
  if (content.projects.length > 0) {
    renderPage('projects-list.html', {
      pageType: 'projects-list',
      page: { title: { en: 'Projects', zh: '项目' }, projects: content.projects },
    }, 'projects/index.html');

    for (const proj of content.projects) {
      renderPage('project-home.html', {
        pageType: 'project',
        page: proj,
        breadcrumbs: [
          { href: '/projects/', label: { en: 'Projects', zh: '项目' } },
          { href: null, label: proj.title },
        ],
      }, `projects/${proj.slug}/index.html`);

      // Subpages
      for (const sub of proj.subpages) {
        renderPage('project-subpage.html', {
          pageType: 'project-subpage',
          page: sub,
          project: proj,
          breadcrumbs: [
            { href: '/projects/', label: { en: 'Projects', zh: '项目' } },
            { href: `/projects/${proj.slug}/`, label: proj.title },
            { href: null, label: sub.title },
          ],
        }, `projects/${proj.slug}/${sub.slug}.html`);
      }
    }
  }

  // ── Blog ──
  // Always render blog list page (even when empty)
  renderPage('blog-list.html', {
    pageType: 'blog-list',
    page: { title: { en: 'Blog', zh: '博客' }, posts: content.blog },
  }, 'blog/index.html');

  for (const post of content.blog) {
      renderPage('blog-post.html', {
        pageType: 'blog-post',
        page: post,
        breadcrumbs: [
          { href: '/blog/', label: { en: 'Blog', zh: '博客' } },
          { href: null, label: post.title },
        ],
      }, `blog/${post.slug}.html`);
    }

  // ── 404 page ──
  renderPage('base.html', {
    pageType: '404',
    page: {
      title: { en: 'Page Not Found', zh: '页面未找到' },
      isBilingual: true,
      bi: {
        en: { html: '<div class="error-state"><h2>404 — Page Not Found</h2><p>The page you are looking for does not exist. <a href="/">Go home</a></p></div>' },
        zh: { html: '<div class="error-state"><h2>404 — 页面未找到</h2><p>您访问的页面不存在。<a href="/">返回首页</a></p></div>' },
      },
    },
  }, '404.html');

  // ── Empty index for directories that need redirects ──
  // (GitHub Pages serves index.html for directory URLs)
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔨 Building static site...\n');

  console.log('📁 Scanning content/ ...');
  const content = await scanAllContent();

  console.log(`   home:       ${content.home ? '✓' : '— (skipped)'}`);
  console.log(`   about:      ${content.about ? '✓' : '— (skipped)'}`);
  console.log(`   courses:    ${content.courses.length} course(s)`);
  console.log(`   projects:   ${content.projects.length} project(s)`);
  console.log(`   blog:       ${content.blog.length} post(s)`);

  console.log('\n📄 Rendering pages ...');
  await buildAll(content);

  console.log('\n✅ Build complete!  Output: public/\n');
  console.log('   Preview:  npx serve public/');
  console.log('          or:  python3 -m http.server -d public/\n');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
