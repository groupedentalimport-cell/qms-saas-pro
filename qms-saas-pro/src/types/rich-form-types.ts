/**
 * rich-form-types.ts
 * ──────────────────
 * Extension du systeme FormTemplate existant.
 * Ajoute : sections, logique conditionnelle, 17 types de champs, reference normative.
 *
 * Retrocompatible avec FormFieldDefinition existant (extends).
 */

// ── Types de champs enrichis ─────────────────────────────────────────────────

export type RichFieldType =
  // Types existants (conserves)
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'signature'
  | 'table'
  // Nouveaux types
  | 'rich_text'        // Editeur formate (listes, gras, italique)
  | 'user_select'      // Selection d'un utilisateur de l'organisation
  | 'multi_select'     // Selection multiple avec chips
  | 'file'             // Piece jointe (preuve objective 4.2.4)
  | 'rating'           // Echelle 1-5 ou 1-10 (probabilite, impact, severite)
  | 'repeater'         // Lignes repetables (5 Pourquois, plan d'actions, findings)
  | 'section_header'   // Separateur visuel sans valeur
  | 'yes_no_na'        // Radio Yes / No / N/A avec justification conditionnelle
  | 'date_range'       // Date debut + date fin
  | 'calculated';      // Valeur calculee automatiquement (ex. RPN = P x I x D)

// ── Logique conditionnelle ────────────────────────────────────────────────────

export interface FieldCondition {
  /** ID du champ declencheur */
  fieldId: string;
  /** Operateur de comparaison */
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_filled';
  /** Valeur de reference */
  value?: unknown;
}

// ── Colonnes pour le type 'repeater' ─────────────────────────────────────────

export interface RepeaterColumn {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'user_select' | 'checkbox';
  required?: boolean;
  options?: string[];
  width?: 'sm' | 'md' | 'lg';
}

// ── Calcul automatique pour le type 'calculated' ─────────────────────────────

export interface CalculationRule {
  /** IDs des champs sources */
  sourceFields: string[];
  /** Type de calcul */
  formula: 'multiply' | 'sum' | 'average' | 'custom';
  /** Expression custom (ex. "probability * impact * detectability") */
  expression?: string;
}

// ── Definition d'un champ enrichi ────────────────────────────────────────────

export interface RichFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: RichFieldType;

  /** Champ obligatoire avant soumission */
  required?: boolean;
  /** Champ obligatoire avant CLOTURE (4.2.4) */
  requiredForClosure?: boolean;

  placeholder?: string;
  helpText?: string;        // Texte d'aide contextuel affiche sous le champ
  defaultValue?: unknown;

  // Options pour select / multi_select / yes_no_na
  options?: string[];

  // Validation
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
  };

  // Affichage conditionnel -- le champ n'apparait que si la condition est vraie
  showIf?: FieldCondition;

  // Pour type='repeater'
  columns?: RepeaterColumn[];
  minRows?: number;
  maxRows?: number;

  // Pour type='rating'
  ratingMin?: number;
  ratingMax?: number;
  ratingLabels?: string[]; // ex. ['Tres improbable', ..., 'Quasi-certain']

  // Pour type='calculated'
  calculation?: CalculationRule;

  // Pour type='file'
  acceptedFormats?: string[]; // ex. ['.pdf', '.jpg', '.png']
  maxFileSizeMB?: number;

  // Reference normative -- affiche comme badge a cote du champ
  normClause?: string; // ex. 'ISO 13485 8.5.2(b)'

  // Champ en lecture seule (calcule ou copie depuis l'enregistrement parent)
  readOnly?: boolean;
}

// ── Section d'un formulaire ───────────────────────────────────────────────────

export interface RichFormSection {
  id: string;
  title: string;
  description?: string;

  /** Clause ISO de reference pour cette section entiere */
  normClause?: string;

  /** La section entiere doit etre completee avant cloture */
  requiredForClosure?: boolean;

  /** Ordre d'affichage */
  order: number;

  /** La section est-elle pliable dans l'UI */
  collapsible?: boolean;
  defaultCollapsed?: boolean;

  fields: RichFieldDefinition[];
}

// ── Cible d'un template ───────────────────────────────────────────────────────

export type RecordTemplateTarget =
  | 'CAPA' | 'NCR' | 'Audit' | 'Training'
  | 'Risk' | 'Deviation' | 'ChangeControl' | 'BatchRecord'
  | 'Supplier' | 'Documents';

// ── Template de formulaire enrichi ─────────────────────────────────────────

export interface RichFormTemplate {
  id: string;

  /** Lien vers le document Document Control approuve (4.2.3) */
  documentId: string;

  title: string;
  version: string;
  isActive: boolean;

  /** Module enregistrement cible */
  recordTarget: RecordTemplateTarget;

  /** Norme de reference principale */
  normReference: string;

  /** Retention des instances creees */
  retentionYears: number;

  /** IDs des champs obligatoires avant cloture (4.2.4) */
  closureRequiredFields: string[];

  /** Sections ordonnees */
  sections: RichFormSection[];

  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Instance enrichie ─────────────────────────────────────────────────────────

export interface RichFormInstance {
  id: string;
  templateId: string;
  templateVersion: string;          // snapshot fige a la creation
  referenceNumber: string;

  /** Valeurs saisies -- cle = fieldDefinition.id */
  values: Record<string, unknown>;

  /** Sections completees (pour la progress bar) */
  completedSections: string[];

  status: 'Draft' | 'In Review' | 'Approved' | 'Rejected';

  // QmsRecord fields (4.2.4)
  isLocked: boolean;
  lockedAt?: string | null;
  lockedById?: string | null;
  retentionYears: number;
  retentionExpiresAt?: string | null;

  signatureHash?: string;
  submittedById?: string;
  submittedAt?: string;

  parentRecordId?: string;     // ex. ID de la CAPA parente
  parentRecordType?: string;   // ex. 'CAPA'

  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}
