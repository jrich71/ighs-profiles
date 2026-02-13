import { opportunities, focusTaxonomy } from "./opportunities.js";

const form = document.getElementById("profileForm");
const resetBtn = document.getElementById("resetBtn");
const cvFileInput = document.getElementById("cvFile");
const cvTextArea = document.getElementById("cvText");
const autoApplyCvSuggestions = document.getElementById("autoApplyCvSuggestions");
const applyCvSuggestionsBtn = document.getElementById("applyCvSuggestionsBtn");
const cvSuggestionsMeta = document.getElementById("cvSuggestionsMeta");
const statusMessage = document.getElementById("statusMessage");
const resultsList = document.getElementById("resultsList");
const resultsMeta = document.getElementById("resultsMeta");
const filtersWrap = document.getElementById("filters");
const cardTemplate = document.getElementById("cardTemplate");
const feedStatus = document.getElementById("feedStatus");
const scrollSentinel = document.getElementById("scrollSentinel");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const collabPanel = document.getElementById("collabPanel");
const collabContext = document.getElementById("collabContext");
const closeCollabPanelBtn = document.getElementById("closeCollabPanelBtn");
const ucsfProfileIdsInput = document.getElementById("ucsfProfileIds");
const runCollabMatchBtn = document.getElementById("runCollabMatchBtn");
const collabStatus = document.getElementById("collabStatus");
const collabResults = document.getElementById("collabResults");

const textFilter = document.getElementById("textFilter");
const topicFilter = document.getElementById("topicFilter");
const sponsorFilter = document.getElementById("sponsorFilter");
const deadlineFilter = document.getElementById("deadlineFilter");
const minAwardFilter = document.getElementById("minAwardFilter");
const sortBy = document.getElementById("sortBy");
const dueDateDisplay = document.getElementById("dueDateDisplay");

const improvementLabels = {
  careerStage: document.getElementById("labelCareerStage"),
  institutionType: document.getElementById("labelInstitutionType"),
  region: document.getElementById("labelRegion"),
  focusAreas: document.getElementById("labelFocusAreas"),
  methods: document.getElementById("labelMethods"),
  populations: document.getElementById("labelPopulations"),
  budgetNeed: document.getElementById("labelBudgetNeed"),
  sponsorPrefs: document.getElementById("labelSponsorPrefs")
};

const RESULT_BATCH_SIZE = 20;
const TOP_COLLABORATOR_COUNT = 3;
const DEFAULT_UCSF_PROFILE_IDS = [
  "dilys.walker",
  "elizabeth.fair",
  "felicia.chow",
  "greta.davis",
  "jenny.x.liu",
  "kimberly.baltzell",
  "michael.potter",
  "michael.j.reid",
  "miranda.rouse",
  "paul.wesson",
  "payam.nahid",
  "susie.welty",
  "kirsten.bibbins-domingo",
  "alice.pressman",
  "alicia.fernandez",
  "alison.huang",
  "diane.havlir",
  "george.rutherford",
  "margot.kushel",
  "dean.schillinger"
];
const UCSF_API_MIN_INTERVAL_MS = 1000;
let baseMatchedResults = [];
let activeFilteredResults = [];
let renderedCount = 0;
let sentinelObserver = null;
let selectedOpportunityId = null;
let selectedOpportunityData = null;
let collabRequestToken = 0;
let lastUcsfApiRequestAt = 0;
const ucsfProfileCache = new Map();

const careerStagePatterns = {
  early: [
    "assistant professor",
    "postdoctoral",
    "postdoc",
    "fellow",
    "resident",
    "instructor",
    "phd candidate",
    "early career"
  ],
  mid: ["associate professor", "mid career", "co-investigator", "co principal investigator"],
  senior: ["professor", "chair", "director", "senior investigator", "principal investigator"],
  consortium: ["consortium", "multi-country", "multi institution", "coordinating center", "program lead"]
};

const institutionTypePatterns = {
  academic: ["university", "school of medicine", "academic", "college", "campus"],
  ngo: ["ngo", "nonprofit", "non-profit", "charity", "foundation", "civil society"],
  public: ["department of health", "ministry of health", "public health agency", "cdc", "government"],
  hospital: ["hospital", "medical center", "health system", "clinic", "clinical service"],
  startup: ["startup", "start-up", "inc.", "llc", "company", "biotech"]
};

const regionPatterns = {
  africa: ["sub-saharan africa", "africa", "kenya", "nigeria", "ghana", "uganda", "ethiopia"],
  asia: ["asia", "asia-pacific", "india", "bangladesh", "vietnam", "philippines", "indonesia", "china"],
  latam: [
    "latin america",
    "latam",
    "caribbean",
    "mexico",
    "peru",
    "brazil",
    "colombia",
    "argentina"
  ],
  us: ["united states", "u.s.", "usa", "california", "new york", "texas", "florida"],
  europe: ["europe", "uk", "united kingdom", "france", "germany", "spain", "italy", "netherlands"],
  global: ["global", "international", "multi-country", "worldwide"]
};

const focusSuggestionPatterns = [
  { term: "communicable disease", patterns: ["hiv", "tb", "malaria", "infectious", "pathogen", "outbreak"] },
  {
    term: "non-communicable disease",
    patterns: ["ncd", "diabetes", "hypertension", "cardiovascular", "cancer", "obesity"]
  },
  { term: "maternal and child health", patterns: ["maternal", "newborn", "child health", "pediatric", "antenatal"] },
  { term: "health systems", patterns: ["health system", "primary care", "service delivery", "system strengthening"] },
  { term: "digital health", patterns: ["digital health", "machine learning", "ai", "telehealth", "informatics"] },
  { term: "climate and health", patterns: ["climate", "heat", "air pollution", "environmental health"] },
  { term: "mental health", patterns: ["mental health", "depression", "anxiety", "substance use"] },
  { term: "health equity", patterns: ["health equity", "disparities", "underserved", "marginalized"] },
  { term: "nutrition", patterns: ["nutrition", "food systems", "malnutrition", "micronutrient"] },
  { term: "surveillance", patterns: ["surveillance", "monitoring", "genomic", "sequencing"] },
  { term: "policy and prevention", patterns: ["policy", "prevention", "guideline", "regulation"] }
];

const methodSuggestionPatterns = [
  "implementation science",
  "epidemiology",
  "program evaluation",
  "policy evaluation",
  "randomized trials",
  "community-based research",
  "machine learning",
  "predictive modeling",
  "telehealth",
  "genomic surveillance",
  "mixed methods",
  "quality improvement"
];

const populationSuggestionPatterns = [
  "adolescents",
  "women",
  "children",
  "rural populations",
  "migrant populations",
  "underserved communities",
  "urban populations",
  "indigenous communities",
  "community health workers",
  "border communities"
];

const populationRecommendationRules = [
  { label: "children", patterns: ["children", "child ", "pediatric", "paediatric", "newborn", "infant"] },
  { label: "adolescents", patterns: ["adolescent", "teen", "youth"] },
  { label: "women", patterns: ["women", "woman", "maternal", "pregnant", "postpartum"] },
  { label: "older adults", patterns: ["older adult", "elderly", "geriatric", "aging"] },
  { label: "rural populations", patterns: ["rural", "remote communities"] },
  { label: "urban populations", patterns: ["urban", "inner-city"] },
  { label: "migrant populations", patterns: ["migrant", "immigrant", "refugee", "displaced"] },
  { label: "indigenous communities", patterns: ["indigenous", "tribal communities", "native communities"] },
  { label: "community health workers", patterns: ["community health worker", "chw"] },
  { label: "underserved communities", patterns: ["underserved", "marginalized", "health disparities", "equity"] },
  { label: "people living with HIV", patterns: ["hiv", "aids"] },
  { label: "people with tuberculosis", patterns: ["tuberculosis", " tb ", "tb "] },
  { label: "people who inject drugs", patterns: ["people who inject drugs", "pwid", "inject drugs"] },
  { label: "men who have sex with men", patterns: ["men who have sex with men", " msm "] },
  { label: "incarcerated populations", patterns: ["incarcerated", "prison", "jail", "detention"] }
];

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "that",
  "this",
  "have",
  "has",
  "are",
  "was",
  "were",
  "you",
  "your",
  "our",
  "their",
  "work",
  "global",
  "health",
  "project",
  "research",
  "program"
]);

