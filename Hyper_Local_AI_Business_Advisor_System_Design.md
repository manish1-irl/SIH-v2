# Hyper-Local AI Business Advisory Platform
## Complete Agent Working Flow & Industry-Ready System Architecture

> **Purpose:** This document defines the end-to-end working flow, agent behavior, inputs, outputs, data sources, decision logic, system architecture, and major product modules for an AI-powered business advisory platform for rural and semi-urban entrepreneurs in India.
>
> **Design principle:** Facts and numerical values must come from verified data sources or deterministic calculations. The LLM should explain and synthesize grounded results rather than invent facts.

---

## 1. Product Vision

The platform is a **decision-making and business lifecycle system**, not merely a chatbot, loan calculator, or report generator.

It helps an entrepreneur answer four questions:

1. **Should this business be started here with the available capital?**
2. **If not, what business is more suitable for this location and capital?**
3. **Which real government schemes match the entrepreneur and proposed project?**
4. **After starting the business, how can the entrepreneur stay on track and avoid failure?**

The platform combines:

- Hyper-local feasibility analysis
- Reverse feasibility / business discovery
- Deterministic financial planning
- Real government scheme discovery and eligibility matching
- DPR generation
- Business-goal generation
- Cluster and resource matching
- Launch-time optimization ("Time Machine")
- Lifecycle monitoring and early-warning support
- General-purpose business chatbot
- Offline-first/PWA operation for low-connectivity environments

---

# 2. High-Level User Journey

```text
LANDING PAGE
     |
     v
USER REGISTRATION / LOGIN
     |
     v
PERSONAL PROFILE
     |
     v
BUSINESS ADVISOR
     |
     +------------------------------+
     |                              |
     v                              v
BUSINESS IDEA KNOWN?             IDEA UNKNOWN?
     |                              |
    YES                             NO
     |                              |
     v                              v
FEASIBILITY ENGINE          REVERSE FEASIBILITY ENGINE
     |                              |
     +---------------+--------------+
                     |
                     v
             FINANCIAL ENGINE
                     |
                     v
          GOVERNMENT SCHEME ENGINE
                     |
                     v
            TIME MACHINE ENGINE
                     |
                     v
             CLUSTER ENGINE
                     |
                     v
       FEASIBILITY + FINANCIAL REPORT
                     |
                     v
              DPR GENERATOR
                     |
                     v
              USER REVIEW
                     |
          +----------+----------+
          |                     |
          v                     v
       SAVE DPR            MODIFY / RE-CALCULATE
          |
          v
      DASHBOARD
          |
          +--> Business Goals
          |
          +--> Scheme/Application Status
          |
          +--> Cluster Opportunities
          |
          +--> Reports
          |
          +--> General Business Chatbot
          |
          +--> Notifications
          |
          v
   BUSINESS STARTED / LOAN DISBURSED
          |
          v
   LIFECYCLE COMPANION
          |
          +--> Periodic health checks
          +--> Goal tracking
          +--> Risk detection
          +--> Corrective recommendations
          +--> Outcome feedback
          |
          v
     CONTINUOUS LEARNING
```

---

# 3. User Inputs

The platform should collect structured information rather than relying on a free-form prompt alone.

## 3.1 Core Self-Business Inputs

Minimum inputs:

| Input | Example | Type |
|---|---|---|
| Locality | Village / Town / Block / District | String |
| State | Rajasthan | String |
| Capital / Margin Money | ₹1,00,000 | Number |
| Business Idea | Dairy | String / Category |
| User Age | 29 | Number |
| Social Category | Optional/consent-based | Enum |
| Gender | Optional/consent-based | Enum |
| Existing Business | Yes/No | Boolean |
| Experience | 2 years | Number/String |
| Education | Optional | Enum |
| Land/Shop/Asset Availability | Yes/No + details | Structured |
| Desired Project Size | Optional | Number |
| Preferred Language | Hindi / English / Regional | Enum |

Additional inputs should be collected only when they materially affect feasibility or scheme eligibility.

---

# 4. Two Main Entry Modes

## Mode A — Self Business / Business Idea Known

Example:

```text
Locality: Alwar
Capital: ₹1,00,000
Business Idea: Dairy
```

The agent validates the proposed business.

### Agent question

> "Can this business realistically work in this location with this available capital?"

---

## Mode B — Reverse Feasibility / Business Idea Unknown

Example:

```text
Locality: Alwar
Capital: ₹1,00,000
Business Idea: Not known
```

The agent discovers suitable business opportunities.

### Agent question

> "Given this location and capital, which businesses have the strongest feasibility?"

The engine ranks multiple business categories and explains why.

Example output:

```text
1. Dairy-related enterprise
   Opportunity Score: High
   Capital Fit: High
   Risk: Medium

2. Food processing
   Opportunity Score: Medium-High
   Capital Fit: Medium
   Risk: Medium

3. Rural retail/service business
   Opportunity Score: Medium
   Capital Fit: High
   Risk: Low-Medium
```

