#!/usr/bin/env python3
"""
QMS SaaS Pro — Computer System Validation Protocol (IQ/OQ/PQ)
ISO 13485:2016 & 21 CFR Part 11 Compliance
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, CondPageBreak,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans-Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif-Bold')
registerFontFamily('LiberationSans', normal='LiberationSans', bold='LiberationSans-Bold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ━━ Cascade Palette ━━
PAGE_BG       = colors.HexColor('#f2f2f1')
SECTION_BG    = colors.HexColor('#f0efee')
CARD_BG       = colors.HexColor('#e8e7e3')
TABLE_STRIPE  = colors.HexColor('#ecebe9')
HEADER_FILL   = colors.HexColor('#685e42')
COVER_BLOCK   = colors.HexColor('#595343')
BORDER        = colors.HexColor('#c9c4b6')
ICON          = colors.HexColor('#ac9142')
ACCENT        = colors.HexColor('#4e2bb7')
ACCENT_2      = colors.HexColor('#53c28b')
TEXT_PRIMARY   = colors.HexColor('#242421')
TEXT_MUTED     = colors.HexColor('#827f78')
SEM_SUCCESS   = colors.HexColor('#41935c')
SEM_WARNING   = colors.HexColor('#a2854c')
SEM_ERROR     = colors.HexColor('#8d4e48')
SEM_INFO      = colors.HexColor('#5a7c9d')

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 0.9 * inch
RIGHT_MARGIN = 0.9 * inch
TOP_MARGIN = 0.75 * inch
BOTTOM_MARGIN = 0.75 * inch
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ━━ Styles ━━
style_h1 = ParagraphStyle(
    name='H1', fontName='LiberationSerif', fontSize=18, leading=24,
    spaceBefore=18, spaceAfter=10, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_h2 = ParagraphStyle(
    name='H2', fontName='LiberationSerif', fontSize=14, leading=20,
    spaceBefore=14, spaceAfter=8, textColor=HEADER_FILL, alignment=TA_LEFT,
)
style_h3 = ParagraphStyle(
    name='H3', fontName='LiberationSerif', fontSize=12, leading=17,
    spaceBefore=10, spaceAfter=6, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_body = ParagraphStyle(
    name='Body', fontName='LiberationSerif', fontSize=10.5, leading=16,
    spaceBefore=2, spaceAfter=6, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
)
style_body_indent = ParagraphStyle(
    name='BodyIndent', fontName='LiberationSerif', fontSize=10.5, leading=16,
    spaceBefore=2, spaceAfter=6, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
    leftIndent=18,
)
style_bullet = ParagraphStyle(
    name='Bullet', fontName='LiberationSerif', fontSize=10.5, leading=16,
    spaceBefore=1, spaceAfter=3, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
    leftIndent=24, bulletIndent=12,
)
style_th = ParagraphStyle(
    name='TableHeader', fontName='LiberationSerif', fontSize=9.5, leading=13,
    textColor=colors.white, alignment=TA_CENTER,
)
style_td = ParagraphStyle(
    name='TableCell', fontName='LiberationSerif', fontSize=9, leading=12.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_td_c = ParagraphStyle(
    name='TableCellC', fontName='LiberationSerif', fontSize=9, leading=12.5,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER,
)
style_caption = ParagraphStyle(
    name='Caption', fontName='LiberationSerif', fontSize=9, leading=12,
    spaceBefore=3, spaceAfter=6, textColor=TEXT_MUTED, alignment=TA_CENTER,
)
style_footer = ParagraphStyle(
    name='Footer', fontName='LiberationSerif', fontSize=8, leading=10,
    textColor=TEXT_MUTED, alignment=TA_CENTER,
)
style_toc_h1 = ParagraphStyle(
    name='TOCH1', fontName='LiberationSerif', fontSize=13, leading=20,
    leftIndent=20, textColor=TEXT_PRIMARY,
)
style_toc_h2 = ParagraphStyle(
    name='TOCH2', fontName='LiberationSerif', fontSize=11, leading=17,
    leftIndent=40, textColor=TEXT_PRIMARY,
)
style_toc_h3 = ParagraphStyle(
    name='TOCH3', fontName='LiberationSerif', fontSize=10, leading=15,
    leftIndent=60, textColor=TEXT_MUTED,
)
style_note = ParagraphStyle(
    name='Note', fontName='LiberationSerif', fontSize=9.5, leading=14,
    spaceBefore=4, spaceAfter=4, textColor=TEXT_MUTED, alignment=TA_LEFT,
    leftIndent=12, borderPadding=4,
)

# ━━ TocDocTemplate ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))


def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15


def add_major_section(text, style):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, style, level=0),
    ]


def make_table(data, col_widths=None, h_align='CENTER'):
    if col_widths is None:
        n_cols = len(data[0]) if data else 1
        col_widths = [AVAILABLE_WIDTH / n_cols] * n_cols
    t = Table(data, colWidths=col_widths, hAlign=h_align)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else TABLE_STRIPE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


# ━━ Build Story ━━
story = []

# ── Table of Contents ──
toc = TableOfContents()
toc.levelStyles = [style_toc_h1, style_toc_h2, style_toc_h3]
story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle(
    name='TOCTitle', fontName='LiberationSerif', fontSize=20, leading=28,
    spaceBefore=12, spaceAfter=18, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)))
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════
# 1. PURPOSE AND SCOPE
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('1. Purpose and Scope', style_h1))

story.append(Paragraph(
    'This Validation Protocol defines the formal qualification testing to be performed on the '
    'QMS SaaS Pro computer system to demonstrate that it meets its intended requirements and '
    'complies with applicable regulatory standards. The protocol establishes the acceptance criteria, '
    'test procedures, and documentation requirements for Installation Qualification (IQ), Operational '
    'Qualification (OQ), and Performance Qualification (PQ).', style_body))

story.append(Paragraph(
    'The scope of this validation encompasses the complete QMS SaaS Pro application, including all '
    'fifteen quality management system modules, the multi-tenant architecture with Supabase Row-Level '
    'Security (RLS), dual-mode operation (Demo and Production), electronic signature capabilities, '
    'and audit trail functionality. The system boundary extends from the user-facing React/Next.js '
    'front-end through the API layer to the Supabase/Prisma persistence layer and all supporting '
    'infrastructure components.', style_body))

story.append(Paragraph(
    'This protocol is governed by the following regulatory frameworks and industry standards:', style_body))

regs = [
    'ISO 13485:2016 — Medical devices, Quality management systems, Requirements for regulatory purposes',
    '21 CFR Part 11 — Electronic Records; Electronic Signatures (U.S. FDA)',
    'EU Annex 11 — Computerized Systems (EudraLex Volume 4)',
    'GAMP 5 — A Risk-Based Approach to Compliant GxP Computerized Systems',
    'IEC 62304:2006 — Medical device software, Software life-cycle processes',
]
for r in regs:
    story.append(Paragraph('<bullet>&bull;</bullet> ' + r, style_bullet))

story.append(Spacer(1, 8))
story.append(Paragraph(
    '<b>System Boundary Definition:</b> The validated system includes the QMS SaaS Pro web application '
    '(React + TypeScript + Next.js front-end), the Supabase back-end with Prisma ORM and RLS policies, '
    'the Zustand state management layer, the 15 QMS functional modules, electronic signature and audit '
    'trail subsystems, and the deployment infrastructure. Excluded from this validation are third-party '
    'SaaS services consumed via API (e.g., identity providers, email delivery) and the end-user device '
    'hardware and browser software.', style_body))


# ═══════════════════════════════════════════════════════════════
# 2. SYSTEM DESCRIPTION
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('2. System Description', style_h1))

story.append(Paragraph(
    'QMS SaaS Pro is a cloud-native Quality Management System designed for regulated medical device '
    'and life sciences companies. It provides a comprehensive suite of fifteen integrated QMS modules '
    'that support the full product lifecycle from design control through post-market surveillance. '
    'The system is built on a modern web technology stack and operates in a multi-tenant architecture '
    'to serve multiple organizations from a single deployment while maintaining strict data isolation.', style_body))

story.append(add_heading('2.1 Architecture', style_h2, level=1))
story.append(Paragraph(
    'The system architecture consists of the following principal technology components:', style_body))

arch_data = [
    [Paragraph('<b>Layer</b>', style_th), Paragraph('<b>Technology</b>', style_th), Paragraph('<b>Purpose</b>', style_th)],
    [Paragraph('Front-End', style_td), Paragraph('React 18 + TypeScript', style_td), Paragraph('Component-based UI with type safety', style_td)],
    [Paragraph('Framework', style_td), Paragraph('Next.js 16 (App Router)', style_td), Paragraph('SSR/SSG, API routes, routing', style_td)],
    [Paragraph('State', style_td), Paragraph('Zustand', style_td), Paragraph('Client-side state management', style_td)],
    [Paragraph('Back-End', style_td), Paragraph('Supabase + Prisma ORM', style_td), Paragraph('PostgreSQL, RLS, auth, storage', style_td)],
    [Paragraph('Styling', style_td), Paragraph('Tailwind CSS + shadcn/ui', style_td), Paragraph('Utility-first CSS, UI component library', style_td)],
]
story.append(Spacer(1, 6))
story.append(make_table(arch_data, [AVAILABLE_WIDTH*0.18, AVAILABLE_WIDTH*0.32, AVAILABLE_WIDTH*0.50]))
story.append(Paragraph('Table 1: Technology Architecture Stack', style_caption))

story.append(add_heading('2.2 QMS Modules', style_h2, level=1))
story.append(Paragraph(
    'The system comprises fifteen interconnected quality management modules, each designed to '
    'address specific regulatory and operational requirements:', style_body))

modules = [
    'Document Control — CRUD operations, approval workflows, version control, e-signatures',
    'CAPA Management — Create, investigate, root cause analysis, effectiveness verification',
    'NCR Management — Nonconformance reporting, OOS/OOT workflow, disposition tracking',
    'Audit Management — Planning, execution, findings, CAPA linkage',
    'Risk Management — FMEA, RPN calculation, risk matrix visualization',
    'Training Management — Assignment, tracking, completion, overdue alerting',
    'Batch Records — Manufacturing step execution, QA review, release, lock',
    'Supplier Management — Qualification, scoring, A/B/C/D rating classification',
    'Change Control and Deviations — Workflow-driven change management with linkage',
    'Dynamic Forms — Template builder, form filler, instance locking',
    'Document Hierarchy — Structured document relationships and navigation',
    'Compliance Scoring Engine — Per-clause assessment, overall compliance score',
    'Reports — Data export, management review report generation (CSV, HTML)',
    'User Management — RBAC, role assignment, session management',
    'Setup Wizard and Dashboard — Initial configuration, KPI dashboard',
]
for m in modules:
    story.append(Paragraph('<bullet>&bull;</bullet> ' + m, style_bullet))

story.append(Spacer(1, 8))
story.append(add_heading('2.3 Multi-Tenancy and Security', style_h2, level=1))
story.append(Paragraph(
    'QMS SaaS Pro employs Supabase Row-Level Security (RLS) policies to enforce tenant isolation at '
    'the database level. Every query is automatically scoped to the authenticated tenant, ensuring that '
    'no cross-tenant data access is possible. The system operates in a dual-mode architecture: a Demo '
    'mode using in-memory storage for training and evaluation, and a Production mode backed by Supabase '
    'for live regulated operations. 21 CFR Part 11 electronic signatures are implemented with '
    'meaning-based signature semantics (e.g., "Approved by", "Verified by"), timestamp capture, and '
    'an immutable audit trail that records all create, read, update, and delete operations across all modules.', style_body))


# ═══════════════════════════════════════════════════════════════
# 3. VALIDATION APPROACH
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('3. Validation Approach', style_h1))

story.append(Paragraph(
    'The validation of QMS SaaS Pro follows a risk-based approach consistent with GAMP 5 guidelines. '
    'This methodology allocates validation effort proportionally to the risk that each system component '
    'poses to product quality, data integrity, and patient safety. The approach ensures that critical '
    'functions receive thorough testing while minimizing unnecessary effort on low-risk components.', style_body))

story.append(add_heading('3.1 GAMP 5 Categorization', style_h2, level=1))
gamp_data = [
    [Paragraph('<b>Category</b>', style_th), Paragraph('<b>Description</b>', style_th),
     Paragraph('<b>QMS SaaS Pro Components</b>', style_th), Paragraph('<b>Validation Effort</b>', style_th)],
    [Paragraph('Category 1', style_td_c), Paragraph('Infrastructure Software', style_td),
     Paragraph('Node.js, Bun runtime, Supabase platform, PostgreSQL', style_td), Paragraph('IQ verification only', style_td)],
    [Paragraph('Category 3', style_td_c), Paragraph('Non-Configured Products', style_td),
     Paragraph('Operating system, browser runtime, network stack', style_td), Paragraph('IQ verification only', style_td)],
    [Paragraph('Category 4', style_td_c), Paragraph('Configured Products', style_td),
     Paragraph('Supabase RLS policies, RBAC configuration, notification rules', style_td), Paragraph('IQ + OQ', style_td)],
    [Paragraph('Category 5', style_td_c), Paragraph('Custom Applications', style_td),
     Paragraph('All 15 QMS modules, e-signature engine, audit trail, compliance engine', style_td), Paragraph('IQ + OQ + PQ', style_td)],
]
story.append(Spacer(1, 6))
story.append(make_table(gamp_data, [AVAILABLE_WIDTH*0.13, AVAILABLE_WIDTH*0.20, AVAILABLE_WIDTH*0.40, AVAILABLE_WIDTH*0.17]))
story.append(Paragraph('Table 2: GAMP 5 Category Classification', style_caption))

story.append(add_heading('3.2 Validation Lifecycle (V-Model)', style_h2, level=1))
story.append(Paragraph(
    'The validation lifecycle follows the V-model, where each development phase has a corresponding '
    'verification or validation activity. The left side of the V represents specification and design '
    'activities; the right side represents verification and validation activities. This model ensures '
    'traceability from user requirements through design specifications to test cases and acceptance criteria.', style_body))

vmodel_items = [
    ('User Requirements Specification (URS)', 'User Acceptance Testing (UAT)'),
    ('Functional Requirements (FRS)', 'System Integration Testing'),
    ('Design Specifications (DS)', 'Module/Component Testing'),
    ('Code Implementation', 'Unit Testing'),
]
vmodel_data = [[Paragraph('<b>Specification Phase (Left V)</b>', style_th),
                Paragraph('<b>Verification Phase (Right V)</b>', style_th)]]
for spec, verify in vmodel_items:
    vmodel_data.append([Paragraph(spec, style_td), Paragraph(verify, style_td)])
story.append(Spacer(1, 6))
story.append(make_table(vmodel_data, [AVAILABLE_WIDTH*0.50, AVAILABLE_WIDTH*0.50]))
story.append(Paragraph('Table 3: V-Model Phase Mapping', style_caption))

story.append(add_heading('3.3 Test Types and Acceptance Criteria', style_h2, level=1))
test_data = [
    [Paragraph('<b>Test Type</b>', style_th), Paragraph('<b>Scope</b>', style_th),
     Paragraph('<b>Performed By</b>', style_th), Paragraph('<b>Acceptance</b>', style_th)],
    [Paragraph('Unit Test', style_td), Paragraph('Individual functions and components', style_td),
     Paragraph('Development Team', style_td_c), Paragraph('100% pass; coverage >= 80%', style_td)],
    [Paragraph('Integration Test', style_td), Paragraph('Module-to-module interfaces', style_td),
     Paragraph('Development Team', style_td_c), Paragraph('100% pass; no critical defects', style_td)],
    [Paragraph('Component Test', style_td), Paragraph('Complete module functionality', style_td),
     Paragraph('QA Team', style_td_c), Paragraph('100% pass; no major defects', style_td)],
    [Paragraph('E2E Test', style_td), Paragraph('Cross-module workflows', style_td),
     Paragraph('QA Team', style_td_c), Paragraph('100% pass; no major defects', style_td)],
    [Paragraph('UAT', style_td), Paragraph('Business process validation', style_td),
     Paragraph('Business Users + QA', style_td_c), Paragraph('100% pass; no open deviations', style_td)],
]
story.append(Spacer(1, 6))
story.append(make_table(test_data, [AVAILABLE_WIDTH*0.16, AVAILABLE_WIDTH*0.34, AVAILABLE_WIDTH*0.20, AVAILABLE_WIDTH*0.30]))
story.append(Paragraph('Table 4: Test Types, Scope, and Acceptance Criteria', style_caption))


# ═══════════════════════════════════════════════════════════════
# 4. INSTALLATION QUALIFICATION (IQ)
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('4. Installation Qualification (IQ)', style_h1))

story.append(Paragraph(
    'Installation Qualification verifies that the QMS SaaS Pro system and all its components are '
    'correctly installed and configured in the target environment according to documented specifications. '
    'IQ establishes that the hardware, software, network, and database infrastructure meet the minimum '
    'requirements and that all installation steps have been completed successfully.', style_body))

story.append(add_heading('4.1 Hardware / Infrastructure Verification', style_h2, level=1))
story.append(Paragraph(
    'Verify that the server infrastructure meets the minimum specifications for CPU, memory, storage, '
    'and network connectivity. The production environment shall be provisioned with at minimum 4 vCPU, '
    '8 GB RAM, and 50 GB SSD storage. Network connectivity between the application server and the '
    'Supabase instance must be confirmed with latency under 100 ms for standard API calls.', style_body))

story.append(add_heading('4.2 Software Installation Verification', style_h2, level=1))
story.append(Paragraph(
    'Confirm that the correct versions of all software dependencies are installed and operational. '
    'This includes the Node.js runtime (v20+), Bun package manager, all npm/bun dependencies as '
    'specified in the lock file, and the Next.js build artifacts. The build process must complete '
    'without errors and the application must start successfully on the designated port.', style_body))

story.append(add_heading('4.3 Database Setup Verification', style_h2, level=1))
story.append(Paragraph(
    'Verify that the Supabase instance is provisioned and accessible, the Prisma schema has been '
    'migrated successfully, all Row-Level Security (RLS) policies are active and enforce tenant '
    'isolation, and initial seed data (reference data, default roles, industry configurations) '
    'has been loaded correctly. Database connection parameters must match the environment configuration.', style_body))

story.append(add_heading('4.4 Network and Security Verification', style_h2, level=1))
story.append(Paragraph(
    'Confirm that HTTPS/TLS encryption is active for all endpoints, that the Caddy reverse proxy '
    'or equivalent gateway is correctly routing traffic, that CORS policies are configured to allow '
    'only authorized origins, and that authentication endpoints are accessible. Verify firewall rules '
    'restrict database access to the application server only.', style_body))

story.append(add_heading('4.5 IQ Test Cases', style_h2, level=1))

iq_cases = [
    ['IQ-001', 'Server hardware meets minimum specs', 'CPU >= 4 vCPU, RAM >= 8 GB, SSD >= 50 GB', 'Pass / Fail'],
    ['IQ-002', 'Node.js runtime version verified', 'Node.js v20+ installed and executable', 'Pass / Fail'],
    ['IQ-003', 'Bun package manager installed', 'Bun v1.0+ installed and executable', 'Pass / Fail'],
    ['IQ-004', 'Application dependencies installed', 'npm/bun install completes with zero errors', 'Pass / Fail'],
    ['IQ-005', 'Next.js build succeeds', 'Build completes with no errors; output in .next/', 'Pass / Fail'],
    ['IQ-006', 'Application starts on port 3000', 'HTTP 200 on / endpoint within 30 seconds', 'Pass / Fail'],
    ['IQ-007', 'Supabase instance accessible', 'Connection test returns OK; latency < 100 ms', 'Pass / Fail'],
    ['IQ-008', 'Prisma schema migration applied', 'All tables created; migration log clean', 'Pass / Fail'],
    ['IQ-009', 'RLS policies active', 'Cross-tenant query returns zero rows', 'Pass / Fail'],
    ['IQ-010', 'Seed data loaded', 'All reference data tables populated', 'Pass / Fail'],
    ['IQ-011', 'HTTPS/TLS active', 'Certificate valid; all endpoints HTTPS-only', 'Pass / Fail'],
    ['IQ-012', 'Caddy gateway routing verified', 'API routes proxied correctly; XTransformPort functional', 'Pass / Fail'],
    ['IQ-013', 'CORS policy configured', 'Only authorized origins accepted', 'Pass / Fail'],
    ['IQ-014', 'Firewall rules enforced', 'DB port inaccessible from public network', 'Pass / Fail'],
    ['IQ-015', 'Authentication endpoints functional', 'Login/logout/signup endpoints return expected codes', 'Pass / Fail'],
]
iq_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
            Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in iq_cases:
    iq_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                    Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(iq_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 5: IQ Test Cases', style_caption))


# ═══════════════════════════════════════════════════════════════
# 5. OPERATIONAL QUALIFICATION (OQ)
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('5. Operational Qualification (OQ)', style_h1))

story.append(Paragraph(
    'Operational Qualification demonstrates that the QMS SaaS Pro system operates according to its '
    'functional specifications throughout all anticipated operating ranges. Each module is tested '
    'individually and in combination to verify that functional requirements are met, error conditions '
    'are handled gracefully, and data integrity is maintained under all supported operating conditions.', style_body))

# 5.1
story.append(add_heading('5.1 Authentication and Authorization', style_h2, level=1))
story.append(Paragraph(
    'The authentication subsystem shall be tested to verify that users can log in with valid credentials, '
    'that invalid credentials are rejected with appropriate error messages, that session tokens expire '
    'according to policy, and that Role-Based Access Control (RBAC) enforces the defined permission matrix. '
    'Each role (Admin, QA Manager, QA Analyst, Production Staff, Viewer) must be verified to access only '
    'its authorized functions.', style_body))

oq_51 = [
    ['OQ-001', 'Valid user login', 'User authenticated; session token issued', 'Pass / Fail'],
    ['OQ-002', 'Invalid password rejection', 'Error message displayed; no session created', 'Pass / Fail'],
    ['OQ-003', 'Session timeout enforcement', 'Session invalidated after configured timeout', 'Pass / Fail'],
    ['OQ-004', 'RBAC - Admin full access', 'Admin can access all modules and functions', 'Pass / Fail'],
    ['OQ-005', 'RBAC - Viewer read-only', 'Viewer cannot create, edit, or delete records', 'Pass / Fail'],
    ['OQ-006', 'RBAC - Unauthorized access blocked', '403 error for unauthorized role/action', 'Pass / Fail'],
]
oq51_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_51:
    oq51_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq51_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 6: OQ Test Cases - Authentication and Authorization', style_caption))

# 5.2
story.append(add_heading('5.2 Document Control', style_h2, level=1))
story.append(Paragraph(
    'Document Control is a critical QMS module subject to stringent regulatory requirements. Testing '
    'shall verify the complete document lifecycle: creation, review, approval with electronic signatures, '
    'publication, version control, obsolescence, and retrieval. The electronic signature workflow must '
    'comply with 21 CFR Part 11 requirements for meaning, timestamp, and non-repudiation.', style_body))

oq_52 = [
    ['OQ-007', 'Create new document', 'Document created with auto-generated ID', 'Pass / Fail'],
    ['OQ-008', 'Submit for review', 'Document status changes to "In Review"', 'Pass / Fail'],
    ['OQ-009', 'Approve with e-signature', 'Signature captured with meaning, user, timestamp', 'Pass / Fail'],
    ['OQ-010', 'Reject and return', 'Document returned to draft with comment', 'Pass / Fail'],
    ['OQ-011', 'Version increment on revision', 'New version created; prior version archived', 'Pass / Fail'],
    ['OQ-012', 'Obsolete document', 'Document marked obsolete; removed from active list', 'Pass / Fail'],
    ['OQ-013', 'Document search and retrieval', 'Search returns correct results by title/ID/type', 'Pass / Fail'],
]
oq52_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_52:
    oq52_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq52_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 7: OQ Test Cases - Document Control', style_caption))

# 5.3
story.append(add_heading('5.3 CAPA Management', style_h2, level=1))
story.append(Paragraph(
    'CAPA (Corrective and Preventive Action) Management shall be tested to verify the complete CAPA '
    'lifecycle: identification, investigation, root cause analysis, action plan creation, implementation '
    'tracking, and effectiveness verification. Linkages between CAPAs and their source records (NCRs, '
    'audit findings, complaints) must be maintained and traceable.', style_body))

oq_53 = [
    ['OQ-014', 'Create CAPA record', 'CAPA created with unique ID; status = Open', 'Pass / Fail'],
    ['OQ-015', 'Link CAPA to source NCR', 'Bi-directional link established and displayed', 'Pass / Fail'],
    ['OQ-016', 'Record investigation findings', 'Investigation data saved; status updated', 'Pass / Fail'],
    ['OQ-017', 'Document root cause analysis', 'Root cause recorded with Ishikawa/5-Why method', 'Pass / Fail'],
    ['OQ-018', 'Create action plan', 'Actions assigned with owners and due dates', 'Pass / Fail'],
    ['OQ-019', 'Close CAPA after effectiveness check', 'CAPA closed; effectiveness verified', 'Pass / Fail'],
    ['OQ-020', 'Overdue CAPA alert', 'Notification triggered when action past due', 'Pass / Fail'],
]
oq53_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_53:
    oq53_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq53_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 8: OQ Test Cases - CAPA Management', style_caption))

# 5.4
story.append(add_heading('5.4 NCR Management', style_h2, level=1))
story.append(Paragraph(
    'Nonconformance (NCR) Management shall be tested to verify that nonconformances can be created, '
    'categorized, investigated, and dispositioned. The Out-of-Specification (OOS) and Out-of-Trend (OOT) '
    'workflow must correctly escalate and route records. Disposition decisions must be recorded with '
    'electronic signatures and linked to any resulting CAPA records.', style_body))

oq_54 = [
    ['OQ-021', 'Create NCR record', 'NCR created with unique ID; status = Open', 'Pass / Fail'],
    ['OQ-022', 'Categorize as OOS/OOT', 'Category recorded; escalation triggered per rules', 'Pass / Fail'],
    ['OQ-023', 'Record containment actions', 'Containment documented; status = Contained', 'Pass / Fail'],
    ['OQ-024', 'Link NCR to CAPA', 'Bi-directional link established', 'Pass / Fail'],
    ['OQ-025', 'Record disposition with e-sig', 'Disposition saved with signature meaning and timestamp', 'Pass / Fail'],
    ['OQ-026', 'Close NCR', 'NCR closed; all required fields populated', 'Pass / Fail'],
]
oq54_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_54:
    oq54_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq54_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 9: OQ Test Cases - NCR Management', style_caption))

# 5.5
story.append(add_heading('5.5 Audit Management', style_h2, level=1))
story.append(Paragraph(
    'Audit Management shall be tested to verify the complete audit lifecycle: planning, scheduling, '
    'execution, findings documentation, and CAPA linkage. Both internal and supplier audits must be '
    'supported. The system must track audit timelines and notify stakeholders of upcoming and overdue audits.', style_body))

oq_55 = [
    ['OQ-027', 'Create audit plan', 'Audit plan created with scope, criteria, and schedule', 'Pass / Fail'],
    ['OQ-028', 'Schedule audit', 'Audit date assigned; calendar notification sent', 'Pass / Fail'],
    ['OQ-029', 'Record audit findings', 'Findings classified (Major/Minor/Observation)', 'Pass / Fail'],
    ['OQ-030', 'Link finding to CAPA', 'CAPA auto-created from finding; link established', 'Pass / Fail'],
    ['OQ-031', 'Close audit', 'All findings addressed; audit report generated', 'Pass / Fail'],
    ['OQ-032', 'Overdue audit notification', 'Alert triggered for audits past scheduled date', 'Pass / Fail'],
]
oq55_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_55:
    oq55_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq55_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 10: OQ Test Cases - Audit Management', style_caption))

# 5.6
story.append(add_heading('5.6 Training Management', style_h2, level=1))
story.append(Paragraph(
    'Training Management shall verify that training assignments can be created and tracked, that '
    'completion is recorded with evidence, and that overdue training triggers escalation alerts. '
    'The system must maintain a training matrix linking job roles to required competencies and '
    'automatically identify gaps when new SOPs are published.', style_body))

oq_56 = [
    ['OQ-033', 'Assign training to user', 'Training task created; user notified', 'Pass / Fail'],
    ['OQ-034', 'Complete training with evidence', 'Completion recorded; evidence attached', 'Pass / Fail'],
    ['OQ-035', 'Overdue training alert', 'Escalation email sent after due date', 'Pass / Fail'],
    ['OQ-036', 'Training matrix gap analysis', 'Untrained competencies identified per role', 'Pass / Fail'],
    ['OQ-037', 'Training effectiveness evaluation', 'Effectiveness score recorded and tracked', 'Pass / Fail'],
]
oq56_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_56:
    oq56_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq56_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 11: OQ Test Cases - Training Management', style_caption))

# 5.7
story.append(add_heading('5.7 Risk Management', style_h2, level=1))
story.append(Paragraph(
    'Risk Management shall be tested to verify that FMEA (Failure Mode and Effects Analysis) records '
    'can be created, that Risk Priority Numbers (RPN) are calculated correctly from Severity, Occurrence, '
    'and Detection ratings, and that the risk matrix correctly classifies risks into appropriate zones '
    '(Low, Medium, High, Critical). Risk mitigation actions must be trackable and linked to CAPA when required.', style_body))

oq_57 = [
    ['OQ-038', 'Create FMEA record', 'FMEA created with failure mode details', 'Pass / Fail'],
    ['OQ-039', 'Calculate RPN', 'RPN = Severity x Occurrence x Detection; calculation verified', 'Pass / Fail'],
    ['OQ-040', 'Risk matrix classification', 'Risk correctly classified per defined thresholds', 'Pass / Fail'],
    ['OQ-041', 'Link risk mitigation to CAPA', 'CAPA created from risk; bidirectional link', 'Pass / Fail'],
    ['OQ-042', 'Risk re-evaluation after mitigation', 'Updated RPN calculated and compared', 'Pass / Fail'],
]
oq57_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_57:
    oq57_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq57_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 12: OQ Test Cases - Risk Management', style_caption))

# 5.8
story.append(add_heading('5.8 Batch Records', style_h2, level=1))
story.append(Paragraph(
    'Batch Record Management shall verify that manufacturing steps can be defined and executed in sequence, '
    'that QA review can approve or reject individual steps, that batch release requires appropriate '
    'electronic signatures, and that completed batch records are locked against further modification. '
    'Step completion must record the operator identity, timestamp, and any measured values.', style_body))

oq_58 = [
    ['OQ-043', 'Create batch record from template', 'Batch record instantiated with all steps', 'Pass / Fail'],
    ['OQ-044', 'Execute manufacturing step', 'Step completed; operator and timestamp recorded', 'Pass / Fail'],
    ['OQ-045', 'QA review of step', 'QA approval/rejection recorded with e-signature', 'Pass / Fail'],
    ['OQ-046', 'Batch release', 'Release recorded with e-sig; status = Released', 'Pass / Fail'],
    ['OQ-047', 'Lock completed batch record', 'Record immutable; edit/delete operations blocked', 'Pass / Fail'],
]
oq58_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_58:
    oq58_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq58_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 13: OQ Test Cases - Batch Records', style_caption))

# 5.9
story.append(add_heading('5.9 Supplier Management', style_h2, level=1))
story.append(Paragraph(
    'Supplier Management shall verify that suppliers can be qualified, scored, and classified into '
    'A/B/C/D rating categories. Supplier evaluation criteria must be configurable, and the scoring '
    'algorithm must correctly compute aggregate scores from individual criteria ratings. Approved '
    'supplier lists must be maintained and accessible from procurement workflows.', style_body))

oq_59 = [
    ['OQ-048', 'Create supplier record', 'Supplier created with all required fields', 'Pass / Fail'],
    ['OQ-049', 'Qualify supplier', 'Qualification status updated; approval recorded', 'Pass / Fail'],
    ['OQ-050', 'Score supplier evaluation', 'Aggregate score calculated correctly', 'Pass / Fail'],
    ['OQ-051', 'Assign A/B/C/D rating', 'Rating auto-assigned per score thresholds', 'Pass / Fail'],
    ['OQ-052', 'Disqualify supplier', 'Status changed; linked records flagged', 'Pass / Fail'],
]
oq59_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
              Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_59:
    oq59_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                      Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq59_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 14: OQ Test Cases - Supplier Management', style_caption))

# 5.10
story.append(add_heading('5.10 Change Control and Deviations', style_h2, level=1))
story.append(Paragraph(
    'Change Control and Deviations testing shall verify that change requests follow the defined approval '
    'workflow, that deviations can be recorded and linked to their source, and that both change controls '
    'and deviations support linkage to CAPA, NCR, and risk records. The approval chain must enforce '
    'electronic signatures at each decision point.', style_body))

oq_510 = [
    ['OQ-053', 'Initiate change request', 'Change request created; workflow started', 'Pass / Fail'],
    ['OQ-054', 'Approve change with e-signature', 'Approval captured; next step enabled', 'Pass / Fail'],
    ['OQ-055', 'Record deviation', 'Deviation logged with classification and impact', 'Pass / Fail'],
    ['OQ-056', 'Link deviation to CAPA', 'Bi-directional link established', 'Pass / Fail'],
    ['OQ-057', 'Close change control', 'All actions verified; change control closed', 'Pass / Fail'],
]
oq510_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
               Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_510:
    oq510_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                       Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq510_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 15: OQ Test Cases - Change Control and Deviations', style_caption))

# 5.11
story.append(add_heading('5.11 Dynamic Forms', style_h2, level=1))
story.append(Paragraph(
    'Dynamic Forms testing shall verify that form templates can be created using the template builder '
    'with various field types (text, number, date, dropdown, checkbox, attachment), that form instances '
    'can be filled and submitted, and that completed form instances can be locked to prevent further '
    'modification. Template versioning must be supported and prior template versions must remain accessible.', style_body))

oq_511 = [
    ['OQ-058', 'Create form template', 'Template saved with all configured field types', 'Pass / Fail'],
    ['OQ-059', 'Fill form instance', 'All field types render and accept input correctly', 'Pass / Fail'],
    ['OQ-060', 'Submit form instance', 'Data saved; status updated to Submitted', 'Pass / Fail'],
    ['OQ-061', 'Lock form instance', 'Instance immutable after lock; edit blocked', 'Pass / Fail'],
    ['OQ-062', 'Template versioning', 'New version created; prior version accessible', 'Pass / Fail'],
]
oq511_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
               Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_511:
    oq511_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                       Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq511_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 16: OQ Test Cases - Dynamic Forms', style_caption))

# 5.12
story.append(add_heading('5.12 Compliance Scoring Engine', style_h2, level=1))
story.append(Paragraph(
    'The Compliance Scoring Engine shall be tested to verify that per-clause assessments can be recorded '
    'for each applicable regulatory standard, that the overall compliance score is calculated as a '
    'weighted aggregate of individual clause assessments, and that the scoring algorithm produces '
    'correct results across the full range of input values. Score changes must be reflected in the '
    'dashboard within the configured refresh interval.', style_body))

oq_512 = [
    ['OQ-063', 'Record per-clause assessment', 'Assessment saved with evidence reference', 'Pass / Fail'],
    ['OQ-064', 'Calculate overall compliance score', 'Score = weighted average; verified by manual calc', 'Pass / Fail'],
    ['OQ-065', 'Dashboard score update', 'Compliance score refreshes within 30 seconds', 'Pass / Fail'],
    ['OQ-066', 'Score history tracking', 'Prior scores retained and accessible in history', 'Pass / Fail'],
]
oq512_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
               Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_512:
    oq512_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                       Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq512_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 17: OQ Test Cases - Compliance Scoring Engine', style_caption))

# 5.13
story.append(add_heading('5.13 Multi-Industry Support', style_h2, level=1))
story.append(Paragraph(
    'Multi-Industry Support testing shall verify that the five industry configurations (Medical Devices, '
    'Pharmaceuticals, Biotechnology, IVD/In Vitro Diagnostics, and Combination Products) can each be '
    'selected and applied during setup, that the correct regulatory checklists are loaded for each '
    'industry, and that industry-specific fields and workflows are activated appropriately.', style_body))

oq_513 = [
    ['OQ-067', 'Select Medical Device config', 'MD-specific checklist and fields loaded', 'Pass / Fail'],
    ['OQ-068', 'Select Pharma config', 'GxP-specific checklist and fields loaded', 'Pass / Fail'],
    ['OQ-069', 'Select Biotech config', 'Biotech checklist and fields loaded', 'Pass / Fail'],
    ['OQ-070', 'Select IVD config', 'IVDR-specific checklist loaded', 'Pass / Fail'],
    ['OQ-071', 'Select Combo Product config', 'Combined MD/Pharma checklist loaded', 'Pass / Fail'],
]
oq513_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
               Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_513:
    oq513_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                       Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq513_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 18: OQ Test Cases - Multi-Industry Support', style_caption))

# 5.14
story.append(add_heading('5.14 Audit Trail (21 CFR Part 11)', style_h2, level=1))
story.append(Paragraph(
    'The Audit Trail subsystem is a critical 21 CFR Part 11 compliance component. Testing shall verify '
    'that all create, read, update, and delete operations are recorded with the user identity, timestamp, '
    'previous value (for updates), new value, and the reason for the change. The audit trail must be '
    'tamper-evident: no user, including administrators, may modify or delete audit trail entries. '
    'The audit trail must support filtering and export for regulatory inspection.', style_body))

oq_514 = [
    ['OQ-072', 'Record creation logged', 'Audit entry created with user, timestamp, record ID', 'Pass / Fail'],
    ['OQ-073', 'Record update logged', 'Previous and new values captured in audit entry', 'Pass / Fail'],
    ['OQ-074', 'Record deletion logged', 'Deletion entry includes record ID and user', 'Pass / Fail'],
    ['OQ-075', 'Audit trail tamper evidence', 'Admin cannot modify/delete audit entries', 'Pass / Fail'],
    ['OQ-076', 'Audit trail filtering', 'Filter by user, date range, module, action type', 'Pass / Fail'],
    ['OQ-077', 'Audit trail export', 'Export to CSV with all fields intact', 'Pass / Fail'],
    ['OQ-078', 'Reason for change required', 'Update blocked without reason entry', 'Pass / Fail'],
]
oq514_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
               Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_514:
    oq514_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                       Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq514_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 19: OQ Test Cases - Audit Trail (21 CFR Part 11)', style_caption))

# 5.15
story.append(add_heading('5.15 Data Export', style_h2, level=1))
story.append(Paragraph(
    'Data Export testing shall verify that all supported export formats (CSV and HTML management review '
    'report) generate complete and accurate output. Exported data must match the on-screen data exactly, '
    'including all fields, formatting, and calculated values. Large data sets must export without timeout '
    'or truncation. HTML reports must be formatted for printing and include headers, footers, and page numbers.', style_body))

oq_515 = [
    ['OQ-079', 'CSV export of document list', 'All columns exported; data matches on-screen display', 'Pass / Fail'],
    ['OQ-080', 'CSV export of CAPA records', 'All fields including linked records exported', 'Pass / Fail'],
    ['OQ-081', 'HTML management review report', 'Report includes all sections; formatted for print', 'Pass / Fail'],
    ['OQ-082', 'Large dataset export (>1000 records)', 'Export completes without timeout; data intact', 'Pass / Fail'],
    ['OQ-083', 'Export date/time stamp', 'Export file includes generation timestamp', 'Pass / Fail'],
]
oq515_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
               Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in oq_515:
    oq515_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                       Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(oq515_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 20: OQ Test Cases - Data Export', style_caption))


# ═══════════════════════════════════════════════════════════════
# 6. PERFORMANCE QUALIFICATION (PQ)
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('6. Performance Qualification (PQ)', style_h1))

story.append(Paragraph(
    'Performance Qualification demonstrates that the QMS SaaS Pro system consistently performs according '
    'to its specification under real-world operating conditions. PQ testing validates end-to-end business '
    'workflows, concurrent user capacity, data integrity under load, and disaster recovery capabilities. '
    'PQ is conducted in the production-equivalent environment with production-representative data volumes.', style_body))

story.append(add_heading('6.1 End-to-End Workflow Testing', style_h2, level=1))
story.append(Paragraph(
    'End-to-end workflow testing exercises complete business processes that span multiple QMS modules. '
    'Each workflow must complete successfully from initiation to closure, with all cross-module linkages, '
    'notifications, and status transitions verified. Workflows shall be executed by representative end-user '
    'roles following documented standard operating procedures.', style_body))

story.append(add_heading('6.2 Concurrent User Testing', style_h2, level=1))
story.append(Paragraph(
    'Concurrent user testing verifies that the system maintains acceptable performance and data integrity '
    'when multiple users access the system simultaneously. Testing shall simulate at minimum 25 concurrent '
    'users performing representative operations across different modules. Response times must remain within '
    'defined thresholds: page loads under 3 seconds, API responses under 1 second, and report generation '
    'under 30 seconds. No data corruption or cross-tenant data leakage may occur under concurrent load.', style_body))

story.append(add_heading('6.3 Data Integrity Under Load', style_h2, level=1))
story.append(Paragraph(
    'Data integrity testing under load shall verify that database transactions are correctly isolated, '
    'that concurrent edits to the same record are handled with appropriate optimistic locking or conflict '
    'resolution, that audit trail entries are recorded without loss even under high transaction volume, '
    'and that RLS policies maintain tenant isolation during concurrent multi-tenant access patterns.', style_body))

story.append(add_heading('6.4 Disaster Recovery / Backup Verification', style_h2, level=1))
story.append(Paragraph(
    'Disaster recovery testing shall verify that the Supabase automated backup mechanism creates '
    'recoverable snapshots, that a point-in-time recovery can be completed within the defined Recovery '
    'Time Objective (RTO) of 4 hours, that the Recovery Point Objective (RPO) of 1 hour is met, and '
    'that restored data is complete and consistent with no data loss beyond the RPO window.', style_body))

story.append(add_heading('6.5 PQ Test Cases', style_h2, level=1))

pq_cases = [
    ['PQ-001', 'E2E: NCR to CAPA workflow', 'NCR created, investigated, CAPA raised, closed; full audit trail', 'Pass / Fail'],
    ['PQ-002', 'E2E: Audit planning to closure', 'Audit planned, executed, findings recorded, CAPA linked, closed', 'Pass / Fail'],
    ['PQ-003', 'E2E: Document lifecycle', 'Create, review, approve (e-sig), publish, revise, obsolete', 'Pass / Fail'],
    ['PQ-004', 'E2E: Batch record execution', 'Template to execution, QA review, release, lock', 'Pass / Fail'],
    ['PQ-005', 'E2E: Supplier qualification', 'Create, evaluate, score, rate, approve supplier', 'Pass / Fail'],
    ['PQ-006', '25 concurrent users', 'All users complete operations; no errors or data loss', 'Pass / Fail'],
    ['PQ-007', 'Page load under load', '95th percentile page load < 3 seconds', 'Pass / Fail'],
    ['PQ-008', 'API response under load', '95th percentile API response < 1 second', 'Pass / Fail'],
    ['PQ-009', 'Concurrent record edit conflict', 'Optimistic lock prevents overwrite; user notified', 'Pass / Fail'],
    ['PQ-010', 'Audit trail under high volume', 'All entries recorded; no gaps in sequence', 'Pass / Fail'],
    ['PQ-011', 'RLS isolation under concurrent tenants', 'Zero cross-tenant data access detected', 'Pass / Fail'],
    ['PQ-012', 'Backup creation and verification', 'Backup created; checksum validated', 'Pass / Fail'],
    ['PQ-013', 'Point-in-time recovery', 'Recovery completed within 4-hour RTO; data intact', 'Pass / Fail'],
    ['PQ-014', 'RPO verification', 'Data loss within 1-hour RPO window', 'Pass / Fail'],
    ['PQ-015', 'Data consistency after recovery', 'All records match pre-failure state within RPO', 'Pass / Fail'],
]
pq_data = [[Paragraph('<b>ID</b>', style_th), Paragraph('<b>Description</b>', style_th),
            Paragraph('<b>Expected Result</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in pq_cases:
    pq_data.append([Paragraph(row[0], style_td_c), Paragraph(row[1], style_td),
                    Paragraph(row[2], style_td), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(pq_data, [AVAILABLE_WIDTH*0.10, AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.44, AVAILABLE_WIDTH*0.16]))
story.append(Paragraph('Table 21: PQ Test Cases', style_caption))


# ═══════════════════════════════════════════════════════════════
# 7. TRACEABILITY MATRIX
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('7. Traceability Matrix', style_h1))

story.append(Paragraph(
    'The traceability matrix maps regulatory requirements to specific test cases, ensuring complete '
    'coverage of ISO 13485:2016 clauses and 21 CFR Part 11 requirements. Each requirement must have '
    'at least one test case that verifies compliance. Gaps in traceability must be documented and '
    'resolved before the validation is considered complete.', style_body))

story.append(add_heading('7.1 ISO 13485:2016 Traceability', style_h2, level=1))

iso_trace = [
    ['Document Control', 'Clause 4.2 (Documents)', 'OQ-007 to OQ-013', 'Covered'],
    ['Management Responsibility', 'Clause 5 (Management)', 'PQ-001 to PQ-005', 'Covered'],
    ['Resource Management', 'Clause 6 (Resources)', 'OQ-033 to OQ-037', 'Covered'],
    ['Product Realization - Planning', 'Clause 7.1 (Planning)', 'OQ-043 to OQ-047', 'Covered'],
    ['Design and Development', 'Clause 7.3 (Design)', 'OQ-058 to OQ-062', 'Covered'],
    ['Purchasing / Supplier Control', 'Clause 7.4 (Purchasing)', 'OQ-048 to OQ-052', 'Covered'],
    ['Production and Service Provision', 'Clause 7.5 (Production)', 'OQ-043 to OQ-047', 'Covered'],
    ['Control of Monitoring Equipment', 'Clause 7.6 (Monitoring)', 'OQ-063 to OQ-066', 'Covered'],
    ['Monitoring and Measurement', 'Clause 8.2 (Monitoring)', 'PQ-006 to PQ-011', 'Covered'],
    ['Control of Nonconforming Product', 'Clause 8.3 (NC Product)', 'OQ-021 to OQ-026', 'Covered'],
    ['Corrective Action', 'Clause 8.5.2 (Corrective)', 'OQ-014 to OQ-020', 'Covered'],
    ['Preventive Action', 'Clause 8.5.3 (Preventive)', 'OQ-038 to OQ-042', 'Covered'],
    ['Risk Management', 'Clause 7.1 (Risk)', 'OQ-038 to OQ-042', 'Covered'],
    ['Internal Audit', 'Clause 8.2.2 (Internal Audit)', 'OQ-027 to OQ-032', 'Covered'],
    ['Change Control', 'Clause 7.3.7 (Design Changes)', 'OQ-053 to OQ-057', 'Covered'],
]
iso_data = [[Paragraph('<b>Requirement</b>', style_th), Paragraph('<b>ISO 13485 Clause</b>', style_th),
             Paragraph('<b>Test Case ID(s)</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in iso_trace:
    iso_data.append([Paragraph(row[0], style_td), Paragraph(row[1], style_td_c),
                     Paragraph(row[2], style_td_c), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(iso_data, [AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.22, AVAILABLE_WIDTH*0.28, AVAILABLE_WIDTH*0.20]))
story.append(Paragraph('Table 22: ISO 13485:2016 Traceability Matrix', style_caption))

story.append(add_heading('7.2 21 CFR Part 11 Traceability', style_h2, level=1))

cfr_trace = [
    ['Electronic Signature - Meaning', '11.50(a)', 'OQ-009, OQ-025, OQ-045, OQ-054', 'Covered'],
    ['Electronic Signature - Components', '11.50(b)', 'OQ-009, OQ-025, OQ-045, OQ-054', 'Covered'],
    ['Signature Manifestation', '11.50', 'OQ-009, OQ-025, OQ-045', 'Covered'],
    ['Audit Trail - Creation', '11.10(e)', 'OQ-072 to OQ-074', 'Covered'],
    ['Audit Trail - Tamper Evidence', '11.10(e)', 'OQ-075', 'Covered'],
    ['Audit Trail - Review and Copy', '11.10(e)', 'OQ-076, OQ-077', 'Covered'],
    ['Record Retention and Retrieval', '11.10(c)', 'PQ-012 to PQ-015', 'Covered'],
    ['System Access Controls', '11.10(d)', 'OQ-001 to OQ-006', 'Covered'],
    ['Authority Checks', '11.10(d)', 'OQ-004 to OQ-006', 'Covered'],
    ['Device Checks', '11.10(a)', 'IQ-012 to IQ-014', 'Covered'],
    ['Operational System Checks', '11.10(f)', 'PQ-009, PQ-010', 'Covered'],
    ['Personnel Qualifications', '11.10(i)', 'OQ-033 to OQ-037', 'Covered'],
]
cfr_data = [[Paragraph('<b>Requirement</b>', style_th), Paragraph('<b>21 CFR 11 Clause</b>', style_th),
             Paragraph('<b>Test Case ID(s)</b>', style_th), Paragraph('<b>Status</b>', style_th)]]
for row in cfr_trace:
    cfr_data.append([Paragraph(row[0], style_td), Paragraph(row[1], style_td_c),
                     Paragraph(row[2], style_td_c), Paragraph(row[3], style_td_c)])
story.append(Spacer(1, 6))
story.append(make_table(cfr_data, [AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.18, AVAILABLE_WIDTH*0.32, AVAILABLE_WIDTH*0.20]))
story.append(Paragraph('Table 23: 21 CFR Part 11 Traceability Matrix', style_caption))


# ═══════════════════════════════════════════════════════════════
# 8. DEVIATION HANDLING
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('8. Deviation Handling', style_h1))

story.append(Paragraph(
    'Any deviation from the expected results defined in this protocol must be documented, investigated, '
    'and resolved before the validation can be concluded. Deviations are classified into three severity '
    'levels based on their potential impact on product quality, data integrity, and patient safety.', style_body))

dev_data = [
    [Paragraph('<b>Severity</b>', style_th), Paragraph('<b>Definition</b>', style_th),
     Paragraph('<b>Action Required</b>', style_th)],
    [Paragraph('Critical', style_td_c),
     Paragraph('Direct impact on patient safety or data integrity; system fails to meet a regulatory requirement', style_td),
     Paragraph('Immediate halt of affected testing; root cause analysis; corrective action; retest after fix', style_td)],
    [Paragraph('Major', style_td_c),
     Paragraph('Significant functional deficiency that does not directly impact patient safety', style_td),
     Paragraph('Document deviation; impact assessment; corrective action plan; retest within defined timeline', style_td)],
    [Paragraph('Minor', style_td_c),
     Paragraph('Cosmetic or documentation issue with no functional impact', style_td),
     Paragraph('Document deviation; assess for cumulative impact; correction in next release', style_td)],
]
story.append(Spacer(1, 6))
story.append(make_table(dev_data, [AVAILABLE_WIDTH*0.14, AVAILABLE_WIDTH*0.43, AVAILABLE_WIDTH*0.43]))
story.append(Paragraph('Table 24: Deviation Severity Classification', style_caption))

story.append(Spacer(1, 6))
story.append(Paragraph(
    '<b>Deviation Documentation Requirements:</b> Each deviation must be recorded on a Deviation Report '
    'form that includes: the test case ID and description, the expected result versus actual result, '
    'the severity classification, the root cause analysis findings, the corrective action taken, '
    'the retest results, and the sign-off by the Validation Lead and QA Manager. All deviation '
    'reports must be appended to the Final Validation Report as attachments.', style_body))

story.append(Paragraph(
    '<b>Impact Assessment Process:</b> When a deviation is identified, the Validation Lead shall conduct '
    'an impact assessment to determine whether the deviation affects other test cases, other modules, '
    'or previously completed qualification activities. If the deviation is found to invalidate prior '
    'testing results, the affected test cases must be re-executed after the corrective action is '
    'implemented and verified.', style_body))

story.append(Paragraph(
    '<b>Resolution and Retesting:</b> Corrective actions must be implemented, verified, and documented '
    'before retesting commences. The retest must follow the identical test procedure as the original '
    'test case and must achieve a passing result. If the retest fails, the escalation procedure '
    'defined in the Quality Manual shall be followed.', style_body))


# ═══════════════════════════════════════════════════════════════
# 9. FINAL REPORT AND SIGN-OFF
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('9. Final Report and Sign-Off', style_h1))

story.append(Paragraph(
    'Upon completion of all IQ, OQ, and PQ testing activities, a Final Validation Report shall be '
    'prepared summarizing the validation results. The report must include: a summary of all test cases '
    'executed with pass/fail results, a list of all deviations identified and their resolution status, '
    'an assessment of compliance with ISO 13485:2016 and 21 CFR Part 11, and a conclusion regarding '
    'the system suitability for release to production.', style_body))

story.append(add_heading('9.1 Validation Summary Template', style_h2, level=1))

summary_data = [
    [Paragraph('<b>Qualification Phase</b>', style_th), Paragraph('<b>Total Tests</b>', style_th),
     Paragraph('<b>Passed</b>', style_th), Paragraph('<b>Failed</b>', style_th),
     Paragraph('<b>Deviations</b>', style_th), Paragraph('<b>Result</b>', style_th)],
    [Paragraph('Installation Qualification', style_td), Paragraph('15', style_td_c),
     Paragraph('____', style_td_c), Paragraph('____', style_td_c),
     Paragraph('____', style_td_c), Paragraph('____', style_td_c)],
    [Paragraph('Operational Qualification', style_td), Paragraph('83', style_td_c),
     Paragraph('____', style_td_c), Paragraph('____', style_td_c),
     Paragraph('____', style_td_c), Paragraph('____', style_td_c)],
    [Paragraph('Performance Qualification', style_td), Paragraph('15', style_td_c),
     Paragraph('____', style_td_c), Paragraph('____', style_td_c),
     Paragraph('____', style_td_c), Paragraph('____', style_td_c)],
    [Paragraph('<b>Overall Total</b>', style_td), Paragraph('<b>113</b>', style_td_c),
     Paragraph('<b>____</b>', style_td_c), Paragraph('<b>____</b>', style_td_c),
     Paragraph('<b>____</b>', style_td_c), Paragraph('<b>____</b>', style_td_c)],
]
story.append(Spacer(1, 6))
story.append(make_table(summary_data, [AVAILABLE_WIDTH*0.30, AVAILABLE_WIDTH*0.12, AVAILABLE_WIDTH*0.12,
                                        AVAILABLE_WIDTH*0.12, AVAILABLE_WIDTH*0.16, AVAILABLE_WIDTH*0.18]))
story.append(Paragraph('Table 25: Validation Summary', style_caption))

story.append(add_heading('9.2 Sign-Off', style_h2, level=1))
story.append(Paragraph(
    'This validation protocol and its results have been reviewed and approved by the following personnel. '
    'By signing below, each signatory confirms that the validation was conducted in accordance with '
    'this protocol, that the results are accurately reported, and that the system is recommended for '
    'release to the production environment.', style_body))

signoff_data = [
    [Paragraph('<b>Role</b>', style_th), Paragraph('<b>Name</b>', style_th),
     Paragraph('<b>Signature</b>', style_th), Paragraph('<b>Date</b>', style_th)],
    [Paragraph('System Owner', style_td), Paragraph('________________', style_td),
     Paragraph('________________', style_td), Paragraph('____/____/____', style_td_c)],
    [Paragraph('QA Manager', style_td), Paragraph('________________', style_td),
     Paragraph('________________', style_td), Paragraph('____/____/____', style_td_c)],
    [Paragraph('Validation Lead', style_td), Paragraph('________________', style_td),
     Paragraph('________________', style_td), Paragraph('____/____/____', style_td_c)],
]
story.append(Spacer(1, 6))
story.append(make_table(signoff_data, [AVAILABLE_WIDTH*0.20, AVAILABLE_WIDTH*0.28, AVAILABLE_WIDTH*0.28, AVAILABLE_WIDTH*0.24]))
story.append(Paragraph('Table 26: Validation Sign-Off', style_caption))


# ━━ Build Body PDF ━━
OUTPUT_DIR = '/home/z/my-project/download'
BODY_PDF = os.path.join(OUTPUT_DIR, '_body_validation.pdf')
FINAL_PDF = os.path.join(OUTPUT_DIR, 'QMS_SaaS_Pro_Validation_Protocol.pdf')

doc = TocDocTemplate(
    BODY_PDF, pagesize=A4,
    leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN,
    title='QMS SaaS Pro - Computer System Validation Protocol',
    author='Z.ai', creator='Z.ai',
    subject='IQ/OQ/PQ Test Plan for ISO 13485:2016 and 21 CFR Part 11 Compliance',
)
doc.multiBuild(story)
print(f"Body PDF generated: {BODY_PDF}")


# ━━ Cover Page (HTML/Playwright) ━━
COVER_HTML = os.path.join(OUTPUT_DIR, '_cover_validation.html')
COVER_PDF = os.path.join(OUTPUT_DIR, '_cover_validation.pdf')

cover_html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { size: 794px 1123px; margin: 0; }
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 794px; height: 1123px; background: #fafaf8; overflow: hidden; }
  .cover {
    position: relative; width: 794px; height: 1123px;
    font-family: 'Inter', -apple-system, sans-serif; color: #242421;
  }

  /* Layer 0: background */
  .layer-0 { position: absolute; inset: 0; background: #fafaf8; z-index: 0; }

  /* Layer 1: decorative - sidebar + watermark */
  .layer-1 {
    position: absolute; inset: 0; overflow: hidden; z-index: 1;
  }
  .sidebar {
    position: absolute; left: 0; top: 0;
    width: 79px; height: 1123px;
    background: #595343;
  }
  .sidebar-watermark {
    position: absolute; left: 39px; top: 50%;
    transform: translate(-50%, -50%) rotate(-90deg);
    font-size: 42px; font-weight: 800; letter-spacing: 8px;
    color: rgba(255,255,255,0.12); white-space: nowrap;
    text-transform: uppercase;
  }
  .bottom-line {
    position: absolute; bottom: 112px; left: 119px;
    width: 596px; height: 1px;
    background: rgba(104,94,66,0.3);
  }

  /* Layer 2: structure lines */
  .layer-2 { position: absolute; inset: 0; z-index: 2; }

  /* Layer 3: content */
  .layer-3 { position: absolute; inset: 0; z-index: 3; }

  .content-area {
    position: absolute; left: 119px; top: 0; right: 60px;
    height: 1123px;
    display: flex; flex-direction: column;
    justify-content: center;
  }

  .kicker {
    font-size: 13px; font-weight: 500; letter-spacing: 3px;
    text-transform: uppercase; color: rgba(36,36,33,0.5);
    margin-bottom: 18px;
  }

  .hero-title {
    font-size: 44px; font-weight: 900; line-height: 1.12;
    color: #242421; margin-bottom: 8px;
    max-width: 560px;
  }

  .subtitle {
    font-size: 20px; font-weight: 400; line-height: 1.4;
    color: #595343; margin-bottom: 32px;
    max-width: 520px;
  }

  .summary-block {
    font-size: 15px; font-weight: 400; line-height: 1.65;
    color: rgba(36,36,33,0.72); margin-bottom: 40px;
    max-width: 480px;
  }

  .meta-block {
    font-size: 14px; font-weight: 400; line-height: 2.0;
    color: #242421;
  }
  .meta-block .label {
    color: rgba(36,36,33,0.5); margin-right: 8px;
  }

  .footer-block {
    position: absolute; bottom: 75px; left: 119px; right: 60px;
    font-size: 13px; font-weight: 400; color: rgba(36,36,33,0.45);
    display: flex; justify-content: space-between;
    text-transform: uppercase; letter-spacing: 2px;
  }
</style>
</head>
<body>
<div class="cover">
  <div class="layer-0"></div>
  <div class="layer-1">
    <div class="sidebar">
      <div class="sidebar-watermark">QMS VALIDATION</div>
    </div>
    <div class="bottom-line"></div>
  </div>
  <div class="layer-2"></div>
  <div class="layer-3">
    <div class="content-area">
      <div class="kicker">Computer System Validation Protocol</div>
      <div class="hero-title">QMS SaaS Pro</div>
      <div class="subtitle">IQ/OQ/PQ Test Plan for ISO 13485:2016 &amp; 21 CFR Part 11 Compliance</div>
      <div class="summary-block">
        This validation protocol establishes the qualification test procedures, acceptance criteria,
        and documentation requirements for the QMS SaaS Pro system, covering Installation Qualification,
        Operational Qualification, and Performance Qualification in accordance with GAMP 5 guidelines.
      </div>
      <div class="meta-block">
        <div><span class="label">Version:</span> 1.0</div>
        <div><span class="label">Date:</span> 2026-05-03</div>
        <div><span class="label">Classification:</span> Confidential</div>
      </div>
    </div>
    <div class="footer-block">
      <span>Document No. VAL-QMS-2026-001</span>
      <span>Revision 1.0</span>
    </div>
  </div>
</div>
</body>
</html>"""

