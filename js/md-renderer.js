/* ============================================================
   md-renderer.js — Markdown fetching, parsing & rendering
   Depends on: marked.js (loaded via CDN)
   ============================================================ */

(function () {
    'use strict';

    class MarkdownRenderer {
        constructor() {
            this.baseUrl = 'content/';
            this.cache = {};  // Simple in-memory cache
        }

        /**
         * Fetch a text file and return its content.
         * @param {string} path — relative path from site root
         * @returns {Promise<string>}
         */
        async _fetch(path) {
            if (this.cache[path]) return this.cache[path];

            const res = await fetch(path);
            if (!res.ok) throw new Error('Failed to load ' + path + ': ' + res.status);
            const text = await res.text();
            this.cache[path] = text;
            return text;
        }

        /**
         * Load and render a markdown file with language fallback.
         * Tries: {filename}.{lang}.md → {filename}.md → error
         *
         * @param {string} category — 'courses' or 'projects'
         * @param {string} slug — course or project slug
         * @param {string} [chapterSlug] — chapter filename (default: 'index')
         * @param {string} [lang] — language code ('zh', 'en')
         * @returns {Promise<{html: string, raw: string}>}
         */
        async renderChapter(category, slug, chapterSlug, lang) {
            chapterSlug = chapterSlug || 'index';
            lang = lang || window.currentLang || 'zh';

            const basePath = this.baseUrl + category + '/' + slug + '/' + chapterSlug;
            let md;

            try {
                md = await this._fetch(basePath + '.' + lang + '.md');
            } catch (errLang) {
                try {
                    md = await this._fetch(basePath + '.md');
                } catch (errFallback) {
                    throw new Error(
                        'Markdown file not found: ' +
                        basePath + '.' + lang + '.md or ' +
                        basePath + '.md'
                    );
                }
            }

            // Extract title from first # heading if present
            let title = '';
            const titleMatch = md.match(/^#\s+(.+)$/m);
            if (titleMatch) {
                title = titleMatch[1].trim();
            }

            // Render markdown to HTML
            let html = '';
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: true,
                    mangle: false
                });
                html = marked.parse(md);
            } else {
                // Fallback: wrap in <pre> if marked.js not loaded
                html = '<pre>' + this._escapeHtml(md) + '</pre>';
            }

            return { html: html, raw: md, title: title };
        }

        /**
         * Load a JSON catalog file.
         * @param {string} type — 'courses' or 'projects'
         * @returns {Promise<object>}
         */
        async loadCatalog(type) {
            const path = this.baseUrl + type + '.json';
            const text = await this._fetch(path);
            return JSON.parse(text);
        }

        /**
         * Escape HTML special characters.
         * @param {string} text
         * @returns {string}
         */
        _escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, function (m) { return map[m]; });
        }
    }

    // Global singleton
    window.mdRenderer = new MarkdownRenderer();

})();