**Important:** Scores must be based on actual retrieved inputs and transparent scoring rules, not invented statistics.

---

# 5. AI Agent Architecture

The platform should use an **AI Agent as the orchestrator**.

The agent does not perform every task itself.

```text
                    AI BUSINESS ADVISOR AGENT
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
         RAG Engine       Tool Engine      LLM Engine
             |                |                |
             v                v                v
       Government Docs    Calculators      Explanation
       Sector Reports     Geo APIs         Report Writing
       Scheme Rules       Pricing APIs      Local Language
       Business Data      Risk Models       Chat
```

## Agent responsibilities

The agent should:

1. Understand the user's intent.
2. Validate required inputs.
3. Decide whether reverse feasibility is required.
4. Call the appropriate data tools.
5. Retrieve relevant government scheme documents.
6. Run deterministic financial calculations.
7. Analyze market and location signals.
8. Calculate feasibility scores.
9. Compare scheme eligibility.
10. Run launch timing analysis.
11. Search for compatible clusters.
12. Assemble a structured evidence object.
13. Ask the LLM to generate the user-facing explanation.
14. Generate the DPR.
15. Save results to the user's dashboard.
16. Create business goals.
17. Activate lifecycle tracking after business initiation/disbursement.

---

# 6. Core Agent Workflow

## Step 1 — Input Understanding

Input:

```json
{
  "location": "Alwar, Rajasthan",
  "capital": 100000,
  "business_idea": "Dairy",
  "language": "Hindi"
}
```

The agent validates:

- Location exists.
- Capital is a valid amount.
- Business category can be mapped to an internal taxonomy.
- Required profile information is available.
- Missing mandatory information is requested.

---

# 7. Step 2 — Location Intelligence

The location is converted into structured geographic information.

```text
User locality
     |
     v
Geocoding
     |
     v
Latitude / Longitude
     |
     v
PostGIS / Geo Data
     |
     +--> Population
     +--> Households
     +--> Nearby markets
     +--> Roads
     +--> Relevant infrastructure
     +--> Nearby businesses
     +--> Supply-side resources
```

Potential data sources:

- data.gov.in
- Census/open government datasets
- Bhuvan/ISRO
- OpenStreetMap
- Nominatim
- State government datasets
- Other verified public datasets

Every data point should store:

```json
{
  "value": "...",
  "source": "...",
  "retrieved_at": "...",
  "confidence": "high|medium|low"
}
```

---

# 8. Step 3 — Market Feasibility Engine

The engine analyzes:

### A. Market Reach

- Population
- Households
- Nearby settlements
- Market accessibility
- Relevant customer base

### B. Demand Signals

- Sector-specific demand indicators
- Local consumption signals
- Existing market activity
- Seasonality

### C. Competition

Competition should be presented carefully.

```text
Exact competitor count available
        |
        v
Use verified count

OR

Only proxy data available
        |
        v
Use estimated density
        |
        v
Clearly label as "estimated"
```

The system must never present an estimate as an exact fact.

### D. Supply-Side Analysis

The engine also asks:

> "Can this business obtain its inputs economically?"

Examples:

- Raw materials
- Suppliers
- Transport
- Veterinary services
- Storage
- Cold chain
- Wholesale markets
- Skilled labor

---

# 9. Step 4 — Business Feasibility Score

A structured score can combine:

```text
Feasibility Score
        |
        +--> Market Demand
        +--> Competition
        +--> Capital Fit
        +--> Input Availability
        +--> Infrastructure
        +--> Seasonality
        +--> Financial Burden
        +--> Scheme Fit
        +--> Risk
```

Example:

```json
{
  "overall_score": 78,
  "market_score": 82,
  "capital_fit": 85,
  "competition_score": 70,
  "supply_score": 76,
  "risk_score": 65,
  "scheme_fit": 88
}
```

The score must be explainable.

Example:

> "The score is 78/100 mainly because capital fit and scheme compatibility are strong, while competition and seasonal risk reduce the score."

---

# 10. Step 5 — Financial Engine

The financial engine is **deterministic**.

The LLM must not perform financial arithmetic.

It calculates:

- Project cost
- Margin contribution
- Loan amount
- Eligible financing
- Interest assumptions
- Tenure
- Moratorium
- EMI
- Total repayment
- Cash-flow scenarios
- Break-even indicators

Example:

```text
Margin Capital
      |
      v
Project Cost Calculation
      |
      v
Loan Requirement
      |
      v
Scheme Rules
      |
      v
Interest + Tenure
      |
      v
EMI Schedule
      |
      v
Cash Flow Analysis
```

Every calculation should store its formula and inputs for auditability.

---

# 11. Step 6 — Government Scheme Engine

This is a critical component.

