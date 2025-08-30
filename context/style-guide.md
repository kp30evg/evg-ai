# evergreenOS™ Brand Kit 2025
*The Complete Visual Identity System for the World's First Business Operating System*

---

## 🎯 Brand Essence

**Mission Statement**: "We're not building another SaaS platform - we're obsoleting the entire concept of business software interfaces."

**Brand Promise**: Run your entire business by typing. One interface. Zero complexity. Complete control.

**Brand Position**: The iPhone moment for enterprise software - transforming business operations from fragmented tools to unified natural language commands.

**Tone of Voice**: Confident without arrogance. Revolutionary yet credible. Technical but accessible. Urgent without desperation.

---

## 🎨 Visual Identity Core

### Logo System

**Primary Logo**: evergreenOS™  
- **Symbol**: Lightning bolt icon (⚡) representing instant execution
- **Wordmark**: "evergreenOS" in custom letterforms with subtle tech-forward styling
- **Color**: Evergreen #1D5238 on light backgrounds, White #FFFFFF on dark
- **Usage**: All primary marketing materials, website headers, business cards

**Secondary Marks**:
- Logo + tagline: "evergreenOS™ - Run Your Business By Typing"
- Icon-only version for favicons, social media profile images
- Monogram: "eOS" for compact applications

**Logo Protection**:
- Minimum clear space: 2x the height of the lightning bolt
- Minimum size: 24px digital, 0.5" print
- Never stretch, rotate, or modify colors outside brand palette

---

## 🌈 Color System

### Primary Brand Colors

**Evergreen** - #1D5238  
- Primary brand color
- CTAs, active states, primary buttons
- Text accents and highlights
- RGB: 29, 82, 56
- HSL: 144°, 48%, 22%

**Charcoal** - #222B2E  
- Primary text color
- Headlines, body copy
- High-contrast elements
- RGB: 34, 43, 46
- HSL: 196°, 15%, 16%

**Pure White** - #FFFFFF  
- Background color for light mode
- Text on dark backgrounds
- Clean, spacious feeling

### Secondary Palette

**Medium Gray** - #6B7280  
- Secondary text, labels
- Subtle text elements
- Form placeholders

**Light Gray** - #E5E7EB  
- Borders, dividers
- Subtle backgrounds
- Input field borders

**Soft Green** - #E6F4EC  
- Hover states
- Success messages background
- Gentle accent areas

**Gold Accent** - #FFD600  
- Premium features
- Special callouts
- Trust indicators

### Semantic Colors

**Success Green** - #10B981  
- Positive metrics, completed states
- Success messages

**Error Red** - #EF4444  
- Error states, warnings
- Critical actions


### Dark Mode Palette

**Dark Background** - #0F172A  
- Primary dark background

**Dark Surface** - #1E293B  
- Card backgrounds, elevated surfaces

**Dark Border** - #334155  
- Borders in dark mode

**Dark Text** - #F1F5F9  
- Primary text in dark mode

---

## 📝 Typography Scale

### Font Family
**Primary**: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
**Fallback**: system-ui, sans-serif

### Type Scale

**H1 - Hero Headlines**: 48px/52px, Font Weight 700, Letter Spacing -0.02em  
*Usage*: Main landing page headlines, major section titles

**H2 - Section Headers**: 36px/40px, Font Weight 600, Letter Spacing -0.01em  
*Usage*: Major section headings, feature titles

**H3 - Component Titles**: 24px/28px, Font Weight 600, Letter Spacing -0.01em  
*Usage*: Card titles, widget headers, modal titles

**H4 - Sub-headers**: 20px/24px, Font Weight 600  
*Usage*: Sub-sections, form group labels

**H5 - Small Headers**: 16px/20px, Font Weight 600  
*Usage*: Small component headers, sidebar labels

**Body Large**: 18px/28px, Font Weight 400  
*Usage*: Important body text, feature descriptions

**Body Medium (Default)**: 16px/24px, Font Weight 400  
*Usage*: Standard body text, form inputs

**Body Small**: 14px/20px, Font Weight 400  
*Usage*: Secondary text, captions, helper text

**Caption**: 12px/16px, Font Weight 500  
*Usage*: Labels, small UI text, metadata

**Code**: 14px/20px, Font Family: "SF Mono", "Monaco", "Cascadia Code", monospace  
*Usage*: Code snippets, technical content

### Font Weights
- **300**: Light (rarely used)
- **400**: Regular (body text)
- **500**: Medium (labels, captions)
- **600**: Semi-Bold (headings, emphasis)
- **700**: Bold (hero headlines, strong emphasis)

---

## 📐 Spacing System

**Base Unit**: 8px  
All spacing uses multiples of 8px for pixel-perfect consistency

