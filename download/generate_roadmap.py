#!/usr/bin/env python3
"""
Feuille de Route — QMS SaaS Pro
Passage en mode Test en Ligne pour Presentation
"""

import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, CondPageBreak,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.tableofcontents import TableOfContents
import hashlib

# ─── Font Registration ───
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/freefont/FreeSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# Install font fallback for mixed CJK/Latin
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
_scripts = os.path.join(PDF_SKILL_DIR, 'scripts')
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)
from pdf import install_font_fallback
install_font_fallback()

# ─── Palette (from cascade generator) ───
ACCENT       = colors.HexColor('#25738d')
ACCENT_SEC   = colors.HexColor('#3da93d')
TEXT_PRIMARY  = colors.HexColor('#21201e')
TEXT_MUTED    = colors.HexColor('#84827a')
BG_PAGE       = colors.HexColor('#f2f1f0')
BG_SURFACE    = colors.HexColor('#eeedeb')
BG_STRIPE     = colors.HexColor('#efefee')
HEADER_FILL   = colors.HexColor('#625b46')
COVER_BLOCK   = colors.HexColor('#8d8057')
BORDER_COLOR  = colors.HexColor('#d2cbb6')
ICON_COLOR    = colors.HexColor('#897434')
SEM_SUCCESS   = colors.HexColor('#418e5a')
SEM_WARNING   = colors.HexColor('#9e834d')
SEM_ERROR     = colors.HexColor('#9d4f48')
SEM_INFO      = colors.HexColor('#547393')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_STRIPE

# ─── Page Setup ───
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ─── Styles ───
styles = getSampleStyleSheet()

s_title = ParagraphStyle(
    'RoadmapTitle', fontName='Microsoft YaHei', fontSize=28, leading=36,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=12,
)
s_h1 = ParagraphStyle(
    'RoadmapH1', fontName='Microsoft YaHei', fontSize=18, leading=26,
    textColor=ACCENT, spaceBefore=18, spaceAfter=10,
)
s_h2 = ParagraphStyle(
    'RoadmapH2', fontName='Microsoft YaHei', fontSize=14, leading=20,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=8,
)
s_h3 = ParagraphStyle(
    'RoadmapH3', fontName='Microsoft YaHei', fontSize=12, leading=17,
    textColor=ICON_COLOR, spaceBefore=10, spaceAfter=6,
)
s_body = ParagraphStyle(
    'RoadmapBody', fontName='SimHei', fontSize=10.5, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=6,
    wordWrap='CJK',
)
s_body_en = ParagraphStyle(
    'RoadmapBodyEN', fontName='Times New Roman', fontSize=10.5, leading=18,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=6,
)
s_muted = ParagraphStyle(
    'RoadmapMuted', fontName='SimHei', fontSize=9, leading=14,
    textColor=TEXT_MUTED, spaceAfter=4, wordWrap='CJK',
)
s_callout = ParagraphStyle(
    'RoadmapCallout', fontName='SimHei', fontSize=11, leading=18,
    textColor=ACCENT, leftIndent=18, borderPadding=6,
    spaceBefore=8, spaceAfter=8, wordWrap='CJK',
)
s_bullet = ParagraphStyle(
    'RoadmapBullet', fontName='SimHei', fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=4,
    leftIndent=24, bulletIndent=12, wordWrap='CJK',
)
s_th = ParagraphStyle(
    'TableHeader', fontName='SimHei', fontSize=10, leading=14,
    textColor=colors.white, alignment=TA_CENTER,
)
s_td = ParagraphStyle(
    'TableCell', fontName='SimHei', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
)
s_td_c = ParagraphStyle(
    'TableCellCenter', fontName='SimHei', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK',
)
s_toc_h1 = ParagraphStyle(
    'TOCH1', fontName='SimHei', fontSize=13, leading=20, leftIndent=20,
    textColor=TEXT_PRIMARY,
)
s_toc_h2 = ParagraphStyle(
    'TOCH2', fontName='SimHei', fontSize=11, leading=18, leftIndent=40,
    textColor=TEXT_MUTED,
)

