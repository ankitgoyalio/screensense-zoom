import {
  EXCEPTION_RULES_TEXT,
  EXACT_RULES_TEXT,
  WILDCARD_RULES_TEXT
} from "./public-suffix-data.js";

const exactRules = new Set(EXACT_RULES_TEXT.split("\n").filter(Boolean));
const wildcardRules = new Set(WILDCARD_RULES_TEXT.split("\n").filter(Boolean));
const exceptionRules = new Set(EXCEPTION_RULES_TEXT.split("\n").filter(Boolean));

function getNormalizedLabels(hostname: string): string[] {
  return hostname
    .toLowerCase()
    .split(".")
    .filter(Boolean);
}

export function getPublicSuffix(hostname: string): string {
  const labels = getNormalizedLabels(hostname);

  if (labels.length === 0) {
    return "";
  }

  let bestStartIndex = labels.length - 1;
  let bestRuleLength = 1;

  for (let index = 0; index < labels.length; index += 1) {
    const candidate = labels.slice(index).join(".");

    if (exceptionRules.has(candidate)) {
      return labels.slice(index + 1).join(".");
    }

    const exactRuleLength = labels.length - index;

    if (exactRules.has(candidate) && exactRuleLength > bestRuleLength) {
      bestStartIndex = index;
      bestRuleLength = exactRuleLength;
    }

    if (index > 0 && wildcardRules.has(candidate) && exactRuleLength + 1 > bestRuleLength) {
      bestStartIndex = index - 1;
      bestRuleLength = exactRuleLength + 1;
    }
  }

  return labels.slice(bestStartIndex).join(".");
}

export function getRegistrableDomain(hostname: string): string {
  const labels = getNormalizedLabels(hostname);

  if (labels.length <= 1) {
    return labels.join(".");
  }

  const publicSuffix = getPublicSuffix(hostname);
  const publicSuffixLabels = getNormalizedLabels(publicSuffix);

  if (labels.length <= publicSuffixLabels.length) {
    return labels.join(".");
  }

  return labels.slice(-(publicSuffixLabels.length + 1)).join(".");
}