The system should recommend **real, current government schemes**, not mock schemes.

## Scheme knowledge base

Store official scheme information such as:

```text
Scheme
├── Official name
├── Ministry / Department
├── Official source URL
├── Target beneficiaries
├── Business/project categories
├── Geographic scope
├── Minimum/maximum project size
├── Margin requirement
├── Subsidy
├── Interest support
├── Loan component
├── Age requirements
├── Social-category requirements
├── Gender requirements
├── Education requirements
├── Income requirements
├── Existing-business restrictions
├── Required documents
├── Application process
├── Validity / update date
└── Source document version
```

## Eligibility engine

```text
User Profile
     +
Business
     +
Project Cost
     +
Location
     +
Capital
     |
     v
Eligibility Rules Engine
     |
     +--> Eligible
     +--> Conditionally Eligible
     +--> Not Eligible
     |
     v
Ranked Scheme Recommendations
```

### Example output

```text
Recommended Scheme
------------------
Scheme: [Official Scheme Name]
Eligibility: Eligible / Conditional
Why:
- Location matches
- Business activity is covered
- Project size fits
- User profile satisfies stated conditions

Requirements:
- Document A
- Document B
- Document C

Important:
Eligibility is based on the latest available official rules and
should be verified with the implementing institution before application.
```

The system should retain the official source and retrieval timestamp.

---

# 12. Step 7 — Reverse Feasibility Engine

Triggered when:

```text
business_idea == null
```

Input:

```json
{
  "location": "Alwar, Rajasthan",
  "capital": 100000,
  "profile": {...}
}
```

Pipeline:

```text
Location Data
     +
Capital
     +
User Profile
     +
Local Demand
     +
Competition
     +
Supply-side Data
     +
Government Scheme Fit
     |
     v
Candidate Business Generator
     |
     v
Financial Filter
     |
     v
Feasibility Scoring
     |
     v
Risk Filtering
     |
     v
Top Business Recommendations
```

Output:

```json
{
  "recommendations": [
    {
      "business": "Business A",
      "score": 86,
      "capital_fit": "High",
      "market_fit": "High",
      "risk": "Medium",
      "reason": [...]
    },
    {
      "business": "Business B",
      "score": 79,
      "capital_fit": "High",
      "market_fit": "Medium",
      "risk": "Low"
    }
  ]
}
```

The user can select one recommendation and enter the normal feasibility pipeline.

---

# 13. Step 8 — SWOT and Risk Analysis

The LLM generates the narrative only after receiving grounded data.

Required sections:

1. Strengths
2. Weaknesses
3. Opportunities
4. Threats
5. Key risks
6. Risk mitigation

The prompt should enforce:

```text
Use only supplied facts.
Do not invent statistics.
Do not invent government schemes.
Do not invent eligibility requirements.
Do not invent competitor counts.
Mark estimates as estimates.
Cite the underlying source where applicable.
```

---

# 14. Step 9 — Time Machine

The Time Machine answers:

> "When should the entrepreneur start the business?"

Inputs:

```text
Business seasonality
+
Expected demand cycle
+
Input price cycle
+
Loan disbursement
+
Moratorium
+
EMI start date
```

Output:

```text
Recommended launch window
Expected high-demand period
Potential low-demand period
Cash-flow warning period
Recommended preparation period
```

Example:

```text
Preparation: January-February
Launch: March
High-demand window: April-June
EMI begins: aligned with expected revenue period
Risk window: July-August
```

The exact result must be based on available data and assumptions.

---

# 15. Step 10 — Cluster Engine

The Cluster Engine identifies complementary businesses and potential local economic networks.

It can detect:

```text
Dairy Entrepreneur
      |
      +--> Fodder Supplier
      +--> Veterinary Service
      +--> Transport
      +--> Milk Collection
      +--> Cold Storage
      +--> Food Processing
```

Possible cluster outputs:

```text
"3 nearby entrepreneurs are exploring complementary activities."

Potential cluster:
- Dairy production
- Fodder supply
- Milk transport
- Milk processing

Potential benefits:
- Shared transport
- Bulk purchasing
- Shared storage
- Better market access
```

### Privacy requirement

Default behavior:

```text
Anonymous aggregate recommendation
```

Direct contact information should only be revealed after appropriate user consent/opt-in.

---

# 16. Step 11 — Feasibility Report

The report combines:

## Executive Summary

- Proposed business
- Location
- Available capital
- Project size
- Overall feasibility
- Main opportunity
- Main risk

## Market Analysis

- Market reach
- Demand
- Competition
- Pricing
- Supply-side availability

## Financial Analysis

- Project cost
- Capital contribution
- Loan requirement
- EMI
- Tenure
- Moratorium
- Break-even indicators
- Scenario analysis

## Government Scheme Analysis

- Recommended schemes
- Eligibility
- Requirements
- Documents
- Official sources

