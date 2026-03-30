export interface CaseStudy {
  id: string
  numericId: number
  industry: string
  location: string
  headline: string
  metric: string
  metricLabel: string
  beforeAfter: string
  timeline: string
  pill1: string
  pill2: string
  pill3: string
  problem: string
  solution: string
  quote: string
  keyWin: string
  accentColor: string
  // Extended fields for detail pages
  resultHeadline: string
  bigMetric: string
  timeTaken: string
  postsPublished: number
  callsChange: string
  beforeRank: string
  afterRank: string
  ratingChange?: string
  situation: string
  agentActions: {
    agent: string
    emoji: string
    action: string
    result: string
  }[]
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'bandra-dental',
    numericId: 1,
    industry: 'Dental Clinic',
    location: '📍 Bandra, Mumbai',
    headline: 'Page 7 → #1 on Google in 61 Days',
    resultHeadline: 'How a Bandra Dental Clinic Fired Their Agency and Hit #1 in 61 Days',
    metric: '+520%',
    metricLabel: 'Organic Traffic',
    bigMetric: '+520% organic traffic',
    beforeAfter: 'Page 7 → #1',
    timeline: '61 Days',
    timeTaken: '61 days',
    postsPublished: 11,
    callsChange: '+8 calls/week',
    beforeRank: 'Page 7',
    afterRank: '#1',
    pill1: '61 Days',
    pill2: '11 posts',
    pill3: '+8 calls/week',
    problem: 'A dental clinic in Bandra spending ₹35,000/month on an agency with zero ranking results after 8 months.',
    situation: "Bandra Dental Clinic had been operating for 11 years with a loyal patient base, but their digital presence was non-existent. They were spending ₹35,000 per month with a digital marketing agency that promised 'SEO results in 3 months' — 8 months later, they were still buried on Page 7 for their most valuable keywords. The agency's monthly reports were full of impressions and clicks, but zero new patient calls could be attributed to organic search. Meanwhile, two competitor clinics that opened in 2023 had already overtaken them on Google Maps.",
    solution: 'ARIA mapped 67 untapped dental keywords. SCRIBE published 11 hyperlocal blogs. LOCL rebuilt their GBP from scratch.',
    agentActions: [
      {
        agent: 'ARIA',
        emoji: '🎯',
        action: 'Keyword Intelligence',
        result: 'Mapped 67 untapped dental keywords with high local intent'
      },
      {
        agent: 'SCRIBE',
        emoji: '✍️',
        action: 'Content Production',
        result: 'Published 11 hyperlocal dental blogs optimized for Bandra searches'
      },
      {
        agent: 'LOCL',
        emoji: '📍',
        action: 'GBP Optimization',
        result: 'Rebuilt Google Business Profile from scratch with 50+ attributes'
      },
      {
        agent: 'CORE',
        emoji: '⚙️',
        action: 'Technical SEO',
        result: 'Fixed 23 technical issues blocking indexing and crawling'
      },
      {
        agent: 'REPUTE',
        emoji: '⭐',
        action: 'Review Generation',
        result: 'Generated 34 new 5-star reviews in 45 days'
      },
      {
        agent: 'AMPLI',
        emoji: '🚀',
        action: 'Indexing Acceleration',
        result: 'Reduced average indexing time from 12 days to 2 days'
      }
    ],
    quote: 'We fired our agency after seeing Page 1 in week 8. Claux did in 2 months what they couldn\'t in 8.',
    keyWin: 'Now ranks #1 for "best dentist bandra" — 2,200 monthly searches',
    accentColor: '#10B981'
  },
  {
    id: 'delhi-ca',
    numericId: 2,
    industry: 'CA & Tax Practice',
    location: '📍 Connaught Place, Delhi',
    headline: 'Page 4 → #2 for High-Intent CA Keywords in 45 Days',
    resultHeadline: 'How a Delhi CA Firm Went from Invisible to #2 in 45 Days',
    metric: '+340%',
    metricLabel: 'Qualified Leads',
    bigMetric: '+340% qualified leads',
    beforeAfter: 'Page 4 → #2',
    timeline: '45 Days',
    timeTaken: '45 days',
    postsPublished: 14,
    callsChange: '+12 leads/month',
    beforeRank: 'Page 4',
    afterRank: '#2',
    pill1: '45 Days',
    pill2: '14 posts',
    pill3: '+12 leads/month',
    problem: 'A 12-year-old CA firm invisible on Google despite having excellent client reviews and strong word-of-mouth.',
    situation: "The Delhi CA practice had built a strong reputation over 12 years through referrals and word-of-mouth. But the senior partners noticed a troubling trend — younger clients were finding their competitors on Google first, and only reaching them when referred. Despite having 200+ satisfied clients and genuine expertise in GST filing and corporate tax, they were invisible on search. They had tried SEO twice before — once with a freelancer (no results) and once with an agency (basic blog posts, no strategy, wasted ₹40,000).",
    solution: 'CORE fixed 34 technical SEO issues. SCRIBE created 14 tax and compliance articles. RIVAL identified 3 competitor gaps exploited immediately.',
    agentActions: [
      {
        agent: 'CORE',
        emoji: '⚙️',
        action: 'Technical SEO Audit',
        result: 'Fixed 34 critical technical issues blocking rankings'
      },
      {
        agent: 'SCRIBE',
        emoji: '✍️',
        action: 'Expert Content',
        result: 'Created 14 tax and compliance articles targeting high-intent searches'
      },
      {
        agent: 'RIVAL',
        emoji: '🔍',
        action: 'Competitor Analysis',
        result: 'Identified 3 competitor gaps and exploited them immediately'
      },
      {
        agent: 'ARIA',
        emoji: '🎯',
        action: 'Keyword Research',
        result: 'Found 42 high-value CA and tax keywords with low competition'
      },
      {
        agent: 'LINX',
        emoji: '🔗',
        action: 'Backlink Building',
        result: 'Built 18 authoritative backlinks from finance and business sites'
      }
    ],
    quote: 'Our clients now find us on Google before they even ask for a referral. ROI in month one.',
    keyWin: 'Ranks #2 for "CA firm Connaught Place" — dominates GST filing and ITR keywords',
    accentColor: '#F59E0B'
  },
  {
    id: 'mumbai-d2c',
    numericId: 3,
    industry: 'D2C Skincare Brand',
    location: '📍 Andheri, Mumbai',
    headline: '₹0 → ₹4.2L/Month Organic Revenue in 90 Days',
    resultHeadline: 'How a D2C Skincare Brand Built ₹4.2L/Month Organic Revenue in 90 Days',
    metric: '₹4.2L/mo',
    metricLabel: 'New Organic Revenue',
    bigMetric: '₹4.2L/month organic revenue',
    beforeAfter: 'Page 6 → #3',
    timeline: '90 Days',
    timeTaken: '90 days',
    postsPublished: 38,
    callsChange: '+47 keywords Top 10',
    beforeRank: 'Page 6',
    afterRank: '#3',
    pill1: '90 Days',
    pill2: '38 posts',
    pill3: '+47 keywords Top 10',
    problem: 'A D2C skincare brand burning ₹80,000/month on paid ads with no organic presence and zero SEO strategy.',
    situation: "This Mumbai-based D2C skincare brand was spending ₹80,000 per month on Meta and Google Ads, driving strong sales — but 100% dependent on paid traffic. The moment ad spend dropped, revenue dropped. They had tried building organic presence for 6 months with a content writer and basic SEO, but with no technical foundation, no keyword strategy, and no backlinks, nothing ranked. They were building content into a void.",
    solution: 'SCRIBE produced 38 product and ingredient-focused articles. AMPLI accelerated indexing by 3x. LINX built 22 niche beauty backlinks.',
    agentActions: [
      {
        agent: 'SCRIBE',
        emoji: '✍️',
        action: 'Product Content',
        result: 'Produced 38 product and ingredient-focused articles'
      },
      {
        agent: 'AMPLI',
        emoji: '🚀',
        action: 'Indexing Boost',
        result: 'Accelerated indexing by 3x — content ranking in days, not weeks'
      },
      {
        agent: 'LINX',
        emoji: '🔗',
        action: 'Niche Backlinks',
        result: 'Built 22 high-authority beauty and skincare backlinks'
      },
      {
        agent: 'ARIA',
        emoji: '🎯',
        action: 'Product Keywords',
        result: 'Identified 89 high-conversion product and ingredient keywords'
      },
      {
        agent: 'CORE',
        emoji: '⚙️',
        action: 'E-commerce SEO',
        result: 'Optimized product pages, schema markup, and site speed'
      }
    ],
    quote: 'Claux\'s content agent alone replaced our ₹15,000/month content writer and tripled our output.',
    keyWin: '47 keywords now in Top 10. Organic now drives 38% of total revenue.',
    accentColor: '#A855F7'
  },
  {
    id: 'pune-clinic',
    numericId: 4,
    industry: 'Physiotherapy Clinic',
    location: '📍 Koregaon Park, Pune',
    headline: 'Zero Online Presence → 140 Monthly Organic Appointments',
    resultHeadline: 'How a Pune Physiotherapy Clinic Went from Zero to 140 Appointments/Month',
    metric: '+430%',
    metricLabel: 'Website Traffic',
    bigMetric: '+430% website traffic',
    beforeAfter: 'Not Ranking → #2',
    timeline: '75 Days',
    timeTaken: '75 days',
    postsPublished: 16,
    callsChange: '+140 appointments/month',
    beforeRank: 'Not Ranking',
    afterRank: '#2',
    ratingChange: '4.0 → 4.8 stars',
    pill1: '75 Days',
    pill2: '16 posts',
    pill3: '+140 appointments/mo',
    problem: 'A physiotherapy clinic relying 100% on referrals with no digital presence, no GBP optimization, and a broken website.',
    situation: "The Koregaon Park physiotherapy clinic relied entirely on doctor referrals and walk-ins. They had no website ranking, a basic GBP listing with 12 reviews and a 4.0 rating, and zero digital marketing. The owner had assumed SEO was 'for big companies or e-commerce.' What changed their mind: a competitor clinic that opened 8 months ago was already ranking #1 for their most valuable keyword and booking out 3 weeks in advance.",
    solution: 'CORE rebuilt site architecture. LOCL optimized GBP with 50+ citation fixes. REPUTE generated 43 new 5-star reviews in 60 days.',
    agentActions: [
      {
        agent: 'CORE',
        emoji: '⚙️',
        action: 'Site Rebuild',
        result: 'Rebuilt entire site architecture for local SEO'
      },
      {
        agent: 'LOCL',
        emoji: '📍',
        action: 'GBP Optimization',
        result: 'Optimized GBP with 50+ citation fixes and complete profile'
      },
      {
        agent: 'REPUTE',
        emoji: '⭐',
        action: 'Review Campaign',
        result: 'Generated 43 new 5-star reviews in 60 days'
      },
      {
        agent: 'SCRIBE',
        emoji: '✍️',
        action: 'Educational Content',
        result: 'Published 16 physiotherapy and injury recovery guides'
      },
      {
        agent: 'ARIA',
        emoji: '🎯',
        action: 'Local Keywords',
        result: 'Mapped 34 high-intent local physiotherapy keywords'
      }
    ],
    quote: 'I never thought SEO was for clinics like mine. Claux proved me completely wrong.',
    keyWin: 'Now the #2 physiotherapist in Pune\'s most competitive locality. Booked 3 weeks in advance.',
    accentColor: '#06B6D4'
  },
  {
    id: 'bangalore-law',
    numericId: 5,
    industry: 'Law Firm',
    location: '📍 Indiranagar, Bangalore',
    headline: 'Page 8 → #1 for High-Value Legal Keywords in 55 Days',
    resultHeadline: 'How a Bangalore Law Firm Went from Page 8 to #1 in 55 Days',
    metric: '+290%',
    metricLabel: 'Consultation Requests',
    bigMetric: '+290% consultation requests',
    beforeAfter: 'Page 8 → #1',
    timeline: '55 Days',
    timeTaken: '55 days',
    postsPublished: 19,
    callsChange: '+18 consultations/month',
    beforeRank: 'Page 8',
    afterRank: '#1',
    pill1: '55 Days',
    pill2: '19 posts',
    pill3: '+18 consultations/mo',
    problem: 'A Bangalore law firm spending ₹60,000/month on an agency that delivered monthly reports full of impressions but zero actual leads.',
    situation: "This Indiranagar law firm had been spending ₹60,000 per month with a reputed Bangalore digital agency for 14 months. In that time, they had moved from Page 9 to Page 8 for their primary keyword. The agency's pitch had been compelling — detailed strategy decks, weekly calls, impressive client logos. But the execution was handled by a team of two junior executives fresh out of college who were managing 23 other clients simultaneously.",
    solution: 'ARIA found 55 high-intent legal search terms. SCRIBE published 19 legal explainer articles. RIVAL identified 4 competitor backlink sources acquired within 30 days.',
    agentActions: [
      {
        agent: 'ARIA',
        emoji: '🎯',
        action: 'Legal Keywords',
        result: 'Found 55 high-intent legal search terms with commercial value'
      },
      {
        agent: 'SCRIBE',
        emoji: '✍️',
        action: 'Legal Content',
        result: 'Published 19 legal explainer articles targeting client questions'
      },
      {
        agent: 'RIVAL',
        emoji: '🔍',
        action: 'Competitor Backlinks',
        result: 'Identified 4 competitor backlink sources, acquired within 30 days'
      },
      {
        agent: 'CORE',
        emoji: '⚙️',
        action: 'Technical Fixes',
        result: 'Fixed 28 technical issues including broken schema and slow load times'
      },
      {
        agent: 'LINX',
        emoji: '🔗',
        action: 'Authority Building',
        result: 'Built 15 authoritative legal and business directory backlinks'
      }
    ],
    quote: 'The first month alone brought 18 new consultations. We recovered our entire annual Claux cost in 6 weeks.',
    keyWin: 'Ranks #1 for "property lawyer Indiranagar" — their highest-value client keyword',
    accentColor: '#EF4444'
  },
  {
    id: 'hyderabad-restaurant',
    numericId: 6,
    industry: 'Premium Restaurant',
    location: '📍 Jubilee Hills, Hyderabad',
    headline: '3.8 Stars & Page 5 → Top 3 on Maps + 4.9 Stars in 50 Days',
    resultHeadline: 'How a Hyderabad Restaurant Went from 3.8 to 4.9 Stars in 50 Days',
    metric: '+380%',
    metricLabel: 'Google Maps Impressions',
    bigMetric: '+380% Google Maps impressions',
    beforeAfter: 'Page 5 → Top 3',
    timeline: '50 Days',
    timeTaken: '50 days',
    postsPublished: 12,
    callsChange: '+65 reservations/week',
    beforeRank: 'Page 5',
    afterRank: 'Top 3 on Maps',
    ratingChange: '3.8 → 4.9 stars',
    pill1: '50 Days',
    pill2: '12 posts',
    pill3: '+65 reservations/wk',
    problem: 'A premium restaurant in Jubilee Hills with great food but terrible online visibility — buried under competitors with inferior ratings.',
    situation: "Despite being one of Jubilee Hills' most beautifully designed restaurants with consistently excellent food, this premium dining spot was suffering. A 3.8 Google rating from 67 reviews (several fake negative reviews from a disgruntled ex-employee) was hurting bookings. Weekday footfall was 30% of capacity. They ranked on Page 5 for 'fine dining Jubilee Hills' — below 4 competitors with inferior food but better-managed digital presence.",
    solution: 'LOCL rebuilt GBP completely with 80+ menu attributes. REPUTE triggered a review campaign that generated 91 new 5-star reviews. PULSE tracked Map Pack position daily.',
    agentActions: [
      {
        agent: 'LOCL',
        emoji: '📍',
        action: 'Complete GBP Rebuild',
        result: 'Rebuilt GBP with 80+ menu attributes and optimized categories'
      },
      {
        agent: 'REPUTE',
        emoji: '⭐',
        action: 'Review Campaign',
        result: 'Generated 91 new 5-star reviews, diluting negative reviews'
      },
      {
        agent: 'PULSE',
        emoji: '📊',
        action: 'Map Pack Tracking',
        result: 'Tracked Map Pack position daily, optimized for local intent'
      },
      {
        agent: 'SCRIBE',
        emoji: '✍️',
        action: 'Food Content',
        result: 'Published 12 cuisine and dining experience articles'
      },
      {
        agent: 'ARIA',
        emoji: '🎯',
        action: 'Local Dining Keywords',
        result: 'Mapped 38 high-intent local dining and reservation keywords'
      }
    ],
    quote: 'We went from empty tables on weekdays to fully booked every night within 7 weeks. This is insane.',
    keyWin: 'Top 3 on Google Maps for "fine dining Jubilee Hills". Walk-ins up 210%.',
    accentColor: '#F97316'
  }
]
