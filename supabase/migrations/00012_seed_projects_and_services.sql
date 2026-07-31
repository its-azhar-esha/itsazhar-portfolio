-- 00010_seed_projects_and_services.sql
-- Seeds the previously mock-only content (5 projects, 6 services) as real
-- database rows so they can be edited, deleted and managed in the admin CMS.
-- Idempotent: skips rows whose slug already exists.

insert into public.services (slug, title, short_description, content, icon, featured, display_order, status, seo_title, seo_description, seo_keywords)
values
  (
    'ai-agents-and-intelligent-assistants',
    'AI Agents & Intelligent Assistants',
    'Build AI-powered assistants that understand requests, make decisions, and automate complex tasks across business operations.',
    '{"highlights": ["Custom AI agent development", "Decision-making workflows", "Multi-step task automation", "Natural language interfaces"]}',
    'bot', true, 0, 'published', null, null, '{}'
  ),
  (
    'workflow-automation-with-n8n',
    'Workflow Automation with n8n',
    'Design reliable automation workflows that connect your tools, move data automatically, and eliminate repetitive manual processes.',
    '{"highlights": ["End-to-end workflow design", "Tool and API integrations", "Conditional logic branches", "Error handling and retries"]}',
    'workflow', true, 1, 'published', null, null, '{}'
  ),
  (
    'api-and-system-integration',
    'API & System Integration',
    'Connect different platforms, databases, and services to create seamless automated ecosystems.',
    '{"highlights": ["REST and webhook integrations", "Database synchronization", "Legacy system connections", "Real-time data pipelines"]}',
    'cable', true, 2, 'published', null, null, '{}'
  ),
  (
    'document-intelligence-systems',
    'Document Intelligence Systems',
    'Extract, classify, analyze, and process documents using AI-powered automation pipelines.',
    '{"highlights": ["PDF and document parsing", "Intelligent data extraction", "Document classification", "Automated validation"]}',
    'file_text', true, 3, 'published', null, null, '{}'
  ),
  (
    'business-process-automation',
    'Business Process Automation',
    'Transform slow manual processes into efficient, scalable systems that save time and reduce errors.',
    '{"highlights": ["Process mapping and analysis", "Automation opportunity identification", "Scalable system architecture", "Performance monitoring"]}',
    'building2', true, 4, 'published', null, null, '{}'
  ),
  (
    'custom-ai-automation-solutions',
    'Custom AI Automation Solutions',
    'Build tailored automation systems based on unique business challenges and operational goals.',
    '{"highlights": ["Custom workflow engineering", "AI model integration", "Business-specific solutions", "End-to-end implementation"]}',
    'cpu', true, 5, 'published', null, null, '{}'
  )
on conflict (slug) do nothing;