## SWOT

- Strengths
- Weaknesses
- Opportunities
- Threats

## Time Machine

- Recommended preparation period
- Recommended launch window
- Seasonal risks

## Cluster Opportunities

- Complementary businesses
- Shared-resource opportunities

## Final Recommendation

```text
GO
CONDITIONAL GO
RECONSIDER
DO NOT PROCEED
```

The recommendation must include reasons.

---

# 17. Step 12 — DPR Generation

After feasibility approval, the platform generates a **Detailed Project Report (DPR)**.

Suggested DPR structure:

```text
1. Cover Page
2. Applicant Profile
3. Executive Summary
4. Business Description
5. Objectives
6. Location Analysis
7. Market Analysis
8. Product / Service Description
9. Operations Plan
10. Infrastructure Requirements
11. Machinery / Equipment
12. Raw Material Requirements
13. Human Resource Requirements
14. Project Cost
15. Means of Finance
16. Working Capital
17. Revenue Projection
18. Expense Projection
19. Profit & Loss Projection
20. Cash Flow
21. Break-even Analysis
22. Loan / EMI Details
23. Government Scheme Alignment
24. Risk Analysis
25. Mitigation Plan
26. Implementation Timeline
27. Sustainability Plan
28. Conclusion
29. Data Sources and Assumptions
```

The DPR should be generated from structured data, not from an unconstrained LLM response.

---

# 18. Step 13 — Personal Dashboard

After the report is generated, the user enters the personal dashboard.

## Dashboard sections

```text
PERSONAL DASHBOARD
|
+-- My Profile
|
+-- My Business
|
+-- Feasibility Reports
|
+-- DPR
|
+-- Government Schemes
|
+-- Business Goals
|
+-- Cluster Opportunities
|
+-- Financial Plan
|
+-- Timeline
|
+-- Notifications
|
+-- Business Chatbot
|
+-- Lifecycle Health
```

---

# 19. Agent-Generated Business Goals

The agent converts the DPR into actionable goals.

Example:

```text
Goal 1
Complete business registration
Deadline: 15 days

Goal 2
Finalize location
Deadline: 20 days

Goal 3
Purchase equipment
Deadline: 35 days

Goal 4
Complete scheme application
Deadline: 30 days

Goal 5
Start operations
Deadline: 60 days
```

Each goal contains:

```json
{
  "goal_id": "...",
  "title": "...",
  "description": "...",
  "deadline": "...",
  "priority": "high",
  "status": "pending",
  "dependencies": [],
  "reminder_enabled": true
}
```

---

# 20. Notification System

If the user enables reminders:

```text
Goal Created
     |
     v
Deadline Scheduler
     |
     +--> Upcoming reminder
     +--> Due reminder
     +--> Overdue reminder
     |
     v
Push Notification / SMS
```

Example:

> "Your business registration goal is due in 3 days."

Notification preferences should be controlled by the user.

---

# 21. General Business Chatbot

The dashboard chatbot handles questions such as:

- "What documents do I need?"
- "Explain my EMI."
- "What should I do next?"
- "Explain my DPR."
- "What is this government scheme?"
- "How can I reduce my business costs?"
- "What does break-even mean?"

The chatbot should use:

```text
User question
     |
     v
Intent detection
     |
     +--> User's business data
     +--> DPR
     +--> Scheme RAG
     +--> Financial tools
     +--> General knowledge
     |
     v
Grounded answer
```

Questions involving financial figures or eligibility should trigger the appropriate deterministic/rule-based tool rather than relying on LLM memory.

---

# 22. Lifecycle Companion

The Lifecycle Companion begins after the business is started or the relevant loan/disbursement milestone is recorded.

It is **app/SMS based for the current version**.

No IVR is required in the current architecture.

## Lifecycle flow

```text
Business Started
       |
       v
Periodic Check-in
       |
       +--> Revenue trend
       +--> Customer activity
       +--> Expenses
       +--> EMI status
       +--> Inventory/input problems
       +--> Major business issue
       |
       v
Business Health Score
       |
       +--> Healthy
       +--> Watch
       +--> At Risk
       |
       v
Recommended Action
```

Example:

```text
Risk detected:
Input costs increased significantly.

Suggested actions:
1. Compare alternate suppliers.
2. Review pricing.
3. Reduce non-essential operating costs.
4. Check whether cluster purchasing is possible.
```

The system should not automatically make regulated lending decisions.

---

# 23. Lifecycle Feedback Loop

The most important long-term loop:

```text
Business Recommendation
        |
        v
Business Started
        |
        v
Lifecycle Monitoring
        |
        v
Actual Outcome
        |
        +--> Successful
        +--> Struggling
        +--> Failed
        |
        v
Anonymized Outcome Data
        |
        v
Risk / Recommendation Models
        |
        v
Better Future Recommendations
```