with open(COVER_HTML, 'w', encoding='utf-8') as f:
    f.write(cover_html)
print(f"Cover HTML written: {COVER_HTML}")

# Render cover PDF
import subprocess
SKILL_DIR = '/home/z/my-project/skills/pdf'
subprocess.run([
    'node', os.path.join(SKILL_DIR, 'scripts', 'html2poster.js'),
    COVER_HTML, '--output', COVER_PDF, '--width', '794px'
], check=True)
print(f"Cover PDF rendered: {COVER_PDF}")

# ━━ Merge Cover + Body ━━
from pypdf import PdfReader, PdfWriter, Transformation

A4_W, A4_H = 595.28, 841.89

def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
        sx, sy = A4_W / w, A4_H / h
        page.add_transformation(Transformation().scale(sx=sx, sy=sy))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

writer = PdfWriter()
cover_page = PdfReader(COVER_PDF).pages[0]
writer.add_page(normalize_page_to_a4(cover_page))
for page in PdfReader(BODY_PDF).pages:
    writer.add_page(normalize_page_to_a4(page))

writer.add_metadata({
    '/Title': 'QMS SaaS Pro - Computer System Validation Protocol',
    '/Author': 'Z.ai',
    '/Creator': 'Z.ai',
    '/Subject': 'IQ/OQ/PQ Test Plan for ISO 13485:2016 and 21 CFR Part 11 Compliance',
})
with open(FINAL_PDF, 'wb') as f:
    writer.write(f)
print(f"Final PDF generated: {FINAL_PDF}")

# Cleanup temp files
for tmp in [BODY_PDF, COVER_PDF, COVER_HTML]:
    try:
        os.remove(tmp)
    except:
        pass
print("Temporary files cleaned up.")
print(f"\nDone! Final PDF: {FINAL_PDF}")