# ─── Helpers ───
def heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def body(text):
    return Paragraph(text, s_body)

def bullet(text):
    return Paragraph(text, s_bullet)

def muted(text):
    return Paragraph(text, s_muted)

def callout(text):
    return Paragraph('<b>%s</b>' % text, s_callout)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR,
                       spaceBefore=6, spaceAfter=6)

def make_table(headers, rows, col_ratios=None):
    """Build a styled table with palette colors."""
    header_row = [Paragraph('<b>%s</b>' % h, s_th) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), s_td) if i == 0 else Paragraph(str(c), s_td_c) for i, c in enumerate(row)])

    if col_ratios:
        col_widths = [r * CONTENT_W for r in col_ratios]
    else:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ─── TOC Template ───
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ─── Build Document ───
OUTPUT = '/home/z/my-project/download/feuille-de-route-qms-test-en-ligne.pdf'

doc = TocDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='Feuille de Route - QMS SaaS Pro - Passage en Test en Ligne',
    author='Z.ai',
    creator='Z.ai',
)

story = []

# ═══════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════
story.append(Paragraph('<b>Feuille de Route</b>', s_title))
story.append(Paragraph('QMS SaaS Pro - Passage en Mode Test en Ligne', ParagraphStyle(
    'Subtitle', fontName='SimHei', fontSize=14, leading=20,
    textColor=TEXT_MUTED, spaceAfter=18,
)))
story.append(hr())

