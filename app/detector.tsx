"use client";

import { useState, useMemo } from "react";
import SearchBar from "./searchbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Technology detection signatures
interface TechSignature {
  name: string;
  category: string;
  icon?: string;
  detect: (html: string, headers?: Record<string, string>) => boolean;
}

const SIGNATURES: TechSignature[] = [
  // Frameworks
  { name: "React", category: "Framework", detect: (h) => /react[-.]|__react|reactDOM|_reactRoot/i.test(h) || h.includes("__NEXT_DATA__") || h.includes("data-reactroot") },
  { name: "Next.js", category: "Framework", detect: (h) => h.includes("__NEXT_DATA__") || h.includes("/_next/") },
  { name: "Vue.js", category: "Framework", detect: (h) => /vue[-.]|__vue|data-v-[a-f0-9]/i.test(h) },
  { name: "Nuxt", category: "Framework", detect: (h) => h.includes("__NUXT__") || h.includes("/_nuxt/") },
  { name: "Angular", category: "Framework", detect: (h) => /ng-version|ng-app|angular[.-]/i.test(h) || h.includes("ng-") },
  { name: "Svelte", category: "Framework", detect: (h) => /svelte[-.]|__svelte/i.test(h) || /class="svelte-[a-z0-9]+"/i.test(h) },
  { name: "SvelteKit", category: "Framework", detect: (h) => h.includes("__sveltekit") },
  { name: "Astro", category: "Framework", detect: (h) => h.includes("astro-") || /astro-island|astro-slot/i.test(h) },
  { name: "Gatsby", category: "Framework", detect: (h) => h.includes("___gatsby") || h.includes("/page-data/") },
  { name: "Remix", category: "Framework", detect: (h) => h.includes("__remix") || h.includes("__remixContext") },
  { name: "jQuery", category: "Library", detect: (h) => /jquery[.-]|jquery\.min\.js/i.test(h) },
  { name: "Bootstrap", category: "Library", detect: (h) => /bootstrap[.-]|bootstrap\.min/i.test(h) },
  { name: "Tailwind CSS", category: "Library", detect: (h) => /tailwindcss|tailwind\.min/i.test(h) || h.includes("tailwind") },
  { name: "Alpine.js", category: "Library", detect: (h) => /alpine[.-]|x-data|x-bind|x-on/i.test(h) },
  { name: "HTMX", category: "Library", detect: (h) => /htmx[.-]|hx-get|hx-post|hx-trigger/i.test(h) },
  // CMS
  { name: "WordPress", category: "CMS", detect: (h) => /wp-content|wp-includes|wp-json/i.test(h) },
  { name: "Drupal", category: "CMS", detect: (h) => /drupal|sites\/default\/files/i.test(h) },
  { name: "Shopify", category: "CMS", detect: (h) => /shopify|cdn\.shopify\.com/i.test(h) },
  { name: "Squarespace", category: "CMS", detect: (h) => /squarespace|static\.squarespace\.com/i.test(h) },
  { name: "Wix", category: "CMS", detect: (h) => /wix\.com|wixstatic\.com|_wix_browser_sess/i.test(h) },
  { name: "Webflow", category: "CMS", detect: (h) => /webflow|assets\.website-files\.com|data-wf-/i.test(h) },
  { name: "Ghost", category: "CMS", detect: (h) => /ghost-|content\/images|ghost\.org/i.test(h) },
  { name: "Contentful", category: "CMS", detect: (h) => /contentful|ctfassets\.net/i.test(h) },
  { name: "Strapi", category: "CMS", detect: (h) => /strapi/i.test(h) },
  // Analytics
  { name: "Google Analytics", category: "Analytics", detect: (h) => /google-analytics|googletagmanager|gtag|ga\.js|analytics\.js|G-[A-Z0-9]+|UA-[0-9]+-[0-9]+/i.test(h) },
  { name: "Google Tag Manager", category: "Analytics", detect: (h) => /googletagmanager\.com\/gtm/i.test(h) },
  { name: "Plausible", category: "Analytics", detect: (h) => /plausible\.io/i.test(h) },
  { name: "Fathom", category: "Analytics", detect: (h) => /usefathom\.com|cdn\.usefathom/i.test(h) },
  { name: "PostHog", category: "Analytics", detect: (h) => /posthog|app\.posthog\.com/i.test(h) },
  { name: "Segment", category: "Analytics", detect: (h) => /cdn\.segment\.com|analytics\.js/i.test(h) && h.includes("segment") },
  { name: "Hotjar", category: "Analytics", detect: (h) => /hotjar|static\.hotjar\.com/i.test(h) },
  { name: "Mixpanel", category: "Analytics", detect: (h) => /mixpanel/i.test(h) },
  { name: "Vercel Analytics", category: "Analytics", detect: (h) => /vercel\.com\/analytics|vitals\.vercel-analytics|va\.vercel-scripts/i.test(h) || h.includes("_vercel") },
  // CDN / Hosting
  { name: "Cloudflare", category: "CDN", detect: (h) => /cloudflare|cf-ray|__cf_/i.test(h) },
  { name: "Vercel", category: "Hosting", detect: (h) => /vercel|\.vercel\.app|_vercel/i.test(h) },
  { name: "Netlify", category: "Hosting", detect: (h) => /netlify/i.test(h) },
  { name: "AWS", category: "CDN", detect: (h) => /amazonaws\.com|cloudfront\.net/i.test(h) },
  { name: "Fastly", category: "CDN", detect: (h) => /fastly/i.test(h) },
  // Other
  { name: "Font Awesome", category: "UI", detect: (h) => /font-awesome|fontawesome|fa-brands|fa-solid/i.test(h) },
  { name: "Google Fonts", category: "UI", detect: (h) => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(h) },
  { name: "Stripe", category: "Payment", detect: (h) => /stripe\.com|js\.stripe/i.test(h) },
  { name: "Intercom", category: "Support", detect: (h) => /intercom|widget\.intercom\.io/i.test(h) },
  { name: "Crisp", category: "Support", detect: (h) => /crisp\.chat|client\.crisp\.chat/i.test(h) },
  { name: "Zendesk", category: "Support", detect: (h) => /zendesk|zdassets\.com/i.test(h) },
  { name: "reCAPTCHA", category: "Security", detect: (h) => /recaptcha|google\.com\/recaptcha/i.test(h) },
  { name: "hCaptcha", category: "Security", detect: (h) => /hcaptcha/i.test(h) },
  { name: "Sentry", category: "Monitoring", detect: (h) => /sentry\.io|browser\.sentry-cdn/i.test(h) },
  { name: "Datadog", category: "Monitoring", detect: (h) => /datadoghq\.com|dd-rum/i.test(h) },
  { name: "LaunchDarkly", category: "Feature Flags", detect: (h) => /launchdarkly/i.test(h) },
  { name: "Optimizely", category: "A/B Testing", detect: (h) => /optimizely/i.test(h) },
  { name: "Hubspot", category: "Marketing", detect: (h) => /hubspot|hs-scripts|hbspt/i.test(h) },
  { name: "Mailchimp", category: "Marketing", detect: (h) => /mailchimp|chimpstatic/i.test(h) },
  { name: "Drift", category: "Support", detect: (h) => /drift\.com|js\.driftt\.com/i.test(h) },
];

