---

name: fashion-store-design
description: Define the premium, youthful, responsive, bilingual, RTL/LTR design system and UX standards for the Fashion Store storefront and admin dashboard.
--------------------------------------------------------------------------------------------------------------------------------------------------------------

# Fashion Store Design System

This skill defines the mandatory visual language, UI/UX behavior, responsive rules, accessibility requirements, and interaction patterns for the Fashion Store platform.

The product is a modern fashion retail website designed to feel youthful, premium, clean, fast, and visually engaging without becoming visually overloaded.

The design must work equally well for Arabic and English and support both RTL and LTR layouts.

---

# 1. Design Philosophy

The website must feel:

* Modern.
* Youthful.
* Premium.
* Clean.
* Confident.
* Fashion-oriented.
* Mobile-first.
* Easy to navigate.
* Visually memorable.
* Fast and lightweight.

Avoid:

* Generic AI-generated ecommerce layouts.
* Excessive gradients.
* Excessive glassmorphism.
* Excessive shadows.
* Overly rounded everything.
* Huge amounts of text.
* Cluttered product cards.
* Unnecessary animations.
* Template-like layouts.
* Visually noisy dashboards.

The design should prioritize the products and photography.

---

# 2. Design Direction

Use a modern editorial fashion aesthetic inspired by contemporary fashion brands and premium ecommerce platforms.

The visual hierarchy should be:

```text
Brand
↓
Hero / Campaign
↓
Categories
↓
Products
↓
Promotions
↓
Brand / Social Proof
↓
Footer
```

Product photography should remain the visual focus.

UI elements should support the product rather than compete with it.

---

# 3. Color System

Do not hardcode colors throughout components.

Use CSS variables/design tokens.

Define semantic tokens such as:

```text
--background
--foreground
--surface
--surface-muted
--border
--primary
--primary-foreground
--secondary
--accent
--accent-foreground
--success
--warning
--destructive
```

The system must support:

* Light mode.
* Dark mode.

Brand colors should be configurable from the admin dashboard where practical.

The UI must remain accessible regardless of the configured brand color.

---

# 4. Typography

Typography must support both Arabic and English.

Use a modern sans-serif typeface suitable for fashion ecommerce.

Arabic typography must remain highly readable.

Typography hierarchy:

```text
Display
H1
H2
H3
Body
Small
Caption
Label
```

Do not use excessive font weights.

Use typography to create hierarchy rather than relying on colors or shadows.

Avoid justified text.

---

# 5. Spacing

Use a consistent spacing scale.

Prefer:

```text
4
8
12
16
24
32
48
64
80
96
```

Do not introduce arbitrary spacing values unless required by a specific design.

Maintain generous whitespace around premium sections.

---

# 6. Border Radius

Use a restrained radius system.

Example:

```text
sm
md
lg
xl
```

Avoid making every element extremely rounded.

Product cards and buttons should feel modern but not cartoonish.

---

# 7. Navigation

The storefront navbar must be simple and responsive.

Desktop:

```text
Logo
Navigation
Search
Language
Theme
Wishlist/Cart if implemented
```

Mobile:

```text
Logo
Search
Menu
```

The navbar must remain usable in both RTL and LTR.

Navigation labels must come from i18n.

Never hardcode Arabic or English UI strings directly inside components.

---

# 8. Hero Section

The hero section should be visually strong but simple.

Support dynamic:

* Image/video.
* Arabic title.
* English title.
* Arabic description.
* English description.
* CTA.
* CTA URL.
* Alignment.
* Overlay.
* Visibility.

Hero content must be controlled by the dashboard.

Do not hardcode campaign content.

The hero must work on:

* Desktop.
* Tablet.
* Mobile.

Do not use desktop hero images that crop important product/model details on mobile.

---

# 9. Categories

Categories should be visually attractive and easy to scan.

Possible layouts:

* Horizontal scrolling cards.
* Image tiles.
* Minimal category cards.
* Editorial category blocks.

Do not overload categories with unnecessary information.

Category ordering must come from backend configuration.

---

# 10. Product Cards

Product cards are a critical component.

Each product card may contain:

```text
Product Image
Badge
Product Name
Price
Original Price
Discount
Optional Color Indicators
```

Support badges such as:

```text
NEW
BEST SELLER
SALE
```

Badges must be data-driven.

Avoid displaying every possible badge simultaneously.

Product cards should have clear hierarchy.

The product image should receive the most visual attention.

---

# 11. Product Images

Images must:

* Use appropriate aspect ratios.
* Maintain consistent card proportions.
* Use lazy loading where appropriate.
* Provide meaningful alt text.
* Avoid layout shift.

Use subtle hover interactions on desktop.

Example:

```text
Primary image
↓ hover
Secondary image
```

Do not use excessive zoom effects.

---

# 12. Product Details Page

The product page must clearly guide the customer toward selecting a variant and ordering.

Recommended structure:

```text
Image Gallery
        +
Product Information
        ↓
Price
        ↓
Discount
        ↓
Color Selection
        ↓
Size Selection
        ↓
Availability
        ↓
Quantity
        ↓
Order via WhatsApp
```

The primary CTA must be visually dominant.

---

# 13. Color Selection

Colors should be represented visually when possible.

Use:

* Color swatches.
* Selected state.
* Disabled/unavailable state.

Do not rely on color alone to communicate state.

Include accessible labels.

Example:

```text
Black
White
Beige
Navy
```

Unavailable variants must be visually distinct and non-interactive.

---

# 14. Size Selection

Use clear size buttons.

Example:

```text
XS
S
M
L
XL
XXL
```

Selected size must be visually obvious.

Unavailable sizes must:

* Remain visible where useful.
* Be clearly disabled.
* Not be selectable.

The selected variant must be validated before ordering.

---

# 15. WhatsApp CTA

The main purchase action is:

```text
Order via WhatsApp
```

There is no online payment flow in the initial version.

The CTA must communicate the next action clearly.

Avoid generic text such as:

```text
Submit
Continue
Buy
```

Prefer an explicit action.

The WhatsApp number and message template are configurable from the dashboard.

---

# 16. Discounts

Discounted products must have clear visual hierarchy.

Example:

```text
$120
$89
-26%
```

Original price should be visually secondary.

Discount percentage should be generated from actual pricing data rather than manually entered display text.

Do not show fake discounts.

---

# 17. Best Sellers

Best sellers should be a dedicated section.

The section should feel dynamic and editorial rather than like another generic product grid.

Possible layouts:

* Horizontal carousel.
* Featured grid.
* Large featured product + smaller products.

The layout should remain performant on mobile.

---

# 18. Responsive Design

Mobile-first design is mandatory.

Breakpoints should follow the project's Tailwind configuration.

Every important page must be tested at:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Do not simply shrink desktop layouts.

Reflow content appropriately.

---

# 19. Mobile UX

Mobile experience is a first-class requirement.

Ensure:

* Touch-friendly targets.
* Comfortable spacing.
* Sticky purchase CTA where appropriate.
* Horizontal product carousels.
* Easy variant selection.
* Fast image loading.
* Simple navigation.
* No hover-dependent functionality.

Avoid tiny buttons.

---

# 20. Dark / Light Mode

Both themes must feel intentionally designed.

Do not simply invert colors.

Ensure:

* Contrast.
* Product image visibility.
* Button readability.
* Border visibility.
* Muted text readability.
* Form field clarity.

Brand colors must remain usable in both themes.

---

# 21. RTL / LTR

Arabic:

```text
dir="rtl"
```

English:

```text
dir="ltr"
```

The layout must genuinely support both directions.

Do not solve RTL by simply changing text alignment.

Consider:

* Flex direction.
* Icons.
* Breadcrumbs.
* Carousels.
* Drawers.
* Navigation.
* Form layouts.
* Directional arrows.
* Product galleries.

Directional icons should adapt to the current direction when appropriate.

---

# 22. Internationalization

All interface text must use i18n.

Never write:

```tsx
<button>إضافة للسلة</button>
```

or:

```tsx
<button>Add to cart</button>
```

directly inside reusable components.

Use translation keys.

Example:

```tsx
t("product.orderViaWhatsApp")
```

Business content should come from the backend with Arabic and English fields.

---

# 23. Animations

Use Framer Motion selectively.

Animations should:

* Reinforce hierarchy.
* Improve feedback.
* Feel premium.
* Remain fast.

Preferred animations:

* Fade.
* Slide.
* Scale.
* Staggered reveal.
* Image transitions.
* Drawer transitions.
* Modal transitions.

Avoid:

* Constant floating animations.
* Excessive parallax.
* Long transitions.
* Animations on every element.

Respect:

```text
prefers-reduced-motion
```

---

# 24. Loading States

Every asynchronous UI must have an intentional loading state.

Use:

* Skeletons.
* Shimmer where appropriate.
* Button loading states.
* Progressive image loading.

Avoid blank screens.

Do not show large spinners for simple interactions.

---