const conceptMap = [
  { canonical: "communicable disease", aliases: ["infectious", "outbreak", "pathogen", "hiv", "tb", "malaria"] },
  { canonical: "non-communicable disease", aliases: ["ncd", "diabetes", "hypertension", "cancer", "cardiovascular"] },
  { canonical: "maternal and child health", aliases: ["maternal", "newborn", "child", "antenatal", "pediatric"] },
  { canonical: "mental health", aliases: ["depression", "anxiety", "substance", "psychosocial"] },
  { canonical: "digital health", aliases: ["ai", "machine learning", "telehealth", "informatics", "digital"] },
  { canonical: "climate and health", aliases: ["climate", "heat", "air pollution", "planetary"] },
  { canonical: "surveillance", aliases: ["monitoring", "field epidemiology", "genomic", "sequencing"] },
  { canonical: "implementation science", aliases: ["scale", "uptake", "quality improvement", "implementation"] },
  { canonical: "health systems", aliases: ["primary care", "service delivery", "system strengthening"] },
  { canonical: "health equity", aliases: ["equity", "underserved", "marginalized", "justice"] }
];

const defaultStatus = "Fill out profile details and required CV text, then generate your ranked funding matches.";
statusMessage.textContent = defaultStatus;

if (globalThis.pdfjsLib?.GlobalWorkerOptions) {
  globalThis.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.js";
}

initTopicFilter();
bindEvents();
initInfiniteScroll();
initializeCollaboratorPanel();

function bindEvents() {
  form.addEventListener("submit", onGenerateMatches);
  resetBtn.addEventListener("click", onReset);
  cvFileInput.addEventListener("change", onCvUpload);
  cvTextArea.addEventListener("input", onCvTextEdited);
  applyCvSuggestionsBtn.addEventListener("click", onApplyCvSuggestionsClick);
  autoApplyCvSuggestions.addEventListener("change", onCvSuggestionModeChange);
  loadMoreBtn.addEventListener("click", renderNextBatch);
  runCollabMatchBtn.addEventListener("click", runCollaboratorMatch);
  closeCollabPanelBtn.addEventListener("click", closeCollaboratorPanel);
  resultsList.addEventListener("click", onResultsListClick);
  document.addEventListener("click", onDocumentClick);

  const liveInputFilters = [textFilter, minAwardFilter];
  const liveSelectFilters = [topicFilter, sponsorFilter, deadlineFilter, sortBy, dueDateDisplay];

  liveInputFilters.forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("keyup", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  liveSelectFilters.forEach((el) => {
    el.addEventListener("change", applyFilters);
    el.addEventListener("input", applyFilters);
    el.addEventListener("click", applyFilters);
  });

  form.addEventListener("input", markImprovementLabels);
  form.addEventListener("change", markImprovementLabels);
}

function onResultsListClick(event) {
  const collabButton = event.target.closest(".match-collaborators-btn");
  if (collabButton) {
    handleCollaboratorButtonClick(collabButton, event);
    return;
  }

  const scorePill = event.target.closest(".score-pill");
  if (!scorePill) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const container = scorePill.closest(".score-wrap");
  const isOpen = container.classList.contains("open");
  closeScoreTooltips();

  if (!isOpen) {
    container.classList.add("open");
  }
}

function handleCollaboratorButtonClick(collabButton, event = null) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const card = collabButton.closest(".result-card");
  const resultIndex = Number.parseInt(
    collabButton.dataset.resultIndex || card?.dataset.resultIndex || "",
    10
  );

  let selectedOpportunity =
    Number.isInteger(resultIndex) && resultIndex >= 0 ? activeFilteredResults[resultIndex] : null;

  if (!selectedOpportunity) {
    const fallbackId = collabButton.dataset.opportunityId || card?.dataset.opportunityId || "";
    selectedOpportunity = getOpportunityById(fallbackId);
  }

  collabPanel.classList.remove("hidden");
  if (!selectedOpportunity) {
    collabContext.textContent = "Select an opportunity to evaluate UCSF collaborators.";
    collabStatus.textContent = "Could not resolve the clicked opportunity. Regenerate matches and try again.";
    collabResults.innerHTML = "";
    return;
  }

  collabContext.textContent = `Selected opportunity: ${selectedOpportunity.title}`;
  collabStatus.textContent = `Preparing collaborator match for: ${selectedOpportunity.title}`;
  collabResults.innerHTML = "";
  selectOpportunityForCollaborators(selectedOpportunity, selectedOpportunity.title);
}

function onDocumentClick(event) {
  if (!event.target.closest(".score-wrap")) {
    closeScoreTooltips();
  }
}

function closeScoreTooltips() {
  resultsList.querySelectorAll(".score-wrap.open").forEach((item) => {
    item.classList.remove("open");
  });
}

function initializeCollaboratorPanel() {
  ucsfProfileIdsInput.value = DEFAULT_UCSF_PROFILE_IDS.join(", ");
  preloadSeededUcsfProfiles();
  cvSuggestionsMeta.textContent = "CV suggestions will auto-apply to empty intake fields.";
  markImprovementLabels();
}

function closeCollaboratorPanel() {
  clearCollaboratorSelection();
}

function onCvSuggestionModeChange() {
  if (autoApplyCvSuggestions.checked) {
    cvSuggestionsMeta.textContent = "Auto-apply is enabled for CV suggestions.";
    if (cvTextArea.value.trim()) {
      const applied = autofillProfileFromCvText(cvTextArea.value, { applyChanges: true });
      if (applied.length > 0) {
        cvSuggestionsMeta.textContent = `Auto-applied: ${applied.join(", ")}.`;
      }
    }
    return;
  }

  if (!cvTextArea.value.trim()) {
    cvSuggestionsMeta.textContent = "Auto-apply is off. Upload or paste CV text to preview suggestions.";
    return;
  }

  const preview = autofillProfileFromCvText(cvTextArea.value, { applyChanges: false });
  cvSuggestionsMeta.textContent =
    preview.length > 0
      ? `Suggestions ready: ${preview.join(", ")}. Click "Apply CV Suggestions" to use them.`
      : "No additional CV suggestions found for currently empty fields.";
}

function onCvTextEdited() {
  if (!cvTextArea.value.trim()) {
    cvSuggestionsMeta.textContent = autoApplyCvSuggestions.checked
      ? "CV suggestions will auto-apply to empty intake fields."
      : "Auto-apply is off. Upload or paste CV text to preview suggestions.";
    return;
  }

  if (autoApplyCvSuggestions.checked) {
    cvSuggestionsMeta.textContent = "Auto-apply is enabled. Suggestions will be applied when you upload or generate.";
    return;
  }

  const preview = autofillProfileFromCvText(cvTextArea.value, { applyChanges: false });
  cvSuggestionsMeta.textContent =
    preview.length > 0
      ? `Suggestions ready: ${preview.join(", ")}. Click "Apply CV Suggestions" to use them.`
      : "No additional CV suggestions found for currently empty fields.";
}

function onApplyCvSuggestionsClick() {
  if (!cvTextArea.value.trim()) {
    cvSuggestionsMeta.textContent = "Paste or upload CV text first to generate suggestions.";
    return;
  }

  const applied = autofillProfileFromCvText(cvTextArea.value, { applyChanges: true });
  cvSuggestionsMeta.textContent =
    applied.length > 0
      ? `Applied CV suggestions: ${applied.join(", ")}.`
      : "No new CV suggestions were applied (fields may already be filled).";
}

function clearCollaboratorSelection() {
  collabRequestToken += 1;
  selectedOpportunityId = null;
  selectedOpportunityData = null;
  collabPanel.classList.add("hidden");
  collabContext.textContent = "Select an opportunity to evaluate UCSF collaborators.";
  collabStatus.textContent = "";
  collabResults.innerHTML = "";
  clearSelectedOpportunityStyles();
}

function initInfiniteScroll() {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  sentinelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          renderNextBatch();
        }
      });
    },
    { root: null, threshold: 0.2 }
  );

  sentinelObserver.observe(scrollSentinel);
}