This converts the platform into a continuously improving local business intelligence system.

---

# 24. RAG Architecture

RAG should be used for information that changes and must remain grounded.

## Knowledge collections

```text
Vector Database
|
+-- Government Schemes
|     +-- Central schemes
|     +-- State schemes
|     +-- Eligibility rules
|     +-- Official circulars
|
+-- Sector Knowledge
|     +-- Dairy
|     +-- Food processing
|     +-- Retail
|     +-- Manufacturing
|     +-- Services
|
+-- Business Guidance
|
+-- Regulations / Documentation
|
+-- Verified Market Reports
```

Each document should contain metadata:

```json
{
  "title": "...",
  "source": "...",
  "official_url": "...",
  "ministry": "...",
  "state": "...",
  "sector": "...",
  "effective_date": "...",
  "retrieved_at": "...",
  "version": "..."
}
```

---

# 25. Agent Tools

The orchestrator should have explicit tools/functions.

Suggested tool contracts:

```text
resolve_location()
get_demographics()
get_geospatial_data()
get_market_data()
get_competitor_signals()
get_supply_side_data()
get_sector_knowledge()
calculate_project_cost()
calculate_loan()
calculate_emi()
calculate_cashflow()
get_scheme_candidates()
check_scheme_eligibility()
calculate_feasibility_score()
run_reverse_feasibility()
run_time_machine()
find_clusters()
generate_feasibility_report()
generate_dpr()
create_business_goals()
get_user_business_context()
get_lifecycle_status()
create_notification()
```

---

# 26. Structured Agent Context

Before generation, the orchestrator should create an evidence object.

Example:

```json
{
  "user": {
    "location": "Alwar, Rajasthan",
    "capital": 100000,
    "business": "Dairy"
  },

  "location_data": {
    "coordinates": {},
    "population": {},
    "market_access": {},
    "infrastructure": {}
  },

  "market_data": {
    "demand_signals": [],
    "competition": {},
    "pricing": {},
    "supply_side": {}
  },

  "financial_data": {
    "project_cost": 0,
    "loan_amount": 0,
    "interest_rate": 0,
    "tenure": 0,
    "emi": 0
  },

  "scheme_data": [
    {
      "scheme": "",
      "eligibility": "",
      "requirements": [],
      "source": ""
    }
  ],

  "time_machine": {},
  "cluster_data": {},
  "confidence": {},
  "sources": []
}
```

The LLM receives this object and generates the user-facing narrative.

---

# 27. Source-of-Truth Architecture

```text
                USER
                  |
                  v
             AI AGENT
                  |
       +----------+----------+
       |          |          |
       v          v          v
      RAG       TOOLS      DATABASE
       |          |          |
       v          v          v
 Official      Verified    User Data
 Documents     APIs        Business Data
       |          |          |
       +----------+----------+
                  |
                  v
          STRUCTURED EVIDENCE
                  |
                  v
                LLM
                  |
                  v
        HUMAN-READABLE OUTPUT
```

### Golden rule

**The LLM explains; the system verifies and calculates.**

---

# 28. Industry-Ready System Architecture

```text
                         CLIENT LAYER
              +-----------------------------+
              | react native PWA / Web Application|
              | Offline Cache / IndexedDB    |
              | Local Queue / Sync            |
              +--------------+--------------+
                             |
                             v
                     API GATEWAY
              +-----------------------------+
              | Authentication              |
              | Authorization               |
              | Rate Limiting                |
              | Request Validation           |
              | API Versioning               |
              +--------------+--------------+
                             |
             +---------------+----------------+
             |                                |
             v                                v
    ORCHESTRATION SERVICE              LIFECYCLE SERVICE
    +--------------------+             +---------------------+
    | AI Agent            |             | Goal Scheduler      |
    | crewai          |             | Check-ins           |
    | Tool Router         |             | Risk Monitoring     |
    | Retry Logic         |             | Notifications       |
    +---------+----------+             +----------+----------+
              |                                   |
              +----------------+------------------+
                               |
                               v
                         CORE SERVICES
      +----------------+----------------+----------------+
      | Financial      | Feasibility    | Scheme         |
      | Engine         | Engine         | Engine         |
      +----------------+----------------+----------------+
      | Reverse        | Time Machine   | Cluster        |
      | Feasibility    | Engine         | Engine         |
      +----------------+----------------+----------------+
      | RAG            | Report/DPR     | Notification   |
      | Service        | Service        | Service        |
      +----------------+----------------+----------------+
                               |
                               v
                         DATA PLATFORM
      +--------------------------------------------------+
      | PostgreSQL / Supabase                            |
      | pgvector                                         |
      | PostGIS                                          |
      | Object/File Storage                              |
      | Redis / Queue                                    |
      +------------------------+-------------------------+
                               |
                               v
                      EXTERNAL DATA SOURCES
      +--------------------------------------------------+
      | Government APIs / Open Data                      |
      | Geospatial Sources                               |
      | Market / Price Sources                           |
      | Weather / Sector Sources                         |
      | LLM Provider                                     |
      +--------------------------------------------------+
```