**Scale**:
- **4px** (0.5 units): Very tight spacing, icon gaps
- **8px** (1 unit): Button padding, small gaps
- **12px** (1.5 units): Input padding, card internal spacing
- **16px** (2 units): Standard component spacing
- **24px** (3 units): Section spacing, larger gaps
- **32px** (4 units): Major component separation
- **48px** (6 units): Section padding, major layout spacing
- **64px** (8 units): Large section breaks
- **96px** (12 units): Hero section spacing
- **128px** (16 units): Major page sections

---

## 🔲 Border Radius System

**Small (4px)**: Form inputs, small buttons, badges  
**Medium (8px)**: Standard buttons, small cards  
**Large (12px)**: Cards, major UI components  
**Extra Large (16px)**: Hero elements, main containers  
**Rounded (20px)**: Pill buttons, tags  
**Full (50%)**: Circular elements, avatars

---

## 🧩 Component Library

### Buttons

**Primary Button**
```css
background: #1D5238
color: #FFFFFF
padding: 12px 24px
border-radius: 8px
font-weight: 600
transition: all 200ms ease-out
```
*Hover*: Opacity 0.9, subtle lift shadow

**Secondary Button**
```css
background: transparent
color: #1D5238
border: 2px solid #1D5238
padding: 10px 22px
border-radius: 8px
font-weight: 600
```
*Hover*: Background #E6F4EC

**Ghost Button**
```css
background: transparent
color: #6B7280
border: 1px solid #E5E7EB
padding: 10px 22px
border-radius: 8px
font-weight: 500
```
*Hover*: Border #1D5238, Color #1D5238

### Input Fields

**Standard Input**
```css
background: #FFFFFF
border: 2px solid #E5E7EB
border-radius: 12px
padding: 12px 16px
font-size: 16px
color: #222B2E
transition: border-color 200ms
```
*Focus*: Border #1D5238, Box-shadow with evergreen tint

**Textarea**
```css
/* Same as input with */
resize: vertical
min-height: 120px
```

### Cards

**Standard Card**
```css
background: #FFFFFF
border: 1px solid rgba(229, 231, 235, 0.6)
border-radius: 16px
padding: 24px
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04)
transition: all 200ms ease-out
```
*Hover*: Transform translateY(-2px), enhanced shadow

**Chat Interface Container**
```css
background: #FFFFFF
border: 1px solid rgba(229, 231, 235, 0.4)
border-radius: 20px
box-shadow: 0 25px 70px rgba(0, 0, 0, 0.1)
min-height: 550px
overflow: hidden
```

### Navigation

**Tab Button (Active)**
```css
background: #1D5238
color: #FFFFFF
padding: 12px 20px
border-radius: 8px
font-weight: 600
```

**Tab Button (Inactive)**
```css
background: transparent
color: #6B7280
padding: 12px 20px
border-radius: 8px
font-weight: 500
```
*Hover*: Background #E6F4EC, Color #1D5238

---

## ✨ Animation & Motion

### Timing Functions
- **Fast**: 150ms - Micro-interactions, hovers
- **Standard**: 200ms - Most UI transitions
- **Medium**: 300ms - Modal appearances, state changes
- **Slow**: 500ms - Page transitions, complex animations

### Easing
- **ease-out**: Default for most animations
- **ease-in-out**: Smooth back-and-forth animations
- **cubic-bezier(0.4, 0, 0.2, 1)**: Material Design inspired

### Signature Animations

**ChatGPT-style Streaming Text**
```css
/* Character-by-character reveal */
animation: typewriter 10ms linear infinite
```

**Card Hover Lift**
```css
transform: translateY(-4px)
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08)
transition: all 200ms ease-out
```

**Button Press**
```css
transform: scale(0.95)
transition: transform 100ms ease-out
```

**Stagger Animation** (for lists/grids)
```css
/* Each item delayed by 50ms */
animation-delay: calc(index * 50ms)
```

---

## 🎪 ChatGPT-Style UI Pattern

### Three-State System
1. **Welcome State**: Clean input with sample prompts
2. **Thinking State**: Animated processing steps
3. **Answer State**: Streaming text + interactive components

### Key Elements
- **THE BOX**: Prominent input area with icons (paperclip, mic, send)
- **Auto-resize Textarea**: Grows with content
- **Sample Prompts**: Grid of clickable examples
- **Progressive Disclosure**: Content appears sequentially
- **Streaming Text**: Bold markdown support with `**text**`
- **Follow-up Actions**: Contextual next steps

---

## 📱 Responsive Breakpoints

**Mobile**: 0px - 767px  
- Single column layout
- Simplified navigation
- Touch-friendly targets (44px minimum)
- Reduced spacing scale (6px base)

**Tablet**: 768px - 1023px  
- Two-column layouts
- Adapted navigation
- Medium spacing scale (7px base)

**Desktop**: 1024px - 1439px  
- Full layout capabilities
- Standard spacing scale (8px base)
- Hover interactions

**Large Desktop**: 1440px+  
- Maximum content width: 1400px
- Centered layouts
- Enhanced spacing for large screens

---

## 🌙 Dark Mode Guidelines