function initTopicFilter() {
  focusTaxonomy.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = toTitleCase(topic);
    topicFilter.append(option);
  });
}

async function onCvUpload() {
  const file = cvFileInput.files?.[0];
  if (!file) {
    return;
  }

  statusMessage.textContent = `Parsing ${file.name}...`;

  try {
    const extracted = await extractTextFromFile(file);
    const trimmed = extracted.trim();

    if (!trimmed) {
      statusMessage.textContent =
        "Could not extract text from this file. Paste CV highlights manually in the text box.";
      return;
    }

    cvTextArea.value = trimmed.slice(0, 20000);
    if (autoApplyCvSuggestions.checked) {
      const autofilled = autofillProfileFromCvText(cvTextArea.value, { applyChanges: true });
      const autofillNote = autofilled.length > 0 ? ` Auto-filled: ${autofilled.join(", ")}.` : "";
      cvSuggestionsMeta.textContent =
        autofilled.length > 0
          ? `Auto-applied CV suggestions: ${autofilled.join(", ")}.`
          : "No additional CV suggestions were applied.";
      statusMessage.textContent =
        `CV parsed successfully. You can edit the extracted text before generating matches.${autofillNote}`;
    } else {
      const preview = autofillProfileFromCvText(cvTextArea.value, { applyChanges: false });
      cvSuggestionsMeta.textContent =
        preview.length > 0
          ? `Suggestions ready: ${preview.join(", ")}. Click "Apply CV Suggestions" to use them.`
          : "No additional CV suggestions found for currently empty fields.";
      statusMessage.textContent =
        "CV parsed successfully. Suggestions are ready, and you can apply them manually.";
    }
    markImprovementLabels();
  } catch (error) {
    console.error(error);
    statusMessage.textContent =
      "CV parsing failed for this format in your browser. Paste CV highlights manually.";
  }
}