---

# 29. Frontend Architecture

Recommended current direction:

```text
Next.js
   |
   +--> PWA
   +--> Responsive Web
   +--> Offline Service Worker
   +--> IndexedDB
   +--> Local Sync Queue
   +--> Dashboard
```

Why:

- Web + mobile browser support
- Installable PWA
- Works on Android and desktop
- No app-store dependency
- Easy deployment
- Strong ecosystem
- Can later be wrapped or paired with native applications if required

---

# 30. Offline-First Design

Low connectivity is primarily solved at the client layer.

```text
ONLINE
  |
  v
Supabase/API
  |
  v
Local IndexedDB Cache

OFFLINE
  |
  v
User can:
- View saved reports
- View DPR
- View business goals
- Update local goal status
- Enter new information
- Queue actions

CONNECTION RETURNS
  |
  v
Sync Queue
  |
  v
Backend
  |
  v
Supabase
```

Large reports should be represented locally as structured JSON where possible rather than depending on repeatedly downloading large PDFs.

---

# 31. Database Architecture

Core entities:

```text
users
profiles
businesses
business_categories
locations
feasibility_reports
feasibility_factors
financial_plans
loan_calculations
schemes
scheme_rules
scheme_sources
scheme_eligibility_results
dpr_reports
business_goals
clusters
cluster_memberships
lifecycle_checkins
business_health_scores
notifications
documents
knowledge_documents
audit_logs
model_runs
tool_runs
```

Important relationships:

```text
User
 |
 +--> Profile
 |
 +--> Business
        |
        +--> Feasibility Report
        |
        +--> Financial Plan
        |
        +--> Scheme Results
        |
        +--> DPR
        |
        +--> Goals
        |
        +--> Cluster
        |
        +--> Lifecycle History
```

---

# 32. Security and Privacy

Because the system handles personal and financial information:

- Authentication and authorization are mandatory.
- Use PostgreSQL Row Level Security.
- Encrypt sensitive information in transit and at rest.
- Minimize collected personal data.
- Capture appropriate consent.
- Maintain audit logs.
- Separate personally identifiable data from analytical aggregates where possible.
- Cluster matching should be anonymized by default.
- Provide appropriate data deletion/retention controls.
- Never expose another user's private information.
- Never use user data for model improvement without an appropriate legal/consent basis.
- Maintain source/version history for government scheme recommendations.

For India deployment, conduct a formal legal/compliance review against the applicable data-protection and sector requirements before production launch.

---

# 33. Reliability Architecture

External government/open-data sources may fail.

Use:

```text
External API
    |
    v
Timeout
    |
    v
Retry with exponential backoff
    |
    v
Circuit breaker
    |
    +--> Success --> Cache result
    |
    +--> Failure --> Use permitted cached data
                         |
                         v
                  Show data freshness
```

Never silently replace unavailable data with hallucinated values.

---

# 34. Auditability

Every major recommendation should be traceable.

Example:

```text
Recommendation ID
      |
      +--> User Inputs
      +--> Data Sources
      +--> Retrieved Documents
      +--> Tool Calls
      +--> Calculation Inputs
      +--> Calculation Outputs
      +--> Model Version
      +--> Prompt Version
      +--> Timestamp
      +--> Final Recommendation
```

This makes the platform explainable and debuggable.

---

# 35. AI Safety / Trust Rules

The agent must follow these rules:

### Never

- Invent a government scheme.
- Invent eligibility requirements.
- Invent a competitor count.
- Invent population statistics.
- Invent prices.
- Invent financial calculations.
- Claim approval/loan sanction.
- Present an estimate as an exact measurement.

### Always

- Identify source where practical.
- Record retrieval time.
- Show assumptions.
- Label estimates.
- Use deterministic financial calculations.
- Ask for missing critical inputs.
- Explain uncertainty.
- Recommend human/institutional verification for high-stakes edge cases.

---

# 36. Output Types

The agent produces several classes of output.

## A. Immediate conversational output

```text
Short answer
Explanation
Recommended next action
```

## B. Feasibility Report

Structured analytical report.

## C. Reverse Feasibility Recommendations

Ranked business opportunities.

## D. Financial Plan

```text
Project Cost
Loan
Margin
EMI
Tenure
Cash Flow
Break-even
```

## E. Government Scheme Recommendations

```text
Scheme
Eligibility
Requirements
Documents
Source
```

## F. DPR

Structured detailed project report.

## G. Business Goals

Actionable tasks with deadlines.

## H. Notifications

Goal and lifecycle reminders.

## I. Lifecycle Risk Alerts

```text
Healthy
Watch
At Risk
```