const CATEGORY_COLORS: Record<string, string> = {
  Framework: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Library: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  CMS: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Analytics: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  CDN: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Hosting: "bg-green-500/15 text-green-400 border-green-500/20",
  UI: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  Payment: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Support: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Security: "bg-red-500/15 text-red-400 border-red-500/20",
  Monitoring: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  "Feature Flags": "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "A/B Testing": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20",
  Marketing: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

interface DetectedTech {
  name: string;
  category: string;
  pages: string[];
  confidence: number; // 0-1, based on how many pages it appears on
}

type SortKey = "name" | "category" | "pages" | "confidence";
type SortDir = "asc" | "desc";
type FilterCategory = "all" | string;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className={`inline ml-1 ${active ? "text-[#3bde77]" : "text-muted-foreground/40"}`}>
      <path d="M6 2L9 5H3L6 2Z" fill={active && dir === "asc" ? "currentColor" : "currentColor"} opacity={active && dir === "asc" ? 1 : 0.3} />
      <path d="M6 10L3 7H9L6 10Z" fill={active && dir === "desc" ? "currentColor" : "currentColor"} opacity={active && dir === "desc" ? 1 : 0.3} />
    </svg>
  );
}

export default function Detector() {
  const [data, setData] = useState<any[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("pages");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCat, setFilterCat] = useState<FilterCategory>("all");
  const { toast } = useToast();

  const detected = useMemo(() => {
    if (!data?.length) return [];
    const results = new Map<string, DetectedTech>();

    for (const page of data) {
      if (!page?.url || !page?.content) continue;
      const html = page.content;
      for (const sig of SIGNATURES) {
        if (sig.detect(html)) {
          const existing = results.get(sig.name);
          if (existing) {
            if (!existing.pages.includes(page.url)) existing.pages.push(page.url);
          } else {
            results.set(sig.name, {
              name: sig.name,
              category: sig.category,
              pages: [page.url],
              confidence: 0,
            });
          }
        }
      }
    }

    const totalPages = data.filter((p) => p?.url && p?.content).length;
    for (const tech of results.values()) {
      tech.confidence = totalPages > 0 ? tech.pages.length / totalPages : 0;
    }

    return Array.from(results.values());
  }, [data]);

  const categories = useMemo(() => {
    const cats = new Set(detected.map((t) => t.category));
    return ["all", ...Array.from(cats).sort()];
  }, [detected]);

  const filtered = useMemo(() => {
    let list = filterCat === "all" ? detected : detected.filter((t) => t.category === filterCat);
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else if (sortKey === "pages") cmp = a.pages.length - b.pages.length;
      else if (sortKey === "confidence") cmp = a.confidence - b.confidence;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [detected, filterCat, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const pageCount = data?.filter((p) => p?.url && p?.content).length || 0;

  const exportResults = (format: "json" | "csv" | "md") => {
    if (!filtered.length) return;
    let content = "";
    let ext = format;
    if (format === "json") {
      content = JSON.stringify(filtered.map((t) => ({ name: t.name, category: t.category, pagesDetected: t.pages.length, confidence: Math.round(t.confidence * 100) + "%", pages: t.pages })), null, 2);
    } else if (format === "csv") {
      content = "Name,Category,Pages Detected,Confidence\n" + filtered.map((t) => `"${t.name}","${t.category}",${t.pages.length},${Math.round(t.confidence * 100)}%`).join("\n");
    } else {
      content = "# Tech Stack Report\n\n| Technology | Category | Pages | Confidence |\n|---|---|---|---|\n" + filtered.map((t) => `| ${t.name} | ${t.category} | ${t.pages.length} | ${Math.round(t.confidence * 100)}% |`).join("\n");
    }
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tech-stack.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Exported", description: `Downloaded tech-stack.${ext}` });
  };

  return (
    <div className="flex flex-col flex-1">
      <SearchBar setDataValues={setData} />
      <div className="flex-1 overflow-auto">
        {!data ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4 py-20">
            <svg height={48} width={48} viewBox="0 0 36 34" xmlns="http://www.w3.org/2000/svg" className="fill-[#3bde77]/30">
              <path fillRule="evenodd" clipRule="evenodd" d="M9.13883 7.06589V0.164429L13.0938 0.164429V6.175L14.5178 7.4346C15.577 6.68656 16.7337 6.27495 17.945 6.27495C19.1731 6.27495 20.3451 6.69807 21.4163 7.46593L22.8757 6.175V0.164429L26.8307 0.164429V7.06589V7.95679L26.1634 8.54706L24.0775 10.3922C24.3436 10.8108 24.5958 11.2563 24.8327 11.7262L26.0467 11.4215L28.6971 8.08749L31.793 10.5487L28.7257 14.407L28.3089 14.9313L27.6592 15.0944L26.2418 15.4502C26.3124 15.7082 26.3793 15.9701 26.4422 16.2355L28.653 16.6566L29.092 16.7402L29.4524 17.0045L35.3849 21.355L33.0461 24.5444L27.474 20.4581L27.0719 20.3816C27.1214 21.0613 27.147 21.7543 27.147 22.4577C27.147 22.5398 27.1466 22.6214 27.1459 22.7024L29.5889 23.7911L30.3219 24.1177L30.62 24.8629L33.6873 32.5312L30.0152 34L27.246 27.0769L26.7298 26.8469C25.5612 32.2432 22.0701 33.8808 17.945 33.8808C13.8382 33.8808 10.3598 32.2577 9.17593 26.9185L8.82034 27.0769L6.05109 34L2.37897 32.5312L5.44629 24.8629L5.74435 24.1177L6.47743 23.7911L8.74487 22.7806C8.74366 22.6739 8.74305 22.5663 8.74305 22.4577C8.74305 21.7616 8.76804 21.0758 8.81654 20.4028L8.52606 20.4581L2.95395 24.5444L0.615112 21.355L6.54761 17.0045L6.908 16.7402L7.34701 16.6566L9.44264 16.2575C9.50917 15.9756 9.5801 15.6978 9.65528 15.4242L8.34123 15.0944L7.69155 14.9313L7.27471 14.407L4.20739 10.5487L7.30328 8.08749L9.95376 11.4215L11.0697 11.7016C11.3115 11.2239 11.5692 10.7716 11.8412 10.3473L9.80612 8.54706L9.13883 7.95679V7.06589Z" />
            </svg>
            <h2 className="text-xl font-bold">Spider Tech Detector</h2>
            <p className="text-muted-foreground max-w-md">
              Detect what technologies any website uses. Identify frameworks, CMS platforms, analytics tools, CDNs, and more.
            </p>
          </div>
        ) : detected.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-20 text-muted-foreground">
            <p>No technologies detected yet.</p>
            <p className="text-sm">Results appear as pages are crawled.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Technologies</p>
                <p className="text-2xl font-bold text-[#3bde77]">{detected.length}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{new Set(detected.map((t) => t.category)).size}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Pages Scanned</p>
                <p className="text-2xl font-bold">{pageCount}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Avg per Page</p>
                <p className="text-2xl font-bold">{pageCount > 0 ? (detected.reduce((s, t) => s + t.pages.length, 0) / pageCount).toFixed(1) : "0"}</p>
              </div>
            </div>

            {/* Filter + Export */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filterCat === cat
                      ? "bg-[#3bde77]/15 text-[#3bde77] border-[#3bde77]/30"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/20"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                  {cat !== "all" && (
                    <span className="ml-1 opacity-60">
                      {detected.filter((t) => t.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
              <div className="flex-1" />
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => exportResults("json")}>JSON</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => exportResults("csv")}>CSV</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => exportResults("md")}>MD</Button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-left p-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("name")}>
                      Technology <SortIcon active={sortKey === "name"} dir={sortDir} />
                    </th>
                    <th className="text-left p-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("category")}>
                      Category <SortIcon active={sortKey === "category"} dir={sortDir} />
                    </th>
                    <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("pages")}>
                      Pages <SortIcon active={sortKey === "pages"} dir={sortDir} />
                    </th>
                    <th className="text-right p-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("confidence")}>
                      Confidence <SortIcon active={sortKey === "confidence"} dir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tech) => (
                    <tr key={tech.name} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium">{tech.name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[tech.category] || "bg-muted text-muted-foreground"}`}>
                          {tech.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono text-xs">{tech.pages.length}/{pageCount}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#3bde77]"
                              style={{ width: `${Math.round(tech.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-8 text-right">{Math.round(tech.confidence * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