async function extractTextFromFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "txt" || extension === "md") {
    return file.text();
  }

  if (extension === "docx") {
    if (!window.mammoth) {
      throw new Error("Mammoth not available.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const { value } = await window.mammoth.extractRawText({ arrayBuffer });
    return value;
  }

  if (extension === "pdf") {
    if (!globalThis.pdfjsLib) {
      throw new Error("pdf.js not available.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await globalThis.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => item.str).join(" ");
      pages.push(text);
    }

    return pages.join("\n");
  }

  return file.text();
}

function onGenerateMatches(event) {
  event.preventDefault();

  if (cvTextArea.value.trim().length > 0) {
    if (autoApplyCvSuggestions.checked) {
      const applied = autofillProfileFromCvText(cvTextArea.value, { applyChanges: true });
      if (applied.length > 0) {
        cvSuggestionsMeta.textContent = `Auto-applied before scoring: ${applied.join(", ")}.`;
      }
    } else {
      const preview = autofillProfileFromCvText(cvTextArea.value, { applyChanges: false });
      if (preview.length > 0) {
        cvSuggestionsMeta.textContent =
          `Suggestions available: ${preview.join(", ")}. Click "Apply CV Suggestions" for maximum match accuracy.`;
      }
    }
  }

  const profile = buildProfile();
  const cvWordCount = tokenizeText(profile.cvText).length;

  if (cvWordCount < 20) {
    statusMessage.textContent =
      "CV text is required. Add a richer CV summary (about 20+ words) or upload a CV before generating matches.";
    return;
  }

  const usableSignal = [
    profile.focusAreas.length,
    profile.methods.length,
    profile.populations.length,
    profile.cvTokens.length
  ].reduce((acc, value) => acc + value, 0);

  if (usableSignal < 3) {
    statusMessage.textContent =
      "Add more expertise details in focus areas, methods, and populations so matching can produce reliable recommendations.";
    return;
  }

  baseMatchedResults = opportunities
    .map((opportunity) => scoreOpportunity(profile, opportunity))
    .sort((a, b) => b.score - a.score);

  statusMessage.textContent = `Generated ${baseMatchedResults.length} ranked opportunities.`;
  filtersWrap.classList.remove("hidden");
  markImprovementLabels();
  applyFilters();
}

function autofillProfileFromCvText(cvText, { applyChanges = true } = {}) {
  const raw = cvText.trim();
  if (!raw) {
    return [];
  }

  const normalized = raw.toLowerCase();
  const autofilled = [];
  const shouldFlag = (changedOrWouldChange) => {
    if (changedOrWouldChange) {
      return true;
    }
    return false;
  };

  const inferredFullName = inferFullNameFromCv(raw);
  const fullNameUpdated = applyChanges
    ? setTextInputIfEmpty("fullName", inferredFullName)
    : Boolean(inferredFullName) && getInputValue("fullName") === "";
  if (shouldFlag(fullNameUpdated)) {
    autofilled.push("full name");
  }

  const inferredCareerStage = inferCategoricalValue(normalized, careerStagePatterns);
  const careerStageUpdated = applyChanges
    ? setSelectIfEmpty("careerStage", inferredCareerStage)
    : Boolean(inferredCareerStage) && getInputValue("careerStage") === "";
  if (shouldFlag(careerStageUpdated)) {
    autofilled.push("career stage");
  }

  const inferredInstitutionType = inferCategoricalValue(normalized, institutionTypePatterns);
  const institutionUpdated = applyChanges
    ? setSelectIfEmpty("institutionType", inferredInstitutionType)
    : Boolean(inferredInstitutionType) && getInputValue("institutionType") === "";
  if (shouldFlag(institutionUpdated)) {
    autofilled.push("institution type");
  }

  const inferredRegion = inferCategoricalValue(normalized, regionPatterns);
  const regionUpdated = applyChanges
    ? setSelectIfEmpty("region", inferredRegion)
    : Boolean(inferredRegion) && getInputValue("region") === "";
  if (shouldFlag(regionUpdated)) {
    autofilled.push("primary region");
  }

  const focusSuggestions = collectFocusSuggestions(normalized);
  const focusUpdated = applyChanges
    ? setCsvInputIfEmpty("focusAreas", focusSuggestions)
    : focusSuggestions.length > 0 && parseCsv(getInputValue("focusAreas")).length === 0;
  if (shouldFlag(focusUpdated)) {
    autofilled.push("focus areas");
  }

  const methodSuggestions = collectPhraseSuggestions(normalized, methodSuggestionPatterns, 6);
  const methodsUpdated = applyChanges
    ? setCsvInputIfEmpty("methods", methodSuggestions)
    : methodSuggestions.length > 0 && parseCsv(getInputValue("methods")).length === 0;
  if (shouldFlag(methodsUpdated)) {
    autofilled.push("methods");
  }

  const populationSuggestions = collectPopulationSuggestions(normalized, raw);
  const populationsUpdated = applyChanges
    ? setCsvInputIfEmpty("populations", populationSuggestions)
    : populationSuggestions.length > 0 && parseCsv(getInputValue("populations")).length === 0;
  if (shouldFlag(populationsUpdated)) {
    autofilled.push("target populations");
  }

  const inferredBudget = inferBudgetNeedFromCv(raw);
  const budgetUpdated = applyChanges
    ? setNumericInputIfEmpty("budgetNeed", inferredBudget)
    : Boolean(inferredBudget) && getInputValue("budgetNeed") === "";
  if (shouldFlag(budgetUpdated)) {
    autofilled.push("budget need");
  }

  const sponsorSuggestions = inferSponsorPreferences(normalized);
  const sponsorUpdated = applyChanges
    ? setSponsorPrefsIfEmpty(sponsorSuggestions)
    : sponsorSuggestions.length > 0 && document.querySelectorAll("#sponsorPrefs input:checked").length === 0;
  if (shouldFlag(sponsorUpdated)) {
    autofilled.push("sponsor preferences");
  }

  markImprovementLabels();
  return autofilled;
}

function inferCategoricalValue(text, patternMap) {
  let bestValue = "";
  let bestScore = 0;

  Object.entries(patternMap).forEach(([value, patterns]) => {
    const score = patterns.reduce((total, pattern) => total + (text.includes(pattern) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestValue = value;
    }
  });

  return bestScore > 0 ? bestValue : "";
}

function collectFocusSuggestions(text) {
  const suggestions = new Set();

  focusSuggestionPatterns.forEach((entry) => {
    if (entry.patterns.some((pattern) => text.includes(pattern))) {
      suggestions.add(entry.term);
    }
  });

  focusTaxonomy.forEach((topic) => {
    if (text.includes(topic)) {
      suggestions.add(topic);
    }
  });

  inferCanonicalConcepts([text]).forEach((topic) => {
    if (focusTaxonomy.includes(topic)) {
      suggestions.add(topic);
    }
  });

  return Array.from(suggestions).slice(0, 6);
}

function collectPhraseSuggestions(text, phrases, maxItems) {
  return phrases.filter((phrase) => text.includes(phrase.toLowerCase())).slice(0, maxItems);
}

function collectPopulationSuggestions(normalizedText, rawText) {
  const suggestions = new Set(
    collectPhraseSuggestions(normalizedText, populationSuggestionPatterns, 10)
  );

  populationRecommendationRules.forEach(({ label, patterns }) => {
    if (patterns.some((pattern) => normalizedText.includes(pattern.toLowerCase()))) {
      suggestions.add(label.toLowerCase());
    }
  });

  const populationMentions = [
    ...rawText.matchAll(
      /(?:among|in|for|with|serving|focused on|targeting)\s+(pregnant women|women|children|adolescents|older adults|migrants?|refugees?|rural communities|urban communities|indigenous communities|community health workers|people who inject drugs|men who have sex with men|incarcerated (?:people|populations))/gi
    )
  ].map((match) => normalizePopulationPhrase(match[1]));

  populationMentions.forEach((phrase) => {
    if (phrase) {
      suggestions.add(phrase);
    }
  });

  if (/\bhiv\b/i.test(rawText) || /\baids\b/i.test(rawText)) {
    suggestions.add("people living with hiv");
  }
  if (/\btuberculosis\b/i.test(rawText) || /\btb\b/i.test(rawText)) {
    suggestions.add("people with tuberculosis");
  }

  return Array.from(suggestions).slice(0, 6);
}

function normalizePopulationPhrase(phrase) {
  const normalized = phrase.trim().toLowerCase();
  const mapped = {
    migrants: "migrant populations",
    migrant: "migrant populations",
    refugees: "migrant populations",
    refugee: "migrant populations",
    "rural communities": "rural populations",
    "urban communities": "urban populations",
    "pregnant women": "women",
    "incarcerated people": "incarcerated populations"
  };

  return mapped[normalized] || normalized;
}

function inferFullNameFromCv(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 25);
  if (!lines.length) {
    return "";
  }

  for (const line of lines) {
    const labeledMatch = line.match(/^(?:name|full name)\s*[:\-]\s*(.+)$/i);
    if (labeledMatch && looksLikePersonName(labeledMatch[1])) {
      return labeledMatch[1].trim();
    }
  }

  for (const line of lines) {
    if (looksLikePersonName(line)) {
      return line.trim();
    }
  }

  return "";
}

function looksLikePersonName(value) {
  const candidate = value.trim();
  if (!candidate || candidate.length < 5 || candidate.length > 60) {
    return false;
  }
  if (/@|https?:\/\/|www\.|\d/.test(candidate)) {
    return false;
  }

  const blocked = [
    "curriculum vitae",
    "resume",
    "contact",
    "education",
    "experience",
    "summary",
    "skills",
    "publications"
  ];
  if (blocked.some((term) => candidate.toLowerCase().includes(term))) {
    return false;
  }

  const sanitized = candidate.replace(/,(?:\s*[A-Z]{1,6}\.?)+$/g, "").trim();
  const parts = sanitized.split(/\s+/);
  if (parts.length < 2 || parts.length > 5) {
    return false;
  }

  return parts.every((part) => /^[A-Za-z][A-Za-z.'-]*$/.test(part));
}

function inferBudgetNeedFromCv(rawText) {
  const matches = [...rawText.matchAll(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:usd|dollars)?/gi)];
  if (!matches.length) {
    return null;
  }

  const amounts = matches
    .map((match) => Number.parseInt(match[1].replace(/,/g, ""), 10))
    .filter((value) => Number.isFinite(value) && value >= 25000 && value <= 15000000);

  if (!amounts.length) {
    return null;
  }

  const maxAmount = Math.max(...amounts);
  return Math.round(maxAmount / 1000) * 1000;
}

function inferSponsorPreferences(text) {
  const sponsorPatterns = {
    federal: ["nih", "cdc", "nsf", "usaid", "hhs", "federal"],
    state: ["state department", "state health", "california department", "new york state", "state grant"],
    foundation: ["foundation", "charitable trust", "philanthropies", "wellcome", "gates"],
    private: ["private", "inc.", "llc", "venture", "industry"]
  };

  return Object.entries(sponsorPatterns)
    .filter(([, patterns]) => patterns.some((pattern) => text.includes(pattern)))
    .map(([key]) => key);
}

function setSelectIfEmpty(id, value) {
  if (!value) {
    return false;
  }

  const element = document.getElementById(id);
  if (!element || element.value.trim()) {
    return false;
  }

  element.value = value;
  return true;
}

function setTextInputIfEmpty(id, value) {
  if (!value) {
    return false;
  }

  const element = document.getElementById(id);
  if (!element || element.value.trim()) {
    return false;
  }

  element.value = value.trim();
  return true;
}

function setCsvInputIfEmpty(id, values) {
  if (!values || values.length === 0) {
    return false;
  }

  const element = document.getElementById(id);
  if (!element || element.value.trim()) {
    return false;
  }

  element.value = values.join(", ");
  return true;
}

function setNumericInputIfEmpty(id, value) {
  if (!value) {
    return false;
  }

  const element = document.getElementById(id);
  if (!element || element.value.trim()) {
    return false;
  }

  element.value = String(value);
  return true;
}

function setSponsorPrefsIfEmpty(sponsorTypes) {
  if (!sponsorTypes || sponsorTypes.length === 0) {
    return false;
  }

  const currentChecked = document.querySelectorAll("#sponsorPrefs input:checked").length;
  if (currentChecked > 0) {
    return false;
  }

  let changed = false;
  document.querySelectorAll("#sponsorPrefs input").forEach((input) => {
    const shouldCheck = sponsorTypes.includes(input.value);
    input.checked = shouldCheck;
    if (shouldCheck) {
      changed = true;
    }
  });

  return changed;
}

function markImprovementLabels() {
  const missingSignals = {
    careerStage: getInputValue("careerStage") === "",
    institutionType: getInputValue("institutionType") === "",
    region: getInputValue("region") === "",
    focusAreas: parseCsv(getInputValue("focusAreas")).length === 0,
    methods: parseCsv(getInputValue("methods")).length === 0,
    populations: parseCsv(getInputValue("populations")).length === 0,
    budgetNeed: getInputValue("budgetNeed") === "",
    sponsorPrefs: document.querySelectorAll("#sponsorPrefs input:checked").length === 0
  };

  Object.entries(improvementLabels).forEach(([key, label]) => {
    if (!label) {
      return;
    }

    label.classList.toggle("input-needed", missingSignals[key]);
  });
}

function buildProfile() {
  const sponsorPreferences = Array.from(
    document.querySelectorAll("#sponsorPrefs input:checked"),
    (input) => input.value
  );

  const profile = {
    fullName: getInputValue("fullName"),
    careerStage: getInputValue("careerStage"),
    institutionType: getInputValue("institutionType"),
    region: getInputValue("region"),
    focusAreas: parseCsv(getInputValue("focusAreas")),
    methods: parseCsv(getInputValue("methods")),
    populations: parseCsv(getInputValue("populations")),
    budgetNeed: Number.parseInt(getInputValue("budgetNeed"), 10) || null,
    sponsorPreferences,
    cvText: cvTextArea.value.trim()
  };

  const cvTokens = extractKeywords(profile.cvText);
  const signalTerms = [...profile.focusAreas, ...profile.methods, ...profile.populations, ...cvTokens];
  const canonicalConcepts = inferCanonicalConcepts(signalTerms);

  profile.cvTokens = cvTokens;
  profile.canonicalConcepts = canonicalConcepts;
  profile.keywordSet = new Set([...signalTerms, ...canonicalConcepts]);

  return profile;
}

function scoreOpportunity(profile, opportunity) {
  const reasons = [];
  const scoreBreakdown = {
    terminology: { label: "Terminology overlap", max: 18, points: 0 },
    focus: { label: "Focus area fit", max: 22, points: 0 },
    methods: { label: "Methods alignment", max: 14, points: 0 },
    populations: { label: "Population alignment", max: 8, points: 0 },
    sponsor: { label: "Sponsor preference fit", max: 8, points: 0 },
    career: { label: "Career stage eligibility", max: 10, points: 0 },
    institution: { label: "Institution eligibility", max: 8, points: 0 },
    region: { label: "Geographic alignment", max: 6, points: 0 },
    budget: { label: "Budget compatibility", max: 6, points: 0 }
  };

  const profileTerms = profile.keywordSet;
  const opportunityTerms = new Set([
    ...opportunity.topics,
    ...opportunity.diseaseAreas,
    ...opportunity.methods,
    ...opportunity.populations,
    ...tokenizeText(`${opportunity.title} ${opportunity.summary}`)
  ]);

  const lexicalOverlap = overlapSize(profileTerms, opportunityTerms);
  if (lexicalOverlap > 0) {
    scoreBreakdown.terminology.points = Math.min(scoreBreakdown.terminology.max, lexicalOverlap * 3);
    reasons.push(`Terminology overlap detected across ${lexicalOverlap} expertise terms.`);
  }

  const focusOverlap = overlapSize(new Set(profile.canonicalConcepts), new Set(opportunity.topics));
  if (focusOverlap > 0) {
    scoreBreakdown.focus.points = Math.min(scoreBreakdown.focus.max, focusOverlap * 11);
    reasons.push(`Alignment with focus area(s): ${listOverlap(profile.canonicalConcepts, opportunity.topics)}.`);
  }

  const methodOverlap = overlapSize(new Set(profile.methods), new Set(opportunity.methods));
  if (methodOverlap > 0) {
    scoreBreakdown.methods.points = Math.min(scoreBreakdown.methods.max, methodOverlap * 7);
    reasons.push(`Method fit based on ${listOverlap(profile.methods, opportunity.methods)}.`);
  }

  const populationOverlap = overlapSize(new Set(profile.populations), new Set(opportunity.populations));
  if (populationOverlap > 0) {
    scoreBreakdown.populations.points = Math.min(scoreBreakdown.populations.max, populationOverlap * 4);
    reasons.push(`Population fit: ${listOverlap(profile.populations, opportunity.populations)}.`);
  }

  if (
    profile.sponsorPreferences.length > 0 &&
    profile.sponsorPreferences.includes(opportunity.sponsorType)
  ) {
    scoreBreakdown.sponsor.points = scoreBreakdown.sponsor.max;
    reasons.push(`Matches preferred sponsor type (${opportunity.sponsorType}).`);
  }

  if (profile.careerStage && opportunity.careerStages.includes(profile.careerStage)) {
    scoreBreakdown.career.points = scoreBreakdown.career.max;
    reasons.push("Career stage eligibility is a direct fit.");
  }

  if (profile.institutionType && opportunity.institutionTypes.includes(profile.institutionType)) {
    scoreBreakdown.institution.points = scoreBreakdown.institution.max;
    reasons.push("Institution type is eligible.");
  }

  if (profile.region && opportunity.regions.includes(profile.region)) {
    scoreBreakdown.region.points = scoreBreakdown.region.max;
    reasons.push("Regional scope aligns with your selected geography.");
  }

  if (profile.budgetNeed) {
    const [minAward, maxAward] = opportunity.awardRange;
    if (profile.budgetNeed >= minAward * 0.5 && profile.budgetNeed <= maxAward * 1.2) {
      scoreBreakdown.budget.points = scoreBreakdown.budget.max;
      reasons.push("Budget range appears compatible with this opportunity.");
    }
  }

  const rawScore = Object.values(scoreBreakdown).reduce((total, category) => total + category.points, 0);
  const maxScore = Object.values(scoreBreakdown).reduce((total, category) => total + category.max, 0);
  const score = Math.max(0, Math.min(100, Math.round((rawScore / maxScore) * 100)));
  const compactBreakdown = Object.fromEntries(
    Object.entries(scoreBreakdown).map(([key, value]) => [
      key,
      { label: value.label, points: value.points, max: value.max }
    ])
  );

  return {
    ...opportunity,
    score,
    reasons: reasons.slice(0, 4),
    matchedTerms: Array.from(intersection(profileTerms, opportunityTerms)).slice(0, 10),
    scoreBreakdown: compactBreakdown,
    scoreInsight: buildScoreInsight(score, compactBreakdown),
    matchExplanation: buildMatchExplanation(reasons)
  };
}

function applyFilters() {
  if (!baseMatchedResults.length) {
    renderResults([]);
    return;
  }

  const query = textFilter.value.trim().toLowerCase();
  const topic = topicFilter.value;
  const sponsor = sponsorFilter.value;
  const deadlineWindowDays = Number.parseInt(deadlineFilter.value, 10) || null;
  const minAward = Number.parseInt(minAwardFilter.value, 10) || 0;
  const sortMode = sortBy.value;

  let filtered = [...baseMatchedResults];

  if (query) {
    filtered = filtered.filter((item) => {
      const blob = [
        item.title,
        item.sponsorName,
        item.summary,
        item.topics.join(" "),
        item.methods.join(" "),
        item.populations.join(" ")
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }

  if (topic) {
    filtered = filtered.filter((item) => item.topics.includes(topic));
  }

  if (sponsor) {
    filtered = filtered.filter((item) => item.sponsorType === sponsor);
  }

  if (deadlineWindowDays) {
    const now = Date.now();
    const horizon = now + deadlineWindowDays * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((item) => {
      const deadlineDate = new Date(item.deadline).getTime();
      return deadlineDate >= now && deadlineDate <= horizon;
    });
  }

  if (minAward > 0) {
    filtered = filtered.filter((item) => item.awardRange[1] >= minAward);
  }

  filtered.sort((a, b) => {
    if (sortMode === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }

    if (sortMode === "award") {
      return b.awardRange[1] - a.awardRange[1];
    }

    return b.score - a.score;
  });

  renderResults(filtered);
}

function renderResults(results) {
  resultsList.innerHTML = "";
  activeFilteredResults = [];
  renderedCount = 0;

  if (!results.length) {
    resultsMeta.textContent =
      baseMatchedResults.length > 0
        ? "No opportunities match the current filters."
        : "No matches generated yet.";
    feedStatus.textContent = "";
    feedStatus.classList.add("hidden");
    loadMoreWrap.classList.add("hidden");
    scrollSentinel.classList.add("hidden");
    clearCollaboratorSelection();

    if (baseMatchedResults.length === 0) {
      return;
    }

    const empty = document.createElement("p");
    empty.className = "status";
    empty.textContent = "Try broadening topic/sponsor filters or removing the keyword query.";
    resultsList.append(empty);
    return;
  }

  const topScore = Math.max(...results.map((item) => item.score));
  resultsMeta.textContent = `${results.length} matched opportunities (pool: ${opportunities.length}). Highest score: ${topScore}/100.`;

  if (selectedOpportunityId && !results.some((item) => item.id === selectedOpportunityId)) {
    clearCollaboratorSelection();
  }

  activeFilteredResults = results;
  if (selectedOpportunityId) {
    const selectedIndex = activeFilteredResults.findIndex((item) => item.id === selectedOpportunityId);
    if (selectedIndex === -1) {
      selectedOpportunityData = null;
    } else {
      selectedOpportunityData = activeFilteredResults[selectedIndex];
    }
  }
  if (selectedOpportunityId) {
    collabPanel.classList.remove("hidden");
  }
  renderNextBatch();
}

function renderNextBatch() {
  if (!activeFilteredResults.length) {
    return;
  }

  if (renderedCount >= activeFilteredResults.length) {
    updateFeedControls();
    return;
  }

  const showDueDates = dueDateDisplay.value !== "hide";
  const nextSlice = activeFilteredResults.slice(renderedCount, renderedCount + RESULT_BATCH_SIZE);
  const fragment = document.createDocumentFragment();

  nextSlice.forEach((item, offsetIndex) => {
    const absoluteIndex = renderedCount + offsetIndex;
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector(".result-card");
    card.dataset.opportunityId = item.id;
    card.dataset.resultIndex = String(absoluteIndex);
    if (selectedOpportunityId && selectedOpportunityId === item.id) {
      card.classList.add("selected-opportunity");
    }

    node.querySelector(".sponsor").textContent = `${toTitleCase(item.sponsorType)} | ${item.sponsorName}`;
    node.querySelector("h3").textContent = item.title;

    const scorePill = node.querySelector(".score-pill");
    scorePill.textContent = `${item.score}/100`;
    scorePill.setAttribute("aria-label", `Match score ${item.score} out of 100`);
    scorePill.setAttribute("title", item.scoreInsight);
    node.querySelector(".score-tooltip").textContent = item.scoreInsight;

    node.querySelector(".summary").textContent = item.summary;
    node.querySelector(".match-explanation").textContent = item.matchExplanation;

    node.querySelector(".award").textContent = `Award: ${formatCurrency(item.awardRange[0])} - ${formatCurrency(
      item.awardRange[1]
    )}`;
    node.querySelector(".deadline").textContent = showDueDates
      ? `Deadline: ${formatDate(item.deadline)}`
      : "Deadline: hidden";
    node.querySelector(".fit").textContent = `Eligible: ${item.careerStages.map(toTitleCase).join(", ")}`;

    const tags = node.querySelector(".topics");
    item.topics.slice(0, 4).forEach((topic) => {
      const tag = document.createElement("span");
      tag.textContent = toTitleCase(topic);
      tags.append(tag);
    });

    const reasonList = node.querySelector(".reasons");
    const reasons = item.reasons.length ? item.reasons : ["General alignment from profile and CV signal."];
    reasons.forEach((reason) => {
      const li = document.createElement("li");
      li.textContent = reason;
      reasonList.append(li);
    });

    const link = node.querySelector(".opportunity-link");
    link.href = item.link;
    link.textContent = "Open funding source";

    const collabButton = node.querySelector(".match-collaborators-btn");
    collabButton.dataset.opportunityId = item.id;
    collabButton.dataset.opportunityTitle = item.title;
    collabButton.dataset.resultIndex = String(absoluteIndex);
    collabButton.onclick = (event) => handleCollaboratorButtonClick(collabButton, event);

    fragment.append(node);
  });

  resultsList.append(fragment);
  renderedCount += nextSlice.length;
  updateFeedControls();
}

function updateFeedControls() {
  if (!activeFilteredResults.length) {
    feedStatus.textContent = "";
    feedStatus.classList.add("hidden");
    loadMoreWrap.classList.add("hidden");
    scrollSentinel.classList.add("hidden");
    return;
  }

  feedStatus.classList.remove("hidden");
  feedStatus.textContent = `Showing ${renderedCount} of ${activeFilteredResults.length} matched opportunities (pool: ${opportunities.length})`;

  if (renderedCount < activeFilteredResults.length) {
    loadMoreWrap.classList.remove("hidden");
    scrollSentinel.classList.remove("hidden");
  } else {
    loadMoreWrap.classList.add("hidden");
    scrollSentinel.classList.add("hidden");
  }
}

function onReset() {
  form.reset();
  cvTextArea.value = "";
  baseMatchedResults = [];
  activeFilteredResults = [];
  renderedCount = 0;
  selectedOpportunityId = null;
  selectedOpportunityData = null;

  filtersWrap.classList.add("hidden");
  [textFilter, topicFilter, sponsorFilter, deadlineFilter, minAwardFilter, sortBy, dueDateDisplay].forEach(
    (el) => {
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      } else {
        el.value = "";
      }
    }
  );

  resultsMeta.textContent = "No matches generated yet.";
  resultsList.innerHTML = "";
  feedStatus.textContent = "";
  feedStatus.classList.add("hidden");
  loadMoreWrap.classList.add("hidden");
  scrollSentinel.classList.add("hidden");
  clearCollaboratorSelection();
  ucsfProfileIdsInput.value = DEFAULT_UCSF_PROFILE_IDS.join(", ");
  autoApplyCvSuggestions.checked = true;
  cvSuggestionsMeta.textContent = "CV suggestions will auto-apply to empty intake fields.";
  statusMessage.textContent = defaultStatus;
  markImprovementLabels();
}

function selectOpportunityForCollaborators(opportunityOrId, opportunityTitle = "") {
  const opportunity =
    opportunityOrId && typeof opportunityOrId === "object"
      ? opportunityOrId
      : getOpportunityById(opportunityOrId);
  const opportunityId =
    opportunity?.id || (typeof opportunityOrId === "string" ? opportunityOrId : "");

  selectedOpportunityId = opportunityId || null;
  selectedOpportunityData = opportunity || null;
  if (selectedOpportunityId) {
    markSelectedOpportunityStyle(selectedOpportunityId);
  } else {
    clearSelectedOpportunityStyles();
  }
  collabPanel.classList.remove("hidden");

  if (!opportunity) {
    collabContext.textContent = opportunityTitle
      ? `Selected opportunity: ${opportunityTitle}`
      : "Select an opportunity to evaluate UCSF collaborators.";
    collabStatus.textContent = "Could not find that opportunity in the current data.";
    collabResults.innerHTML = "";
    return;
  }

  collabContext.textContent = `Selected opportunity: ${opportunity.title}`;
  runCollaboratorMatch(opportunity);
}

async function runCollaboratorMatch(forcedOpportunity = null) {
  const opportunity = forcedOpportunity || selectedOpportunityData || getOpportunityById(selectedOpportunityId);
  if (!opportunity) {
    collabStatus.textContent = "Select an opportunity card first to match UCSF collaborators.";
    collabResults.innerHTML = "";
    return;
  }

  selectedOpportunityData = opportunity;
  selectedOpportunityId = opportunity.id || selectedOpportunityId;
  collabContext.textContent = `Selected opportunity: ${opportunity.title}`;
  markSelectedOpportunityStyle(selectedOpportunityId);

  const profileIds = parseUcsfProfileIds(ucsfProfileIdsInput.value);
  if (!profileIds.length) {
    collabStatus.textContent =
      "Add at least one UCSF profile URL name (for example: kirsten.bibbins-domingo).";
    collabResults.innerHTML = "";
    return;
  }

  collabStatus.textContent = `Loading ${profileIds.length} UCSF profile(s) for: ${opportunity.title}`;
  collabResults.innerHTML = "";
  const requestToken = ++collabRequestToken;

  const settled = [];
  for (let index = 0; index < profileIds.length; index += 1) {
    if (requestToken !== collabRequestToken || selectedOpportunityId !== opportunity.id) {
      return;
    }

    const profileId = profileIds[index];
    collabStatus.textContent = `Loading UCSF profiles (${index + 1}/${profileIds.length}) for: ${opportunity.title}`;

    try {
      const profile = await fetchUcsfProfileByUrlName(profileId);
      settled.push({ status: "fulfilled", value: profile });
    } catch (error) {
      settled.push({ status: "rejected", reason: error });
    }
  }

  if (requestToken !== collabRequestToken || selectedOpportunityId !== opportunity.id) {
    return;
  }

  const ranked = [];
  let failures = 0;

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      ranked.push(buildCollaboratorScore(opportunity, result.value, profileIds[index]));
    } else {
      failures += 1;
      console.error(`UCSF collaborator lookup failed for ${profileIds[index]}`, result.reason);
    }
  });

  ranked.sort((a, b) => b.score - a.score);
  const topCandidates = ranked.slice(0, TOP_COLLABORATOR_COUNT);
  renderCollaboratorResults(topCandidates);

  if (!ranked.length) {
    collabStatus.textContent =
      "No collaborator profiles could be evaluated. Confirm URL names and try again.";
    return;
  }

  const failureText = failures > 0 ? ` (${failures} profile lookup${failures === 1 ? "" : "s"} failed)` : "";
  collabStatus.textContent = `Showing top ${topCandidates.length} of ${ranked.length} collaborator candidates${failureText}.`;
}

function getOpportunityById(opportunityId) {
  if (!opportunityId) {
    return null;
  }

  return (
    activeFilteredResults.find((item) => item.id === opportunityId) ||
    baseMatchedResults.find((item) => item.id === opportunityId) ||
    opportunities.find((item) => item.id === opportunityId) ||
    null
  );
}

function clearSelectedOpportunityStyles() {
  resultsList.querySelectorAll(".result-card.selected-opportunity").forEach((card) => {
    card.classList.remove("selected-opportunity");
  });
}

function markSelectedOpportunityStyle(opportunityId) {
  clearSelectedOpportunityStyles();
  const selectedCard = resultsList.querySelector(`.result-card[data-opportunity-id="${opportunityId}"]`);
  if (selectedCard) {
    selectedCard.classList.add("selected-opportunity");
  }
}

function parseUcsfProfileIds(value) {
  const normalized = value
    .split(/[,\n;]+/)
    .map((part) => normalizeUcsfProfileId(part))
    .filter(Boolean);

  return Array.from(new Set(normalized)).slice(0, 25);
}

function normalizeUcsfProfileId(rawValue) {
  let normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  normalized = normalized.replace(/^https?:\/\/profiles\.ucsf\.edu\//i, "");
  normalized = normalized.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  if (!normalized.includes(".") && normalized.includes(" ")) {
    normalized = normalized.replace(/\s+/g, ".");
  }

  return /^[a-z0-9.-]+$/.test(normalized) ? normalized : "";
}

function normalizeSeededUcsfProfile(seedProfile, fallbackId) {
  const globalHealthSource = seedProfile?.global_health || seedProfile?.GlobalHealth || {};

  return {
    Name: seedProfile?.name || seedProfile?.Name || fallbackId,
    Title: seedProfile?.title || seedProfile?.Title || "",
    Department: seedProfile?.department || seedProfile?.Department || "",
    ProfilesURL:
      seedProfile?.profile_url || seedProfile?.ProfilesURL || `https://profiles.ucsf.edu/${fallbackId}`,
    Keywords: toStringArray(seedProfile?.keywords || seedProfile?.Keywords),
    FreetextKeywords: toStringArray(seedProfile?.freetext_keywords || seedProfile?.FreetextKeywords),
    GlobalHealth: {
      Interests: toStringArray(globalHealthSource?.Interests || globalHealthSource?.interests),
      Locations: toStringArray(globalHealthSource?.Locations || globalHealthSource?.locations),
      Projects: toStringArray(globalHealthSource?.Projects || globalHealthSource?.projects),
      Centers: toStringArray(globalHealthSource?.Centers || globalHealthSource?.centers)
    },
    CollaborationInterests: seedProfile?.CollaborationInterests || {},
    ResearchActivitiesAndFunding: toObjectArray(seedProfile?.ResearchActivitiesAndFunding)
  };
}

async function preloadSeededUcsfProfiles() {
  try {
    const response = await fetch("./ucsf_profiles_20.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const seededProfiles = await response.json();
    if (!Array.isArray(seededProfiles)) {
      return;
    }

    seededProfiles.forEach((seedProfile) => {
      const normalizedId = normalizeUcsfProfileId(seedProfile?.id || seedProfile?.ProfilesURL || "");
      if (!normalizedId) {
        return;
      }

      ucsfProfileCache.set(normalizedId, normalizeSeededUcsfProfile(seedProfile, normalizedId));
    });
  } catch (error) {
    console.warn("Could not preload local UCSF profile seed data.", error);
  }
}

async function throttleUcsfApiRequests() {
  const elapsed = Date.now() - lastUcsfApiRequestAt;
  if (lastUcsfApiRequestAt > 0 && elapsed < UCSF_API_MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, UCSF_API_MIN_INTERVAL_MS - elapsed));
  }
  lastUcsfApiRequestAt = Date.now();
}

async function fetchUcsfProfileByUrlName(profileUrlName) {
  if (ucsfProfileCache.has(profileUrlName)) {
    return ucsfProfileCache.get(profileUrlName);
  }

  await throttleUcsfApiRequests();
  const endpoint = `https://api.profiles.ucsf.edu/json/v2/?ProfilesURLName=${encodeURIComponent(
    profileUrlName
  )}&source=global-health-funding-matcher`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`UCSF API error ${response.status}`);
  }

  const payload = await response.json();
  const profile = payload?.Profiles?.[0];
  if (!profile) {
    throw new Error("No profile returned");
  }

  ucsfProfileCache.set(profileUrlName, profile);
  return profile;
}

