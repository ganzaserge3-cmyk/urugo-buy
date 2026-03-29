# AdSense Readiness Checklist

This project is much closer to AdSense approval, but final approval depends on the live deployment and Google review.

## Before Applying

1. Deploy the site on a real public domain, not a temporary dev URL.
2. Make sure every main page loads without errors on mobile and desktop.
3. Keep the legal pages live and accessible:
   - `/about-us`
   - `/contact-us`
   - `/privacy-policy`
   - `/terms-of-service`
4. Verify that the blog and content pages are visible and not empty.
5. Continue adding original posts and business content over time.

## AdSense Integration

1. Replace the placeholder AdSense script in `client/index.html` with your real `ca-pub-...` publisher ID.
2. Replace the placeholder line in `client/public/ads.txt` with the real Google-provided entry.
3. After deployment, confirm:
   - `https://yourdomain.com/ads.txt`
   - `https://yourdomain.com/robots.txt`
   - `https://yourdomain.com/sitemap.xml`

## SEO and Search

1. Add the live domain property to Google Search Console.
2. Submit the sitemap after deployment.
3. Check that canonical URLs match production routes.
4. Make sure Google can crawl the main pages without login.

## Trust and Policy

1. Keep contact details real and monitored.
2. Do not publish copied or auto-generated spam content.
3. Avoid policy-violating material, copyrighted misuse, misleading claims, or thin placeholder pages.
4. Keep navigation, footer links, and copyright visible.

## Final Review

1. Test the homepage, shop, product detail, blog, legal pages, and contact form.
2. Check for broken internal links.
3. Confirm pages load quickly and images render correctly.
4. Apply to AdSense only after the production site is stable and complete.