## J. General Chatbot Answers

Context-aware business assistance.

---

# 37. Example Complete Input → Output

## Input

```json
{
  "location": "Example Village, Alwar, Rajasthan",
  "capital": 100000,
  "business_idea": "Dairy",
  "language": "Hindi"
}
```

## Internal processing

```text
1. Resolve location
2. Retrieve location data
3. Retrieve dairy-sector knowledge
4. Retrieve market signals
5. Retrieve supply-side signals
6. Calculate project/loan structure
7. Retrieve current government schemes
8. Evaluate eligibility
9. Calculate feasibility
10. Analyze seasonal timing
11. Search for clusters
12. Assemble evidence
13. Generate report
14. Generate DPR
15. Generate goals
16. Save everything to dashboard
```

## Final user output

```text
FEASIBILITY: CONDITIONAL GO

Business: Dairy
Location: Example Village, Alwar
Capital: ₹1,00,000

Why:
- Strong capital fit
- Relevant local market signals
- Moderate competition
- Supply-side constraints identified

Main Risks:
- Seasonal demand variation
- Input cost volatility

Recommended Schemes:
- [Real current scheme]
- Eligibility: ...
- Requirements: ...

Recommended Launch Period:
...

Cluster Opportunities:
...

Next Steps:
1. ...
2. ...
3. ...
```

---

# 38. Recommended Technology Stack

## Frontend

```text
react native
TypeScript
PWA
bhashini api
Workbox / Service Worker
IndexedDB (dexie.js)
Tailwind CSS
vercel
```

## Backend

```text
Python
FastAPI
crewai
render
```

## Database

```text
Supabase PostgreSQL
pgvector
PostGIS
Supabase Storage
```




## AI

```text
LLM API : gemini
Embedding model
RAG
crewai Agent
```

The exact LLM provider can remain configurable.

## Reports

```text
ReportLab / WeasyPrint
```

## Notifications

```text
Firebase Cloud Messaging
SMS provider where required
```



## CI/CD

```text
GitHub
GitHub Actions
```

---

# 39. Free-First Development Strategy

The project should prefer free/open-source resources during development.

Examples:

| Requirement | Preferred free/open-source option |
|---|---|
| Frontend | react native |
| PWA | Workbox |
| Backend | FastAPI |
| Agent | crewai |
| Database | Supabase PostgreSQL |
| Vector DB | pgvector |
| Geospatial DB | PostGIS |
| Local DB | IndexedDB |
| API testing | Postman / curl |
| Unit testing | pytest |
| E2E | Playwright |
| Load testing | k6 |
| Logs | Loki |
| Error tracking | Sentry free tier |
| CI/CD | GitHub Actions |
| Diagrams | diagrams.net |
| Geocoding | Nominatim where usage policy permits |
| Maps/data | OpenStreetMap |
| Weather | Open-Meteo where suitable |

**Important:** "Free" must not be treated as "unlimited." Free tiers and public APIs have quotas, rate limits, licensing requirements, and changing terms. Production architecture should allow providers to be replaced.

---

# 40. API Boundary

Example API design:

```text
POST /api/v1/advisor/analyze
POST /api/v1/advisor/reverse-feasibility

GET  /api/v1/reports/{report_id}
POST /api/v1/reports/{report_id}/dpr

GET  /api/v1/schemes
POST /api/v1/schemes/check-eligibility

GET  /api/v1/business/goals
POST /api/v1/business/goals

GET  /api/v1/clusters
POST /api/v1/clusters/match

GET  /api/v1/lifecycle/status
POST /api/v1/lifecycle/check-in

POST /api/v1/chat
POST /api/v1/notifications/preferences
```

All endpoints should have:

- Authentication
- Authorization
- Input validation
- Rate limiting
- Request IDs
- Structured errors
- API versioning

---

# 41. Agent State Machine

The agent can be implemented as a state graph:

```text
START
 |
 v
VALIDATE_INPUT
 |
 +--> Missing data --> REQUEST_INPUT
 |
 v
CLASSIFY_REQUEST
 |
 +--> SELF_BUSINESS
 |       |
 |       v
 |   FEASIBILITY
 |
 +--> REVERSE_FEASIBILITY
         |
         v
     BUSINESS_RANKING
         |
         v
     USER_SELECTS_BUSINESS
         |
         v
      FEASIBILITY
         |
         v
FINANCIAL_ANALYSIS
 |
 v
SCHEME_ANALYSIS
 |
 v
TIME_MACHINE
 |
 v
CLUSTER_ANALYSIS
 |
 v
EVIDENCE_ASSEMBLY
 |
 v
REPORT_GENERATION
 |
 v
DPR_GENERATION
 |
 v
GOAL_GENERATION
 |
 v
DASHBOARD
 |
 v
LIFECYCLE
```

---

# 42. What the LLM Does vs What Tools Do