function buildCollaboratorScore(opportunity, profile, profileUrlName) {
  const expertise = extractProfileExpertise(profile);
  const globalTextBlob = expertise.globalTerms.join(" ").toLowerCase();

  const topicHits = countPhraseHits(opportunity.topics, expertise.textBlob);
  const diseaseHits = countPhraseHits(opportunity.diseaseAreas, expertise.textBlob);
  const methodHits = countPhraseHits(opportunity.methods, expertise.textBlob);
  const populationHits = countPhraseHits(opportunity.populations, expertise.textBlob);
  const globalTopicHits = countPhraseHits(opportunity.topics, globalTextBlob);
  const globalDiseaseHits = countPhraseHits(opportunity.diseaseAreas, globalTextBlob);
  const globalPopulationHits = countPhraseHits(opportunity.populations, globalTextBlob);
  const globalEvidenceMax = expertise.globalTerms.length > 0 ? 10 : 0;
  const globalEvidenceBoost = globalEvidenceMax
    ? Math.min(globalEvidenceMax, globalTopicHits * 3 + globalDiseaseHits * 2 + globalPopulationHits * 2)
    : 0;

  const opportunityTokens = new Set(
    tokenizeText(
      [
        opportunity.title,
        opportunity.summary,
        opportunity.topics.join(" "),
        opportunity.diseaseAreas.join(" "),
        opportunity.methods.join(" "),
        opportunity.populations.join(" ")
      ].join(" ")
    )
  );
  const lexicalOverlap = overlapSize(expertise.tokenSet, opportunityTokens);
  const globalHealthBoost = expertise.globalTerms.length > 0 && opportunity.regions.some((region) => region !== "us") ? 4 : 0;

  const rawScore =
    topicHits * 16 +
    diseaseHits * 11 +
    methodHits * 13 +
    populationHits * 7 +
    Math.min(18, lexicalOverlap * 2) +
    globalHealthBoost +
    globalEvidenceBoost;
  const maxScore =
    opportunity.topics.length * 16 +
    opportunity.diseaseAreas.length * 11 +
    opportunity.methods.length * 13 +
    opportunity.populations.length * 7 +
    18 +
    4 +
    globalEvidenceMax;
  const score = Math.max(0, Math.min(100, Math.round((rawScore / maxScore) * 100)));

  const matchedTopics = findMatchedPhrases(opportunity.topics, expertise.textBlob);
  const matchedMethods = findMatchedPhrases(opportunity.methods, expertise.textBlob);
  const matchedDiseases = findMatchedPhrases(opportunity.diseaseAreas, expertise.textBlob);
  const matchedPopulations = findMatchedPhrases(opportunity.populations, expertise.textBlob);
  const matchedGlobalTerms = findMatchedPhrases(
    Array.from(new Set([...opportunity.topics, ...opportunity.diseaseAreas, ...opportunity.populations])),
    globalTextBlob
  );
  const highlights = buildCollaboratorHighlights({
    matchedTopics,
    matchedMethods,
    matchedDiseases,
    matchedPopulations,
    matchedGlobalTerms,
    lexicalOverlap
  });

  return {
    score,
    name: profile.Name || `${profile.FirstName || ""} ${profile.LastName || ""}`.trim() || profileUrlName,
    title: profile.Title || "",
    department: profile.Department || "",
    profileUrl: profile.ProfilesURL || `https://profiles.ucsf.edu/${profileUrlName}`,
    explanation: buildCollaboratorExplanation(
      matchedTopics,
      matchedMethods,
      matchedDiseases,
      matchedPopulations,
      matchedGlobalTerms,
      expertise
    ),
    highlights,
    matchedCount:
      matchedTopics.length +
      matchedMethods.length +
      matchedDiseases.length +
      matchedPopulations.length +
      matchedGlobalTerms.length +
      lexicalOverlap
  };
}