insert into public.projects (slug, title, short_description, description, thumbnail, images, video_url, industry, technologies, category, featured, status, "order", client, demo_url, github_url, seo_title, seo_description, og_image, canonical_url, keywords, challenge, solution, workflow, impact)
values
  (
    'fleet-guard',
    'Fleet Guard',
    'Real-time AI-powered fleet monitoring system that detects risks, analyzes driver behavior, and alerts teams instantly to prevent incidents.',
    'A comprehensive AI fleet monitoring system designed for logistics companies. Fleet Guard uses real-time data analysis, AI-powered risk detection, and instant alerting to transform reactive fleet management into a proactive safety system.',
    null, '{}', null,
    '{"Logistics", "Transportation", "Fleet Management"}',
    '{"n8n", "Supabase", "Groq AI", "OpenAI", "React", "Webhooks", "PostgreSQL"}',
    'Logistics', true, 'active', 1, null, null, null, null, null, null, '{}',
    '{"fleet monitoring", "AI", "logistics", "safety"}',
    'Manual fleet monitoring was reactive, slow, and prone to missed incidents. Dispatchers had to constantly monitor multiple data sources, making it impossible to catch every anomaly or safety concern in real time.',
    'An intelligent monitoring layer that connects to existing fleet data sources, analyzes vehicle and driver behaviour using AI, and automatically flags issues â€” from harsh braking to route deviations â€” the moment they happen.',
    '{"Collects real-time fleet data from GPS, telemetry, and driver inputs", "AI analyzes route behaviour, speed patterns, and driving anomalies", "Automatically flags incidents, harsh events, and safety risks", "Sends instant alerts to dispatchers and management teams", "Generates daily safety reports and trend analysis"}',
    'Transformed a reactive fleet monitoring process into an intelligent, proactive safety system that catches incidents in real time and reduces response times from hours to seconds.'
  ),
  (
    'lease-intelligence',
    'Lease Intelligence System',
    'AI-powered lease document analysis system that extracts critical clauses, summaries, and insights from complex real estate lease agreements.',
    'An intelligent document processing system built for real estate professionals who deal with complex lease agreements. Lease Intelligence automates the extraction of critical lease information from PDFs, providing structured summaries, clause analysis, and instant search across the entire lease portfolio.',
    null, '{}', null,
    '{"Real Estate", "Legal", "Finance & FinTech"}',
    '{"n8n", "Supabase", "OpenAI", "Python", "PostgreSQL", "PDF.js"}',
    'Real Estate', true, 'active', 2, null, null, null, null, null, null, '{}',
    '{"lease analysis", "document AI", "real estate", "PDF processing"}',
    'Manual lease review was slow, inconsistent, and easy to miss critical clauses. Real estate teams spent hours reading through lengthy PDFs to find specific terms, renewal dates, and financial obligations.',
    'A fully automated document intelligence system that processes lease PDFs, extracts key clauses and dates using AI, and generates structured summaries with instant access to every critical detail.',
    '{"Upload lease PDF documents", "AI extracts key clauses: rent, renewal, termination, escalation", "Generates structured summaries with key dates and obligations", "Stores and indexes data for instant search across portfolio", "Automated alerts for upcoming renewals and deadlines"}',
    'Reduces manual document review time by 80% and eliminates missed contract details â€” ensuring real estate teams never miss a critical lease clause again.'
  ),
  (
    'document-intelligence',
    'Document Intelligence System',
    'End-to-end automated document processing pipeline that extracts, classifies, validates, and stores business data from any document type.',
    'A versatile document intelligence pipeline that handles any document type â€” invoices, contracts, forms, reports â€” and automatically extracts, classifies, validates, and stores the data. Built for businesses drowning in paperwork who need reliable, scalable document processing automation.',
    null, '{}', null,
    '{"Document Intelligence", "Business Operations"}',
    '{"n8n", "Supabase", "OpenAI", "Python", "PostgreSQL", "Document AI"}',
    'Document Intelligence', true, 'active', 3, null, null, null, null, null, null, '{}',
    '{"document processing", "AI extraction", "data pipeline", "automation"}',
    'Businesses receive hundreds of documents daily â€” invoices, contracts, forms â€” requiring manual sorting, data entry, and validation that is slow, expensive, and error-prone.',
    'An intelligent document pipeline that automatically classifies incoming documents, extracts relevant data using AI, validates against business rules, and pushes structured data into the appropriate business systems.',
    '{"Auto-classifies documents by type (invoice, contract, form, etc.)", "AI extracts structured data fields from each document", "Validates extracted data against business rules and thresholds", "Routes approved data to ERP, CRM, or accounting systems", "Flags exceptions and discrepancies for manual review"}',
    'Eliminates manual data entry across document-heavy workflows, reducing processing time by 90% and virtually eliminating data entry errors.'
  ),
  (
    'client-onboarding',
    'Client Onboarding Orchestrator',
    'Automated client onboarding system that handles intake, verification, document collection, and provisioning across multiple business tools.',
    'A comprehensive client onboarding automation system that orchestrates the entire new client journey â€” from initial intake and document collection to account provisioning and welcome communications. Built for service-based businesses that onboard multiple clients weekly.',
    null, '{}', null,
    '{"Business Operations", "Sales & CRM", "Customer Support"}',
    '{"n8n", "Supabase", "Slack API", "Google Workspace", "PostgreSQL"}',
    'Business Operations', true, 'active', 4, null, null, null, null, null, null, '{}',
    '{"onboarding", "automation", "client intake", "provisioning"}',
    'Manual client onboarding involved 15+ touchpoints across different tools, with coordinators chasing documents, manually creating accounts, and sending follow-ups â€” resulting in delays and inconsistent experiences.',
    'A fully automated onboarding orchestration layer that triggers the entire onboarding sequence from a single intake submission, coordinating across email, CRM, Slack, and business tools without manual intervention.',
    '{"Client intake form triggers automated onboarding sequence", "Collects and verifies required documents automatically", "Provisions accounts across CRM, email, and business tools", "Sends personalized welcome communications", "Notifies internal teams with onboarding checklist"}',
    'Reduces onboarding time from days to hours, eliminates manual coordination overhead, and delivers a consistent, professional welcome experience for every new client.'
  ),
  (
    'product-matcher',
    'Smart Product Matcher AI',
    'AI-powered product matching system that intelligently matches supplier products with retailer catalogs using semantic understanding.',
    'An intelligent product matching system that goes beyond simple SKU matching to understand product semantics, attributes, and context. Built for e-commerce businesses that manage multi-supplier catalogs and need to automatically match products across different naming conventions and data formats.',
    null, '{}', null,
    '{"E-Commerce", "Manufacturing", "Custom Solutions"}',
    '{"n8n", "Supabase", "OpenAI", "Python", "PostgreSQL", "Redis"}',
    'E-Commerce', true, 'active', 5, null, null, null, null, null, null, '{}',
    '{"product matching", "catalog", "e-commerce", "AI matching"}',
    'E-commerce businesses with multi-supplier catalogs struggled to match products across different naming conventions, units, and data formats â€” requiring hours of manual SKU mapping.',
    'An AI-driven matching engine that understands product semantics, compares attributes intelligently, and automatically suggests high-confidence matches between supplier and retailer catalog entries.',
    '{"Ingests product catalogs from suppliers and retailers", "AI analyzes product names, descriptions, and attributes", "Scores and ranks potential matches by confidence level", "Auto-accepts high-confidence matches, flags ambiguous ones", "Syncs matched products to the master catalog"}',
    'Dramatically reduces manual SKU mapping effort, enabling e-commerce businesses to onboard new suppliers in hours instead of weeks.'
  )
on conflict (slug) do nothing;