toc = TableOfContents()
toc.levelStyles = [s_toc_h1, s_toc_h2]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════
# SECTION 1: ETAT DES LIEUX
# ═══════════════════════════════════════════
story.append(heading('1. Etat des Lieux et Prerequis', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('1.1 Situation Actuelle du Projet', s_h2, 1))
story.append(body(
    "Le projet QMS SaaS Pro a atteint un taux de conformite de 100% par rapport au prompt de correction initial. "
    "L'application est fonctionnelle en mode demo avec un serveur Vite de developpement. Les 16 domaines de correction "
    "ont ete entierement valides : purge Next.js complete, multi-tenant RLS avec filtrage organisationId, audit trail "
    "immuable avec triggers SQL, signatures electroniques CFR Part 11 (SHA-256, re-authentification, verrouillage), "
    "workflow documents avec sequence IQ-OQ-PQ-Full, centralisation des regles metier dans 5 moteurs de compliance, "
    "RBAC refactore, mode demo avec IDataProvider, architecture DDD complete, TypeScript strict avec zero erreur, "
    "separation Supabase/composants, module Compliance conforme, et 719 tests Vitest passant."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Indicateur', 'Valeur Actuelle', 'Statut'],
    [
        ['Conformite prompt', '100%', 'Atteint'],
        ['Erreurs TypeScript', '0', 'Atteint'],
        ['Tests Vitest', '719/719', 'Atteint'],
        ['Build Vite', 'Reussi (1.2s)', 'Atteint'],
        ['Couverture DDD', '11 domaines + components/', 'Atteint'],
        ['Serveur production', 'Non configure', 'En attente'],
        ['Domaine personnalise', 'Non configure', 'En attente'],
        ['HTTPS/SSL', 'Non configure', 'En attente'],
        ['Monitoring', 'Non configure', 'En attente'],
    ],
    col_ratios=[0.35, 0.35, 0.30],
))
story.append(Spacer(1, 12))

story.append(heading('1.2 Prerequis Techniques', s_h2, 1))
story.append(body(
    "Avant d'initier le passage en mode test en ligne, il est indispensable de verifier que l'ensemble des prerequis "
    "techniques sont satisfaits. Chaque element ci-dessous constitue un bloqueur potentiel s'il n'est pas resolve "
    "prealablement. L'infrastructure cible doit supporter une application React SPA servie par un serveur HTTP "
    "statique ou un reverse proxy, avec acces a une instance Supabase pour le mode production."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Prerequis', 'Description', 'Priorite'],
    [
        ['Serveur HTTP/HTTPS', 'Nginx, Caddy ou CDN pour servir le build statique Vite', 'Critique'],
        ['Certificat SSL/TLS', 'Let\'s Encrypt ou certificat wildcard pour le domaine', 'Critique'],
        ['Nom de domaine', 'Sous-domaine dedie (ex: qms.votre-entreprise.com)', 'Critique'],
        ['Instance Supabase', 'Projet Supabase configure avec migrations SQL', 'Haute'],
        ['Variables d\'environnement', 'VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY', 'Haute'],
        ['DNS configure', 'Enregistrement A/CNAME pointant vers le serveur', 'Moyenne'],
        ['Protection CORS', 'Configuration Supabase pour le domaine autorise', 'Moyenne'],
        ['Sauvegarde base', 'Plan de backup automatise Supabase', 'Moyenne'],
    ],
    col_ratios=[0.25, 0.55, 0.20],
))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════
# SECTION 2: STRATEGIE DE DEPLOIEMENT
# ═══════════════════════════════════════════
story.append(heading('2. Strategie de Deploiement', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('2.1 Architecture Cible', s_h2, 1))
story.append(body(
    "L'architecture cible pour le mode test en ligne repose sur un deploiement statique du build Vite derriere un "
    "reverse proxy avec terminaison SSL. Cette approche offre une performance optimale (fichiers statiques servis "
    "directement), une securite renforcee (HTTPS, headers de securite), et une scalabilite naturelle via CDN. "
    "L'application communique uniquement avec Supabase via son API REST et les WebSockets pour les abonnements "
    "en temps reel, ce qui elimine la necessite d'un serveur backend dedie."
))
story.append(Spacer(1, 6))

story.append(body(
    "Le flux de requetes suit le chemin suivant : le navigateur client envoie une requete HTTPS vers le reverse "
    "proxy (Nginx/Caddy), qui sert les fichiers statiques du build Vite ou proxyfie les appels API vers Supabase. "
    "Les politiques RLS (Row Level Security) configurees dans Supabase garantissent l'isolation multi-tenant au "
    "niveau de la base de donnees. L'audit trail immuable est enforce par des triggers SQL qui interceptent "
    "toute operation INSERT/UPDATE/DELETE sur les tables metier."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Composant', 'Technologie', 'Role'],
    [
        ['Frontend', 'Vite Build (SPA statique)', 'Interface utilisateur React'],
        ['Reverse Proxy', 'Nginx ou Caddy', 'Terminaison SSL, cache, compression'],
        ['Base de donnees', 'Supabase (PostgreSQL)', 'Stockage, RLS, triggers, auth'],
        ['Authentification', 'Supabase Auth', 'JWT, MFA, sessions'],
        ['Stockage fichiers', 'Supabase Storage', 'Documents, pieces jointes'],
        ['CDN (optionnel)', 'Cloudflare / Vercel', 'Acceleration, DDoS protection'],
    ],
    col_ratios=[0.22, 0.35, 0.43],
))
story.append(Spacer(1, 12))

story.append(heading('2.2 Pipeline CI/CD', s_h2, 1))
story.append(body(
    "La mise en place d'un pipeline d'integration et de deploiement continus est essentielle pour garantir la "
    "reproductibilite des deploiements et la qualite du code en environnement de test. Le pipeline doit inclure "
    "des etapes de verification automatisees (lint, tests, build) avant chaque deploiement, ainsi qu'un mecanisme "
    "de rollback en cas d'echec. L'approche recommandee repose sur GitHub Actions ou GitLab CI pour l'orchestration, "
    "avec un deploiement par SSH/rsync vers le serveur cible."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Etape', 'Commande', 'Condition d\'arret'],
    [
        ['1. Lint', 'npx eslint src/', 'Aucune erreur'],
        ['2. Type Check', 'npx tsc --noEmit', 'Zero erreur'],
        ['3. Tests unitaires', 'npx vitest run', '719/719 passent'],
        ['4. Build production', 'npx vite build', 'Build reussi'],
        ['5. Deploiement', 'rsync -avz dist/ serveur:/var/www/qms/', 'Checksum OK'],
        ['6. Health check', 'curl -sf https://qms.example.com/health', 'HTTP 200'],
        ['7. Smoke tests', 'npx playwright test --project=smoke', 'Tous passent'],
    ],
    col_ratios=[0.20, 0.45, 0.35],
))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════
# SECTION 3: SECURISATION
# ═══════════════════════════════════════════
story.append(heading('3. Securisation pour l\'Acces Public', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('3.1 Headers de Securite HTTP', s_h2, 1))
story.append(body(
    "L'exposition d'une application QMS reglementee sur Internet impose une politique de securite stricte au niveau "
    "des headers HTTP. Ces headers protegent contre les attaques courantes (XSS, clickjacking, injection de contenu) "
    "et sont verifies lors des audits de conformite. La configuration ci-dessous est conforme aux recommandations "
    "OWASP et aux exigences FDA 21 CFR Part 11 en matiere de controle d'acces electronique."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Header', 'Valeur recommandee', 'Objectif'],
    [
        ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains', 'Forcer HTTPS'],
        ['X-Content-Type-Options', 'nosniff', 'Prevenir MIME sniffing'],
        ['X-Frame-Options', 'DENY', 'Protection clickjacking'],
        ['X-XSS-Protection', '1; mode=block', 'Filtrage XSS navigateur'],
        ['Content-Security-Policy', "default-src 'self'; script-src 'self'", 'Controle ressources'],
        ['Referrer-Policy', 'strict-origin-when-cross-origin', 'Fuite referer'],
        ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()', 'Limitation API'],
    ],
    col_ratios=[0.28, 0.40, 0.32],
))
story.append(Spacer(1, 12))

story.append(heading('3.2 Authentification et Controle d\'Acces', s_h2, 1))
story.append(body(
    "Le systeme d'authentification de QMS SaaS Pro repose sur Supabase Auth avec support JWT et MFA optionnel. "
    "Pour le mode test en ligne, il est imperatif de configurer les politiques suivantes : validation d'email "
    "obligatoire pour chaque compte, duree de session maximale de 8 heures conformement aux exigences CFR Part 11, "
    "re-authentification obligatoire pour les operations critiques (approbation, signature electronique, liberation "
    "d'enregistrement), et verrouillage automatique du compte apres 5 tentatives echouees. Le mecanisme de "
    "re-authentification est deja implemente dans le signatureEngine et le workflowEngine du projet."
))
story.append(Spacer(1, 6))

story.append(body(
    "Les permissions RBAC sont centralisees dans rbacService.ts avec les fonctions hasPermission() et "
    "requirePermission(). Le systeme definit 6 roles (viewer, operator, qa, manager, admin, superadmin) et "
    "plus de 30 permissions granulaires couvrant tous les modules. Aucune verification de role inline n'existe "
    "dans les composants, garantissant que toute autorisation transite par le moteur de permissions centralise."
))
story.append(Spacer(1, 6))

story.append(heading('3.3 Conformite Reglementaire en Ligne', s_h2, 1))
story.append(body(
    "Le deploiement en ligne d'un systeme QMS reglemente impose des contraintes supplementaires par rapport a "
    "un environnement de developpement local. Les enregistrements electroniques generes en mode en ligne doivent "
    "satisfaire aux exigences de la FDA 21 CFR Part 11 relative aux signatures electroniques et aux "
    "enregistrements electroniques. Cela implique que chaque action critique (creation, modification, approbation, "
    "rejet, suppression) soit tracee dans l'audit trail immuable avec horodatage, identite de l'utilisateur, "
    "ancienne et nouvelle valeur, et adresse IP. Les signatures electroniques doivent inclure le sens de la "
    "signature (meaning_of_signature), le hash SHA-256, et la confirmation par mot de passe."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Exigence CFR Part 11', 'Implementation QMS', 'Statut'],
    [
        ['Audit trail immuable', 'Triggers SQL + RLS blocage UPDATE/DELETE', 'Conforme'],
        ['Signature electronique', 'SHA-256 + re-auth + verrouillage', 'Conforme'],
        ['Controle d\'acces', 'RBAC centralise + RLS multi-tenant', 'Conforme'],
        ['Horodatage', 'created_at sur toutes les tables + triggers', 'Conforme'],
        ['Verification d\'identite', 'passwordConfirmation obligatoire', 'Conforme'],
        ['Enregistrements complets', 'old_values/new_values dans audit_trails', 'Conforme'],
        ['Protection des enregistrements', 'prevent_delete_func() + soft delete', 'Conforme'],
    ],
    col_ratios=[0.30, 0.45, 0.25],
))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════
# SECTION 4: DONNEES DE DEMO
# ═══════════════════════════════════════════
story.append(heading('4. Preparation des Donnees de Demonstration', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('4.1 Donnees de Demo pour Presentation', s_h2, 1))
story.append(body(
    "Le mode demo de QMS SaaS Pro est alimente par un store Zustand (demo-store.ts) avec des donnees mock "
    "realistes initialisees dans mock-data.ts. Pour une presentation en ligne convaincante, il est essentiel "
    "que ces donnees reflettent un scenario d'entreprise pharmaceutique ou medtech complet, avec des documents "
    "dans differents statuts (Draft, In Review, Approved, Obsolete), des CAPA en cours et cloturees, des "
    "non-conformites ouvertes et fermees, des audits planifies et completes, et des enregistrements de lot "
    "en production. Le DemoProvider applique desormais un filtrage par organizationId pour garantir la "
    "fidelite multi-tenant meme en mode demo."
))
story.append(Spacer(1, 6))

story.append(heading('4.2 Scenario de Demonstration Recommande', s_h2, 1))
story.append(body(
    "Le scenario de demonstration doit illustrer le cycle de vie complet d'un document reglemente, depuis sa "
    "creation jusqu'a son approbation avec signature electronique, en passant par la revue et la validation. "
    "Il doit egalement montrer la gestion d'une non-conformite et l'ouverture d'une CAPA associee, la planification "
    "d'un audit interne, le suivi de la formation du personnel, et la visualisation du tableau de bord de "
    "compliance avec le score global et les metriques detaillees. Ce scenario couvre l'ensemble des modules "
    "critiques et demontre la conformite aux normes ISO 13485 et FDA 21 CFR Part 11."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Etape', 'Module', 'Action demontree', 'Duree estimee'],
    [
        ['1', 'Dashboard', 'Vue d\'ensemble KPIs, score compliance 87%', '2 min'],
        ['2', 'Documents', 'Creation SOP-001, soumission pour revue', '3 min'],
        ['3', 'Documents', 'Approbation avec signature electronique', '2 min'],
        ['4', 'NCR', 'Declaration non-conformite NC-2024-015', '2 min'],
        ['5', 'CAPA', 'Ouverture CAPA corrective liee au NCR', '2 min'],
        ['6', 'Audit Trail', 'Consultation audit trail, export CSV', '2 min'],
        ['7', 'Compliance', 'Tableau de bord compliance, metriques', '2 min'],
        ['8', 'Batch Records', 'Enregistrement de lot, verrouillage', '2 min'],
        ['9', 'Training', 'Suivi formation, alerte retard', '1 min'],
        ['10', 'Reports', 'Rapports analytiques par module', '2 min'],
    ],
    col_ratios=[0.08, 0.17, 0.50, 0.25],
))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════
# SECTION 5: PHASES DE TEST
# ═══════════════════════════════════════════
story.append(heading('5. Phases de Test et Validation', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('5.1 Phase 1 : Test Interne (Semaine 1)', s_h2, 1))
story.append(body(
    "La premiere phase consiste en un test interne approfondi realise par l'equipe de developpement. L'objectif "
    "est de valider le fonctionnement complet de l'application dans un environnement de pre-production, de "
    "verifier que le build statique se comporte de maniere identique au mode developpement, et de tester "
    "l'integration avec Supabase en conditions reelles. Cette phase inclut la validation du multi-tenant "
    "(creation de deux organisations distinctes et verification de l'isolation des donnees), le test des "
    "signatures electroniques avec re-authentification, la verification de l'audit trail immuable, et le "
    "test du verrouillage des enregistrements apres approbation."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Test', 'Module', 'Critere d\'acceptation'],
    [
        ['Authentification', 'Auth', 'Connexion/deconnexion, MFA, session 8h'],
        ['Multi-tenant', 'RLS', 'Org A ne voit pas donnees Org B'],
        ['CRUD documents', 'Documents', 'Creer, modifier, approuver, obsolescer'],
        ['Signatures e-sig', 'Compliance', 'SHA-256, re-auth, verrouillage'],
        ['Audit trail', 'Audit', 'Immuabilite, pas de DELETE physique'],
        ['CAPA/NCR', 'Records', 'Cycle complet creation-cloture'],
        ['Batch records', 'Batch', 'Verrouillage apres release'],
        ['Export CSV', 'Compliance', 'Export audit trail complet'],
        ['RBAC', 'Securite', 'Chaque role voit uniquement ses modules'],
        ['Performance', 'Global', 'Chargement page < 3s sur 4G'],
    ],
    col_ratios=[0.22, 0.18, 0.60],
))
story.append(Spacer(1, 12))

story.append(heading('5.2 Phase 2 : Test d\'Acceptation Utilisateur (Semaine 2)', s_h2, 1))
story.append(body(
    "La deuxieme phase implique des utilisateurs metier reels (equipe QA, responsables qualite, auditeurs internes) "
    "dans un environnement de staging isole. L'objectif est de valider que l'application repond aux besoins "
    "operationnels et reglementaires des utilisateurs finaux. Cette phase doit reproduire des scenarios de travail "
    "reels : gestion d'un SOP depuis sa creation jusqu'a son approbation, traitement d'une non-conformite "
    "avec ouverture de CAPA, planification et execution d'un audit interne, et verification de la conformite "
    "des enregistrements de lot. Les retours utilisateurs sont documentes et classes par priorite (bloquant, "
    "majeur, mineur, suggestion) avant correction."
))
story.append(Spacer(1, 6))

story.append(heading('5.3 Phase 3 : Recette Reglementaire (Semaine 3)', s_h2, 1))
story.append(body(
    "La troisieme phase est la recette reglementaire, qui verifie formellement que le systeme est conforme aux "
    "exigences ISO 13485 et FDA 21 CFR Part 11. Cette phase est realisee par l'equipe qualite assistee d'un "
    "consultant reglementaire si necessaire. Elle inclut la verification formelle de chaque exigence reglementaire "
    "identifiee dans le prompt de correction original, la validation des enregistrements electroniques et des "
    "signatures electroniques conformement au CFR Part 11, la revue de l'audit trail pour garantir la tracabilite "
    "complete, et la validation du controle d'acces et de la separation des responsabilites. A l'issue de cette "
    "phase, un rapport de qualification (IQ/OQ/PQ) est produit pour documenter la conformite du systeme."
))
story.append(Spacer(1, 6))

# ═══════════════════════════════════════════
# SECTION 6: MONITORING
# ═══════════════════════════════════════════
story.append(heading('6. Monitoring et Observabilite', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('6.1 Metriques Cles a Surveiller', s_h2, 1))
story.append(body(
    "Le suivi en temps reel de l'application en mode test en ligne est crucial pour detecter rapidement les "
    "anomalies et garantir la disponibilite du service. Les metriques suivantes doivent etre surveillees en "
    "permanence via un tableau de bord de monitoring (Grafana, Datadog, ou solution equivalente). Chaque "
    "metrique dispose d'un seuil d'alerte au-dela duquel une notification est envoyee a l'equipe technique."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Metrique', 'Seuil normal', 'Seuil d\'alerte', 'Action'],
    [
        ['Temps de reponse (P95)', '< 500ms', '> 2s', 'Investigation performance'],
        ['Taux d\'erreur HTTP', '< 0.1%', '> 1%', 'Verification logs'],
        ['Disponibilite', '> 99.9%', '< 99.5%', 'Failover / restart'],
        ['Sessions actives', '< 50', '> 100', 'Scale infrastructure'],
        ['Taille audit_trails', '< 1 Go', '> 5 Go', 'Archivage / partition'],
        ['Tentatives auth echouees', '< 10/jour', '> 50/jour', 'Alerte securite'],
        ['Latence Supabase', '< 200ms', '> 1s', 'Verification connexion'],
    ],
    col_ratios=[0.25, 0.18, 0.18, 0.39],
))
story.append(Spacer(1, 12))

story.append(heading('6.2 Journalisation et Audit', s_h2, 1))
story.append(body(
    "L'audit trail de QMS SaaS Pro est deja implemente avec des triggers SQL qui capturent automatiquement "
    "chaque operation sur les tables metier. En mode en ligne, il est recommande d'ajouter une couche de "
    "journalisation applicative qui complete l'audit trail base de donnees. Cette journalisation doit inclure "
    "les acces aux pages (qui a consulte quel module et quand), les erreurs applicatives avec stack trace, "
    "les tentatives d'acces non autorisees, et les operations de signature electronique avec horodatage "
    "et adresse IP. Les logs doivent etre conserves pendant une duree minimale de 5 ans conformement aux "
    "exigences reglementaires, et exportables au format CSV pour les audits externes."
))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════
# SECTION 7: PLAN DE ROLLBACK
# ═══════════════════════════════════════════
story.append(heading('7. Plan de Rollback et Gestion des Incidents', s_h1, 0))
story.append(Spacer(1, 6))

story.append(heading('7.1 Strategie de Rollback', s_h2, 1))
story.append(body(
    "Chaque deploiement en environnement de test en ligne doit etre reversible. La strategie de rollback repose "
    "sur trois niveaux de granularite : le rollback applicatif (retour a la version precedente du build statique), "
    "le rollback base de donnees (restauration du snapshot Supabase pre-deploiement), et le rollback complet "
    "(retour a l'etat anterieur du systeme entier). Chaque deploiement doit etre precede d'un snapshot de la "
    "base de donnees et d'une archive du build precedent. La procedure de rollback doit etre testee au moins "
    "une fois avant la mise en production effective."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Niveau', 'Declencheur', 'Procedure', 'Duree estimee'],
    [
        ['Applicatif', 'Bug fonctionnel majeur', 'rsync build precedent + restart', '< 5 min'],
        ['Base de donnees', 'Corruption / perte de donnees', 'Restauration snapshot Supabase', '15-30 min'],
        ['Complet', 'Incident de securite', 'Rollback app + DB + rotation cles', '30-60 min'],
    ],
    col_ratios=[0.15, 0.28, 0.37, 0.20],
))
story.append(Spacer(1, 12))

story.append(heading('7.2 Gestion des Incidents', s_h2, 1))
story.append(body(
    "Tout incident survenu en mode test en ligne doit etre documente dans le systeme de gestion des incidents "
    "de QMS SaaS Pro (module NCR/Deviations). La classification suit les niveaux de severite suivants : "
    "critique (service indisponible ou donnees corrompues, resolution en moins de 4 heures), majeur "
    "(fonctionnalite degradée mais service partiellement disponible, resolution en moins de 24 heures), "
    "et mineur (anomalie cosmetique ou fonctionnalite secondaire, resolution dans le sprint suivant). "
    "Chaque incident fait l'objet d'une analyse de cause racine et d'une CAPA si necessaire, conformement "
    "aux exigences ISO 13485."
))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════
# SECTION 8: CALENDRIER
# ═══════════════════════════════════════════
story.append(heading('8. Calendrier de Deploiement', s_h1, 0))
story.append(Spacer(1, 6))

story.append(body(
    "Le calendrier ci-dessous presente le plan de deploiement phase par phase sur une periode de 4 semaines. "
    "Chaque phase inclut des jalons de validation qui doivent etre atteints avant de passer a la phase suivante. "
    "Le calendrier suppose que les prerequis techniques (serveur, domaine, SSL, Supabase) sont deja en place. "
    "Si ce n'est pas le cas, une semaine supplementaire doit etre prevue pour la mise en place de l'infrastructure."
))
story.append(Spacer(1, 6))

story.append(make_table(
    ['Semaine', 'Phase', 'Activites Principales', 'Jalon'],
    [
        ['S1 (J1-J5)', 'Preparation', 'Config serveur, SSL, DNS, build production, deploiement initial', 'App accessible en HTTPS'],
        ['S1 (J5)', 'Smoke Test', 'Verification scenario critique end-to-end', '0 bloquant'],
        ['S2 (J6-J10)', 'Test Interne', 'Tests systematiques tous modules, corrections', 'Tests internes OK'],
        ['S2 (J10)', 'Recette Interne', 'Validation equipe dev + QA interne', 'Go/No-Go UAT'],
        ['S3 (J11-J15)', 'UAT', 'Tests utilisateurs metier, retours documentes', 'UAT sign-off'],
        ['S3 (J15)', 'Correction UAT', 'Resolution retours majeurs et bloquants', 'Tous bloquants resolus'],
        ['S4 (J16-J19)', 'Recette Reglementaire', 'Validation conforme ISO 13485 / CFR Part 11', 'Rapport qualification'],
        ['S4 (J20)', 'Go Production', 'Ouverture acces aux utilisateurs finaux', 'Service en production'],
    ],
    col_ratios=[0.13, 0.17, 0.45, 0.25],
))
story.append(Spacer(1, 18))

# ═══════════════════════════════════════════
# SECTION 9: CHECKLIST
# ═══════════════════════════════════════════
story.append(heading('9. Checklist Pre-Deploiement', s_h1, 0))
story.append(Spacer(1, 6))

story.append(body(
    "La checklist ci-dessous recapitule l'ensemble des actions a realiser avant le deploiement en mode test en "
    "ligne. Chaque item doit etre verifie et valide par le responsable technique. Cette checklist constitue le "
    "document de reference pour le jalon Go/No-Go de passage en test en ligne."
))
story.append(Spacer(1, 6))

checklist_items = [
    ('Infrastructure', [
        'Serveur HTTP/HTTPS configure et teste',
        'Certificat SSL/TLS installe et valide',
        'Nom de domaine configure avec DNS',
        'Reverse proxy (Nginx/Caddy) configure avec headers de securite',
        'Variables d\'environnement production definies',
    ]),
    ('Application', [
        'Build production Vite genere sans erreur',
        'Tests Vitest 719/719 passent',
        'TypeScript tsc --noEmit 0 erreur',
        'Mode demo fonctionnel sans backend',
        'Mode production fonctionnel avec Supabase',
    ]),
    ('Securite', [
        'Headers de securite HTTP verifies',
        'CORS Supabase configure pour le domaine',
        'Politiques RLS activees sur toutes les tables',
        'Authentification Supabase configuree (email + MFA)',
        'Audit trail immuable verifie (pas de DELETE physique)',
    ]),
    ('Donnees', [
        'Migrations SQL executees sur Supabase production',
        'Donnees de demo chargees et verifiees',
        'Filtrage multi-tenant DemoProvider valide',
        'Backup initial base de donnees realise',
        'Plan de restauration teste',
    ]),
    ('Monitoring', [
        'Tableau de bord monitoring operationnel',
        'Alertes configurees (seuils definis)',
        'Journalisation applicative activee',
        'Procedure de rollback documentee et testee',
        'Contact technique d\'astreinte identifie',
    ]),
]

for category, items in checklist_items:
    story.append(Paragraph('<b>%s</b>' % category, s_h3))
    for item in items:
        story.append(Paragraph(item, s_bullet, bulletText='\u2022'))
    story.append(Spacer(1, 6))

story.append(Spacer(1, 12))
story.append(hr())
story.append(Spacer(1, 6))
story.append(muted('Document genere par Z.ai - QMS SaaS Pro - Feuille de Route Test en Ligne'))

# ─── Build ───
doc.multiBuild(story)
print(f"PDF generated: {OUTPUT}")