# 25. Empty States

Empty states must be designed.

Examples:

* No products.
* No search results.
* No category products.
* No orders in dashboard.
* No uploaded media.

Provide:

* Clear explanation.
* Appropriate visual.
* Useful next action.

---

# 26. Error States

Errors must be human-readable.

Avoid raw backend errors such as:

```text
500 Internal Server Error
```

Display useful contextual messages.

Example:

```text
Something went wrong.
Please try again.
```

Arabic translations must be available.

---

# 27. Accessibility

Follow WCAG principles.

Ensure:

* Keyboard navigation.
* Visible focus states.
* Sufficient contrast.
* Accessible labels.
* Semantic HTML.
* Alt text.
* Screen-reader-friendly controls.
* Proper button semantics.
* Form error associations.

Do not rely on color alone.

---

# 28. Search

Search should feel fast and simple.

Support:

* Product name.
* SKU.
* Category where appropriate.

The UI should provide:

* Search input.
* Loading state.
* Results.
* Empty state.
* Clear action.

On mobile, search should be easy to access.

---

# 29. Admin Dashboard Design

The admin dashboard should use the same design tokens as the storefront but have a more utilitarian UX.

Dashboard priorities:

```text
Clarity
Efficiency
Information density
Consistency
Fast navigation
```

Avoid making the dashboard look like a marketing website.

---

# 30. Admin Layout

Recommended structure:

```text
Sidebar
├── Dashboard
├── Products
├── Categories
├── Orders
├── Discounts
├── Homepage
├── Media
├── Settings
├── Users
└── Audit Logs

Topbar
├── Search
├── Language
├── Theme
└── User Menu
```

Sidebar visibility must respect permissions.

---

# 31. Admin Product Management

The product form should be organized into logical sections.

Example:

```text
Basic Information
Pricing
Category
Images
Colors
Sizes
Variants
SEO
Status
```

Use tabs or sections when the form becomes large.

Avoid one enormous form with no visual hierarchy.

---

# 32. Admin Homepage Builder

The dashboard must allow administrators to control homepage sections.

Support:

* Enable/disable.
* Reordering.
* Content editing.
* Image selection.
* Product selection.
* Category selection.

Use drag-and-drop only if it improves usability.

Do not add complex interactions merely for visual effect.

---

# 33. Admin Settings

Settings should provide controls for:

```text
Branding
Store Information
WhatsApp
Social Media
Theme
Language
SEO
Contact Information
```

Changes must be reflected dynamically on the storefront.

---

# 34. Tables

Admin tables must support:

* Search.
* Pagination.
* Sorting.
* Filtering.
* Bulk actions where useful.
* Responsive behavior.

On mobile, complex tables should transform into cards or horizontally scrollable layouts.

---

# 35. Forms

Use consistent form components.

Every form should provide:

* Label.
* Input.
* Validation.
* Error state.
* Loading state.
* Success feedback.

Do not rely solely on placeholder text as labels.

---

# 36. Notifications

Use toast notifications for short-lived feedback.

Examples:

```text
Product created successfully.
Changes saved.
Import completed.
Unable to delete product.
```

Critical destructive actions require confirmation.

---

# 37. Destructive Actions

Actions such as:

* Delete product.
* Delete category.
* Remove media.
* Delete user.

must require confirmation.

Prefer archive/deactivate where business data should remain historically available.

---

# 38. Design Consistency

Before creating a new component:

1. Check whether an existing component can be reused.
2. Check the design tokens.
3. Check shadcn/ui components.
4. Check existing patterns.
5. Avoid introducing a new visual style unnecessarily.

Do not create multiple visually different versions of the same component without a strong reason.

---

# 39. Performance-aware UI

Avoid heavy UI libraries when unnecessary.

Prefer:

* CSS animations for simple transitions.
* Native browser capabilities.
* Lazy loading.
* Optimized images.
* Virtualized lists when truly necessary.

Do not add large dependencies for trivial UI functionality.

---

# 40. Final Design Quality Checklist

Before considering a UI feature complete:

```text
Visual hierarchy ✓
Responsive ✓
Mobile UX ✓
Arabic ✓
English ✓
RTL ✓
LTR ✓
Dark mode ✓
Light mode ✓
Loading state ✓
Empty state ✓
Error state ✓
Accessibility ✓
Keyboard navigation ✓
Consistent spacing ✓
Consistent typography ✓
Consistent components ✓
Performance ✓
No hardcoded business content ✓
```

The final interface should feel like a real fashion brand website, not an AI-generated template.
