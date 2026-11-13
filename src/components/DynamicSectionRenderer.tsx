import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Send, Check, Clock, Quote } from 'lucide-react';
import { WebsiteSection, Product } from '../types';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { RichContentRenderer } from './RichContentRenderer';

interface DynamicSectionRendererProps {
  section: WebsiteSection;
}

export const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({ section }) => {
  const {
    products,
    categories,
    storeSettings,
    navigateTarget,
    navigateToShop,
    subscribeNewsletter,
  } = useApp();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterErr, setNewsletterErr] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (section.type !== 'countdown_promo' || !section.countdownEndAt) return;
    const calc = () => {
      const target = new Date(section.countdownEndAt!).getTime();
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [section.type, section.countdownEndAt]);

  if (!section.isVisible) return null;

  // Desktop & Mobile visibility rules
  let visibilityClass = '';
  if (section.visibleDesktop === false && section.visibleMobile === false) return null;
  if (section.visibleDesktop === false) visibilityClass = 'block lg:hidden';
  else if (section.visibleMobile === false) visibilityClass = 'hidden lg:block';

  const containerClass =
    storeSettings.layoutWidth === 'wide'
      ? 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10'
      : storeSettings.layoutWidth === 'compact'
      ? 'max-w-5xl mx-auto px-4 sm:px-6'
      : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  const primaryColor = storeSettings.primaryColor || '#1B3B2B';
  const radiusClass =
    storeSettings.borderRadius === 'sharp'
      ? 'rounded-md'
      : storeSettings.borderRadius === 'rounded'
      ? 'rounded-3xl'
      : 'rounded-2xl';

  const btnBaseStyle =
    storeSettings.buttonStyle === 'outline'
      ? {
          backgroundColor: 'transparent',
          color: section.textColor || primaryColor,
          borderColor: section.textColor || primaryColor,
          borderWidth: '1px',
        }
      : {
          backgroundColor: primaryColor,
          color: '#FAF8F4',
        };

  const alignClass =
    section.alignment === 'center'
      ? 'text-center items-center'
      : section.alignment === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  // Helper to resolve products for product-based sections
  const resolveProducts = (mode: 'featured' | 'new' | 'best' | 'promo' | 'collection'): Product[] => {
    const active = products.filter((p) => p.isActive);
    const limit = section.productCount > 0 ? section.productCount : 6;
    if (section.productIds && section.productIds.length > 0) {
      const picked = active.filter((p) => section.productIds!.includes(p.id));
      if (picked.length > 0) return picked.slice(0, limit);
    }
    if (mode === 'featured') return active.filter((p) => p.isFeatured).slice(0, limit);
    if (mode === 'new') return active.filter((p) => p.isNewArrival).slice(0, limit);
    if (mode === 'best') {
      return [...active]
        .filter((p) => p.isBestSeller)
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);
    }
    if (mode === 'promo') {
      const onSale = active.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
      return (onSale.length > 0 ? onSale : active).slice(0, limit);
    }
    if (mode === 'collection') {
      const cat = section.categorySlug && section.categorySlug !== 'all' ? section.categorySlug : null;
      return (cat ? active.filter((p) => p.categoryId === cat) : active).slice(0, limit);
    }
    return active.slice(0, limit);
  };

  const handleSectionNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterErr(null);
    try {
      await subscribeNewsletter(newsletterEmail, 'section');
      setNewsletterDone(true);
      setNewsletterEmail('');
    } catch (err: any) {
      setNewsletterErr(err?.message || 'Unable to subscribe.');
    }
  };

  const renderHeaderBlock = () => (
    <div className={`flex flex-col ${alignClass} gap-1.5 mb-7`}>
      {section.subtitle && (
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-75 font-semibold">
          {section.subtitle}
        </p>
      )}
      {section.heading && (
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          {section.heading}
        </h2>
      )}
      {section.description && (
        <p className="text-sm opacity-80 max-w-2xl mt-1 leading-relaxed">{section.description}</p>
      )}
    </div>
  );

  const renderActionBtn = (inverse = false) =>
    section.buttonText ? (
      <button
        type="button"
        onClick={() => navigateTarget(section.buttonTargetType, section.buttonDestination)}
        style={
          inverse
            ? { backgroundColor: '#FAF8F4', color: '#171C19' }
            : btnBaseStyle
        }
        className="px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
      >
        <span>{section.buttonText}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    ) : null;

  // 1. HERO BANNER
  if (section.type === 'hero_banner') {
    const heroImg = section.images?.[0];
    const isCentered = section.layout === 'centered' || section.alignment === 'center';
    return (
      <section className={`${visibilityClass} pt-6 sm:pt-8`}>
        <div className={containerClass}>
          <div
            className={`${radiusClass} border border-[#E4E0D6] overflow-hidden grid grid-cols-1 ${
              isCentered ? '' : 'lg:grid-cols-12'
            } items-stretch`}
            style={{
              backgroundColor: section.backgroundColor || '#F3F0E8',
              color: section.textColor || '#171C19',
            }}
          >
            <div
              className={`${
                isCentered ? 'text-center items-center' : 'lg:col-span-6 items-start'
              } p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-5`}
            >
              {section.subtitle && (
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-75 font-semibold">
                  {section.subtitle}
                </p>
              )}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.06] tracking-tight">
                {section.heading}
              </h1>
              {section.description && (
                <p className="text-sm sm:text-base opacity-80 leading-relaxed max-w-lg">
                  {section.description}
                </p>
              )}
              <div className="pt-2 flex flex-wrap gap-3">{renderActionBtn()}</div>
            </div>

            {!isCentered && (
              <div className="lg:col-span-6 h-72 sm:h-96 lg:h-[520px] bg-[#E9EFEA] overflow-hidden">
                {heroImg ? (
                  <img
                    src={heroImg}
                    alt={section.heading}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 2. PROMOTIONAL BANNER / 3. IMAGE & TEXT / 10. BRAND INTRO
  if (
    section.type === 'promotional_banner' ||
    section.type === 'image_text' ||
    section.type === 'brand_intro'
  ) {
    const img = section.images?.[0];
    const imageRight = section.type === 'image_text' && section.alignment === 'left';
    const isDarkBg =
      section.backgroundColor?.toLowerCase() === '#1b3b2b' ||
      section.backgroundColor?.toLowerCase() === '#171c19';

    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          <div
            className={`${radiusClass} overflow-hidden border border-[#E4E0D6] grid grid-cols-1 lg:grid-cols-12 items-stretch`}
            style={{
              backgroundColor: section.backgroundColor || '#1B3B2B',
              color: section.textColor || '#FAF8F4',
            }}
          >
            {img && !imageRight && (
              <div className="lg:col-span-6 h-64 sm:h-80 lg:min-h-[380px] overflow-hidden bg-black/10">
                <img
                  src={img}
                  alt={section.heading}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div
              className={`${
                img ? 'lg:col-span-6' : 'lg:col-span-12'
              } p-8 sm:p-12 flex flex-col justify-center ${alignClass} space-y-4`}
            >
              {section.subtitle && (
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-75 font-semibold">
                  {section.subtitle}
                </p>
              )}
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
                {section.heading}
              </h2>
              {section.description && (
                <p className="text-sm opacity-85 leading-relaxed max-w-xl">
                  {section.description}
                </p>
              )}
              <div className="pt-2">{renderActionBtn(isDarkBg)}</div>
            </div>

            {img && imageRight && (
              <div className="lg:col-span-6 h-64 sm:h-80 lg:min-h-[380px] overflow-hidden bg-black/10">
                <img
                  src={img}
                  alt={section.heading}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 4, 5, 6, 8, 17: PRODUCT GRIDS
  if (
    section.type === 'featured_products' ||
    section.type === 'new_arrivals' ||
    section.type === 'best_sellers' ||
    section.type === 'promotional_product_grid' ||
    section.type === 'collection_showcase'
  ) {
    const mode =
      section.type === 'featured_products'
        ? 'featured'
        : section.type === 'new_arrivals'
        ? 'new'
        : section.type === 'best_sellers'
        ? 'best'
        : section.type === 'promotional_product_grid'
        ? 'promo'
        : 'collection';
    const list = resolveProducts(mode);

    return (
      <section
        className={`${visibilityClass} py-4`}
        style={{
          backgroundColor: section.backgroundColor || 'transparent',
          color: section.textColor || '#171C19',
        }}
      >
        <div className={containerClass}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4E0D6]">
            <div>
              {section.subtitle && (
                <p className="text-[11px] uppercase tracking-[0.18em] opacity-75 font-semibold">
                  {section.subtitle}
                </p>
              )}
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">
                {section.heading}
              </h2>
              {section.description && (
                <p className="text-xs sm:text-sm opacity-75 mt-1 max-w-xl">
                  {section.description}
                </p>
              )}
            </div>

            {section.buttonText && (
              <button
                type="button"
                onClick={() => navigateTarget(section.buttonTargetType, section.buttonDestination)}
                className="text-sm font-medium hover:underline underline-offset-4 inline-flex items-center gap-1 shrink-0"
                style={{ color: primaryColor }}
              >
                <span>{section.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 mt-8">
            {list.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 7. CATEGORY GRID
  if (section.type === 'category_grid') {
    const activeCats = categories.filter((c) => c.isActive);
    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              {section.subtitle && (
                <p className="text-[11px] uppercase tracking-[0.18em] opacity-75 font-semibold">
                  {section.subtitle}
                </p>
              )}
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">
                {section.heading}
              </h2>
            </div>
            {section.buttonText && (
              <button
                type="button"
                onClick={() => navigateToShop('all', '')}
                className="text-sm font-medium hover:underline underline-offset-4 inline-flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                <span>{section.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {activeCats.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigateToShop(cat.slug, '')}
                className={`group text-left bg-white border border-[#E4E0D6] ${radiusClass} p-3 hover:border-[#1B3B2B]/50 transition-colors`}
              >
                <div className="aspect-4/3 w-full rounded-xl bg-[#F3F0E8] overflow-hidden mb-3">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                </div>
                <h3 className="text-sm font-semibold text-[#171C19] group-hover:text-[#1B3B2B]">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#5C655F] mt-0.5 line-clamp-1">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 9. IMAGE GALLERY & 14. SOCIAL SHOWCASE
  if (section.type === 'image_gallery' || section.type === 'social_showcase') {
    const imgs = section.images || [];
    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          {renderHeaderBlock()}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imgs.map((url, idx) => (
              <div
                key={idx}
                className={`aspect-4/3 ${radiusClass} overflow-hidden bg-[#F3F0E8] border border-[#E4E0D6]`}
              >
                <img
                  src={url}
                  alt={`${section.heading} ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
          {section.buttonText && <div className="mt-6">{renderActionBtn()}</div>}
        </div>
      </section>
    );
  }

  // 11. TESTIMONIALS & 12. CUSTOMER REVIEWS
  if (section.type === 'testimonials' || section.type === 'customer_reviews') {
    const entries =
      section.items && section.items.length > 0
        ? section.items
        : [
            {
              id: 't1',
              title: 'Quiet craftsmanship, dependable delivery',
              body: 'Ordered the Solis Lamp and Linen Overshirt to Banani. Arrived next afternoon in clean plastic-free packaging.',
              author: 'Tahmidul Islam',
              role: 'Dhaka',
              rating: 5,
            },
            {
              id: 't2',
              title: 'Honest materials & smooth bKash verification',
              body: 'The Stoneware Vase Duo matches our dining room effortlessly. Support verified my bKash TrxID within minutes.',
              author: 'Maliha Chowdhury',
              role: 'Chattogram',
              rating: 5,
            },
            {
              id: 't3',
              title: 'Built to last',
              body: 'The Heritage Watch and Studio Headphones feel thoughtfully engineered without unnecessary logos.',
              author: 'Rafiul Karim',
              role: 'Sylhet',
              rating: 5,
            },
          ];

    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          {renderHeaderBlock()}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`${radiusClass} p-6 bg-white border border-[#E4E0D6] flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  {section.type === 'customer_reviews' ? (
                    <div className="flex items-center gap-1 text-[#1B3B2B]">
                      {Array.from({ length: entry.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  ) : (
                    <Quote className="w-5 h-5 text-[#6E8774]" />
                  )}
                  {entry.title && (
                    <h3 className="text-sm font-semibold text-[#171C19]">{entry.title}</h3>
                  )}
                  <p className="text-sm text-[#5C655F] leading-relaxed">“{entry.body}”</p>
                </div>
                <div className="pt-3 border-t border-[#E4E0D6] text-xs">
                  <span className="font-semibold text-[#171C19]">{entry.author || 'Customer'}</span>
                  {entry.role && <span className="text-[#5C655F]"> · {entry.role}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 13. NEWSLETTER SUBSCRIPTION
  if (section.type === 'newsletter') {
    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          <div
            className={`${radiusClass} border border-[#E4E0D6] p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6`}
            style={{
              backgroundColor: section.backgroundColor || '#F3F0E8',
              color: section.textColor || '#171C19',
            }}
          >
            <div className="space-y-2 max-w-lg">
              {section.subtitle && (
                <p className="text-[11px] uppercase tracking-[0.18em] opacity-75 font-semibold">
                  {section.subtitle}
                </p>
              )}
              <h2 className="font-serif text-3xl font-semibold">{section.heading}</h2>
              {section.description && (
                <p className="text-sm opacity-80">{section.description}</p>
              )}
            </div>

            {newsletterDone ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E9EFEA] text-[#1B3B2B] text-sm font-medium">
                <Check className="w-4 h-4" />
                <span>Thank you for subscribing.</span>
              </div>
            ) : (
              <form onSubmit={handleSectionNewsletter} className="w-full md:w-auto space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="px-4 py-3 rounded-xl bg-white border border-[#E4E0D6] text-sm text-[#171C19] min-w-[260px]"
                  />
                  <button
                    type="submit"
                    style={btnBaseStyle}
                    className="px-6 py-3 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{section.buttonText || 'Subscribe'}</span>
                  </button>
                </div>
                {newsletterErr && <p className="text-xs text-red-700">{newsletterErr}</p>}
              </form>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 15. RICH TEXT SECTION (HTML-FREE)
  if (section.type === 'rich_text') {
    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          <div
            className={`${radiusClass} border border-[#E4E0D6] p-8 sm:p-12`}
            style={{
              backgroundColor: section.backgroundColor || '#FFFFFF',
              color: section.textColor || '#171C19',
            }}
          >
            {renderHeaderBlock()}
            <RichContentRenderer content={section.description} textColor={section.textColor} />
            {section.buttonText && <div className="mt-6">{renderActionBtn()}</div>}
          </div>
        </div>
      </section>
    );
  }

  // 16. COUNTDOWN PROMOTION
  if (section.type === 'countdown_promo') {
    return (
      <section className={visibilityClass}>
        <div className={containerClass}>
          <div
            className={`${radiusClass} border border-[#E4E0D6] p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8`}
            style={{
              backgroundColor: section.backgroundColor || '#1B3B2B',
              color: section.textColor || '#FAF8F4',
            }}
          >
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] opacity-80 font-semibold">
                <Clock className="w-4 h-4" />
                <span>{section.subtitle || 'Limited Seasonal Offer'}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold">{section.heading}</h2>
              {section.description && <p className="text-sm opacity-85">{section.description}</p>}
              <div className="pt-2">{renderActionBtn(true)}</div>
            </div>

            <div className="grid grid-cols-4 gap-3 shrink-0">
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Mins', val: timeLeft.mins },
                { label: 'Secs', val: timeLeft.secs },
              ].map((u) => (
                <div
                  key={u.label}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-center min-w-[72px]"
                >
                  <div className="font-mono text-2xl font-semibold tabular-nums">
                    {String(u.val).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider opacity-75 mt-0.5">
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
};