function extractProfileExpertise(profile) {
  const keywords = [
    ...toStringArray(profile.Keywords),
    ...toStringArray(profile.FreetextKeywords)
  ];
  const globalHealth = flattenGlobalHealth(profile.GlobalHealth);
  const collaborationInterests = flattenObjectStrings(profile.CollaborationInterests);
  const fundingTitles = toObjectArray(profile.ResearchActivitiesAndFunding).flatMap((grant) =>
    toStringArray([grant.Title, grant.Sponsor])
  );

  const textBlob = [
    profile.Name,
    profile.Title,
    profile.Department,
    profile.Narrative,
    ...keywords,
    ...globalHealth,
    ...collaborationInterests,
    ...fundingTitles
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tokenSet = new Set(
    tokenizeText(textBlob).filter((token) => token.length > 2 && !stopWords.has(token))
  );

  return {
    textBlob,
    tokenSet,
    globalTerms: globalHealth
  };
}

function renderCollaboratorResults(results) {
  collabResults.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "status";
    empty.textContent = "No UCSF collaborators could be matched for the selected opportunity.";
    collabResults.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  results.forEach((item) => {
    const card = document.createElement("article");
    card.className = "collab-card";

    const top = document.createElement("div");
    top.className = "collab-card-top";

    const titleWrap = document.createElement("div");
    const name = document.createElement("h4");
    name.textContent = item.name;
    const meta = document.createElement("p");
    meta.className = "collab-meta";
    meta.textContent = [item.title, item.department].filter(Boolean).join(" | ");
    titleWrap.append(name, meta);

    const score = document.createElement("span");
    score.className = "collab-score";
    score.textContent = `${item.score}/100`;

    top.append(titleWrap, score);

    const explanation = document.createElement("p");
    explanation.className = "collab-explanation";
    explanation.textContent = item.explanation;

    const highlights = document.createElement("p");
    highlights.className = "collab-highlights";
    highlights.textContent =
      item.highlights && item.highlights.length > 0
        ? `Evidence: ${item.highlights.join(" | ")}`
        : "Evidence: general topical and terminology overlap.";

    const link = document.createElement("a");
    link.className = "collab-link";
    link.href = item.profileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open UCSF profile";

    card.append(top, explanation, highlights, link);
    fragment.append(card);
  });

  collabResults.append(fragment);
}

function buildCollaboratorHighlights({
  matchedTopics,
  matchedMethods,
  matchedDiseases,
  matchedPopulations,
  matchedGlobalTerms,
  lexicalOverlap
}) {
  const highlights = [];

  if (matchedTopics.length > 0) {
    highlights.push(`Topics: ${matchedTopics.slice(0, 2).join(", ")}`);
  }
  if (matchedMethods.length > 0) {
    highlights.push(`Methods: ${matchedMethods.slice(0, 2).join(", ")}`);
  }
  if (matchedDiseases.length > 0) {
    highlights.push(`Diseases: ${matchedDiseases.slice(0, 2).join(", ")}`);
  }
  if (matchedPopulations.length > 0) {
    highlights.push(`Populations: ${matchedPopulations.slice(0, 2).join(", ")}`);
  }
  if (matchedGlobalTerms.length > 0) {
    highlights.push(`Global: ${matchedGlobalTerms.slice(0, 2).join(", ")}`);
  }
  if (lexicalOverlap > 0) {
    highlights.push(`Shared terms: ${lexicalOverlap}`);
  }

  return highlights.slice(0, 4);
}

function buildCollaboratorExplanation(
  matchedTopics,
  matchedMethods,
  matchedDiseases,
  matchedPopulations,
  matchedGlobalTerms,
  expertise
) {
  const topicText = matchedTopics.length > 0 ? matchedTopics.slice(0, 2).join(", ") : "related topic areas";
  const methodText = matchedMethods.length > 0 ? matchedMethods.slice(0, 2).join(", ") : "implementation methods";
  const diseaseText = matchedDiseases.length > 0 ? matchedDiseases.slice(0, 2).join(", ") : "relevant disease priorities";
  const populationText =
    matchedPopulations.length > 0 ? matchedPopulations.slice(0, 2).join(", ") : "priority populations";
  const globalText =
    matchedGlobalTerms.length > 0
      ? `Global-health interests overlap in ${matchedGlobalTerms.slice(0, 2).join(", ")}.`
      : expertise.globalTerms.length > 0
      ? `Profile highlights global-health work in ${expertise.globalTerms.slice(0, 2).join(", ")}.`
      : "Profile includes related research or funding activity aligned with this opportunity.";

  return `Matches opportunity focus in ${topicText}, with overlap on ${methodText}, ${diseaseText}, and ${populationText}. ${globalText}`;
}

function countPhraseHits(phrases, textBlob) {
  return phrases.reduce((count, phrase) => count + (textBlob.includes(phrase.toLowerCase()) ? 1 : 0), 0);
}

function findMatchedPhrases(phrases, textBlob) {
  return phrases.filter((phrase) => textBlob.includes(phrase.toLowerCase()));
}

function flattenGlobalHealth(globalHealthObject) {
  if (!globalHealthObject || typeof globalHealthObject !== "object") {
    return [];
  }

  return [
    ...toStringArray(globalHealthObject.Interests),
    ...toStringArray(globalHealthObject.Locations),
    ...toStringArray(globalHealthObject.Projects),
    ...toStringArray(globalHealthObject.Centers)
  ];
}

function flattenObjectStrings(value) {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenObjectStrings(item));
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap((item) => flattenObjectStrings(item));
  }

  return [];
}

function toStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function toObjectArray(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

function extractKeywords(text) {
  if (!text) {
    return [];
  }

  return tokenizeText(text)
    .filter((token) => token.length > 2 && !stopWords.has(token))
    .slice(0, 220);
}

function tokenizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function inferCanonicalConcepts(rawTerms) {
  const rawBlob = rawTerms.join(" ").toLowerCase();
  const found = new Set();

  conceptMap.forEach((entry) => {
    const hasAlias = rawBlob.includes(entry.canonical) || entry.aliases.some((alias) => rawBlob.includes(alias));
    if (hasAlias) {
      found.add(entry.canonical);
    }
  });

  return Array.from(found);
}

function parseCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getInputValue(id) {
  return document.getElementById(id).value.trim();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function overlapSize(a, b) {
  return intersection(a, b).size;
}

function intersection(a, b) {
  const setA = a instanceof Set ? a : new Set(a);
  const setB = b instanceof Set ? b : new Set(b);
  const shared = new Set();

  setA.forEach((item) => {
    if (setB.has(item)) {
      shared.add(item);
    }
  });

  return shared;
}

function listOverlap(a, b) {
  const values = Array.from(intersection(a, b));
  return values.length > 0 ? values.slice(0, 3).join(", ") : "broad relevance";
}

function buildScoreInsight(score, breakdown) {
  const categories = Object.values(breakdown);
  const strongest = categories
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 2)
    .map((item) => `${item.label} (+${item.points})`);

  const biggestGaps = categories
    .map((item) => ({ ...item, gap: item.max - item.points }))
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((item) => `${item.label} (+${item.gap})`);

  const strongestText = strongest.length ? strongest.join(", ") : "limited matching signals";
  const gapText = biggestGaps.length
    ? biggestGaps.join(", ")
    : "you are already at full points across all categories";

  return `Current score ${score}/100. Strongest signals: ${strongestText}. To move toward 100, improve: ${gapText}.`;
}

function buildMatchExplanation(reasons) {
  if (reasons.length >= 2) {
    return `${reasons[0]} ${reasons[1]}`;
  }

  if (reasons.length === 1) {
    return `${reasons[0]} Additional profile signals indicate this is likely a relevant fit.`;
  }

  return "This opportunity has broad topical relevance to your submitted profile and CV signals.";
}

function toTitleCase(value) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