### Implementation Strategy
- Use CSS custom properties for easy theme switching
- Maintain semantic color relationships
- Ensure WCAG AA contrast ratios
- Test all interactive states

### Color Adaptations
- Backgrounds: Pure white → Dark Background (#0F172A)
- Text: Charcoal → Light text (#F1F5F9)
- Cards: White → Dark Surface (#1E293B)
- Borders: Light gray → Dark Border (#334155)

---

## 🎨 Brand Applications

### Website Headers
- evergreenOS logo top-left
- Clean navigation menu
- CTA button in primary green
- Minimal design, maximum impact

### Marketing Materials
- Hero imagery: Clean command interfaces
- Screenshots: Always show real data flows
- Color scheme: Green as accent, lots of white space
- Typography: Clear hierarchy, generous spacing

### Social Media
- Profile images: Icon-only logo on white/green background
- Cover images: Brand message with clean typography
- Post templates: Consistent visual style
- Video thumbnails: Green accent frames

### Business Cards
- Minimal design philosophy
- Logo + name + title + contact
- Premium paper stock
- Subtle green accent elements

---

## 🏆 Brand Guidelines

### Do's ✅
- Use ample white space for clean, uncluttered feeling
- Apply consistent spacing using 8px grid system
- Maintain high contrast for accessibility
- Use animations purposefully to enhance UX
- Keep messaging clear and direct
- Show real product capabilities, not mock-ups
- Use evergreen color strategically as accent

### Don'ts ❌
- Never overcrowd layouts with too many elements
- Don't use evergreen as background color extensively
- Avoid generic stock photos or illustrations
- Never compromise on loading speed for visual effects
- Don't use jargon or overly technical language
- Avoid competing with other green-branded companies' exact styles
- Never sacrifice usability for visual appeal

---

## 🔍 Competitive Differentiation

### Visual Identity vs Competitors

**vs Salesforce**: Clean vs cluttered, minimal vs overwhelming
**vs Microsoft**: Modern vs corporate, unified vs fragmented  
**vs SAP**: Approachable vs intimidating, simple vs complex
**vs Startups**: Professional vs casual, comprehensive vs basic

### Brand Personality Spectrum
- **Professional** ←→ Approachable: 70% Professional, 30% Approachable
- **Innovative** ←→ Traditional: 90% Innovative, 10% Traditional
- **Confident** ←→ Humble: 80% Confident, 20% Humble
- **Technical** ←→ Accessible: 60% Technical, 40% Accessible

---

## 📊 Brand Metrics & KPIs

### Visual Consistency Metrics
- Color usage accuracy: >95%
- Typography compliance: >98%
- Spacing adherence: >90%
- Component library usage: >85%

### Brand Recognition Goals
- Unaided brand recall: 40% within target market by Year 2
- Brand preference: 60% vs closest competitor
- Visual identity recognition: 80% from logo alone

### User Experience Metrics
- Page load speed: <2 seconds
- Accessibility score: WCAG AA+ compliance
- Mobile responsiveness: 100% functional parity
- Animation performance: 60fps on standard devices

---

## 🛠️ Implementation Tools

### Design Tools
- **Figma**: Primary design tool with shared component library
- **Sketch**: Alternative tool with brand kit assets
- **Adobe Creative Suite**: For complex graphics and brand materials

### Development Tools
- **CSS Custom Properties**: For theme management
- **Tailwind CSS**: Utility-first styling matching brand tokens
- **Framer Motion**: Animation library for React components
- **Storybook**: Component documentation and testing

### Brand Asset Management
- **Figma Libraries**: Centralized component system
- **Brand Folder Structure**: Organized asset repository
- **Version Control**: Git-based asset management
- **Style Guides**: Living documentation system

---

## 📈 Evolution & Updates

### Quarterly Reviews
- Brand application consistency audit
- Competitor analysis update
- User feedback integration
- Performance metrics analysis

### Annual Brand Refresh
- Typography refinements
- Color palette evolution
- Component library updates
- Market positioning adjustments

### Future Considerations
- International market adaptations
- Industry-specific variations
- Accessibility standard updates
- Emerging technology integrations

---

## 🔗 Resources & Assets

### Download Links
- Logo package (SVG, PNG, PDF)
- Color swatches (ASE, SCSS, JSON)
- Font files and licenses
- Icon library (SVG sprite)
- Component templates (Figma, Sketch)
- Brand photography collection

### Contact Information
- Brand Guardian: [Contact Details]
- Design Team: [Contact Details]
- Legal/Trademark: [Contact Details]

---

*This brand kit is a living document. It evolves with evergreenOS as we build the future of business operations. Every design decision should ladder up to our core mission: making business software as intuitive as conversation.*

**Document Version**: 1.0  
**Last Updated**: August 30, 2025  
**Next Review**: November 30, 2025

---

**© 2025 evergreenOS. All rights reserved. evergreenOS is a trademark of [Company Name].**