| Task | LLM | Tool/RAG |
|---|---:|---:|
| Understand user language | Yes | |
| Translate/localize response | Yes | |
| Generate narrative | Yes | |
| Government scheme facts | | RAG |
| Scheme eligibility | | Rules engine |
| Population | | Data source |
| Competitor signals | | Data/API |
| Project cost | | Calculator |
| EMI | | Calculator |
| Cash flow | | Calculator |
| Business ranking | Assist synthesis | Scoring engine |
| Launch timing | | Time Machine rules/data |
| Cluster detection | | Database/algorithm |
| DPR wording | Yes | Structured data |
| Audit trail | | Backend |
| Notifications | | Scheduler |

---

# 43. Core USP

## One-line USP

> **"An AI business advisor that does not just recommend a business—it proves whether the business fits the location and capital, finds the right government support, and stays with the entrepreneur through the business lifecycle."**

## Technical USP

```text
Agent
+
Real Government Data
+
RAG
+
Deterministic Financial Engine
+
Hyper-Local Feasibility
+
Reverse Feasibility
+
Time Machine
+
Cluster Intelligence
+
Lifecycle Companion
```

## Trust USP

> **Every important number should be traceable to a source or a deterministic formula.**

---

# 44. Final End-to-End Architecture

```text
                         USER
                           |
                           v
                react native PWA / WEB APP
                           |
             +-------------+-------------+
             |                           |
             v                           v
        OFFLINE STORE               API GATEWAY
        IndexedDB                       |
             |                          v
             |                ORCHESTRATION SERVICE
             |                          |
             |                    AI AGENT / LANGGRAPH
             |                          |
             |        +-----------------+------------------+
             |        |                 |                  |
             |        v                 v                  v
             |   RAG SERVICE       TOOL SERVICE      USER CONTEXT
             |        |                 |                  |
             |        |        +--------+---------+        |
             |        |        |        |         |        |
             |        v        v        v         v        v
             |    Schemes   Finance    Geo      Market   Profile
             |              Engine     Data      Data
             |                 |
             |                 v
             |            Time Machine
             |                 |
             |                 v
             |             Clusters
             |                 |
             +-----------------+------------------+
                               |
                               v
                       EVIDENCE OBJECT
                               |
                               v
                              LLM
                               |
                +--------------+--------------+
                |              |              |
                v              v              v
             REPORT          DPR           GOALS
                |              |              |
                +--------------+--------------+
                               |
                               v
                          DASHBOARD
                               |
                               v
                     LIFECYCLE COMPANION
                               |
                 +-------------+-------------+
                 |             |             |
                 v             v             v
              CHECK-INS    NOTIFICATIONS   RISK
                 |             |             |
                 +-------------+-------------+
                               |
                               v
                       OUTCOME DATA
                               |
                               v
                  IMPROVED RECOMMENDATIONS
```

---

# 45. Implementation Priority

## Phase 1 — Foundation

- react native PWA
- Authentication
- Supabase database
- IndexedDB offline layer
- User profile
- Business profile
- API gateway/backend
- Audit logging

## Phase 2 — Core Intelligence

- Location resolution
- Data ingestion
- RAG
- Financial calculator
- Scheme database
- Eligibility engine
- Feasibility engine

## Phase 3 — Agent

- crewai orchestration
- Tool calling
- Evidence object
- Grounded LLM generation
- Feasibility report

## Phase 4 — Advanced Intelligence

- Reverse Feasibility
- Time Machine
- Cluster Engine
- Scenario simulation
- Counterfactual analysis

## Phase 5 — Business Execution

- DPR
- Goals
- Dashboard
- Notifications
- Application tracking

## Phase 6 — Lifecycle

- Periodic check-ins
- Business health score
- Risk alerts
- Corrective recommendations
- Outcome feedback

## Phase 7 — Production Hardening

- Security testing
- Load testing
- Disaster recovery
- Monitoring
- CI/CD
- Data governance
- Compliance review
- Model evaluation
- API reliability
- Cost optimization

---

# 46. Final Design Principle

The platform should never be designed as:

```text
User -> Prompt -> LLM -> Answer
```

It should be designed as:

```text
User
  |
  v
Agent
  |
  +--> Retrieve real data
  +--> Retrieve official documents
  +--> Run deterministic calculations
  +--> Evaluate eligibility
  +--> Analyze local conditions
  +--> Run business scoring
  +--> Analyze timing
  +--> Analyze clusters
  |
  v
Evidence
  |
  v
LLM
  |
  v
Explainable Recommendation
  |
  v
DPR + Goals
  |
  v
Dashboard
  |
  v
Lifecycle Monitoring
  |
  v
Outcome Feedback
```

This separation is the foundation of an industry-ready system: **the agent coordinates, tools verify and calculate, RAG grounds knowledge, the database preserves state, and the LLM communicates the result.**
