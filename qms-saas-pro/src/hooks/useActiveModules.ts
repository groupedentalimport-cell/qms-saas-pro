// useActiveModules.ts — Hook pour les modules actifs
// Fournit un accès simplifié aux modules actifs de l'organisation
// et des utilitaires de vérification de visibilité

import { useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { CORE_MODULES } from '@/types/qms';

// Modules principaux toujours visibles
const ALWAYS_VISIBLE_MODULES = [
  'documents', 'capa', 'ncr', 'audits', 'training', 'reports', 'compliance',
  'dashboard', 'user-management',
];

// Modules optionnels qui nécessitent activation
const OPTIONAL_MODULE_IDS = [
  'risks', 'hierarchy', 'batch_records', 'suppliers', 'forms',
  'change_control', 'deviations', 'oos_oot',
];

/**
 * Hook principal pour les modules actifs.
 */
export function useActiveModules() {
  const { orgSettings } = useOrganization();
  const activeModules = orgSettings?.active_modules || [];

  /**
   * Vérifie si un module est visible.
   * Les modules principaux sont toujours visibles.
   * Les modules optionnels nécessitent d'être dans active_modules.
   */
  const isModuleVisible = (moduleId: string | undefined): boolean => {
    if (!moduleId) return true;
    if (ALWAYS_VISIBLE_MODULES.includes(moduleId)) return true;
    if (moduleId === 'documents') return true; // documents inclut la hiérarchie
    return activeModules.includes(moduleId);
  };

  /**
   * Retourne la liste des modules optionnels actifs.
   */
  const activeOptionalModules = useMemo(() => {
    return OPTIONAL_MODULE_IDS.filter(id => activeModules.includes(id));
  }, [activeModules]);

  /**
   * Retourne la liste des modules optionnels inactifs.
   */
  const inactiveOptionalModules = useMemo(() => {
    return OPTIONAL_MODULE_IDS.filter(id => !activeModules.includes(id));
  }, [activeModules]);

  /**
   * Retourne le nombre total de modules actifs.
   */
  const activeModuleCount = useMemo(() => {
    return CORE_MODULES.length + activeOptionalModules.length;
  }, [activeOptionalModules]);

  /**
   * Vérifie si tous les modules optionnels sont actifs.
   */
  const allModulesActive = useMemo(() => {
    return OPTIONAL_MODULE_IDS.every(id => activeModules.includes(id));
  }, [activeModules]);

  return {
    activeModules,
    isModuleVisible,
    activeOptionalModules,
    inactiveOptionalModules,
    activeModuleCount,
    allModulesActive,
    coreModules: CORE_MODULES,
    optionalModuleIds: OPTIONAL_MODULE_IDS,
  };
}
