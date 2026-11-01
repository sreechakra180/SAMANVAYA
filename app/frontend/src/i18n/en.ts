export const en = {
  // Brand
  brandName: 'SAMANVAYA',
  brandDescriptor: 'COMMUNITY CYBER INTELLIGENCE',
  primaryTagline: 'Know before you trust.',
  secondaryTagline: 'Community-powered intelligence for safer digital interactions.',
  
  // Navigation
  nav: {
    home: 'Home',
    lookup: 'Lookup',
    scanner: 'AI Scanner',
    radar: 'Threat Map',
    alerts: 'Alerts',
    report: 'Report',
    checkAction: 'Check an Identifier',
    reportAction: 'Report a Scam',
    languageToggle: 'हिन्दी',
    helpline: 'Helpline 1930',
  },

  // Hero Section
  hero: {
    badge: 'COMMUNITY CYBER INTELLIGENCE',
    headline: 'Know before you trust.',
    supportingText: 'Community-powered scam intelligence that helps people identify suspicious phone numbers, UPI identifiers, websites and messages before they become victims.',
    primaryCta: 'Check an Identifier',
    secondaryCta: 'Explore How It Works',
    searchPlaceholder: 'Enter phone (+91), UPI ID, website or SMS header...',
    checkButton: 'Check',
    quickTry: 'Sample identifiers:',
  },

  // Architecture Section
  arch: {
    sectionTag: 'BACKEND ARCHITECTURE',
    title: 'Inside the intelligence engine',
    subtitle: 'Every report travels through a structured evidence pipeline before becoming public intelligence.',
    closingStatement: 'AI assists. Evidence decides. Communities protect.',
    steps: {
      1: {
        title: 'Report Ingestion',
        desc: 'Receives phone numbers, UPI identifiers, URLs and sender IDs through the report interface.',
      },
      2: {
        title: 'API Validation',
        desc: 'Validates identifier formats and incoming report fields against canonical standards.',
      },
      3: {
        title: 'Privacy & Processing',
        desc: 'Protects reporter identity, avoids exposing precise location and supports pseudonymous internal correlation via keyed HMAC.',
      },
      4: {
        title: 'Source Correlation',
        desc: 'Groups duplicates and related reports using Union-Find clustering to prevent repeated or coordinated submissions from appearing as independent evidence.',
      },
      5: {
        title: 'Trust Engine',
        desc: 'Assesses source independence, evidence quality, relevance and report consistency using Bayesian Beta-Binomial inference.',
      },
      6: {
        title: 'Verdict Engine',
        desc: 'Produces supported public outcomes: KNOWN_SCAM, SUSPICIOUS, VERIFIED_BUSINESS, or NO_REPORTS.',
      },
      7: {
        title: 'Database & Read Cache',
        desc: 'Stores relevant structured intelligence and serves fast sub-10ms read operations on precomputed rows.',
      },
      8: {
        title: 'AI Assistant',
        desc: 'Assists with suspicious message classification. Its output is an advisory aid and not automatically a public trust verdict.',
      },
    },
  },

  // Dashboard Overview
  dashboard: {
    title: 'System Overview',
    subtitle: 'Verified operational intelligence aggregated across community reports.',
    verifiedReports: 'Verified Threat Records',
    activeAlerts: 'Active Area Alerts',
    monitoredZones: 'Supported Geographic Zones',
    systemStatus: 'System Status',
    statusOperational: 'Operational (Live API)',
    statusOffline: 'Offline / Cached Mode',
    noDataYet: 'No data available yet.',
    threatOverview: 'Regional Threat Summary',
    recentActivity: 'Recent Verified Telemetry',
    viewAllMap: 'Open Full Threat Map',
    statutoryNotice: 'Official Cybercrime Emergency Hotline: Dial 1930 for immediate financial freezing in banking fraud.',
  },

  // Universal Threat Lookup
  lookup: {
    title: 'Check an Identifier',
    subtitle: 'Search phone numbers, UPI VPAs, URLs, and SMS Sender IDs with instant read-after-write verification.',
    types: {
      phone: 'Phone Number',
      upi: 'UPI VPA',
      url: 'Website / Link',
      sender_id: 'SMS Sender ID',
    },
    placeholder: {
      phone: 'Enter phone number (e.g. +91 98765 43210 or 1930)...',
      upi: 'Enter UPI ID (e.g. name@okhdfcbank)...',
      url: 'Enter website URL (e.g. sbi-kyc-verify.top)...',
      sender_id: 'Enter 6-character SMS sender ID (e.g. HDFCBK)...',
    },
    searchBtn: 'Search',
    searching: 'Verifying...',
    verdicts: {
      KNOWN_SCAM: {
        badge: 'CONFIRMED KNOWN SCAM',
        summary: 'Multiple independent, corroborated reports confirm this identifier is involved in fraudulent activity.',
        recommendation: 'Do not transfer funds, share OTPs, or communicate with this identifier.',
      },
      SUSPICIOUS: {
        badge: 'SUSPICIOUS ACTIVITY',
        summary: 'Uncorroborated reports have been filed against this identifier. It is under active cluster observation.',
        recommendation: 'Exercise extreme caution. Verify identity through secondary official channels before transacting.',
      },
      VERIFIED_BUSINESS: {
        badge: 'VERIFIED ENTITY',
        summary: 'This identifier belongs to an authorized commercial entity, national institution, or emergency helpline.',
        recommendation: 'Recognized legitimate entity on official allowlist.',
      },
      NO_REPORTS: {
        badge: 'NO REPORTS ON FILE',
        summary: 'There are currently no community reports recorded for this identifier.',
        recommendation: 'Lack of reports does not guarantee that an unknown identifier is safe. Remain alert.',
      },
    },
    evidenceHeader: 'Aggregated Evidence Summary',
    reportCount: 'Reports Received',
    clusterCount: 'Independent Clusters',
    readAloud: 'Read Aloud',
    stopAudio: 'Stop Audio',
    disputePrompt: 'Is this your legitimate business?',
    disputeLink: 'Submit a formal verification challenge',
  },

  // AI Scanner
  scanner: {
    badge: 'NATURAL LANGUAGE THREAT CLASSIFIER',
    title: 'AI Message Scanner',
    subtitle: 'Paste suspicious SMS, WhatsApp messages, or emails to analyze threat intent and extract embedded phone numbers or URLs.',
    disclaimer: 'Advisory notice: This analysis is an AI-assisted classification to help identify common scam patterns. It does not independently produce public scam verdicts.',
    inputPlaceholder: 'Paste suspicious message text here (e.g. "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM...")...',
    scanBtn: 'Analyze Message',
    scanning: 'Analyzing message patterns...',
    sampleLabel: 'Load sample message:',
    resultsHeader: 'Analysis Findings',
    intentDetected: 'Deceptive Intent Pattern',
    intentClean: 'Standard / Neutral Pattern',
    category: 'Predicted Pattern Archetype',
    extractedIocs: 'Extracted Identifiers (IOCs)',
    verifyAction: 'Check in Lookup',
    reportAction: 'Report Incident',
    noIocs: 'No embedded phone numbers, UPI handles, or URLs were detected in this text.',
    signalsDetected: 'Key Trigger Phrases Identified',
  },

  // 3D Threat Radar
  radar: {
    badge: 'NATIONAL THREAT GIS CORRIDOR MONITOR',
    title: 'India Threat Map',
    subtitle: 'Interactive geographical representation of verified scam reports across India\'s 25 monitored corridors.',
    timeRange: 'Reporting Period',
    timeOptions: {
      '24h': 'Past 24 Hours',
      '48h': 'Past 48 Hours',
      '7d': 'Past 7 Days',
      '30d': '30-Day View',
    },
    controls: 'Orbit: Click & drag to rotate | Scroll: Zoom | Reset Camera',
    resetBtn: 'Reset View',
    legend: {
      critical: 'High Incident Volume',
      moderate: 'Elevated Activity',
      baseline: 'Baseline Monitoring',
    },
    selectedCluster: 'Selected Area',
    clusterPincode: 'PIN Code',
    clusterCity: 'City / Region',
    clusterCases: 'Verified Reports',
    noMappedReports: 'No mapped reports are currently recorded in the active period.',
  },

  // Alerts
  alerts: {
    badge: 'COMMUNITY ADVISORIES',
    title: 'Area Threat Alerts',
    subtitle: 'Automated early warnings triggered by unusual report volume surges or emerging fraud patterns.',
    emptyTitle: 'No Active Threat Alerts',
    emptyDesc: 'All monitored areas are currently operating within standard baseline thresholds.',
    spikeAlert: 'VOLUME SPIKE ALERT',
    newTypeAlert: 'EMERGING FRAUD PATTERN',
    advisoryHeader: 'Public Advisory',
    call1930: 'If you have sent money to this scam within 2 hours, call 1930 immediately.',
  },

  // Report Flow
  report: {
    badge: 'ANONYMOUS INGESTION',
    title: 'Report a Scam',
    subtitle: 'Help protect your community. Reports are pseudonymously processed with zero plaintext raw notes stored.',
    channelLabel: '1. Channel of Contact',
    identifierTypeLabel: '2. Identifier Type',
    identifierValueLabel: '3. Suspicious Identifier',
    timeBucketLabel: '4. When did this occur?',
    scamTypeLabel: '5. Scam Category',
    pincodeLabel: '6. Nearest Area / PIN Code',
    noteLabel: '7. Brief Incident Context (Optional)',
    evidenceLabel: 'I have retained screenshots or transaction proofs (+corroboration boost)',
    submitBtn: 'Submit Anonymous Report',
    submitting: 'Cryptographically Ingesting...',
    successTitle: 'Report Successfully Received',
    successDesc: 'Your report has been hashed and integrated into the evidence correlation pipeline. Thank you for protecting the community.',
    reportId: 'Report Reference',
    anotherReportBtn: 'Submit Another Report',
  },

  // Merchant Dispute
  dispute: {
    title: 'Merchant & Business Verification Challenge',
    subtitle: 'If your commercial identifier has been mistakenly reported, submit authorized identity credentials for compliance audit.',
    notice: 'Filing a challenge registers a formal review request and applies a temporary evidence veto under our trust policy.',
    businessName: 'Registered Commercial Name',
    contactEmail: 'Authorized Compliance Email',
    reason: 'Reason for Dispute & Supporting Documents',
    submitBtn: 'Submit Formal Challenge',
    successMsg: 'Dispute submitted successfully. Our compliance team audits challenges within 48 hours.',
  },

  // Footer
  footer: {
    tagline: 'Samanvaya • Community Cyber Intelligence Platform',
    statutoryLinks: 'Official Resources: National Cyber Crime Reporting Portal (1930) • RBI Sachet • TRAI Sanchar Saathi',
    copyright: 'Engineered for civic digital trust. Open evidence model.',
  },
}

